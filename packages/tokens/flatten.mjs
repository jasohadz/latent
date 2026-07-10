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
