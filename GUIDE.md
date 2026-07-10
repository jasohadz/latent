# Build Guide

The reference build order for Latent. Follow this top to bottom — later
phases depend on earlier ones being solid, especially the token schema.

## Phase 1 — Foundation

1. Monorepo already set up (`packages/core`, `packages/cli`, `packages/theme-*`, `packages/tokens`)
2. Styling: CSS custom properties (`--lat-*`), consumed by plain CSS today — StyleX is a drop-in upgrade later if wanted
3. Token schema (`packages/tokens/tokens.json`) is the single source of truth — spacing, color, radius, typography. Figma variables must mirror these names/nesting exactly.
4. Primitives: Button exists. Add 4-7 more (Input, Stack, Text, Card) following its exact three-file pattern: `.tsx` + `.css` + `.doc.mjs`, each with a `figmaTokens` mapping.

## Phase 2 — Figma-to-code pipeline

5. Structure Figma variable collections to mirror `tokens.json` 1:1 — same names, same nesting
6. Use F8igma Console (`figma_get_variables` / `figma_export_tokens`) to pull the live collection to a JSON file
7. Run `node packages/cli/bin/latent.mjs sync figma --file <export>.json --json` — fix any reported drift before moving on
8. Once a component's Figma spec is stable, run `check-parity <name>` to confirm the shipped CSS matches it
9. (Later) automate steps 6-7 as a script or CI job instead of running by hand

## Phase 3 — Agent-readiness layer (mostly done)

10. Every component ships a `.doc.mjs` — keep doing this for every new one, no exceptions
11. CLI supports `list`, `docs`, `swizzle`, `sync figma`, `check-parity`, `manifest --json` — add `init` and `upgrade` once there's a second consuming project
12. Error codes are typed and append-only (`ERR_UNKNOWN_COMPONENT`, etc.) — never remove or repurpose a code once shipped

## Phase 4 — Templates & polish

13. Build 2-3 content-only page templates (dashboard, settings, form) composing a shared layout primitive with header/content/panel slots
14. Keep templates separate from app-shell/nav components
15. Publish `packages/core`, `packages/theme-neutral`, `packages/cli` as scoped npm packages once the API stabilizes — not before, since `swizzle` paths and prop names become breaking changes for anyone who's forked


