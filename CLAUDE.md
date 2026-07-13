# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Latent is a proof-of-concept design system (a remix on the "Astryx" pattern) with an agent-facing CLI. It's a workspaces monorepo with no build step, bundler, or test runner — everything runs directly via Node (`packages/*` are plain `.mjs`/`.tsx`/`.css`, consumed as source).

Read `GUIDE.md` before adding anything — it defines the phase-by-phase build order (Phase 1: foundation/primitives, Phase 2: Figma sync, Phase 3: agent-readiness/CLI, Phase 4: templates) and later phases assume earlier ones are solid.

## Commands

There is no build/lint/test tooling configured. The only entry point is the CLI itself:

```
node packages/cli/bin/latent.mjs list --json
node packages/cli/bin/latent.mjs docs <Component> --json
node packages/cli/bin/latent.mjs manifest --json
node packages/cli/bin/latent.mjs swizzle <Component> --dest ./out
node packages/cli/bin/latent.mjs sync figma --file <export>.json --json
node packages/cli/bin/latent.mjs check-parity <Component> --json
```

(also available as `npm run ds -- <command>`, via the `ds` script in `package.json`). There is no automated test suite — verify changes by running the relevant CLI command(s) above and checking the JSON output / exit code.

## Architecture

**Data flow: tokens → theme → components → CLI.**

- `packages/tokens/tokens.json` is the single source of truth for spacing, color, radius, and typography. Figma variable collections are expected to mirror its names/nesting exactly.
- `packages/tokens/flatten.mjs` provides `flattenTokens()` (nested token object → dotted-path map, e.g. `color.bg.default`) and `tokenPathToCssVar()` (dotted path → `--lat-*` custom property name). Both the CLI's Figma diffing and parity checking depend on this dotted-path representation.
- `packages/theme-neutral/theme.css` is the token values hand-authored as `--lat-*` CSS custom properties. It's a generated artifact conceptually ("Generated from tokens.json — keep in sync, don't hand-edit values") but there's currently no script that actually generates it — edits to `tokens.json` must be mirrored here by hand.
- `packages/core/src/` holds primitive components. **Every primitive is exactly three files sharing a basename** (see `Button.tsx` / `Button.css` / `Button.doc.mjs`):
  - `.tsx` — the component, styled only via `--lat-*` custom properties, no hardcoded values
  - `.css` — the styles
  - `.doc.mjs` — a machine-readable doc module (`default export`) with `name`, `summary`, `props`, `example`, `doNot`, `swizzlePath`, and a `figmaTokens` map (CSS property → token dotted-path). This file is what makes the CLI's `docs`, `swizzle`, and `check-parity` commands work — there are no exceptions to shipping one.
- `packages/cli/bin/latent.mjs` is the CLI. Every command supports `--json` (agent output is the primary consumer, human-readable text is secondary). Key mechanics:
  - `discoverComponents()` is currently **hardcoded to `["Button"]`** rather than scanning `packages/core/src` for `*.doc.mjs` files — this is a known scaffold shortcut called out in `GUIDE.md`/`README.md`, not an oversight.
  - `swizzle <name>` copies a component's source file (resolved from its `.doc.mjs`'s `swizzlePath`) out to a consumer's own tree (`--dest`, default `./swizzled`). Once a component has been swizzled, its `swizzlePath` and prop names are effectively a public API — changing them is a breaking change.
  - `sync figma --file <export.json>` diffs a flattened Figma export against flattened `tokens.json` and reports three drift categories: `missingInCode`, `missingInFigma`, `valueMismatches`. Exits non-zero on any drift (CI-gateable). `packages/tokens/figma-export.sample.json` has intentional drift (renamed key, changed value, missing key) for exercising this.
  - `check-parity <name>` reads a component's `figmaTokens` map and greps the compiled CSS for each expected `--lat-*` custom property, to catch a component silently drifting from its declared design spec.
  - Error codes (`ERR_UNKNOWN_COMPONENT`, `ERR_UNKNOWN_COMMAND`, `ERR_MISSING_ARG`, `ERR_FILE_NOT_FOUND`, `ERR_NO_FIGMA_SPEC`) are typed and **append-only** — never remove or repurpose one once shipped, add a new one instead.

## Conventions

- All custom properties are namespaced `--lat-*`; dotted token paths map to them via `tokenPathToCssVar` (`color.bg.default` → `--lat-color-bg-default`).
- Don't hardcode colors/spacing in component CSS — add or reuse a `--lat-*` custom property instead.
- Keep templates (Phase 4) separate from app-shell/nav components.
- Don't publish `packages/core`, `packages/theme-neutral`, or `packages/cli` as real npm packages until the API stabilizes (per `GUIDE.md`) — swizzle paths and prop names become breaking changes for anyone who's already forked.

## Figma Styles (Text/Effect) — check before building

The Figma file (`Latent DS`) has a library of named Text Styles and Effect
Styles — see **`STYLES.md`** for the full inventory with values and token
bindings. These are a different Figma primitive from Variables: `sync figma`
and `packages/tokens/*.json` don't track them at all, so nothing enforces
their use automatically — the only enforcement is this instruction.

**Before creating any text node or shadow/effect in a Figma build session**,
pull the live style lists first —

```js
const textStyles = await figma.getLocalTextStylesAsync();
const effectStyles = await figma.getLocalEffectStylesAsync();
```

— and apply a matching existing style (`setTextStyleIdAsync` /
`setEffectStyleIdAsync`) instead of hand-rolling the equivalent raw
properties. Only create a new style when no existing one fits the role, and
when you do, update `STYLES.md`'s tables in the same session — that file is
what a future session (or you, after context resets) checks first instead of
re-discovering the library from scratch by trial and error.
