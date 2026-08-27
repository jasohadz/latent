#!/usr/bin/env node
// latent — CLI for the design system. Every command supports --json so an
// agent gets structured output instead of parsing prose.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { flattenTokens, tokenPathToCssVar, tokensEqual, isTerminalModeMap } from "../../tokens/flatten.mjs";
import { LocalIndex } from "vectra";
import { getLlama, resolveModelFile, LlamaChatSession } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORE_SRC = path.resolve(__dirname, "../../core/src");
const REPO_ROOT = path.resolve(__dirname, "../../..");

const TOKENS_DIR = path.resolve(__dirname, "../../tokens");

const INDEX_PATH = path.join(REPO_ROOT, ".latent-index");   // committed — small, text-based
const MODELS_DIR = path.join(REPO_ROOT, ".latent-models");  // gitignored — model weights are GBs, not a text artifact

// Verify current repo/quant tags on huggingface.co before relying on these —
// GGUF conversions get re-uploaded/renamed over time.
const CHAT_MODEL_URI = "hf:bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M";
const EMBED_MODEL_URI = "hf:second-state/All-MiniLM-L6-v2-Embedding-GGUF:Q8_0";

// Repo-root docs worth indexing alongside component contracts for `latent ask`.
const DOC_FILES = [
  "GUIDE.md", "README.md", "HOW-TO.md", "STYLES.md",
  "TOKEN-SCHEMA-V2.md", "VARIABLE-SCOPES.md",
  "NAMING-CONVENTIONS.md", "DESIGNER-CHECKLIST.md",
  "CONTRIBUTING.md", "CLAUDE.md", "CATALOG-VALIDATION.md",
];

// Known-stale facts that have appeared in prose before and could again —
// append-only, same discipline as ERROR_CODES. allowNear exempts a line
// that's clearly giving historical context (e.g. "renamed from X") rather
// than asserting X is still current.
const DOC_BLOCKLIST = [
  {
    term: "Style Tokens",
    allowNear: /renamed|misnamed|was (?:called|named)/i,
    reason:
      'Figma\'s Semantic collection was renamed from "Style Tokens" on 2026-08-20 — a bare mention likely describes it as still current.',
  },
  {
    term: "#0066FE",
    allowNear: /stale|superseded|alpha|not (?:the )?(?:real|current)|outdated/i,
    reason:
      "brand assets/latent_logo_package/DESIGN.md (gitignored, third-party-generated 'design.md' brand kit, dated 2026-07-11, version: alpha) claims this as the primary brand blue — it does not match the real primitive color.blue.600 (#2563eb) and is superseded. That file is explicitly written to be picked up by AI coding agents; a bare mention elsewhere likely repeats it as current rather than flagging it as stale.",
  },
];

// primitives/breakpoint are single-mode per token; semantic/density are
// mode-aware ({ light, dark } / { default, condensed }) — see flatten.mjs.
const LAYER_FILES = {
  primitives: "primitives.json",
  semantic: "semantic.json",
  density: "density.json",
  breakpoint: "breakpoint.json",
};

const COMMANDS = {
  list: { args: [], flags: ["--json"], responseTypes: ["component-list"] },
  docs: { args: ["<name>"], flags: ["--json"], responseTypes: ["component-doc", "error"] },
  swizzle: { args: ["<name>"], flags: ["--json", "--dest"], responseTypes: ["swizzle-result", "error"] },
  "sync figma": { args: [], flags: ["--file", "--json"], responseTypes: ["sync-result", "error"] },
  "check-parity": { args: ["<name>"], flags: ["--json"], responseTypes: ["parity-result", "error"] },
  "check-component-bindings": { args: ["<name>"], flags: ["--json"], responseTypes: ["component-bindings-result", "error"] },
  "check-styles": { args: [], flags: ["--file", "--json"], responseTypes: ["check-styles-result", "error"] },
  "check-docs": { args: [], flags: ["--json"], responseTypes: ["check-docs-result"] },
  verify: { args: [], flags: ["--json"], responseTypes: ["verify-result"] },
  "apply-drift": {
    args: [],
    flags: ["--json", "--write", "--force", "--tokens-file", "--styles-file"],
    responseTypes: ["apply-drift-result"],
  },
  manifest: { args: [], flags: ["--json"], responseTypes: ["manifest"] },
  index: { args: [], flags: ["--json"], responseTypes: ["index-result", "error"] },
  ask: { args: ["<question>"], flags: ["--json", "--check", "--monitor", "--cite"], responseTypes: ["ask-result", "error"] },
  "compose-check": { args: ["<file.json>"], flags: ["--json"], responseTypes: ["compose-check-result", "error"] },
};

const ERROR_CODES = {
  ERR_UNKNOWN_COMPONENT: "No component matched the requested name.",
  ERR_UNKNOWN_COMMAND: "A top-level command name was not recognized.",
  ERR_MISSING_ARG: "A required positional argument was omitted.",
  ERR_FILE_NOT_FOUND: "The referenced file does not exist on disk.",
  ERR_NO_FIGMA_SPEC: "Component has no figmaTokens mapping defined in its doc file.",
  ERR_NO_INDEX: "No knowledge index found — run `latent index` first.",
  ERR_MODEL_DOWNLOAD_FAILED: "Could not download the local model on first run — check network access and try again.",
  ERR_INVALID_COMPOSITION_JSON: "The composition file is not valid JSON.",
};

function err(code, extra = {}) {
  return { type: "error", code, message: ERROR_CODES[code] ?? "Unknown error", ...extra };
}

async function loadDoc(name) {
  const docPath = path.join(CORE_SRC, `${name}.doc.mjs`);
  if (!existsSync(docPath)) return null;
  const mod = await import(pathToFileURL(docPath).href);
  return mod.default;
}

function discoverComponents() {
  if (!existsSync(CORE_SRC)) return [];
  return readdirSync(CORE_SRC)
    .filter((f) => f.endsWith(".doc.mjs"))
    .map((f) => f.slice(0, -".doc.mjs".length))
    .sort();
}

async function cmdList(json) {
  const names = discoverComponents();
  if (json) return print({ type: "component-list", components: names });
  console.log(names.join("\n"));
}

async function cmdDocs(name, json) {
  if (!name) return print(err("ERR_MISSING_ARG", { arg: "name" }), json);
  const doc = await loadDoc(name);
  if (!doc) return print(err("ERR_UNKNOWN_COMPONENT", { requested: name }), json);
  if (json) return print({ type: "component-doc", ...doc });
  console.log(`${doc.name} — ${doc.summary}\n`);
  for (const p of doc.props) {
    console.log(`  ${p.name}: ${p.type} (default: ${p.default})\n    ${p.description}`);
  }
  if (doc.extends) {
    console.log(`\nAlso accepts: ${doc.extends} (passed through via {...rest}, not itemized above).`);
  }
  console.log(`\nExample:\n  ${doc.example}`);
}

async function cmdSwizzle(name, json, dest) {
  const doc = await loadDoc(name);
  if (!doc) return print(err("ERR_UNKNOWN_COMPONENT", { requested: name }), json);
  const srcFile = path.resolve(__dirname, "../../..", doc.swizzlePath);
  const outDir = dest ?? "./swizzled";
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, path.basename(srcFile));
  copyFileSync(srcFile, outFile);
  const result = { type: "swizzle-result", component: name, from: doc.swizzlePath, to: outFile };
  print(result, json);
}

