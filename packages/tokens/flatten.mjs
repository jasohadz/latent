// Shared flatten/unflatten helpers so both the token schema and any
// Figma export use the same dotted-path representation for diffing.
export function flattenTokens(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flattenTokens(value, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

export function tokenPathToCssVar(path) {
  return `--lat-${path.replace(/\./g, "-")}`;
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
