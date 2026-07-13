---
name: design-system-builder
description: Use when adding a new primitive component, editing design tokens, or working the Figma sync pipeline in the Latent design system. Encodes the three-file component pattern, the tokens-as-source-of-truth rule, and the CLI verification workflow so new work stays consistent with the existing scaffold (Button) instead of drifting from it.
---

# Design System Builder

Latent follows a strict, deliberately small pattern. The reference build order lives in `GUIDE.md` — read it before starting; this skill covers *how* to execute each step correctly.

## Adding a primitive component

Every primitive is exactly three files in `packages/core/src/`, sharing a basename, following `Button` as the reference implementation:

1. **`ComponentName.tsx`** — the component. Style only via `--lat-*` custom properties (see `packages/theme-neutral/theme.css` for what exists). Never hardcode a color, spacing, radius, or font value — if the token you need doesn't exist yet, add it to `packages/tokens/tokens.json` first (see below), then consume it.
2. **`ComponentName.css`** — the styles, using `var(--lat-*)` exclusively.
3. **`ComponentName.doc.mjs`** — a default-exported object with:
   - `name`, `summary`
   - `props` — array of `{ name, type, default, description }`
   - `example` — a realistic usage snippet
   - `doNot` — concrete misuse warnings (see `Button.doc.mjs` for tone/specificity)
   - `swizzlePath` — path to the `.tsx` file, relative to repo root
   - `figmaTokens` — map of `"<css property description>": "<token.dotted.path>"` for every token the component consumes. This is what `check-parity` verifies against.

No exceptions on the `.doc.mjs` file — it's the only thing that makes `list`, `docs`, `swizzle`, and `check-parity` work for a component.

After adding files, `discoverComponents()` in `packages/cli/bin/latent.mjs` is currently hardcoded (`return ["Button"]`) rather than scanning for `*.doc.mjs`. Until that's replaced (a listed Phase 3 task), add the new component name to that hardcoded list or the CLI won't see it.

## Editing tokens

`packages/tokens/tokens.json` is the single source of truth. When you change it:

1. Mirror the change by hand into `packages/theme-neutral/theme.css` (there is no generator script yet — this is a manual sync today).
2. If the token is Figma-authored, the Figma variable collection must mirror the same name/nesting — coordinate the rename/change on both sides.
3. Run `sync figma` (see below) to confirm nothing drifted.

## Verifying with the CLI

Run these after any component or token change — all should exit cleanly or fail with an expected, typed error (`ERR_*` codes in `latent.mjs`, append-only, never repurpose one):

```
node packages/cli/bin/latent.mjs list --json
node packages/cli/bin/latent.mjs docs <Component> --json
node packages/cli/bin/latent.mjs check-parity <Component> --json
node packages/cli/bin/latent.mjs sync figma --file packages/tokens/figma-export.sample.json --json
node packages/cli/bin/latent.mjs manifest --json
```

`check-parity` only checks components that declare `figmaTokens` in their `.doc.mjs` — if it reports `ERR_NO_FIGMA_SPEC`, the mapping is missing, not the CSS.

## Reusing Figma Text/Effect Styles

Before creating any text node or shadow/effect on any Figma page in this
file, pull the current style libraries first:

```js
const textStyles = await figma.getLocalTextStylesAsync();
const effectStyles = await figma.getLocalEffectStylesAsync();
```

Apply a matching existing style (`setTextStyleIdAsync` / `setEffectStyleIdAsync`)
rather than recreating its `fontSize`/`fontWeight`/`lineHeight` or `effects`
array by hand — see `STYLES.md` (repo root) for the full inventory with values
and which token each style is bound to. `sync figma` never catches drift here;
Text Styles and Effect Styles are a different Figma primitive from Variables
and aren't covered by `packages/tokens/*.json` at all. If nothing existing
fits and the role is reusable (not one-off page chrome), create the style,
bind its properties to tokens the same way the existing styles do, and update
`STYLES.md`'s tables before ending the session — that file only stays useful
if every session that changes the style library updates it in the same pass.

## Boundaries to respect

- Templates (Phase 4) stay separate from app-shell/nav components — a template composes a shared layout primitive with header/content/panel slots, nothing more.
- Don't publish `packages/core`, `packages/theme-neutral`, or `packages/cli` as real npm packages until the API stabilizes — once anyone swizzles a component, its `swizzlePath` and prop names are a de facto public contract.
