// Shared flatten/unflatten helpers so both the token schema and any
// Figma export use the same dotted-path representation for diffing.
//
// Mode-aware layers (semantic.json, density.json, breakpoint.json) wrap
// each leaf as { value: { <mode>: ..., <mode>: ... } } — flattening stops
// at the "value" object instead of recursing into its mode keys, so a
// flattened path yields the whole per-mode map, e.g.
//   "color.action.primary.default" -> { light: "...", dark: "..." }
// Single-mode layers (primitives.json, breakpoint.json's non-wrapped
// callers) have plain scalar leaves and flatten as before.
//
// "value" is also a legitimate Figma path segment in its own right (e.g.
// typography/input/value/font-size vs .../label/font-size vs .../hint/...),
// so a bare `"value" in node` check isn't enough to recognize the wrapper —
// a real mode-map's own entries (light/dark, default/condensed, ...) are
// always terminal scalars, never further-nested objects.
export function isTerminalModeMap(x) {
  return (
    x !== null &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    Object.values(x).every((v) => v === null || typeof v !== "object")
  );
}

export function flattenTokens(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if ("value" in value && isTerminalModeMap(value.value)) {
        out[path] = value.value;
      } else {
        Object.assign(out, flattenTokens(value, path));
      }
    } else {
      out[path] = value;
    }
  }
  return out;
}

// layer: "primitive" -> --lat-primitive-*, "semantic" (default) -> --lat-*
// (also used for density/breakpoint, which share the semantic namespace).
export function tokenPathToCssVar(path, layer = "semantic") {
  const prefix = layer === "primitive" ? "--lat-primitive-" : "--lat-";
  return `${prefix}${path.replace(/\./g, "-")}`;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

// Figma variable exports commonly use uppercase hex (#FFFFFF) while
// tokens.json is authored lowercase (#ffffff) — same color, not drift.
export function tokensEqual(a, b) {
  if (typeof a === "string" && typeof b === "string" && HEX_COLOR_RE.test(a) && HEX_COLOR_RE.test(b)) {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}
