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
<title>Latent SLM — Live Monitor</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --bg: #14141a; --bg-alt: #1c1c24; --text: #eceef2; --text-dim: #8b8b96;
    --border: #2c2c36; --accent: #9d90ff; --accent-dim: #26223f;
    --ok: #3fae5c; --ok-bg: rgba(63,174,92,0.12); --warn: #e8b64b;
    --danger: #e0524b; --danger-bg: rgba(224,82,75,0.14);
    --mono: "SFMono-Regular", Consolas, Menlo, monospace;
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

  .strap { display: inline-flex; align-items: center; gap: 6px; background: var(--accent-dim); color: var(--accent); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.02em; padding: 5px 12px; border-radius: 999px; margin-bottom: 18px; }
  .hero { display: flex; align-items: center; gap: 16px; border-radius: 14px; padding: 20px 24px; margin-bottom: 18px; border: 1px solid var(--border); background: var(--bg-alt); transition: background 0.3s, border-color 0.3s; }
  .hero.status-clean { background: var(--ok-bg); border-color: var(--ok); }
  .hero.status-failed { background: var(--danger-bg); border-color: var(--danger); }
  .hero-icon { font-size: 2.1rem; line-height: 1; flex-shrink: 0; }
  .hero-status { font-size: 1.25rem; font-weight: 700; }
  .hero.status-clean .hero-status { color: var(--ok); }
  .hero.status-failed .hero-status { color: var(--danger); }
  .hero-meta { color: var(--text-dim); font-size: 0.85rem; margin-top: 3px; }
  .watch-explainer { color: var(--text-dim); font-size: 0.85rem; margin-bottom: 20px; }
  .checks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 22px; }
  .check-chip { display: flex; align-items: flex-start; gap: 10px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; font-size: 0.82rem; transition: background 0.3s, border-color 0.3s; }
  .check-chip .icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
  .check-chip.pass .icon { color: var(--ok); }
  .check-chip.fail { border-color: var(--danger); background: var(--danger-bg); }
  .check-chip.fail .icon { color: var(--danger); }
  .check-chip .chip-label { font-weight: 600; }
  .check-chip .chip-detail { color: var(--text-dim); font-size: 0.75rem; margin-top: 2px; }
  .explain-card { background: var(--bg-alt); border: 1px solid var(--accent); border-radius: 12px; padding: 18px 20px; margin-bottom: 14px; }
  .explain-card .explain-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
  .explain-card .explain-tag { font-family: var(--mono); font-size: 0.68rem; background: var(--accent-dim); color: var(--accent); padding: 2px 8px; border-radius: 5px; }
  .explain-card .explain-badge { font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 5px; }
  .explain-card .explain-badge.verified { background: var(--ok-bg); color: var(--ok); }
  .explain-card .explain-badge.unverified { background: var(--danger-bg); color: var(--danger); }
  .explain-card .explain-text { font-size: 0.98rem; margin-bottom: 12px; }
  .explain-card .explain-quote { font-family: var(--mono); font-size: 0.8rem; color: var(--text-dim); border-left: 3px solid var(--accent); padding: 6px 12px; }
  .timeline { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 16px; }
  .timeline .tick-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--ok); flex-shrink: 0; }
  .timeline .tick-dot.failed { background: var(--danger); }
  .watch-log-details { color: var(--text-dim); font-size: 0.8rem; }
  .watch-log-details summary { cursor: pointer; user-select: none; margin-bottom: 8px; }
  .log-line { padding: 4px 0; border-bottom: 1px solid var(--border); font-family: var(--mono); font-size: 0.78rem; }
</style>
</head>
<body>
<div class="wrap">
  <div class="strap">🤖 Local model · Llama-3.2-3B · 100% offline · zero API calls</div>
  <h1 id="title">Latent SLM — Live Monitor</h1>
  <p class="sub" id="subtitle">Connected — waiting for a command to start.</p>
  <div id="root"><p class="waiting">Run <code>latent ask/draft-doc/watch ... --monitor</code> in the terminal that started this page.</p></div>
</div>
<script>
const root = document.getElementById("root");
const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
let els = {};
let currentMode = "ask";

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

