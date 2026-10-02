#!/usr/bin/env node
// Generates packages/theme-neutral/theme.css from the token JSON — the one
// step between "Latent Sync pulled a rebrand into packages/tokens" and
// "every consumer (gallery, Storybook, Chromatic) actually renders it."
// theme.css was hand-mirrored until 2026-10-02, and had already drifted
// when this was written: 12 primitive dimensions and density's radius.xxs
// were never added, so condensed spacing fell back to raw literals.
//
// Sources, in output order:
//   primitives.json  -> --lat-primitive-*            (one value)
//   semantic.json    -> --lat-*, light in :root, dark overrides
//   code-only.json   -> --lat-* values with no Figma variable (see its notes)
//   density.json     -> --lat-*, default in :root, condensed overrides
//   styles.json      -> --lat-elevation-* from Figma Effect Styles
//
// It also writes fonts.css next to theme.css: one Google Fonts @import per
// family in primitives' typography.font-family, at every weight in
// typography.font-weight. Before this, every consumer hardcoded its own
// <link> for Geist — so a rebrand to another font silently rendered in the
// browser default with no error anywhere. A family that isn't on Google
// Fonts (commercial, self-hosted) goes in font-sources.json instead — see
// fontImports() below. One @import per family, not one combined URL: Google
// rejects the whole request (400) if any single family is unknown.
//
// breakpoint.json is deliberately not emitted: its modes (mobile/tablet/
// desktop) have no viewport widths anywhere in the token data, and turning
// them into @media rules would mean inventing those widths. Nothing in
// packages/core reads a breakpoint token today.
//
// Run directly (`node packages/tokens/build-theme.mjs`) to rewrite theme.css,
// or via `latent build-theme` for a dry-run diff. The pre-commit hook
// regenerates it whenever a source file is staged, same as the sample fixture.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { flattenTokens } from "./flatten.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const THEME_NAME = "neutral";
export const THEME_CSS_PATH = path.resolve(__dirname, `../theme-${THEME_NAME}/theme.css`);
export const FONTS_CSS_PATH = path.resolve(__dirname, `../theme-${THEME_NAME}/fonts.css`);
export const THEME_SOURCES = ["primitives.json", "semantic.json", "density.json", "styles.json", "code-only.json", "font-sources.json"];

function load(file) {
  return JSON.parse(readFileSync(path.join(__dirname, file), "utf-8"));
}

const cssName = (tokenPath) => tokenPath.replace(/\./g, "-");

// Figma stores every dimension as a unitless float; CSS needs to know which
// ones are lengths. Anything not listed here is a length in px.
const UNITLESS = [/^opacity\./, /^grid\.columns\./, /^typography\.font-weight\./];
const EM = [/^typography\.list-spacing\./];

// A generic family after the brand font, so a font that fails to load
// degrades to the right *kind* of face instead of the browser default (Times).
const GENERIC_FALLBACK = { sans: "sans-serif", serif: "serif", mono: "monospace" };

function formatPrimitive(tokenPath, value) {
  if (typeof value === "string") {
    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value;
    const fallback = GENERIC_FALLBACK[/^typography\.font-family\.(.+)$/.exec(tokenPath)?.[1]];
    return fallback ? `${JSON.stringify(value)}, ${fallback}` : JSON.stringify(value);
  }
  if (UNITLESS.some((re) => re.test(tokenPath))) return String(value);
  if (EM.some((re) => re.test(tokenPath))) return `${value}em`;
  return `${value}px`;
}

const round = (n, places = 3) => Number(n.toFixed(places));

