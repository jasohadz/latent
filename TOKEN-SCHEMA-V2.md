# Token Schema v2 — Primitives + Semantic + Modes

**Status: done.** This migration (four-file token schema, mode-aware
`theme.css`, per-mode `sync figma` diffing) was executed and is what
`packages/tokens/*.json` and `packages/theme-neutral/theme.css` are
today — see `GUIDE.md` Phase 1/2. Kept as the design-spec record of why
the schema is shaped this way, not as a pending to-do; the "Execution
steps" section below describes what was done, not what's left.

Design spec for reconciling `tokens.json` with the real Figma file
(4 collections, 628 variables). Written for Claude Code to execute —
this file defines the target shape; Claude Code should pull the live
data via F8igma Console MCP and generate the files below programmatically
rather than hand-transcribing.

## Why the current schema doesn't fit

`tokens.json` v1 is flat, single-mode, dot-separated (`color.bg.default`).
The Figma file now has a real two-layer architecture:
- **Primitives** (366 vars, 1 mode "Value") — raw scale: color ramps
  (slate/gray/red/... 50-950), spacing, radius, font-size, weight, etc.
  Figma naming uses `/` (e.g. `color/blue/600`).
- **Semantic** (194 vars at the time this was written, now ~200; Light +
  Dark modes; briefly misnamed "Style Tokens" in the Figma file itself,
  renamed back 2026-08-20 — see `packages/figma-plugin`) — semantic aliases
  referencing Primitives (e.g. `color/action/primary/default` → some
  `color/blue/600`-equivalent, per mode)
- **Density** (62 vars, Default + Condensed modes)
- **Breakpoint** (6 vars, Mobile/Tablet/Desktop, no color)

## Target file structure

```
packages/tokens/
  primitives.json       — flat, single "value" per token, Figma /-paths
                           converted to nested JSON (color.blue.600 etc.)
  semantic.json          — nested, EACH LEAF has both light and dark
                           values: { "value": { "light": "...", "dark": "..." } }
                           Prefer storing as an ALIAS reference to a
                           primitive path where Figma has one bound
                           (check valuesByMode for VARIABLE_ALIAS type,
                           not just resolved value) — resolving to a
                           literal defeats the point of a two-layer system.
  density.json            — same nested/mode pattern, modes are
                           "default"/"condensed"
  breakpoint.json         — single-mode, no light/dark needed
```

## CSS output structure

`packages/theme-neutral/theme.css` becomes mode-aware:
```css
:root[data-latent-theme="neutral"] {
  /* primitives, unprefixed by mode */
  --lat-primitive-color-blue-600: #...;
  ...
  /* semantic, light mode is the default */
  --lat-color-action-primary-default: var(--lat-primitive-color-blue-600);
}
:root[data-latent-mode="dark"] {
  --lat-color-action-primary-default: var(--lat-primitive-color-blue-800); /* whatever dark actually maps to */
}
```
The override block needs the `:root` prefix too, not just the attribute
selector — `[data-latent-mode="dark"]` alone (specificity 0-1-0) is weaker
than `:root[data-latent-theme="neutral"]` (0-2-0), so on an element carrying
both attributes (the normal case: both live on `<html>`) the light-mode
block would always win regardless of source order. Found and fixed
2026-08-03 — theme.css previously shipped the under-specified version and
dark mode silently never took effect.

Density follows the same override pattern with `:root[data-latent-density="condensed"]` — same specificity fix applies.

## CLI changes required

- `flatten.mjs` needs mode-awareness: a flattened path becomes
  `{path}` → `{ light: value, dark: value }` for the semantic/density
  layers, single value for primitives/breakpoint.
- `sync figma` needs to diff per-mode, not just per-token — a token that
  matches in Light but drifted in Dark should report as drift.
- `tokenPathToCssVar` needs a `layer` param (primitive vs semantic) since
  they land in different CSS custom property namespaces.
- `check-parity` per-component `figmaTokens` mapping should reference
  semantic tokens only (`color.action.primary.default`), never primitives
  directly — that's the whole point of the two-layer system: components
  bind to intent, not to a raw color.

## Execution steps for Claude Code

1. Pull each collection in full via `figma_get_variables` (paginate at
   pageSize=100, collection filter, resolveAliases=false to preserve
   alias structure where present)
2. Convert `/`-paths to nested JSON objects
3. Generate the four token files above
4. Generate `theme-neutral/theme.css` with light/dark/density selectors
5. Update `flatten.mjs`, `latent.mjs` (sync/check-parity), and Button's
   `figmaTokens` mapping to the new semantic names
6. Run `sync figma` and `check-parity Button` against a fresh export —
   don't consider this done until both report clean, same discipline as
   the hex-casing fix earlier in this project's history
7. Commit with a clear message referencing this migration