// A flattened value is either a scalar (primitives/breakpoint-as-scalar)
// or a per-mode object (semantic/density/breakpoint), e.g. { light, dark }.
function isModeMap(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function diffLayer(layer, codeFlat, figmaFlat, missingInCode, missingInFigma, valueMismatches) {
  for (const [tokenPath, figmaValue] of Object.entries(figmaFlat)) {
    if (!(tokenPath in codeFlat)) {
      missingInCode.push({ layer, token: tokenPath, figmaValue });
      continue;
    }
    const codeValue = codeFlat[tokenPath];
    if (isModeMap(figmaValue) || isModeMap(codeValue)) {
      const modes = new Set([...Object.keys(codeValue ?? {}), ...Object.keys(figmaValue ?? {})]);
      for (const mode of modes) {
        const cv = codeValue?.[mode];
        const fv = figmaValue?.[mode];
        if (!tokensEqual(cv, fv)) {
          valueMismatches.push({ layer, token: tokenPath, mode, codeValue: cv, figmaValue: fv });
        }
      }
    } else if (!tokensEqual(codeValue, figmaValue)) {
      valueMismatches.push({ layer, token: tokenPath, codeValue, figmaValue });
    }
  }
  for (const tokenPath of Object.keys(codeFlat)) {
    if (!(tokenPath in figmaFlat)) missingInFigma.push({ layer, token: tokenPath, codeValue: codeFlat[tokenPath] });
  }
}

async function computeSyncFigma(filePath) {
  if (!filePath) return err("ERR_MISSING_ARG", { arg: "--file" });
  const resolvedFile = path.resolve(process.cwd(), filePath);
  if (!existsSync(resolvedFile)) return err("ERR_FILE_NOT_FOUND", { path: resolvedFile });

  const figmaRaw = JSON.parse(readFileSync(resolvedFile, "utf-8"));
  delete figmaRaw._comment;

  const missingInCode = [];   // in Figma, not in code
  const missingInFigma = [];  // in code, not in Figma
  const valueMismatches = []; // in both, different value (per-mode for semantic/density/breakpoint)

  for (const layer of Object.keys(LAYER_FILES)) {
    const tokensPath = path.join(TOKENS_DIR, LAYER_FILES[layer]);
    if (!existsSync(tokensPath)) return err("ERR_FILE_NOT_FOUND", { path: tokensPath });
    const codeFlat = flattenTokens(JSON.parse(readFileSync(tokensPath, "utf-8")));
    const figmaFlat = flattenTokens(figmaRaw[layer] ?? {});
    diffLayer(layer, codeFlat, figmaFlat, missingInCode, missingInFigma, valueMismatches);
  }

  const drift = missingInCode.length + missingInFigma.length + valueMismatches.length;
  return {
    type: "sync-result",
    status: drift === 0 ? "in-sync" : "drift-detected",
    driftCount: drift,
    missingInCode,   // token exists in Figma, needs adding to code
    missingInFigma,  // token exists in code, missing from the Figma export
    valueMismatches, // same token+mode, different value — likely someone edited one side only
  };
}

async function cmdSyncFigma(filePath, json) {
  const result = await computeSyncFigma(filePath);
  print(result, json);
  if (result.type === "sync-result" && result.driftCount > 0) process.exitCode = 1;
}

// Text/Effect Styles are a different Figma primitive from Variables — compound
// objects (fontName/lineHeight/boundVariables, or an array of shadow layers)
// rather than scalar leaves — so they get their own diff, not flattenTokens.
function diffStyleValue(path, codeVal, figmaVal, mismatches) {
  const codeIsObj = codeVal && typeof codeVal === "object";
  const figmaIsObj = figmaVal && typeof figmaVal === "object";
  if (codeIsObj && figmaIsObj) {
    const keys = new Set([...Object.keys(codeVal), ...Object.keys(figmaVal)]);
    for (const k of keys) {
      diffStyleValue(path ? `${path}.${k}` : k, codeVal[k], figmaVal[k], mismatches);
    }
    return;
  }
  if (typeof codeVal === "number" && typeof figmaVal === "number" && Math.abs(codeVal - figmaVal) < 0.001) return;
  if (codeVal !== figmaVal) mismatches.push({ field: path, codeValue: codeVal, figmaValue: figmaVal });
}

function diffStyleCategory(category, codeStyles, figmaStyles, missingInCode, missingInFigma, valueMismatches) {
  for (const [name, figmaVal] of Object.entries(figmaStyles)) {
    if (!(name in codeStyles)) {
      missingInCode.push({ category, style: name });
      continue;
    }
    const mismatches = [];
    diffStyleValue("", codeStyles[name], figmaVal, mismatches);
    for (const m of mismatches) valueMismatches.push({ category, style: name, ...m });
  }
  for (const name of Object.keys(codeStyles)) {
    if (!(name in figmaStyles)) missingInFigma.push({ category, style: name });
  }
}

async function computeCheckStyles(filePath) {
  if (!filePath) return err("ERR_MISSING_ARG", { arg: "--file" });
  const resolvedFile = path.resolve(process.cwd(), filePath);
  if (!existsSync(resolvedFile)) return err("ERR_FILE_NOT_FOUND", { path: resolvedFile });

  const figmaRaw = JSON.parse(readFileSync(resolvedFile, "utf-8"));
  const stylesPath = path.join(TOKENS_DIR, "styles.json");
  if (!existsSync(stylesPath)) return err("ERR_FILE_NOT_FOUND", { path: stylesPath });
  const codeStyles = JSON.parse(readFileSync(stylesPath, "utf-8"));

  const missingInCode = [];
  const missingInFigma = [];
  const valueMismatches = [];

  diffStyleCategory("text", codeStyles.text ?? {}, figmaRaw.text ?? {}, missingInCode, missingInFigma, valueMismatches);
  diffStyleCategory("effect", codeStyles.effect ?? {}, figmaRaw.effect ?? {}, missingInCode, missingInFigma, valueMismatches);

  const drift = missingInCode.length + missingInFigma.length + valueMismatches.length;
  return {
    type: "check-styles-result",
    status: drift === 0 ? "in-sync" : "drift-detected",
    driftCount: drift,
    missingInCode,   // style exists in Figma, not recorded in styles.json
    missingInFigma,  // style exists in styles.json, missing/renamed in Figma
    valueMismatches, // same style, some field differs — likely edited on one side only
  };
}

async function cmdCheckStyles(filePath, json) {
  const result = await computeCheckStyles(filePath);
  print(result, json);
  if (result.type === "check-styles-result" && result.driftCount > 0) process.exitCode = 1;
}

async function computeCheckParity(name) {
  if (!name) return err("ERR_MISSING_ARG", { arg: "name" });
  const doc = await loadDoc(name);
  if (!doc) return err("ERR_UNKNOWN_COMPONENT", { requested: name });
  if (!doc.figmaTokens) return err("ERR_NO_FIGMA_SPEC", { requested: name });

  const tsxPath = path.resolve(__dirname, "../../..", doc.swizzlePath);
  const cssPath = tsxPath.replace(/\.tsx$/, ".css");
  if (!existsSync(cssPath)) return err("ERR_FILE_NOT_FOUND", { path: cssPath });
  const css = readFileSync(cssPath, "utf-8");

  const checks = Object.entries(doc.figmaTokens).map(([property, tokenPath]) => {
    const expectedVar = tokenPathToCssVar(tokenPath);
    return { property, tokenPath, expectedVar, found: css.includes(expectedVar) };
  });
  const mismatches = checks.filter((c) => !c.found);

  return {
    type: "parity-result",
    component: name,
    status: mismatches.length === 0 ? "matches" : "drift-detected",
    checks,
  };
}

async function cmdCheckParity(name, json) {
  const result = await computeCheckParity(name);
  print(result, json);
  if (result.type === "parity-result" && result.status !== "matches") process.exitCode = 1;
}

// Answers a different question than check-parity: not "does the CSS match
// what the .doc.mjs claims" (self-consistency — passes even if the claim
// itself is wrong or stale) but "does the .doc.mjs's claim actually match
// what Figma has bound right now" (added 2026-08-26, after exactly that
// gap let real drift sit undetected in Calendar and Button while `verify`
// reported clean the whole time — see CLAUDE.md's "Component bindings"
// section for the full story and packages/figma-plugin/code.js's
// extractComponentBindings for how the live export is produced).
//
// Deliberately coarse, not per-property: for each figmaTokens entry (that
// isn't opted out via figmaTokensSkipLiveCheck), checks whether the claimed
// token appears *anywhere* in that component's live-extracted binding set
// — not that it's on the exact same CSS property. A stronger per-property
// check is a possible future enhancement, not attempted here; this
// coarser version is what actually would have caught both Calendar's and
// Button's real mismatches, and is far more resilient to internal Figma
// node renames than hard-coding an exact node path per property.
async function computeCheckComponentBindings(name) {
  if (!name) return err("ERR_MISSING_ARG", { arg: "name" });
  const doc = await loadDoc(name);
  if (!doc) return err("ERR_UNKNOWN_COMPONENT", { requested: name });
  if (!doc.figmaTokens) return err("ERR_NO_FIGMA_SPEC", { requested: name });

  const bindingsPath = path.join(TOKENS_DIR, "component-bindings.live.json");
  if (!existsSync(bindingsPath)) return err("ERR_FILE_NOT_FOUND", { path: bindingsPath });
  const allBindings = JSON.parse(readFileSync(bindingsPath, "utf-8"));
  const liveTokens = allBindings[name];
  if (!liveTokens) {
    return {
      type: "component-bindings-result",
      component: name,
      status: "no-live-data",
      reason: `No entry for "${name}" in component-bindings.live.json — the plugin's last extraction didn't find a matching Figma component (renamed? not yet built?). Not treated as drift.`,
      checks: [],
    };
  }
  // Figma's own variable names aren't consistently segmented — the same
  // conceptual word shows up as one hyphenated segment in some collections
  // and as separate nested segments in others (real examples pulled live:
  // "font-size/caption" in Breakpoint vs "font/size/200" in Primitives;
  // "font/line-height/100/normal" vs "typography/line-height/200/normal").
  // A literal dotted-to-slash conversion of our own token paths can't
  // reliably predict which form a given real binding uses, so compare
  // normalized (all separators and case stripped) instead of exact string
  // equality — confirmed necessary by running this once and finding almost
  // every text-related token falsely flagged as missing until this was
  // added, none of them real drift.
  const normalize = (s) => s.toLowerCase().replace(/[./-]/g, "");
  const liveNormalized = new Set(liveTokens.map(normalize));
  // Text nodes frequently bind straight to a Primitives-layer variable
  // (e.g. "typography/font-family/sans") rather than going through our
  // Semantic-layer alias ("font-family.sans") — same real value, one
  // layer of indirection removed. Also index each live token with a
  // leading "typography/" stripped so a semantic-layer claim still
  // matches a component that happens to bind the primitive directly.
  for (const t of liveTokens) {
    if (t.startsWith("typography/")) liveNormalized.add(normalize(t.slice("typography/".length)));
  }
  const skipKeys = new Set(doc.figmaTokensSkipLiveCheck ?? []);

  // Same layering gap as above, other direction: our own semantic paths
  // sometimes prefix a compound word with "font-" (font-line-height,
  // font-family, font-size, font-style) where the Primitives-layer
  // variable a text node binds to directly drops that prefix entirely
  // (typography/line-height/..., not typography/font-line-height/...).
  // Try the claim with a leading "font-" stripped as a fallback match —
  // can only turn a false "missing" into a correct "found," never mask a
  // real one (the unstripped form is still checked first).
  const matchesLive = (tokenPath) =>
    liveNormalized.has(normalize(tokenPath)) || liveNormalized.has(normalize(tokenPath.replace(/^font-/, "")));

  const checks = Object.entries(doc.figmaTokens)
    .filter(([property]) => !skipKeys.has(property))
    .map(([property, tokenPath]) => {
      const figmaName = tokenPath.replace(/\./g, "/");
      return { property, tokenPath, figmaName, foundInFigma: matchesLive(tokenPath) };
    });
  const mismatches = checks.filter((c) => !c.foundInFigma);

  return {
    type: "component-bindings-result",
    component: name,
    status: mismatches.length === 0 ? "matches" : "drift-detected",
    checks,
    skipped: [...skipKeys],
  };
}

async function cmdCheckComponentBindings(name, json) {
  const result = await computeCheckComponentBindings(name);
  print(result, json);
  if (result.type === "component-bindings-result" && result.status === "drift-detected") process.exitCode = 1;
}

// Blank-line-separated paragraphs, not lines — markdown source commonly
// wraps one sentence across multiple lines, so a qualifying phrase like
// "renamed from" can land on a different source line than the flagged term
// while still reading as one sentence. Checking a whole paragraph as one
// string avoids flagging that as a violation.
function splitIntoParagraphs(lines) {
  const paragraphs = [];
  let start = -1;
  let buf = [];
  lines.forEach((line, i) => {
    if (line.trim() === "") {
      if (buf.length > 0) {
        paragraphs.push({ startLine: start, text: buf.join(" ") });
        buf = [];
      }
    } else {
      if (buf.length === 0) start = i;
      buf.push(line);
    }
  });
  if (buf.length > 0) paragraphs.push({ startLine: start, text: buf.join(" ") });
  return paragraphs;
}

function checkStaleTerms() {
  const lsFiles = execFileSync("git", ["ls-files", "*.md"], { cwd: REPO_ROOT, encoding: "utf-8" });
  const files = lsFiles.split("\n").filter(Boolean);

  const violations = [];
  for (const relPath of files) {
    const fullPath = path.join(REPO_ROOT, relPath);
    if (!existsSync(fullPath)) continue; // tracked-but-deleted in the working tree
    const paragraphs = splitIntoParagraphs(readFileSync(fullPath, "utf-8").split("\n"));
    for (const para of paragraphs) {
      for (const entry of DOC_BLOCKLIST) {
        if (para.text.includes(entry.term) && !entry.allowNear.test(para.text)) {
          violations.push({ kind: "stale-term", file: relPath, line: para.startLine + 1, term: entry.term, reason: entry.reason });
        }
      }
    }
  }
  return violations;
}

// Enforces the *.doc.mjs shape CLAUDE.md documents as mandatory ("there are
// no exceptions to shipping one"): every component doc needs the full set
// of top-level fields, a non-empty doNot and figmaTokens, and every prop
// needs a description — not just a name/type/default. This was previously
// only a convention (nothing checked it, so it silently drifted per
// component); it's now load-bearing the same way check-parity is.
// states/accessibility (added 2026-08-26) are optional, not part of the
// required set above — opt-out-by-omission like figmaTokens, validated
// below only when present.
async function checkDocSchema() {
  const violations = [];
  for (const name of discoverComponents()) {
    const doc = await loadDoc(name);
    const file = `packages/core/src/${name}.doc.mjs`;
    if (!doc) {
      violations.push({ kind: "doc-schema", file, component: name, field: null, reason: "doc.mjs failed to load" });
      continue;
    }

    for (const field of ["name", "summary", "props", "example", "doNot", "swizzlePath", "extends", "figmaTokens"]) {
      if (!(field in doc)) {
        violations.push({ kind: "doc-schema", file, component: name, field, reason: `missing required top-level field "${field}"` });
      }
    }

    // extends is required but its value is allowed to be null (most
    // components don't extend an HTML attributes interface) — the key
    // must still be present so "no passthrough" reads as a deliberate
    // fact, not an omission nobody got around to.
    if ("extends" in doc && doc.extends !== null && (typeof doc.extends !== "string" || doc.extends.length === 0)) {
      violations.push({ kind: "doc-schema", file, component: name, field: "extends", reason: "extends must be null, or the literal TS `extends X` clause from the component's Props interface" });
    }

    if (doc.summary !== undefined && (typeof doc.summary !== "string" || doc.summary.length < 10)) {
      violations.push({ kind: "doc-schema", file, component: name, field: "summary", reason: "summary missing or too short to be useful" });
    }
    if (doc.example !== undefined && !doc.example) {
      violations.push({ kind: "doc-schema", file, component: name, field: "example", reason: "example is empty" });
    }
    if (doc.doNot !== undefined && (!Array.isArray(doc.doNot) || doc.doNot.length === 0)) {
      violations.push({ kind: "doc-schema", file, component: name, field: "doNot", reason: "doNot must be a non-empty array — every component has at least one real constraint or misuse case worth flagging" });
    }
    if (doc.figmaTokens !== undefined && (typeof doc.figmaTokens !== "object" || doc.figmaTokens === null || Object.keys(doc.figmaTokens).length === 0)) {
      violations.push({ kind: "doc-schema", file, component: name, field: "figmaTokens", reason: "figmaTokens must be a non-empty object — opt out by omitting the field entirely (see ERR_NO_FIGMA_SPEC), not by shipping an empty one" });
    }

    if (Array.isArray(doc.props)) {
      doc.props.forEach((p, i) => {
        const label = p?.name ?? `props[${i}]`;
        if (!p?.name) violations.push({ kind: "doc-schema", file, component: name, field: `props[${i}].name`, reason: "prop is missing a name" });
        if (!p?.type) violations.push({ kind: "doc-schema", file, component: name, field: `${label}.type`, reason: "prop is missing a type" });
        if (p?.default === undefined) violations.push({ kind: "doc-schema", file, component: name, field: `${label}.default`, reason: "prop is missing a default" });
        if (!p?.description) violations.push({ kind: "doc-schema", file, component: name, field: `${label}.description`, reason: "prop is missing a description" });
      });
    } else if (doc.props !== undefined) {
      violations.push({ kind: "doc-schema", file, component: name, field: "props", reason: "props must be an array" });
    }

    // Both optional, DSDS-inspired (see CATALOG-VALIDATION.md-adjacent
    // DSDS fit assessment) but hand-rolled, not DSDS-conformant — same
    // opt-out-by-omission discipline as figmaTokens/ERR_NO_FIGMA_SPEC: a
    // component with no meaningful state variation or no accessibility
    // surface omits the field entirely, not an empty array/object. If
    // present, must be real content, not a placeholder.
    if (doc.states !== undefined && (!Array.isArray(doc.states) || doc.states.length === 0)) {
      violations.push({ kind: "doc-schema", file, component: name, field: "states", reason: "states must be a non-empty array — opt out by omitting the field entirely, not by shipping an empty one" });
    }
    if (Array.isArray(doc.states)) {
      doc.states.forEach((s, i) => {
        const label = s?.name ?? `states[${i}]`;
        if (!s?.name) violations.push({ kind: "doc-schema", file, component: name, field: `states[${i}].name`, reason: "state is missing a name" });
        if (!s?.description) violations.push({ kind: "doc-schema", file, component: name, field: `${label}.description`, reason: "state is missing a description" });
        if (s?.tokens !== undefined && !Array.isArray(s.tokens)) {
          violations.push({ kind: "doc-schema", file, component: name, field: `${label}.tokens`, reason: "state's tokens, if present, must be an array" });
        }
      });
    }

    if (doc.accessibility !== undefined) {
      if (typeof doc.accessibility !== "object" || doc.accessibility === null || Array.isArray(doc.accessibility)) {
        violations.push({ kind: "doc-schema", file, component: name, field: "accessibility", reason: "accessibility must be an object" });
      } else {
        const { keyboardInteractions, ariaAttributes, focusBehaviors } = doc.accessibility;
        if (keyboardInteractions === undefined && ariaAttributes === undefined && focusBehaviors === undefined) {
          violations.push({ kind: "doc-schema", file, component: name, field: "accessibility", reason: "accessibility must declare at least one of keyboardInteractions/ariaAttributes/focusBehaviors — opt out by omitting the whole field, not by shipping an empty object" });
        }
        if (keyboardInteractions !== undefined) {
          if (!Array.isArray(keyboardInteractions) || keyboardInteractions.length === 0) {
            violations.push({ kind: "doc-schema", file, component: name, field: "accessibility.keyboardInteractions", reason: "keyboardInteractions must be a non-empty array" });
          } else {
            keyboardInteractions.forEach((k, i) => {
              if (!k?.key) violations.push({ kind: "doc-schema", file, component: name, field: `accessibility.keyboardInteractions[${i}].key`, reason: "keyboard interaction is missing a key" });
              if (!k?.action) violations.push({ kind: "doc-schema", file, component: name, field: `accessibility.keyboardInteractions[${i}].action`, reason: "keyboard interaction is missing an action" });
            });
          }
        }
        if (ariaAttributes !== undefined) {
          if (!Array.isArray(ariaAttributes) || ariaAttributes.length === 0) {
            violations.push({ kind: "doc-schema", file, component: name, field: "accessibility.ariaAttributes", reason: "ariaAttributes must be a non-empty array" });
          } else {
            ariaAttributes.forEach((a, i) => {
              if (!a?.attribute) violations.push({ kind: "doc-schema", file, component: name, field: `accessibility.ariaAttributes[${i}].attribute`, reason: "aria attribute entry is missing an attribute name" });
              if (!a?.description) violations.push({ kind: "doc-schema", file, component: name, field: `accessibility.ariaAttributes[${i}].description`, reason: "aria attribute entry is missing a description" });
            });
          }
        }
        if (focusBehaviors !== undefined && (!Array.isArray(focusBehaviors) || focusBehaviors.length === 0)) {
          violations.push({ kind: "doc-schema", file, component: name, field: "accessibility.focusBehaviors", reason: "focusBehaviors must be a non-empty array of description strings" });
        }
      }
    }

    // Optional, added 2026-08-26 alongside check-component-bindings — same
    // opt-out-by-omission discipline. Lists figmaTokens keys that
    // check-component-bindings should skip, for either of two honest
    // reasons (say which one applies in a comment next to the key in the
    // figmaTokens object itself, not just in this array): (1) a deliberate
    // code-only addition with no Figma precedent — most often an
    // accessibility fix, e.g. a focus ring Figma's own component doesn't
    // have; or (2) a real Figma binding that this check's coarse,
    // single-static-instance walk genuinely can't see — e.g. a :hover
    // token on a component that's a plain Figma COMPONENT (one static
    // example) rather than a COMPONENT_SET with every state as its own
    // variant instance. Neither reason means "unverified" in the sense of
    // "nobody checked" — it means a human or agent already verified it by
    // other means (reading the real source, an earlier live pull, a
    // screenshot) and this mechanical check just can't independently
    // confirm it. See CLAUDE.md's "Component bindings" section.
    if (doc.figmaTokensSkipLiveCheck !== undefined) {
      if (!Array.isArray(doc.figmaTokensSkipLiveCheck) || doc.figmaTokensSkipLiveCheck.length === 0) {
        violations.push({ kind: "doc-schema", file, component: name, field: "figmaTokensSkipLiveCheck", reason: "figmaTokensSkipLiveCheck must be a non-empty array of figmaTokens keys — opt out by omitting the field entirely, not by shipping an empty one" });
      } else {
        for (const key of doc.figmaTokensSkipLiveCheck) {
          if (!doc.figmaTokens || !(key in doc.figmaTokens)) {
            violations.push({ kind: "doc-schema", file, component: name, field: "figmaTokensSkipLiveCheck", reason: `"${key}" isn't a key in this component's own figmaTokens — figmaTokensSkipLiveCheck can only reference keys that actually exist there` });
          }
        }
      }
    }
  }
  return violations;
}

// Checks two directions of drift between packages/core/src's real
// components and the Latent Sync plugin's own COMPONENT_NAMES list
// (packages/figma-plugin/code.js) — a plain JS array literal, parsed by
// regex rather than imported, since code.js runs inside the Figma plugin
// sandbox and isn't a module this CLI can import. Pure text/file check, no
// Figma connection needed.
//
// Built 2026-08-27 after Alert/AlertStack/Select/MultiSelect/SelectOption
// shipped with real .doc.mjs files but were never added to COMPONENT_NAMES
// — the real plugin sync silently produced no live-bindings data for any
// of them (component-bindings.live.json had 29 keys, not 34) for the
// better part of a session, discovered only because the user manually
// checked GitHub after a sync. check-component-bindings itself couldn't
// catch this: a component missing from COMPONENT_NAMES just reports
// "no-live-data" (deliberately non-blocking, since a component's first day
// of life has no sync yet either) — nothing distinguished "brand new,
// never synced" from "shipped a week ago and someone forgot to register
// it." This check closes exactly that gap, mechanically, on every commit
// that touches a .doc.mjs.
function checkPluginCoverage() {
  const violations = [];
  const pluginRelPath = "packages/figma-plugin/code.js";
  const pluginPath = path.join(REPO_ROOT, pluginRelPath);
  if (!existsSync(pluginPath)) return violations; // plugin file missing is a different, unrelated problem

  const src = readFileSync(pluginPath, "utf-8");
  const match = src.match(/const COMPONENT_NAMES\s*=\s*\[([\s\S]*?)\];/);
  if (!match) {
    violations.push({
      kind: "plugin-coverage",
      file: pluginRelPath,
      component: null,
      reason: "Could not find/parse the COMPONENT_NAMES array — this check can't verify anything until code.js's own shape is fixed",
    });
    return violations;
  }
  const namesInPlugin = new Set(Array.from(match[1].matchAll(/"([A-Za-z0-9]+)"/g)).map((m) => m[1]));

  // Icon is a deliberate, permanent exclusion (see code.js's own comment
  // next to COMPONENT_NAMES) — a thin lucide-react wrapper with no bound
  // style properties of its own to verify.
  for (const name of discoverComponents()) {
    if (name === "Icon") continue;
    if (!namesInPlugin.has(name)) {
      violations.push({
        kind: "plugin-coverage",
        file: pluginRelPath,
        component: name,
        reason: `"${name}" has a real .doc.mjs but is missing from COMPONENT_NAMES — the Latent Sync plugin will silently produce no live-bindings data for it until this is added`,
      });
    }
  }

  // The reverse gap: a name still in COMPONENT_NAMES for a component
  // that's since been removed from packages/core/src (this happened for
  // real with Checkbox, built then deleted the same session) — harmless
  // to the plugin itself (it just won't find a matching Figma node), but
  // worth flagging as dead weight nobody's cleaning up.
  const discovered = new Set(discoverComponents());
  for (const name of namesInPlugin) {
    if (!discovered.has(name)) {
      violations.push({
        kind: "plugin-coverage",
        file: pluginRelPath,
        component: name,
        reason: `"${name}" is still in COMPONENT_NAMES but has no matching .doc.mjs in packages/core/src — likely a removed component whose plugin entry was never cleaned up`,
      });
    }
  }

  return violations;
}

// Checks that every packages/*/package.json workspace has a matching entry
// in the root package-lock.json — npm install (used throughout local work)
// tolerates a stale lockfile silently; npm ci (what CI actually runs)
// doesn't. Built 2026-08-27 after packages/gallery was tracked as a real
// workspace (commit 95bbc32) without regenerating package-lock.json,
// which broke the Latent Sync Check workflow's `npm ci` step with no local
// warning at all — this is the mechanical check that would have caught it
// immediately, on the same commit, instead of on the next real CI run.
function checkLockfileSync() {
  const violations = [];
  const lockPath = path.join(REPO_ROOT, "package-lock.json");
  if (!existsSync(lockPath)) return violations; // no lockfile at all is a different, unrelated problem

  let lock;
  try {
    lock = JSON.parse(readFileSync(lockPath, "utf-8"));
  } catch {
    violations.push({ kind: "lockfile-sync", file: "package-lock.json", component: null, reason: "package-lock.json is not valid JSON" });
    return violations;
  }
  const lockPackages = lock.packages ?? {};

  const packagesDir = path.join(REPO_ROOT, "packages");
  if (!existsSync(packagesDir)) return violations;
  for (const dir of readdirSync(packagesDir)) {
    const pkgJsonPath = path.join(packagesDir, dir, "package.json");
    if (!existsSync(pkgJsonPath)) continue; // most packages/* are plain source dirs, not their own workspace package
    const lockKey = `packages/${dir}`;
    if (!(lockKey in lockPackages)) {
      violations.push({
        kind: "lockfile-sync",
        file: "package-lock.json",
        component: null,
        reason: `packages/${dir}/package.json exists as a real workspace but "${lockKey}" is missing from package-lock.json's packages map — run npm install at the repo root and commit the result`,
      });
    }
  }
  return violations;
}

// Checks for a real, repeatedly-found bug class: a component's CSS sets
// `color` on a wrapper element (expecting an <Icon> child to inherit it via
// currentColor) without a matching `<selector> .lat-icon { color: inherit;
// }` rescue rule. Icon.css sets .lat-icon's own color unconditionally
// (color.icon.default) — a direct rule on the icon element itself always
// wins over an inherited value from a parent, regardless of the parent's
// specificity, so without the rescue rule the icon silently renders the
// wrong color. Badge.css/Button.css already had the fix; Search.css/
// ChatInput.css didn't, and check-parity/check-component-bindings couldn't
// catch it — both only verify a token is *referenced* somewhere in the CSS
// text, never that it actually wins the cascade. Found 2026-08-27 via
// direct computed-style checks in a live browser, not a token audit —
// this check turns that manual audit into something that runs on every
// commit instead of only when someone notices a wrong color by eye.
//
// Deliberately narrow: only flags a selector whose declared color differs
// from color.icon.default (Icon.css's own baseline) — a selector declaring
// color.icon.default itself is textually missing the same rescue rule, but
// renders identically either way (Icon.css's default already matches), so
// there's no visible bug to report.
function checkIconCascade() {
  const violations = [];
  const srcDir = path.join(REPO_ROOT, "packages/core/src");
  if (!existsSync(srcDir)) return violations;

  for (const file of readdirSync(srcDir)) {
    if (!file.endsWith(".css")) continue;
    const relPath = `packages/core/src/${file}`;
    const css = readFileSync(path.join(srcDir, file), "utf-8");
    const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = ruleRe.exec(css))) {
      const selector = m[1].trim();
      const body = m[2];
      if (/%/.test(selector) || /\.lat-icon\b/.test(selector)) continue; // skip @keyframes steps and rules already targeting .lat-icon directly
      const colorMatch = body.match(/(?:^|;|\{)\s*color:\s*(var\(--lat-color-icon-[a-z-]+\))/);
      if (!colorMatch) continue;
      const declaredColor = colorMatch[1];
      if (declaredColor === "var(--lat-color-icon-default)") continue; // matches Icon.css's own baseline — no visible bug either way
      const rescuePattern = `${selector} .lat-icon`;
      if (!css.includes(rescuePattern)) {
        violations.push({
          kind: "icon-cascade",
          file: relPath,
          component: file.slice(0, -".css".length),
          reason: `"${selector}" sets color to ${declaredColor} expecting an <Icon> child to inherit it, but has no "${rescuePattern} { color: inherit; }" rescue rule — Icon.css's own unconditional default will silently win instead`,
        });
      }
    }
  }
  return violations;
}