// --- draft-doc mode: one card per targeted prop, filled in as each one's ---
// --- generation finishes. No token streaming (grammar-constrained JSON ---
// --- generation isn't legible mid-stream, same reason ask --cite skips it). ---
function initDraftDoc() {
  titleEl.textContent = "Latent draft-doc — Live Monitor";
  subtitleEl.textContent = "Connected — waiting for draft-doc to start.";
  root.innerHTML = '<div id="dd-header" class="question"><span class="label">draft-doc</span>waiting…</div><div id="dd-list"></div><div id="dd-footer"></div>';
}
function draftDocCard(name) {
  const card = document.createElement("div");
  card.className = "chunk";
  card.id = "dd-" + name;
  card.innerHTML = '<span class="tag">generating</span><span class="name">' + escapeHtml(name) + '</span><div class="snippet">Asking the model…</div>';
  return card;
}

// --- watch mode: a hero status banner + a checks grid (so a viewer sees at ---
// --- a glance *what* is being watched, not just a pass/fail log line), an ---
// --- AI-explanation card whenever a check actually fails (cleared once it ---
// --- clears), and a compact tick-history timeline; the full raw log is kept ---
// --- collapsed behind <details> for anyone who wants it. ---
const CHECK_CATEGORIES = [
  { icon: "🎨", label: "Figma tokens", test: (f) => f === "sync figma" },
  { icon: "🎭", label: "Text/effect styles", test: (f) => f === "check-styles" },
  { icon: "🧩", label: "Component parity", test: (f) => f.startsWith("check-parity ") },
  { icon: "🔗", label: "Figma↔code bindings", test: (f) => f.startsWith("check-component-bindings ") },
  { icon: "📄", label: "Docs schema", test: (f) => f === "check-docs" },
];
let watchIntervalSeconds = null;

function initWatch() {
  titleEl.textContent = "Latent watch — Live Monitor";
  subtitleEl.textContent = "Connected — waiting for the first verify pass.";
  root.innerHTML =
    '<div class="hero" id="watch-hero"><div class="hero-icon" id="hero-icon">⏳</div><div><div class="hero-status" id="hero-status">Waiting for first check…</div><div class="hero-meta" id="hero-meta">—</div></div></div>' +
    '<div class="watch-explainer">Watching Figma tokens, text/effect styles, component parity, Figma↔code bindings, and docs schema against the live repo for drift — explained locally, in plain English, whenever something breaks.</div>' +
    '<div class="checks-grid" id="checks-grid"></div>' +
    '<div id="watch-explanations"></div>' +
    '<div class="timeline" id="watch-timeline"></div>' +
    '<details class="watch-log-details"><summary>Full tick log</summary><div id="watch-log"></div></details>';
  renderChecksGrid([]);
}

function renderChecksGrid(failedList) {
  const grid = document.getElementById("checks-grid");
  if (!grid) return;
  grid.innerHTML = CHECK_CATEGORIES.map((cat) => {
    const failing = failedList.filter(cat.test);
    const pass = failing.length === 0;
    return '<div class="check-chip ' + (pass ? "pass" : "fail") + '">' +
      '<span class="icon">' + (pass ? "✓" : "✕") + '</span>' +
      '<div><div class="chip-label">' + cat.icon + " " + cat.label + '</div>' +
      (pass ? '' : '<div class="chip-detail">' + escapeHtml(failing.join(", ")) + '</div>') +
      '</div></div>';
  }).join("");
}

function setHero(status, timestamp) {
  const hero = document.getElementById("watch-hero");
  if (!hero) return;
  const clean = status === "clean";
  hero.className = "hero " + (clean ? "status-clean" : "status-failed");
  document.getElementById("hero-icon").textContent = clean ? "✅" : "⚠️";
  document.getElementById("hero-status").textContent = clean
    ? "All clear — Figma, code, and docs are in sync"
    : "Drift detected";
  document.getElementById("hero-meta").textContent =
    "Last checked " + new Date(timestamp).toLocaleTimeString() +
    (watchIntervalSeconds ? " · rechecking every " + watchIntervalSeconds + "s" : "");
}

function addTimelineDot(status) {
  const tl = document.getElementById("watch-timeline");
  if (!tl) return;
  const dot = document.createElement("div");
  dot.className = "tick-dot" + (status === "clean" ? "" : " failed");
  dot.title = status + " — " + new Date().toLocaleTimeString();
  tl.appendChild(dot);
  while (tl.children.length > 60) tl.removeChild(tl.firstChild);
}

