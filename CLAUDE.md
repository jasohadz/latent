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
node packages/cli/bin/latent.mjs check-styles --file <export>.json --json
node packages/cli/bin/latent.mjs check-docs --json
node packages/cli/bin/latent.mjs verify --json
```

(also available as `npm run ds -- <command>`, via the `ds` script in `package.json`). There is no automated test suite — verify changes by running the relevant CLI command(s) above and checking the JSON output / exit code. **`verify` is the one-command version**: it runs `sync figma`/`check-styles` against `packages/tokens/{figma-export.live,styles-export.live}.json`, `check-parity` for every discovered component, and `check-docs`, and aggregates them into one `verify-result` with a single pass/fail. Run it yourself at the terminal any time you want to know "is everything actually consistent right now" — it's the same command `.github/workflows/latent-sync-check.yml` runs automatically after every Latent Sync plugin push.

## Architecture

**Data flow: tokens → theme → components → CLI.**

- `packages/tokens/tokens.json` is the single source of truth for spacing, color, radius, and typography. Figma variable collections are expected to mirror its names/nesting exactly.
- `packages/tokens/flatten.mjs` provides `flattenTokens()` (nested token object → dotted-path map, e.g. `color.bg.default`) and `tokenPathToCssVar()` (dotted path → `--lat-*` custom property name). Both the CLI's Figma diffing and parity checking depend on this dotted-path representation.
- `packages/theme-neutral/theme.css` is the token values hand-authored as `--lat-*` CSS custom properties. It's a generated artifact conceptually ("Generated from tokens.json — keep in sync, don't hand-edit values") but there's currently no script that actually generates it — edits to `tokens.json` must be mirrored here by hand.
- `packages/core/src/` holds primitive components. **Every primitive is exactly three files sharing a basename** (see `Button.tsx` / `Button.css` / `Button.doc.mjs`):
  - `.tsx` — the component, styled only via `--lat-*` custom properties, no hardcoded values
  - `.css` — the styles
  - `.doc.mjs` — a machine-readable doc module (`default export`) with `name`, `summary`, `props`, `example`, `doNot`, `swizzlePath`, `extends`, and a `figmaTokens` map (CSS property → token dotted-path). This file is what makes the CLI's `docs`, `swizzle`, and `check-parity` commands work — there are no exceptions to shipping one. `extends` is the component's Props interface's literal TS `extends` clause (e.g. `"React.ButtonHTMLAttributes<HTMLButtonElement>"`), or `null` if it doesn't extend one — this is the documented contract for props that pass through via `{...rest}` but aren't listed in `props` (standard HTML attributes like `onClick`, `disabled`, `aria-*`). `check-docs`' schema check (below) enforces all of this — every field is required, `extends` is the one allowed to be `null`.
- `packages/cli/bin/latent.mjs` is the CLI. Every command supports `--json` (agent output is the primary consumer, human-readable text is secondary). Key mechanics:
  - `discoverComponents()` scans `packages/core/src` for `*.doc.mjs` files and derives each component's name from the filename — adding a new component's three files is enough for `list`/`docs`/`swizzle`/`check-parity` to pick it up, no CLI edit required.
  - `swizzle <name>` copies a component's source file (resolved from its `.doc.mjs`'s `swizzlePath`) out to a consumer's own tree (`--dest`, default `./swizzled`). Once a component has been swizzled, its `swizzlePath` and prop names are effectively a public API — changing them is a breaking change.
  - `sync figma --file <export.json>` diffs a flattened Figma export against flattened `tokens.json` and reports three drift categories: `missingInCode`, `missingInFigma`, `valueMismatches`. Exits non-zero on any drift (CI-gateable). `packages/tokens/figma-export.sample.json` has exactly 3 intentional drift cases for exercising this — it's generated (`npm run generate-sample-fixture`, or automatically via the pre-commit hook whenever `primitives/semantic/density/breakpoint.json` change), so it can't accumulate unrelated staleness the way a hand-edited copy can. Never hand-edit it; regenerate instead.
  - `check-parity <name>` reads a component's `figmaTokens` map and greps the compiled CSS for each expected `--lat-*` custom property, to catch a component silently drifting from its declared design spec. The pre-commit hook runs this automatically for any component whose files are staged (warns instead of blocking if the component has no `figmaTokens` yet — it hasn't opted in, it isn't drifting). It only checks *declared* tokens; a raw value on a property nobody declared is still invisible to everything in this repo — see `HOW-TO.md`'s component-editing section.
  - `check-styles --file <export.json>` is `sync figma`'s counterpart for Text/Effect Styles — diffs `packages/tokens/styles.json` (the source of truth, mirrored in human-readable form by `STYLES.md`) against a fresh Figma export, same three drift categories, non-zero exit on drift. Run it after any session that creates, edits, or renames a Text or Effect Style.
  - `check-docs` runs two independent checks and reports one merged `violations` list, each entry tagged `kind`: `"stale-term"` or `"doc-schema"`.
    - `stale-term`: scans every tracked `*.md` file (via `git ls-files '*.md'`) for `DOC_BLOCKLIST` terms — known-stale facts that have appeared in prose before, e.g. Figma's Semantic collection's old "Style Tokens" name. Append-only, same discipline as `ERROR_CODES`; add an entry whenever a doc turns out to have baked in a fact that later changed. Checks per-paragraph, not per-line, so a qualifying phrase like "renamed from" on a different wrapped source line still exempts the term from being flagged.
    - `doc-schema`: loads every component's `*.doc.mjs` and enforces the shape described above — all eight top-level fields present, `summary`/`example` non-empty, `doNot` and `figmaTokens` non-empty (opt out of `figmaTokens` by omitting it, not by shipping `{}` — see `ERR_NO_FIGMA_SPEC`), `extends` is `null` or a non-empty string, and every entry in `props` has `name`/`type`/`default`/`description`. This was previously just a documented convention nothing enforced; it's now load-bearing the same way `check-parity` is for CSS/token drift.
  - `verify` runs `sync figma`/`check-styles` (against the `*.live.json` files directly, no `--file` needed) + `check-parity` for every component (honoring the same `ERR_NO_FIGMA_SPEC`-warns-not-blocks exception the pre-commit hook applies) + `check-docs`, all in one call, one aggregated `verify-result`. This is what `.github/workflows/latent-sync-check.yml` runs after every Latent Sync plugin push, and what a human should run at the terminal instead of the four commands separately.
  - Error codes (`ERR_UNKNOWN_COMPONENT`, `ERR_UNKNOWN_COMMAND`, `ERR_MISSING_ARG`, `ERR_FILE_NOT_FOUND`, `ERR_NO_FIGMA_SPEC`) are typed and **append-only** — never remove or repurpose one once shipped, add a new one instead.
- `packages/figma-plugin/` is a Figma plugin ("Latent Sync") that generates `packages/tokens/figma-export.live.json` and `styles-export.live.json` directly from the open Figma file and commits both to a `figma-sync` GitHub branch — this replaced the old manual "pull via an MCP tool, hand-write the export file" step described in `STYLES.md`/`GUIDE.md`. It does not touch `primitives.json`/`semantic.json`/`density.json`/`breakpoint.json`/`styles.json` themselves or auto-merge — `sync figma`/`check-styles` still gate a human reconciliation step same as before. Every push triggers `.github/workflows/latent-sync-check.yml`, which runs `verify`. See `packages/figma-plugin/README.md` for setup.

## Conventions

- All custom properties are namespaced `--lat-*`; dotted token paths map to them via `tokenPathToCssVar` (`color.bg.default` → `--lat-color-bg-default`).
- Don't hardcode colors/spacing in component CSS — add or reuse a `--lat-*` custom property instead.
- Keep templates (Phase 4) separate from app-shell/nav components.
- Don't publish `packages/core`, `packages/theme-neutral`, or `packages/cli` as real npm packages until the API stabilizes (per `GUIDE.md`) — swizzle paths and prop names become breaking changes for anyone who's already forked.

## Figma Styles (Text/Effect) — check before building

The Figma file (`Latent DS`) has a library of named Text Styles and Effect
Styles. `packages/tokens/styles.json` is their source of truth; `STYLES.md`
is the human-readable view of the same data. These are a different Figma
primitive from Variables — `sync figma` never touches them — so they have
their own verification command:

```
node packages/cli/bin/latent.mjs check-styles --file <export>.json --json
```

**Before creating any text node or shadow/effect in a Figma build session**,
pull the live style lists first —

```js
const textStyles = await figma.getLocalTextStylesAsync();
const effectStyles = await figma.getLocalEffectStylesAsync();
```

— and apply a matching existing style (`setTextStyleIdAsync` /
`setEffectStyleIdAsync`) instead of hand-rolling the equivalent raw
properties. **If no existing style fits the role, stop and flag it to the
user instead of creating a new style unilaterally** — describe the gap (what
role/values you need) and let them decide whether it should become a new
named style, reuse an adjacent one, or stay a one-off.

**After any session that creates, edits, or renames a Text or Effect Style**:
update `packages/tokens/styles.json` and `STYLES.md`'s tables in the same
session, regenerate a fresh export (see `STYLES.md` for the pull script), and
run `check-styles` against it — treat non-zero exit the same as `sync figma`
drift: don't end the session with it unresolved.