async function computeCheckDocs() {
  const violations = [
    ...checkStaleTerms(),
    ...(await checkDocSchema()),
    ...checkPluginCoverage(),
    ...checkLockfileSync(),
    ...checkIconCascade(),
  ];
  return {
    type: "check-docs-result",
    status: violations.length === 0 ? "clean" : "violations-found",
    violations,
  };
}

async function cmdCheckDocs(json) {
  const result = await computeCheckDocs();
  print(result, json);
  if (result.violations.length > 0) process.exitCode = 1;
}

// --- latent ask: local RAG over component contracts + repo docs ---
//
// Runs entirely in-process via node-llama-cpp — no separate app/service.
// resolveModelFile() downloads a model into MODELS_DIR the first time it's
// requested and reuses the cached file on every call after, so the only
// "setup" a contributor ever does is running `latent index` once.

let llamaInstance;
async function getLlamaInstance() {
  if (!llamaInstance) llamaInstance = await getLlama();
  return llamaInstance;
}

// Cached per URI: without this, embedding ~170 chunks during `latent index`
// reloaded the GGUF file from disk 170 times (caught during testing — the
// embed model is small enough that it still finished, but the same
// unguarded loadModel() call would be a real problem against the ~2GB chat
// model if it were ever called per-chunk instead of once per `ask`).
const modelCache = new Map();
async function loadModel(modelUri) {
  if (modelCache.has(modelUri)) return modelCache.get(modelUri);
  const llama = await getLlamaInstance();
  const modelPath = await resolveModelFile(modelUri, MODELS_DIR);
  const model = await llama.loadModel({ modelPath });
  modelCache.set(modelUri, model);
  return model;
}

