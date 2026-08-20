#!/usr/bin/env node
// latent — CLI for the design system. Every command supports --json so an
// agent gets structured output instead of parsing prose.
import { readFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { flattenTokens, tokenPathToCssVar, tokensEqual } from "../../tokens/flatten.mjs";

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

function computeCheckDocs() {
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
          violations.push({ file: relPath, line: para.startLine + 1, term: entry.term, reason: entry.reason });
        }
      }
    }
  }

  return {
    type: "check-docs-result",
    status: violations.length === 0 ? "clean" : "violations-found",
    violations,
  };
}

function cmdCheckDocs(json) {
  const result = computeCheckDocs();
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

  const checkDocs = computeCheckDocs();

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
    case "manifest":
      return cmdManifest(json);
    default:
      print(err("ERR_UNKNOWN_COMMAND", { requested: cmd }));
      process.exitCode = 1;
  }
}

main();