function watchLogLine(text) {
  const log = document.getElementById("watch-log");
  if (!log) return;
  const line = document.createElement("div");
  line.className = "log-line";
  line.textContent = text;
  log.appendChild(line);
  line.scrollIntoView({ block: "end" });
}

const es = new EventSource("/events");

es.addEventListener("mode", (e) => {
  const d = JSON.parse(e.data);
  currentMode = d.mode;
  if (currentMode === "draft-doc") initDraftDoc();
  else if (currentMode === "watch") initWatch();
  else {
    titleEl.textContent = "Latent ask — Live Monitor";
    subtitleEl.textContent = "Connected — waiting for a question.";
  }
});

es.addEventListener("draft-doc-start", (e) => {
  const d = JSON.parse(e.data);
  const header = document.getElementById("dd-header");
  if (header) header.innerHTML = '<span class="label">draft-doc — ' + escapeHtml(d.component) + '</span>Drafting: ' + (d.targets.length ? escapeHtml(d.targets.join(", ")) : "(nothing missing)");
  subtitleEl.textContent = d.targets.length + " prop(s) targeted.";
});

es.addEventListener("draft-doc-item-start", (e) => {
  const d = JSON.parse(e.data);
  const list = document.getElementById("dd-list");
  if (list) list.appendChild(draftDocCard(d.name));
});

es.addEventListener("draft-doc-item-done", (e) => {
  const d = JSON.parse(e.data);
  const card = document.getElementById("dd-" + d.name);
  if (!card) return;
  card.innerHTML =
    '<span class="tag">' + (d.verified ? "verified" : "unverified") + '</span><span class="name">' + escapeHtml(d.name) + "</span>" +
    (d.existingDescription ? '<div class="snippet"><b>existing:</b> ' + escapeHtml(d.existingDescription) + "</div>" : "") +
    '<div class="snippet"><b>draft:</b> ' + escapeHtml(d.draftDescription) + "</div>" +
    '<div class="parity ' + (d.verified ? "matches" : "drift") + '" style="margin-top:6px;">quote: "' + escapeHtml(d.quote) + '"' + (d.verified ? "" : " — UNVERIFIED, not a real substring of the source") + "</div>";
});

es.addEventListener("draft-doc-done", (e) => {
  const d = JSON.parse(e.data);
  const footer = document.getElementById("dd-footer");
  if (footer) footer.innerHTML = '<p class="sub">Done — mode: ' + escapeHtml(d.mode) + (d.filesWritten && d.filesWritten.length ? " — wrote " + escapeHtml(d.filesWritten.join(", ")) : "") + "</p>";
  subtitleEl.textContent = "Done.";
});

es.addEventListener("watch-config", (e) => {
  const d = JSON.parse(e.data);
  watchIntervalSeconds = d.intervalSeconds;
});

es.addEventListener("watch-tick", (e) => {
  const d = JSON.parse(e.data);
  subtitleEl.textContent = "Last check: " + d.timestamp + " — " + d.status;
  setHero(d.status, d.timestamp);
  renderChecksGrid(d.failed || []);
  addTimelineDot(d.status);
  watchLogLine("[" + d.timestamp + "] " + d.status + (d.unchanged ? " (unchanged)" : ""));
  if (d.status === "clean") {
    const box = document.getElementById("watch-explanations");
    if (box) box.innerHTML = "";
  }
});

es.addEventListener("watch-failure", (e) => {
  const d = JSON.parse(e.data);
  const box = document.getElementById("watch-explanations");
  if (!box) return;
  const card = document.createElement("div");
  card.className = "explain-card";
  card.innerHTML =
    '<div class="explain-head"><span class="explain-tag">🤖 AI explanation</span><span class="explain-tag">' + escapeHtml(d.label) + '</span>' +
    '<span class="explain-badge ' + (d.verified ? "verified" : "unverified") + '">' + (d.verified ? "✓ verified quote" : "✗ unverified") + '</span></div>' +
    '<div class="explain-text">' + escapeHtml(d.explanation ?? "(no explanation available)") + '</div>' +
    (d.quote ? '<div class="explain-quote">“' + escapeHtml(d.quote) + '”</div>' : "");
  box.appendChild(card);
});

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