let embeddingContextCache;
async function embedText(text) {
  const model = await loadModel(EMBED_MODEL_URI);
  if (!embeddingContextCache) embeddingContextCache = await model.createEmbeddingContext();
  const { vector } = await embeddingContextCache.getEmbeddingFor(text);
  return vector;
}

// MiniLM-family embedding models train at a small context window (confirmed
// 512 tokens for EMBED_MODEL_URI — small-context is the norm for this whole
// model class, not a one-off config mistake). Several repo docs (CLAUDE.md,
// STYLES.md, DESIGNER-CHECKLIST.md) are multiple KB and blow past that as a
// single chunk, which throws rather than degrading — so nothing gets
// embedText'd without going through this first. Paragraph-aware, falls back
// to a hard character split only if a single paragraph itself is oversized.
function chunkTextForEmbedding(text, maxChars = 1000) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = "";
  for (const para of paragraphs) {
    const candidate = buf ? `${buf}\n\n${para}` : para;
    if (candidate.length <= maxChars) {
      buf = candidate;
      continue;
    }
    if (buf) chunks.push(buf);
    if (para.length <= maxChars) {
      buf = para;
    } else {
      for (let i = 0; i < para.length; i += maxChars) chunks.push(para.slice(i, i + maxChars));
      buf = "";
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length > 0 ? chunks : [text];
}

// One chunk per component, built from the same fields CLAUDE.md documents
// as mandatory (see checkDocSchema above) — props, doNot, swizzlePath,
// figmaTokens, example — so the index can't say anything the contract
// itself doesn't already say.
function docChunkText(doc) {
  const props = (doc.props ?? [])
    .map((p) => `${p.name}: ${p.type} (default: ${p.default}) — ${p.description}`)
    .join("\n");
  const tokens = doc.figmaTokens
    ? Object.entries(doc.figmaTokens).map(([k, v]) => `${k} -> ${v}`).join("\n")
    : "(none declared)";
  const sections = [
    `Component: ${doc.name}`,
    `Summary: ${doc.summary}`,
    `Props:\n${props}`,
    `Do not:\n${(doc.doNot ?? []).join("\n")}`,
    `Swizzle path: ${doc.swizzlePath}`,
    `Figma tokens:\n${tokens}`,
    `Example:\n${doc.example}`,
  ];
  // Both optional — only included when the component actually declares
  // them, same opt-out-by-omission the fields themselves follow.
  if (doc.states) {
    sections.push(`States:\n${doc.states.map((s) => `${s.name} — ${s.description}`).join("\n")}`);
  }
  if (doc.accessibility) {
    const a11yLines = [];
    if (doc.accessibility.keyboardInteractions) {
      a11yLines.push(...doc.accessibility.keyboardInteractions.map((k) => `Key ${k.key}: ${k.action}`));
    }
    if (doc.accessibility.ariaAttributes) {
      a11yLines.push(...doc.accessibility.ariaAttributes.map((a) => `${a.attribute}: ${a.description}`));
    }
    if (doc.accessibility.focusBehaviors) {
      a11yLines.push(...doc.accessibility.focusBehaviors);
    }
    sections.push(`Accessibility:\n${a11yLines.join("\n")}`);
  }
  return sections.join("\n\n");
}

async function cmdIndex(json) {
  const index = new LocalIndex(INDEX_PATH);
  // upsertItem only replaces an existing entry when given a stable `id` —
  // without one it always generates a fresh uuid, i.e. it always inserts,
  // never updates (caught via duplicate entries in `ask` results during
  // testing). cmdIndex already rebuilds from every component/doc on every
  // call, so the correct fix is a clean rebuild each time, not manual id
  // bookkeeping — otherwise re-running `latent index` (as the pre-commit
  // hook does automatically) would silently double the index on every commit.
  if (await index.isIndexCreated()) await index.deleteIndex();
  await index.createIndex();

  let contractCount = 0;
  let contractChunkCount = 0;
  for (const name of discoverComponents()) {
    const doc = await loadDoc(name);
    if (!doc) continue;
    const pieces = chunkTextForEmbedding(docChunkText(doc));
    for (let i = 0; i < pieces.length; i++) {
      const vector = await embedText(pieces[i]);
      await index.upsertItem({ vector, metadata: { type: "contract", component: name, chunk: i, chunkCount: pieces.length, text: pieces[i] } });
      contractChunkCount++;
    }
    contractCount++;
  }

  let docCount = 0;
  let docChunkCount = 0;
  for (const rel of DOC_FILES) {
    const full = path.join(REPO_ROOT, rel);
    if (!existsSync(full)) continue;
    const pieces = chunkTextForEmbedding(readFileSync(full, "utf-8"));
    for (let i = 0; i < pieces.length; i++) {
      const vector = await embedText(pieces[i]);
      await index.upsertItem({ vector, metadata: { type: "doc", path: rel, chunk: i, chunkCount: pieces.length, text: pieces[i] } });
      docChunkCount++;
    }
    docCount++;
  }

  print({
    type: "index-result",
    contractsIndexed: contractCount,
    contractChunks: contractChunkCount,
    docsIndexed: docCount,
    docChunks: docChunkCount,
    indexPath: INDEX_PATH,
  }, json);
}

async function cmdAsk(question, json, checkComponent, monitor, cite) {
  if (!question) return print(err("ERR_MISSING_ARG", { arg: "question" }), json);

  let mon = null;
  if (monitor) {
    const { createMonitor } = await import("./monitor.mjs");
    mon = await createMonitor({});
    console.error(`\nMonitor running at ${mon.url} — open it in a browser, then this will continue.`);
    await mon.waitForClient();
    mon.emit("start", { question, checkComponent: checkComponent ?? null });
  }

  const index = new LocalIndex(INDEX_PATH);
  if (!(await index.isIndexCreated())) return print(err("ERR_NO_INDEX"), json);

  // --check names the component directly — no need to guess it via semantic
  // search, and mixing in unrelated generic chunks turned out to actively
  // hurt: with --check, feeding the component's contract *plus* 4 loosely-
  // related chunks (other components, doc fragments) produced a confused
  // "the question is not provided" answer from the small chat model, even
  // though the question was clearly the last line of the prompt — the
  // model just lost the thread in the extra noise. So --check skips the
  // generic semantic search entirely and uses only the named component's
  // own chunks (listItemsByMetadata is an exact match, guaranteed present)
  // plus the check-parity result. Plain `ask` with no --check still uses
  // semantic search, since there's no named component to look up directly.
  let allChunks;
  if (checkComponent) {
    allChunks = await index.listItemsByMetadata({ type: "contract", component: checkComponent });
  } else {
    const qVector = await embedText(question);
    // vectra's real signature is (vector, query, topK, filter?, isBm25?) —
    // query is a required string. Passing topK where query belongs silently
    // returns zero results (topK ends up NaN) rather than throwing — caught
    // this in testing via an empty `sources` array.
    const results = await index.queryItems(qVector, question, 4);
    allChunks = results.map((r) => r.item);
  }

  if (mon) {
    mon.emit("retrieval", {
      count: allChunks.length,
      exact: Boolean(checkComponent),
      chunks: allChunks.map((item) => ({
        type: item.metadata.type,
        component: item.metadata.component,
        path: item.metadata.path,
        chunk: item.metadata.chunk,
        chunkCount: item.metadata.chunkCount,
        snippet: item.metadata.text.length > 220 ? item.metadata.text.slice(0, 220) + "…" : item.metadata.text,
      })),
    });
  }

  let retrievedContext = allChunks.map((item) => item.metadata.text).join("\n\n---\n\n");

  // Folds a failed check straight into the same context, so the model
  // explains against the real declared contract instead of guessing.
  let parityBlock = null;
  if (checkComponent) {
    const parity = await computeCheckParity(checkComponent);
    parityBlock = `check-parity result for ${checkComponent}:\n${JSON.stringify(parity, null, 2)}`;
    retrievedContext += `\n\n---\n\n${parityBlock}`;
    if (mon) {
      mon.emit("check-parity", {
        component: checkComponent,
        status: parity.status,
        failedProperties: (parity.checks ?? []).filter((c) => !c.found).map((c) => c.property),
      });
    }
  }

  // A vague free-text question ("why is this failing") left the small chat
  // model unable to connect "this" to Button even with the right JSON in
  // context — confirmed by testing the same context with an explicit
  // question naming the component, which got a correct, specific answer.
  // --check already knows the component; use that to disambiguate instead
  // of relying on the user to name it themselves.
  const effectiveQuestion = checkComponent
    ? `Regarding the "${checkComponent}" component's check-parity result above: ${question}`
    : question;

  const chatModel = await loadModel(CHAT_MODEL_URI);
  const llamaContext = await chatModel.createContext();
  const session = new LlamaChatSession({ contextSequence: llamaContext.getSequence() });

  const sources = allChunks.map((item) => item.metadata);
  let answer;
  let claims;

  if (cite) {
    // Grammar-constrained generation forces syntactically valid JSON — per
    // node-llama-cpp's own docs this "reduces," not eliminates, hallucination:
    // it guarantees the *shape* of the output, not the truth of its content.
    // The actual anti-hallucination step is what happens after generation —
    // every claim's "quote" is checked as a real substring of the numbered
    // source it claims to come from. The model can still assert something
    // false in "text", but it can no longer get away with inventing a
    // citation for it: the quote either exists in that source or the claim
    // is marked unverified, visibly, instead of silently trusted.
    const sourceTexts = [...allChunks.map((item) => item.metadata.text), ...(parityBlock ? [parityBlock] : [])];
    const numberedSources = sourceTexts.map((text, i) => `Source ${i}:\n${text}`).join("\n\n");

    // minItems/maxItems + telling the model the expected count in the
    // prompt are both required — node-llama-cpp's own grammar docs warn
    // that using minItems/maxItems without also stating the expectation in
    // the prompt "may lead to hallucinations." Confirmed the failure mode
    // directly: without both, the model reliably emitted a syntactically
    // valid but empty `{"claims": []}` — the grammar guarantees valid JSON,
    // not that the model tries to fill it in.
    const citePrompt = `Answer the question using ONLY the numbered sources below. Break your answer into individual factual claims — provide between 1 and 5 claims, at least one. For each claim, give:\n- "text": the claim, in your own words\n- "quote": an exact substring copied verbatim from the source it comes from — do not paraphrase the quote\n- "source": the number of the source the quote came from\n\nSources:\n${numberedSources}\n\nQuestion: ${effectiveQuestion}`;
    if (process.env.LATENT_DEBUG_PROMPT) console.error("=== FULL PROMPT (cite) ===\n" + citePrompt + "\n=== END PROMPT (length: " + citePrompt.length + ") ===");
    if (mon) mon.emit("prompt-ready", { length: citePrompt.length });

    const llama = await getLlamaInstance();
    const grammar = await llama.createGrammarForJsonSchema({
      type: "object",
      properties: {
        claims: {
          type: "array",
          minItems: 1,
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              quote: { type: "string" },
              source: { type: "integer" },
            },
          },
        },
      },
    });

    const raw = await session.prompt(citePrompt, { grammar });
    const parsed = grammar.parse(raw);

    // Case-insensitive: the model tends to capitalize a quoted fragment as
    // if it were a sentence start ("Three sizes") even when the source has
    // it mid-sentence, lowercase ("three sizes") — confirmed this produces
    // false-negative "unverified" claims on genuinely real quotes if the
    // comparison is case-sensitive. Still requires the actual substring
    // content to be real; only case is forgiven, not the quote itself.
    // Empty/near-empty quote is a real loophole, not a hypothetical: caught
    // it directly — a claim with quote: "" was coming back `verified: true`,
    // because "".includes("") (or any trivially short substring) is always
    // true in JS. That's fail-open exactly where this needs to fail closed —
    // no real quote means "can't verify," not "verified." Requiring a few
    // real characters also blocks near-empty quotes ("a", "is") from
    // trivially matching almost any source.
    // Strips markdown emphasis (*/_) too — caught a false-negative directly:
    // a doc source had **bold** around a phrase, the model's quote (correctly)
    // reproduced only the plain text, and the literal "**" made a real,
    // exact quote fail to match. Only affects `type: "doc"` sources (root
    // markdown files); `type: "contract"` chunks are plain generated text
    // with no markdown syntax, so this never mattered for the earlier
    // Button-only tests.
    // Also strips backticks and every quote-mark variant (straight and
    // curly, single and double) — caught a third false negative directly:
    // the source had backtick code-spans (`PowerShell`), and the model's
    // quote didn't reproduce backticks at all, instead re-rendering that
    // text wrapped in curly smart quotes ('PowerShell') — its own styling
    // choice, not a copy error, but exact substring matching has no
    // tolerance for either the punctuation swap or straight-vs-curly.
    const normalize = (s) => String(s ?? "").replace(/[*_`'‘’"“”]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
    claims = (parsed.claims ?? []).map((c) => {
      const src = sourceTexts[c.source];
      const normalizedQuote = normalize(c.quote);
      const verified = typeof src === "string" && normalizedQuote.length >= 4 && normalize(src).includes(normalizedQuote);
      return { ...c, verified };
    });

    answer = claims
      .map((c) => (c.verified ? c.text : `${c.text} [UNVERIFIED — no matching source text found]`))
      .join(" ");

    if (!json) {
      process.stderr.write("\n");
      for (const c of claims) {
        process.stderr.write(`${c.verified ? "✓" : "✗"} ${c.text}\n    quote (source ${c.source}): "${c.quote}"\n`);
      }
      process.stderr.write("\n");
    }
    if (mon) mon.emit("done", { answer, sources, claims });
  } else {
    const prompt = `Answer using ONLY the context below. If the answer isn't in it, say so clearly.\n\nContext:\n${retrievedContext}\n\nQuestion: ${effectiveQuestion}`;
    if (process.env.LATENT_DEBUG_PROMPT) console.error("=== FULL PROMPT ===\n" + prompt + "\n=== END PROMPT (length: " + prompt.length + ") ===");
    if (mon) mon.emit("prompt-ready", { length: prompt.length });

    // Streams to stderr as it generates so a human watching the terminal
    // sees the answer appear live, token by token, rather than staring at a
    // blank screen until the single final JSON blob prints to stdout. Kept
    // off stdout deliberately — --json consumers still get one clean JSON
    // object there, uninterrupted by partial text. The monitor gets the
    // same stream over SSE, one `token` event per chunk. Not used for
    // --cite: streaming raw grammar-constrained JSON char by char reads as
    // garbled JSON, not prose, so that path waits for the full result instead.
    if (!json) process.stderr.write("\n");
    answer = await session.prompt(prompt, {
      onTextChunk: (text) => {
        if (!json) process.stderr.write(text);
        if (mon) mon.emit("token", { text });
      },
    });
    if (!json) process.stderr.write("\n\n");
    if (mon) mon.emit("done", { answer, sources });
  }

  if (mon) console.error(`Monitor still running at ${mon.url} — Ctrl+C to stop.`);

  print({ type: "ask-result", question, answer, sources, ...(claims ? { claims } : {}) }, json);
}

// Runs every drift check this repo has in one call — sync figma, check-styles,
// check-parity + check-component-bindings (every component, honoring the
// same "ERR_NO_FIGMA_SPEC warns, doesn't block" exception the pre-commit
// hook documents), and check-docs. This is what both
// .github/workflows/latent-sync-check.yml and a human at the terminal
// should reach for instead of running each check separately.
async function computeVerify() {
  const syncFigma = await computeSyncFigma(path.join(TOKENS_DIR, "figma-export.live.json"));
  const checkStyles = await computeCheckStyles(path.join(TOKENS_DIR, "styles-export.live.json"));

  const checkParity = [];
  const checkComponentBindings = [];
  for (const name of discoverComponents()) {
    checkParity.push(await computeCheckParity(name));
    checkComponentBindings.push(await computeCheckComponentBindings(name));
  }

  const checkDocs = await computeCheckDocs();

  const failed = [];
  if (syncFigma.type === "error" || syncFigma.driftCount > 0) failed.push("sync figma");
  if (checkStyles.type === "error" || checkStyles.driftCount > 0) failed.push("check-styles");
  for (const result of checkParity) {
    if (result.type === "error") {
      if (result.code === "ERR_NO_FIGMA_SPEC") continue; // opted out, not drifting
      failed.push(`check-parity ${result.requested ?? ""}`.trim());
    } else if (result.status !== "matches") {
      failed.push(`check-parity ${result.component}`);
    }
  }
  for (const result of checkComponentBindings) {
    if (result.type === "error") {
      if (result.code === "ERR_NO_FIGMA_SPEC") continue; // opted out, not drifting
      failed.push(`check-component-bindings ${result.requested ?? ""}`.trim());
    } else if (result.status === "drift-detected") {
      failed.push(`check-component-bindings ${result.component}`);
    }
    // "no-live-data" isn't pushed to failed — it means the plugin's last
    // extraction predates this component (renamed, or genuinely new),
    // not that a previously-verified claim regressed. Still visible in
    // the full checkComponentBindings array below, just not gating.
  }
  if (checkDocs.violations.length > 0) failed.push("check-docs");

  return {
    type: "verify-result",
    status: failed.length === 0 ? "clean" : "failed",
    failed,
    syncFigma,
    checkStyles,
    checkParity,
    checkComponentBindings,
    checkDocs,
  };
}

async function cmdVerify(json) {
  const result = await computeVerify();
  print(result, json);
  if (result.status !== "clean") process.exitCode = 1;
}

function setAtDottedPath(root, dottedPath, value) {
  const parts = dottedPath.split(".");
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (typeof node[key] !== "object" || node[key] === null || Array.isArray(node[key])) {
      node[key] = {};
    }
    node = node[key];
  }
  node[parts[parts.length - 1]] = value;
}

