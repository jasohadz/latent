// Tiny local HTTP+SSE server for watching `latent ask` reason live in a
// browser. No new dependency — Node's built-in http module only, same
// "no build step" discipline as the rest of the CLI. One process, one
// browser tab: createMonitor() starts a server and waits for that tab to
// connect before the caller starts emitting pipeline events, so nothing
// fires into the void before anyone's watching.
import http from "node:http";

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Latent Ask — Live Monitor</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --bg: #14141a; --bg-alt: #1c1c24; --text: #eceef2; --text-dim: #8b8b96;
    --border: #2c2c36; --accent: #9d90ff; --accent-dim: #26223f;
    --ok: #3fae5c; --warn: #e8b64b; --mono: "SFMono-Regular", Consolas, Menlo, monospace;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--sans); line-height: 1.5; }
  .wrap { max-width: 900px; margin: 0 auto; padding: 32px 24px 80px; }
  h1 { font-size: 1.3rem; margin: 0 0 4px; letter-spacing: -0.01em; }
  .sub { color: var(--text-dim); font-size: 0.85rem; margin: 0 0 28px; }
  .question { background: var(--bg-alt); border: 1px solid var(--border); border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; font-size: 1.05rem; }
  .question .label { color: var(--accent); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; display: block; margin-bottom: 6px; }
  .step { display: flex; gap: 14px; margin-bottom: 4px; opacity: 0.35; transition: opacity 0.3s; }
  .step.active, .step.done { opacity: 1; }
  .step .dot { width: 22px; height: 22px; border-radius: 50%; background: var(--bg-alt); border: 2px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; margin-top: 2px; }
  .step.active .dot { border-color: var(--accent); animation: pulse 1.2s infinite; }
  .step.done .dot { border-color: var(--ok); background: var(--ok); color: #0a0a0a; }
  .step .body { flex: 1; padding-bottom: 22px; border-left: 2px solid var(--border); margin-left: -25px; padding-left: 33px; }
  .step:last-child .body { border-left: 2px solid transparent; }
  .step .title { font-weight: 600; font-size: 0.95rem; }
  .step .detail { color: var(--text-dim); font-size: 0.85rem; margin-top: 4px; }
  @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(157,144,255,0.4); } 50% { box-shadow: 0 0 0 5px rgba(157,144,255,0); } }
  .chunks { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
  .chunk { background: var(--bg-alt); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; font-size: 0.82rem; opacity: 0; animation: fadeIn 0.4s forwards; }
  @keyframes fadeIn { to { opacity: 1; } }
  .chunk .tag { display: inline-block; font-family: var(--mono); font-size: 0.68rem; background: var(--accent-dim); color: var(--accent); padding: 1px 7px; border-radius: 5px; margin-right: 8px; }
  .chunk .name { font-weight: 600; }
  .chunk .snippet { color: var(--text-dim); margin-top: 4px; white-space: pre-wrap; }
  .parity { margin-top: 10px; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; font-family: var(--mono); }
  .parity.matches { background: rgba(63,174,92,0.12); border: 1px solid var(--ok); }
  .parity.drift { background: rgba(232,182,75,0.12); border: 1px solid var(--warn); }
  .answer { background: var(--bg-alt); border: 1px solid var(--accent); border-radius: 10px; padding: 18px 20px; margin-top: 6px; font-size: 1rem; white-space: pre-wrap; min-height: 24px; }
  .cursor { display: inline-block; width: 8px; height: 1.1em; background: var(--accent); vertical-align: text-bottom; animation: blink 0.9s infinite; margin-left: 2px; }
  @keyframes blink { 50% { opacity: 0; } }
  .waiting { color: var(--text-dim); font-style: italic; padding: 40px 0; text-align: center; }
  .error { color: #ff8080; background: rgba(255,80,80,0.1); border: 1px solid #ff8080; border-radius: 8px; padding: 12px 16px; margin-top: 10px; font-family: var(--mono); font-size: 0.85rem; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Latent Ask — Live Monitor</h1>
  <p class="sub">Watching the RAG pipeline run in real time. Connected — waiting for a question.</p>
  <div id="root"><p class="waiting">Run <code>latent ask "&lt;question&gt;" --monitor</code> in the terminal that started this page.</p></div>
</div>
<script>
const root = document.getElementById("root");
let els = {};

function reset(question, checkComponent) {
  els = {};
  root.innerHTML = "";
  const q = document.createElement("div");
  q.className = "question";
  q.innerHTML = '<span class="label">Question' + (checkComponent ? ' — checking ' + checkComponent : '') + '</span>' + question;
  root.appendChild(q);

  const steps = [
    ["embed", "Embed the question"],
    ["retrieve", "Retrieve relevant chunks"],
    ["prompt", "Build the prompt"],
    ["generate", "Generate the answer"],
  ];
  for (const [id, title] of steps) {
    const step = document.createElement("div");
    step.className = "step";
    step.id = "step-" + id;
    step.innerHTML = '<div class="dot"></div><div class="body"><div class="title">' + title + '</div><div class="detail" id="detail-' + id + '"></div></div>';
    root.appendChild(step);
    els[id] = step;
  }
}

function setStep(id, state, detailHtml) {
  const step = els[id];
  if (!step) return;
  step.classList.remove("active", "done");
  step.classList.add(state);
  if (detailHtml !== undefined) document.getElementById("detail-" + id).innerHTML = detailHtml;
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

const es = new EventSource("/events");

es.addEventListener("start", (e) => {
  const d = JSON.parse(e.data);
  reset(escapeHtml(d.question), d.checkComponent ? escapeHtml(d.checkComponent) : null);
  setStep("embed", "active");
});

es.addEventListener("retrieval", (e) => {
  const d = JSON.parse(e.data);
  setStep("embed", "done");
  setStep("retrieve", "active", d.count + " chunk" + (d.count === 1 ? "" : "s") + " retrieved" + (d.exact ? " (exact match on the named component)" : " (semantic search)"));
  const box = document.createElement("div");
  box.className = "chunks";
  for (const c of d.chunks) {
    const el = document.createElement("div");
    el.className = "chunk";
    const name = c.type === "contract" ? c.component : c.path;
    el.innerHTML = '<span class="tag">' + c.type + '</span><span class="name">' + escapeHtml(name) + '</span>' +
      (c.chunkCount > 1 ? ' <span class="tag">chunk ' + (c.chunk + 1) + '/' + c.chunkCount + '</span>' : '') +
      '<div class="snippet">' + escapeHtml(c.snippet) + '</div>';
    box.appendChild(el);
  }
  document.getElementById("detail-retrieve").after(box);
  setStep("retrieve", "done");
});

es.addEventListener("check-parity", (e) => {
  const d = JSON.parse(e.data);
  const box = document.createElement("div");
  box.className = "parity " + (d.status === "matches" ? "matches" : "drift");
  box.textContent = "check-parity " + d.component + ": " + d.status +
    (d.failedProperties && d.failedProperties.length ? " — failing: " + d.failedProperties.join(", ") : "");
  document.getElementById("step-retrieve").querySelector(".body").appendChild(box);
});

es.addEventListener("prompt-ready", (e) => {
  const d = JSON.parse(e.data);
  setStep("prompt", "done", "Prompt built — " + d.length + " characters of context + question");
  setStep("generate", "active");
  const ans = document.createElement("div");
  ans.className = "answer";
  ans.innerHTML = '<span class="cursor"></span>';
  document.getElementById("step-generate").querySelector(".body").appendChild(ans);
  els.answerEl = ans;
});

let answerText = "";
es.addEventListener("token", (e) => {
  const d = JSON.parse(e.data);
  answerText += d.text;
  if (els.answerEl) els.answerEl.innerHTML = escapeHtml(answerText) + '<span class="cursor"></span>';
});

es.addEventListener("done", (e) => {
  const d = JSON.parse(e.data);
  answerText = d.answer;
  if (els.answerEl) els.answerEl.innerHTML = escapeHtml(answerText);
  setStep("generate", "done");
});

es.addEventListener("error", (e) => {
  const d = JSON.parse(e.data);
  const err = document.createElement("div");
  err.className = "error";
  err.textContent = d.message;
  root.appendChild(err);
});
</script>
</body>
</html>`;

export function createMonitor({ port = 4791 } = {}) {
  let clientRes = null;
  const pending = [];

  function send(event, data) {
    if (!clientRes) {
      pending.push({ event, data });
      return;
    }
    clientRes.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const server = http.createServer((req, res) => {
    if (req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(PAGE);
      return;
    }
    if (req.url === "/events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(":ok\n\n");
      clientRes = res;
      for (const { event, data } of pending) send(event, data);
      pending.length = 0;
      req.on("close", () => {
        if (clientRes === res) clientRes = null;
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, () => {
      resolve({
        url: `http://localhost:${port}`,
        emit: send,
        waitForClient: () =>
          new Promise((res2) => {
            if (clientRes) return res2();
            const iv = setInterval(() => {
              if (clientRes) {
                clearInterval(iv);
                res2();
              }
            }, 100);
          }),
        close: () => server.close(),
      });
    });
  });
}
