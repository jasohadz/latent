# Contributing to Latent

Latent is a small, deliberately-scoped design system. Before adding
anything, read [GUIDE.md](./GUIDE.md) for the phase-by-phase build order —
changes should slot into that order, not skip ahead of it.

## Adding a primitive component

Every primitive follows the exact same three-file pattern as `Button`
(`packages/core/src/`):

- `ComponentName.tsx` — the component itself
- `ComponentName.css` — styled entirely via `--lat-*` custom properties,
  never hardcoded values
- `ComponentName.doc.mjs` — machine-readable doc: `name`, `summary`,
  `props`, `example`, `doNot`, `swizzlePath`, `extends` (the Props
  interface's literal TS `extends` clause, or `null`), and a
  `figmaTokens` mapping from CSS property to token path. All eight
  required — `extends` is the only one allowed to be `null`. Two more
  fields are optional (added 2026-08-26): `states` and `accessibility` —
  see `CLAUDE.md`'s architecture section for their shape. Write both
  by reading the component's real `.tsx`/`.css`, not by inferring from
  the prop list — that's exactly how this repo caught several real,
  previously-undocumented accessibility bugs in its own components (see
  `GUIDE.md` Phase 4 item 15).

No exceptions on the `.doc.mjs` file — it's what makes the CLI,
`check-parity`, and `check-docs`' schema check work at all.

## Tokens

`packages/tokens/tokens.json` is the single source of truth for spacing,
color, radius, and typography. Figma variable collections must mirror its
names and nesting exactly — if you rename or restructure a token, update
both sides and re-run:

```
node packages/cli/bin/latent.mjs sync figma --file <export>.json --json
```

Fix any reported drift (`missingInCode`, `missingInFigma`,
`valueMismatches`) before merging.

## CLI changes

- Every command must support `--json` — the CLI is agent-facing first,
  human-readable second.
- Error codes (`ERR_UNKNOWN_COMPONENT`, etc.) are typed and **append-only**.
  Never remove or repurpose a code once shipped; add a new one instead.
- `swizzlePath` values and prop names are a public contract once a
  component has been swizzled by a consumer — treat changes to them as
  breaking.
- `index`/`ask` (the local RAG layer, see `CLAUDE.md`) follow the same
  rules as everything else here — `--json` support, typed append-only
  error codes. Not part of the PR checklist below, since `index` triggers
  a one-time multi-GB model download on a machine that doesn't have one
  yet — don't make that a required gate.

## Before opening a PR

Run the full command set from the README against your change:

```
node packages/cli/bin/latent.mjs list --json
node packages/cli/bin/latent.mjs docs <Component> --json
node packages/cli/bin/latent.mjs manifest --json
node packages/cli/bin/latent.mjs swizzle <Component> --dest ./out
node packages/cli/bin/latent.mjs sync figma --file packages/tokens/figma-export.sample.json --json
node packages/cli/bin/latent.mjs check-parity <Component> --json
node packages/cli/bin/latent.mjs check-component-bindings <Component> --json
node packages/cli/bin/latent.mjs check-docs --json
```

All of these should exit cleanly (or fail with an expected, typed error)
before you push. Or run `node packages/cli/bin/latent.mjs verify --json`
instead of the individual `sync figma`/`check-parity`/`check-component-bindings`/`check-docs` calls
above — the one-command version, same aggregated pass/fail CI runs.