function gitDirtyFiles(paths) {
  const out = execFileSync("git", ["status", "--porcelain", "--", ...paths], { cwd: REPO_ROOT, encoding: "utf-8" });
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3));
}

// Mechanically applies what sync figma/check-styles already report as drift
// into the real token/style files — additions (missingInCode) and value
// overwrites (valueMismatches) only. Never deletes (missingInFigma) — that's
// a human call every time, not automated. --write actually writes; without
// it, this only reports what *would* change. Never invoked by the plugin or
// CI — a human runs this deliberately, after already deciding Figma's side
// is the one that's right (see CLAUDE.md's "investigate before overwriting"
// discipline — this command doesn't make that judgment call, it just saves
// the hand-typing once you have).
async function computeApplyDrift({ tokensFile, stylesFile, write, force }) {
  const tokensFilePath = tokensFile ?? path.join(TOKENS_DIR, "figma-export.live.json");
  const stylesFilePath = stylesFile ?? path.join(TOKENS_DIR, "styles-export.live.json");

  const syncResult = await computeSyncFigma(tokensFilePath);
  const stylesResult = await computeCheckStyles(stylesFilePath);

  const tokenChanges = [];
  const tokenSkipped = [];
  const layerData = {};

  if (syncResult.type === "sync-result") {
    for (const layer of Object.keys(LAYER_FILES)) {
      layerData[layer] = JSON.parse(readFileSync(path.join(TOKENS_DIR, LAYER_FILES[layer]), "utf-8"));
    }

    for (const m of syncResult.missingInCode) {
      const wrapped = isTerminalModeMap(m.figmaValue) ? { value: m.figmaValue } : m.figmaValue;
      setAtDottedPath(layerData[m.layer], m.token, wrapped);
      tokenChanges.push({ action: "add", layer: m.layer, token: m.token, value: m.figmaValue });
    }
    for (const vm of syncResult.valueMismatches) {
      const dottedPath = vm.mode ? `${vm.token}.value.${vm.mode}` : vm.token;
      setAtDottedPath(layerData[vm.layer], dottedPath, vm.figmaValue);
      tokenChanges.push({ action: "update", layer: vm.layer, token: vm.token, mode: vm.mode, from: vm.codeValue, to: vm.figmaValue });
    }
    for (const mf of syncResult.missingInFigma) {
      tokenSkipped.push({
        layer: mf.layer,
        token: mf.token,
        reason: "would require deleting an existing code token — not automated, handle manually",
      });
    }
  }

  const styleChanges = [];
  const styleSkipped = [];
  let stylesData = null;

  if (stylesResult.type === "check-styles-result") {
    stylesData = JSON.parse(readFileSync(path.join(TOKENS_DIR, "styles.json"), "utf-8"));
    const figmaRaw = JSON.parse(readFileSync(path.resolve(process.cwd(), stylesFilePath), "utf-8"));

    for (const m of stylesResult.missingInCode) {
      const fullValue = figmaRaw[m.category]?.[m.style];
      if (fullValue === undefined) {
        styleSkipped.push({ category: m.category, style: m.style, reason: "not found in the export file — can't reconstruct the full style object" });
        continue;
      }
      stylesData[m.category] ??= {};
      stylesData[m.category][m.style] = fullValue;
      styleChanges.push({ action: "add", category: m.category, style: m.style, value: fullValue });
    }
    for (const vm of stylesResult.valueMismatches) {
      const dottedPath = `${vm.category}.${vm.style}.${vm.field}`;
      setAtDottedPath(stylesData, dottedPath, vm.figmaValue);
      styleChanges.push({ action: "update", category: vm.category, style: vm.style, field: vm.field, from: vm.codeValue, to: vm.figmaValue });
    }
    for (const mf of stylesResult.missingInFigma) {
      styleSkipped.push({
        category: mf.category,
        style: mf.style,
        reason: "would require deleting an existing code style — not automated, handle manually",
      });
    }
  }

  const filesToWrite = [];
  const changedLayers = new Set(tokenChanges.map((c) => c.layer));
  for (const layer of changedLayers) {
    filesToWrite.push({ path: path.join(TOKENS_DIR, LAYER_FILES[layer]), data: layerData[layer] });
  }
  if (styleChanges.length > 0) {
    filesToWrite.push({ path: path.join(TOKENS_DIR, "styles.json"), data: stylesData });
  }

  let writeError = null;
  let wrote = false;
  if (write && filesToWrite.length > 0) {
    const dirty = gitDirtyFiles(filesToWrite.map((f) => f.path));
    if (dirty.length > 0 && !force) {
      writeError = `Refusing to write: uncommitted changes already exist in ${dirty.join(", ")}. Commit/stash them first, or pass --force to overwrite anyway.`;
    } else {
      for (const f of filesToWrite) {
        writeFileSync(f.path, JSON.stringify(f.data, null, 2) + "\n");
      }
      wrote = true;
    }
  }

  return {
    type: "apply-drift-result",
    mode: write ? (wrote ? "written" : "blocked") : "dry-run",
    tokenChanges,
    tokenSkipped,
    styleChanges,
    styleSkipped,
    filesWritten: wrote ? filesToWrite.map((f) => path.relative(REPO_ROOT, f.path)) : [],
    error: writeError,
  };
}

