# Build Guide

The reference build order for Latent. Follow this top to bottom — later
phases depend on earlier ones being solid, especially the token schema.

## Phase 1 — Foundation

1. Monorepo already set up (`packages/core`, `packages/cli`, `packages/theme-*`, `packages/tokens`)
2. Styling: CSS custom properties (`--lat-*`), consumed by plain CSS today — StyleX is a drop-in upgrade later if wanted
3. Token schema is the single source of truth, split into four files under `packages/tokens/` that mirror Figma's own collection structure (see `TOKEN-SCHEMA-V2.md`):
   - `primitives.json` — raw scale values (color ramps, spacing, radius, font-size/weight, etc.), single mode, Figma `/`-paths converted to nested JSON.
   - `semantic.json` and `density.json` — mode-aware (`{ value: { light, dark } }` / `{ value: { default, condensed } }`); each leaf stores an alias reference into `primitives.json` rather than a resolved literal.
   - `breakpoint.json` — mode-aware across `mobile`/`tablet`/`desktop`.
   Figma's variable collections (Primitives, Style Tokens, Density, Breakpoint) must mirror these names/nesting exactly.
4. Primitives: Button exists. Add 4-7 more (Input, Stack, Text, Card) following its exact three-file pattern: `.tsx` + `.css` + `.doc.mjs`, each with a `figmaTokens` mapping.

## Phase 2 — Figma-to-code pipeline (core loop done)

5. ~~Structure Figma variable collections to mirror `tokens.json` 1:1~~ — done: Figma's Primitives/Style Tokens/Density/Breakpoint collections (628 variables) now map directly onto the four token files, per `TOKEN-SCHEMA-V2.md`.
6. Use F8igma Console (`figma_get_variables`, `resolveAliases: false` to preserve alias structure) to pull each collection live and regenerate the four token files plus `theme-neutral/theme.css` (mode-aware: light/dark via `[data-latent-mode]`, density via `[data-latent-density]`) — done, see `TOKEN-SCHEMA-V2.md`'s execution steps for the full recipe.
7. Run `node packages/cli/bin/latent.mjs sync figma --file <export>.json --json` — now diffs per layer *and* per mode (a token that matches in Light but drifted in Dark reports as drift). Clean against a fresh export.
8. Once a component's Figma spec is stable, run `check-parity <name>` to confirm the shipped CSS matches it — Button is wired to semantic paths (`color.action.primary.default`, `radius.input`, etc.) and passes.
9. (Later) automate steps 6-7 as a script or CI job instead of running by hand — still manual today, not done.

## Phase 3 — Agent-readiness layer (mostly done)

10. Every component ships a `.doc.mjs` — keep doing this for every new one, no exceptions
11. CLI supports `list`, `docs`, `swizzle`, `sync figma`, `check-parity`, `manifest --json` — add `init` and `upgrade` once there's a second consuming project
12. Error codes are typed and append-only (`ERR_UNKNOWN_COMPONENT`, etc.) — never remove or repurpose a code once shipped

## Phase 4 — Templates & polish

13. Build 2-3 content-only page templates (dashboard, settings, form) composing a shared layout primitive with header/content/panel slots
14. Keep templates separate from app-shell/nav components
15. Publish `packages/core`, `packages/theme-neutral`, `packages/cli` as scoped npm packages once the API stabilizes — not before, since `swizzle` paths and prop names become breaking changes for anyone who's forked


