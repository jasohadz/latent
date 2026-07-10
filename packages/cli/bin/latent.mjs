#!/usr/bin/env node
// latent — CLI for the design system. Every command supports --json so an
// agent gets structured output instead of parsing prose.
import { readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { flattenTokens, tokenPathToCssVar, tokensEqual } from "../../tokens/flatten.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORE_SRC = path.resolve(__dirname, "../../core/src");

const TOKENS_PATH = path.resolve(__dirname, "../../tokens/tokens.json");

const COMMANDS = {
  list: { args: [], flags: ["--json"], responseTypes: ["component-list"] },
  docs: { args: ["<name>"], flags: ["--json"], responseTypes: ["component-doc", "error"] },
  swizzle: { args: ["<name>"], flags: ["--json", "--dest"], responseTypes: ["swizzle-result", "error"] },
  "sync figma": { args: [], flags: ["--file", "--json"], responseTypes: ["sync-result", "error"] },
  "check-parity": { args: ["<name>"], flags: ["--json"], responseTypes: ["parity-result", "error"] },
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
  const mod = await import(docPath);
  return mod.default;
}

function discoverComponents() {
  // In this scaffold, only Button exists. In a real build, scan CORE_SRC
  // for *.doc.mjs files instead of hardcoding.
  return ["Button"];
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

async function cmdSyncFigma(filePath, json) {
  if (!filePath) return print(err("ERR_MISSING_ARG", { arg: "--file" }), json);
  const resolvedFile = path.resolve(process.cwd(), filePath);
  if (!existsSync(resolvedFile)) return print(err("ERR_FILE_NOT_FOUND", { path: resolvedFile }), json);
  if (!existsSync(TOKENS_PATH)) return print(err("ERR_FILE_NOT_FOUND", { path: TOKENS_PATH }), json);

  const codeTokens = flattenTokens(JSON.parse(readFileSync(TOKENS_PATH, "utf-8")));
  const figmaRaw = JSON.parse(readFileSync(resolvedFile, "utf-8"));
  delete figmaRaw._comment;
  const figmaTokens = flattenTokens(figmaRaw);

  const missingInCode = [];   // in Figma, not in tokens.json
  const missingInFigma = [];  // in tokens.json, not in Figma
  const valueMismatches = []; // in both, different value

  for (const [tokenPath, figmaValue] of Object.entries(figmaTokens)) {
    if (!(tokenPath in codeTokens)) {
      missingInCode.push({ token: tokenPath, figmaValue });
    } else if (!tokensEqual(codeTokens[tokenPath], figmaValue)) {
      valueMismatches.push({ token: tokenPath, codeValue: codeTokens[tokenPath], figmaValue });
    }
  }
  for (const tokenPath of Object.keys(codeTokens)) {
    if (!(tokenPath in figmaTokens)) missingInFigma.push({ token: tokenPath, codeValue: codeTokens[tokenPath] });
  }

  const drift = missingInCode.length + missingInFigma.length + valueMismatches.length;
  const result = {
    type: "sync-result",
    status: drift === 0 ? "in-sync" : "drift-detected",
    driftCount: drift,
    missingInCode,   // token exists in Figma, needs adding to tokens.json
    missingInFigma,  // token exists in code, missing from the Figma export
    valueMismatches, // same token name, different value — likely someone edited one side only
  };
  print(result, json);
  if (drift > 0) process.exitCode = 1;
}

async function cmdCheckParity(name, json) {
  if (!name) return print(err("ERR_MISSING_ARG", { arg: "name" }), json);
  const doc = await loadDoc(name);
  if (!doc) return print(err("ERR_UNKNOWN_COMPONENT", { requested: name }), json);
  if (!doc.figmaTokens) return print(err("ERR_NO_FIGMA_SPEC", { requested: name }), json);

  const tsxPath = path.resolve(__dirname, "../../..", doc.swizzlePath);
  const cssPath = tsxPath.replace(/\.tsx$/, ".css");
  if (!existsSync(cssPath)) return print(err("ERR_FILE_NOT_FOUND", { path: cssPath }), json);
  const css = readFileSync(cssPath, "utf-8");

  const checks = Object.entries(doc.figmaTokens).map(([property, tokenPath]) => {
    const expectedVar = tokenPathToCssVar(tokenPath);
    return { property, tokenPath, expectedVar, found: css.includes(expectedVar) };
  });
  const mismatches = checks.filter((c) => !c.found);

  const result = {
    type: "parity-result",
    component: name,
    status: mismatches.length === 0 ? "matches" : "drift-detected",
    checks,
  };
  print(result, json);
  if (mismatches.length > 0) process.exitCode = 1;
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
    case "manifest":
      return cmdManifest(json);
    default:
      print(err("ERR_UNKNOWN_COMMAND", { requested: cmd }));
      process.exitCode = 1;
  }
}

main();