async function cmdApplyDrift(json, write, force, tokensFile, stylesFile) {
  const result = await computeApplyDrift({ tokensFile, stylesFile, write, force });
  print(result, json);
  if (result.error) process.exitCode = 1;
}

// --- compose-check: validates a generated page composition against the ---
// --- real component catalog. See CATALOG-VALIDATION.md for the design. ---
//
// Deterministic — no model, no index, nothing from `ask`. Same category as
// check-parity: the catalog is generated from .doc.mjs at validation time,
// never hand-maintained separately, for the same reason sync figma/
// check-parity/check-docs all exist — a second source of truth for the
// same facts is exactly the drift this repo has spent effort preventing
// everywhere else.

// .doc.mjs's `type` field is a loose TS-like string, not JSON Schema
// ('"primary" | "secondary" | "ghost"', "boolean", "React.ReactNode",
// "(value: string) => void"). Parses the two constrainable shapes
// (scalars, string-literal unions); everything else — function types,
// React.ReactNode, generics — falls back to unconstrained ("any") rather
// than guessing wrong, same call checkDocSchema already makes treating
// `extends: null` as a deliberate valid state instead of an omission.
function parsePropType(typeStr) {
  const trimmed = String(typeStr ?? "").trim();
  if (trimmed === "boolean") return { kind: "boolean" };
  if (trimmed === "string") return { kind: "string" };
  if (trimmed === "number") return { kind: "number" };
  if (/^"[^"]*"(\s*\|\s*"[^"]*")*$/.test(trimmed)) {
    const values = [...trimmed.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    return { kind: "enum", values };
  }
  return { kind: "any" };
}

