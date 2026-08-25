#!/usr/bin/env node
// latent — CLI for the design system. Every command supports --json so an
// agent gets structured output instead of parsing prose.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { flattenTokens, tokenPathToCssVar, tokensEqual, isTerminalModeMap } from "../../tokens/flatten.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORE_SRC = path.resolve(__dirname, "../../core/src");
const REPO_ROOT = path.resolve(__dirname, "../../..");

const TOKENS_DIR = path.resolve(__dirname, "../../tokens");

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
  "check-styles": { args: [], flags: ["--file", "--json"], responseTypes: ["check-styles-result", "error"] },
  "check-docs": { args: [], flags: ["--json"], responseTypes: ["check-docs-result"] },
  verify: { args: [], flags: ["--json"], responseTypes: ["verify-result"] },
  "apply-drift": {
    args: [],
    flags: ["--json", "--write", "--force", "--tokens-file", "--styles-file"],
    responseTypes: ["apply-drift-result"],
  },
  manifest: { args: [], flags: ["--json"], responseTypes: ["manifest"] },
};

const ERROR_CODES = {
  ERR_UNKNOWN_COMPONENT: "No component matched the requested name.",
  ERR_UNKNOWN_COMMAND: "A top-level command name was not recognized.",
  ERR_MISSING_ARG: "A required positional argument was omitted.",
  ERR_FILE_NOT_FOUND: "The referenced file does not exist on disk.",
  ERR_NO_FIGMA_SPEC: "Component has no figmaTokens mapping defined in its doc file.",
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
async function checkDocSchema() {
  const violations = [];
  for (const name of discoverComponents()) {
    const doc = await loadDoc(name);
    const file = `packages/core/src/${name}.doc.mjs`;
    if (!doc) {
      violations.push({ kind: "doc-schema", file, component: name, field: null, reason: "doc.mjs failed to load" });
      continue;
    }

    for (const field of ["name", "summary", "props", "example", "doNot", "swizzlePath", "figmaTokens"]) {
      if (!(field in doc)) {
        violations.push({ kind: "doc-schema", file, component: name, field, reason: `missing required top-level field "${field}"` });
      }
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
  }
  return violations;
}

async function computeCheckDocs() {
  const violations = [...checkStaleTerms(), ...(await checkDocSchema())];
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

// Runs every drift check this repo has in one call — sync figma, check-styles,
// check-parity (every component, honoring the same "ERR_NO_FIGMA_SPEC warns,
// doesn't block" exception the pre-commit hook documents), and check-docs.
// This is what both .github/workflows/latent-sync-check.yml and a human at
// the terminal should reach for instead of running each check separately.
async function computeVerify() {
  const syncFigma = await computeSyncFigma(path.join(TOKENS_DIR, "figma-export.live.json"));
  const checkStyles = await computeCheckStyles(path.join(TOKENS_DIR, "styles-export.live.json"));

  const checkParity = [];
  for (const name of discoverComponents()) {
    checkParity.push(await computeCheckParity(name));
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
  if (checkDocs.violations.length > 0) failed.push("check-docs");

  return {
    type: "verify-result",
    status: failed.length === 0 ? "clean" : "failed",
    failed,
    syncFigma,
    checkStyles,
    checkParity,
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
    default:
      print(err("ERR_UNKNOWN_COMMAND", { requested: cmd }));
      process.exitCode = 1;
  }
}

main();