function formatShadow(effects) {
  return effects
    .filter((e) => e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW")
    .map((e) => {
      const { r, g, b, a } = e.color;
      const rgba = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${round(a)})`;
      const px = (n) => (n === 0 ? "0" : `${round(n)}px`);
      const inset = e.type === "INNER_SHADOW" ? "inset " : "";
      return `${inset}${px(e.offset.x)} ${px(e.offset.y)} ${px(e.radius)} ${px(e.spread ?? 0)} ${rgba}`;
    })
    .join(", ");
}

export function buildTheme() {
  const P = flattenTokens(load("primitives.json"));
  const S = flattenTokens(load("semantic.json"));
  const D = flattenTokens(load("density.json"));
  const styles = load("styles.json");
  const codeOnly = load("code-only.json");

  const warnings = [];
  const densityNames = new Set(Object.keys(D).map(cssName));

  // "{color.gray.900}" -> var(--lat-primitive-color-gray-900). A reference
  // into another collection (semantic spacing -> "{density.spacing.8}")
  // resolves to that collection's own --lat-* name.
  function ref(alias, from) {
    const m = /^\{(.+)\}$/.exec(String(alias));
    if (!m) throw new Error(`${from}: expected an alias like {color.gray.900}, got ${JSON.stringify(alias)}`);
    const target = m[1];
    if (target in P) return `var(--lat-primitive-${cssName(target)})`;
    if (target.startsWith("density.") && target.slice(8) in D) return `var(--lat-${cssName(target.slice(8))})`;
    if (target in S) return `var(--lat-${cssName(target)})`;
    throw new Error(`${from}: alias ${alias} doesn't resolve to any primitive, semantic, or density token`);
  }

  const root = [];
  const dark = [];
  const condensed = [];
  const decl = (name, value) => `  --lat-${name}: ${value};`;

  root.push("  /* primitives — one value, no modes */");
  for (const [p, v] of Object.entries(P)) root.push(`  --lat-primitive-${cssName(p)}: ${formatPrimitive(p, v)};`);

  root.push("", "  /* semantic — light here, dark in the [data-latent-mode=\"dark\"] block */");
  for (const [p, modes] of Object.entries(S)) {
    const name = cssName(p);
    if (densityNames.has(name)) {
      // Semantic spacing.* just aliases density.spacing.* under the same
      // name, and radius.* is duplicated with identical values, so density's
      // declaration is the real one. A collision with *different* values is
      // two Figma collections disagreeing (sizing.action.* today) — density
      // wins (it always has, by coming later in the file), but say so.
      const agrees = modes.light === `{density.${p}}` || (modes.light === modes.dark && modes.light === D[p].default);
      if (!agrees) {
        warnings.push(`${p} is defined in both semantic.json (${modes.light}) and density.json (${D[p].default}) — density wins`);
      }
      continue;
    }
    root.push(decl(name, ref(modes.light, `semantic ${p} (light)`)));
    if (modes.dark !== modes.light) dark.push(decl(name, ref(modes.dark, `semantic ${p} (dark)`)));
  }

  root.push("", "  /* code-only — no Figma variable can hold these; see packages/tokens/code-only.json */");
  for (const [p, entry] of Object.entries(flattenCodeOnly(codeOnly))) root.push(decl(cssName(p), entry.value));

  root.push("", "  /* density — default here, condensed in the [data-latent-density=\"condensed\"] block */");
  for (const [p, modes] of Object.entries(D)) {
    root.push(decl(cssName(p), ref(modes.default, `density ${p} (default)`)));
    if (modes.condensed !== modes.default) condensed.push(decl(cssName(p), ref(modes.condensed, `density ${p} (condensed)`)));
  }

  root.push("", "  /* elevation — Figma Effect Styles (styles.json). Effect Styles have no modes. */");
  for (const [styleName, style] of Object.entries(styles.effect ?? {})) {
    const shadow = formatShadow(style.effects ?? []);
    if (shadow) root.push(decl(cssName(styleName.toLowerCase().replace(/\//g, ".")), shadow));
  }

  const css = [
    "/* GENERATED by packages/tokens/build-theme.mjs from packages/tokens/{primitives,semantic,density,styles,code-only}.json.",
    "   Don't edit this file — change the token JSON (normally via the Latent Sync plugin) and rerun",
    "   `node packages/tokens/build-theme.mjs`. The pre-commit hook does this automatically. */",
    `:root[data-latent-theme="${THEME_NAME}"] {`,
    ...root,
    "}",
    "",
    // :root prefix keeps these at the same specificity as the block above —
    // see TOKEN-SCHEMA-V2.md for the 2026-08-03 dark-mode-never-applied bug.
    ':root[data-latent-mode="dark"] {',
    ...dark,
    "}",
    "",
    ':root[data-latent-density="condensed"] {',
    ...condensed,
    "}",
    "",
  ].join("\n");

  return { css, fontsCss: fontImports(P), warnings };
}

// font-sources.json (optional) maps a family name to the stylesheet URL that
// loads it, or to null when the consumer loads it some other way (a
// self-hosted @font-face in the app, a system font). Anything not listed is
// assumed to be on Google Fonts.
function fontImports(P) {
  let sources = {};
  try {
    sources = load("font-sources.json");
  } catch {
    // no overrides — every family comes from Google Fonts
  }
  const families = [...new Set(Object.entries(P).filter(([p]) => p.startsWith("typography.font-family.")).map(([, v]) => v))];
  const weights = Object.entries(P).filter(([p]) => p.startsWith("typography.font-weight.")).map(([, v]) => v).sort((a, b) => a - b);
  const lines = [
    "/* GENERATED by packages/tokens/build-theme.mjs from primitives.json's typography.font-family/font-weight",
    "   (and font-sources.json, if present). Don't edit — import it next to theme.css. */",
  ];
  for (const family of families) {
    if (family in sources) {
      if (sources[family]) lines.push(`@import url("${sources[family]}");`);
      else lines.push(`/* ${family}: loaded by the consumer (font-sources.json maps it to null) */`);
      continue;
    }
    const name = family.trim().replace(/ /g, "+");
    const wght = weights.length ? `:wght@${weights.join(";")}` : "";
    lines.push(`@import url("https://fonts.googleapis.com/css2?family=${name}${wght}&display=swap");`);
  }
  return lines.join("\n") + "\n";
}

// code-only.json leaves are { value, note } — flattenTokens would recurse
// into them, so walk it by hand.
function flattenCodeOnly(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("_")) continue;
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && "value" in v) out[p] = v;
    else Object.assign(out, flattenCodeOnly(v, p));
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { css, fontsCss, warnings } = buildTheme();
  writeFileSync(THEME_CSS_PATH, css);
  writeFileSync(FONTS_CSS_PATH, fontsCss);
  for (const w of warnings) console.warn(`build-theme: ${w}`);
  console.log(`build-theme: wrote ${path.relative(process.cwd(), THEME_CSS_PATH)} and ${path.basename(FONTS_CSS_PATH)}`);
}