async function buildComponentCatalog() {
  const catalog = {};
  for (const name of discoverComponents()) {
    const doc = await loadDoc(name);
    if (!doc) continue;
    const props = {};
    for (const p of doc.props ?? []) {
      props[p.name] = parsePropType(p.type);
    }
    catalog[name] = { props };
  }
  return catalog;
}

function isComposeNodeLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof value.component === "string";
}

// Recursive tree walker. A CompositionNode is { component, props?, children? }
// — components nest (a React.ReactNode/function prop represents nesting,
// not a scalar to validate, see parsePropType above), so this validates the
// whole tree, not one flat object. Collects every violation instead of
// stopping at the first, same as check-parity reporting every mismatched
// token in one pass rather than one at a time.
function validateComposition(node, catalog, path, errors) {
  if (node === null || typeof node !== "object" || Array.isArray(node)) {
    errors.push({ path, message: "expected a composition node object" });
    return;
  }
  const { component, props, children } = node;
  if (typeof component !== "string" || !catalog[component]) {
    errors.push({ path: `${path}.component`, message: `"${component}" is not a real component` });
    return; // nothing further here can be validated against an unknown component's schema
  }
  const schema = catalog[component];
  if (props !== undefined) {
    if (props === null || typeof props !== "object" || Array.isArray(props)) {
      errors.push({ path: `${path}.props`, message: "props must be an object" });
    } else {
      for (const [propName, value] of Object.entries(props)) {
        const propSchema = schema.props[propName];
        if (!propSchema) {
          errors.push({ path: `${path}.props.${propName}`, message: `"${propName}" is not a valid prop for ${component}` });
          continue;
        }
        // A ReactNode-typed prop (parsePropType's "any") can itself hold a
        // nested composition — PageLayout's header/panel/footer, for
        // instance. Recurse into it if its value actually looks like a
        // composition node (or an array of them), rather than leaving it
        // unchecked just because the prop's own declared type couldn't be
        // constrained to a scalar. Found this gap building the first real
        // template, not by reasoning about it in the abstract.
        if (isComposeNodeLike(value)) {
          validateComposition(value, catalog, `${path}.props.${propName}`, errors);
          continue;
        }
        if (Array.isArray(value) && value.some(isComposeNodeLike)) {
          value.forEach((item, i) => {
            if (isComposeNodeLike(item)) validateComposition(item, catalog, `${path}.props.${propName}[${i}]`, errors);
          });
          continue;
        }
        if (propSchema.kind === "enum" && !propSchema.values.includes(value)) {
          errors.push({
            path: `${path}.props.${propName}`,
            message: `"${value}" is not a valid ${propName} for ${component} (expected: ${propSchema.values.join(" | ")})`,
          });
        } else if (propSchema.kind === "boolean" && typeof value !== "boolean") {
          errors.push({ path: `${path}.props.${propName}`, message: `${propName} must be a boolean for ${component}` });
        } else if (propSchema.kind === "string" && typeof value !== "string") {
          errors.push({ path: `${path}.props.${propName}`, message: `${propName} must be a string for ${component}` });
        } else if (propSchema.kind === "number" && typeof value !== "number") {
          errors.push({ path: `${path}.props.${propName}`, message: `${propName} must be a number for ${component}` });
        }
        // kind "any" (function props, React.ReactNode, generics) — intentionally unconstrained
      }
    }
  }
  // children is either a plain string (text content — several components,
  // e.g. Badge, take their label via JSX children rather than a dedicated
  // prop, since `extends` passthrough isn't itemized in .doc.mjs's props
  // array; nothing to validate about arbitrary text) or an array of nested
  // composition nodes, validated recursively. Found needing the string case
  // by trying to model Badge's real API accurately, not by assuming a tree
  // is always nested components.
  if (children !== undefined) {
    if (typeof children === "string") {
      // text content — nothing to validate
    } else if (!Array.isArray(children)) {
      errors.push({ path: `${path}.children`, message: "children must be a string or an array of composition nodes" });
    } else {
      children.forEach((child, i) => validateComposition(child, catalog, `${path}.children[${i}]`, errors));
    }
  }
}

async function computeComposeCheck(filePath) {
  if (!filePath) return err("ERR_MISSING_ARG", { arg: "file" });
  const resolvedFile = path.resolve(process.cwd(), filePath);
  if (!existsSync(resolvedFile)) return err("ERR_FILE_NOT_FOUND", { path: resolvedFile });

  let composition;
  try {
    composition = JSON.parse(readFileSync(resolvedFile, "utf-8"));
  } catch (e) {
    return err("ERR_INVALID_COMPOSITION_JSON", { path: resolvedFile, message: e.message });
  }

  const catalog = await buildComponentCatalog();
  const errors = [];
  validateComposition(composition, catalog, "root", errors);

  return { type: "compose-check-result", status: errors.length === 0 ? "valid" : "invalid", errors };
}

async function cmdComposeCheck(filePath, json) {
  const result = await computeComposeCheck(filePath);
  print(result, json);
  if (result.type === "error" || result.status !== "valid") process.exitCode = 1;
}

function cmdManifest(json) {
  const manifest = {
    type: "manifest",
    cli: "latent",
    commands: Object.entries(COMMANDS).map(([name, spec]) => ({ name, ...spec })),
    errorCodes: Object.entries(ERROR_CODES).map(([code, message]) => ({ code, message })),
  };
  if (json) return print(manifest);
  console.log(JSON.stringify(manifest, null, 2));
}

function print(obj, json = true) {
  console.log(JSON.stringify(obj, null, 2));
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  const json = rest.includes("--json");
  const positional = rest.filter((a) => !a.startsWith("--"));

  switch (cmd) {
    case "list":
      return cmdList(json);
    case "docs":
      return cmdDocs(positional[0], json);
    case "swizzle": {
      const destFlagIdx = rest.indexOf("--dest");
      const dest = destFlagIdx >= 0 ? rest[destFlagIdx + 1] : undefined;
      return cmdSwizzle(positional[0], json, dest);
    }
    case "sync": {
      if (positional[0] !== "figma") {
        print(err("ERR_UNKNOWN_COMMAND", { requested: `sync ${positional[0] ?? ""}`.trim() }));
        process.exitCode = 1;
        return;
      }
      const fileFlagIdx = rest.indexOf("--file");
      const filePath = fileFlagIdx >= 0 ? rest[fileFlagIdx + 1] : undefined;
      return cmdSyncFigma(filePath, json);
    }
    case "check-parity":
      return cmdCheckParity(positional[0], json);
    case "check-component-bindings":
      return cmdCheckComponentBindings(positional[0], json);
    case "check-styles": {
      const fileFlagIdx = rest.indexOf("--file");
      const filePath = fileFlagIdx >= 0 ? rest[fileFlagIdx + 1] : undefined;
      return cmdCheckStyles(filePath, json);
    }
    case "check-docs":
      return cmdCheckDocs(json);
    case "verify":
      return cmdVerify(json);
    case "apply-drift": {
      const write = rest.includes("--write");
      const force = rest.includes("--force");
      const tokensFlagIdx = rest.indexOf("--tokens-file");
      const tokensFile = tokensFlagIdx >= 0 ? rest[tokensFlagIdx + 1] : undefined;
      const stylesFlagIdx = rest.indexOf("--styles-file");
      const stylesFile = stylesFlagIdx >= 0 ? rest[stylesFlagIdx + 1] : undefined;
      return cmdApplyDrift(json, write, force, tokensFile, stylesFile);
    }
    case "manifest":
      return cmdManifest(json);
    case "compose-check":
      return cmdComposeCheck(positional[0], json);
    case "index":
      return cmdIndex(json);
    case "ask": {
      const checkFlagIdx = rest.indexOf("--check");
      const checkComponent = checkFlagIdx >= 0 ? rest[checkFlagIdx + 1] : undefined;
      const monitor = rest.includes("--monitor");
      const cite = rest.includes("--cite");
      return cmdAsk(positional[0], json, checkComponent, monitor, cite);
    }
    default:
      print(err("ERR_UNKNOWN_COMMAND", { requested: cmd }));
      process.exitCode = 1;
  }
}

main();
