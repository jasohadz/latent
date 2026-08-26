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
   - `extends` — the Props interface's literal TS `extends` clause (e.g. `"React.ButtonHTMLAttributes<HTMLButtonElement>"`), or `null` if there isn't one. Required field, but `null` is a valid value — don't omit it.
   - `figmaTokens` — map of `"<css property description>": "<token.dotted.path>"` for every token the component consumes. This is what `check-parity` verifies against.
   - `states` and `accessibility` — **optional**, added 2026-08-26. `states`: array of `{ name, description, tokens? }` documenting real visual/interaction states (hover, pressed, error, etc.), `tokens` referencing keys already in this same component's `figmaTokens`. `accessibility`: object with any of `keyboardInteractions`/`ariaAttributes`/`focusBehaviors` (at least one required if the field is present at all). Same opt-out-by-omission rule as `figmaTokens`/`ERR_NO_FIGMA_SPEC` — omit the field entirely if it doesn't apply, don't ship an empty array/object. Write both by actually reading the component's real `.tsx`/`.css`, not by inferring from the prop list — doing that the lazy way is exactly what let real, previously-undocumented accessibility bugs slip through undetected in this repo's own components (see `GUIDE.md` Phase 4 item 15).

No exceptions on `name`/`summary`/`props`/`example`/`doNot`/`swizzlePath`/`extends`/`figmaTokens` — `check-docs`' schema check enforces all eight as required (only `extends` may be `null`). `states`/`accessibility` are the only genuinely optional fields.

`discoverComponents()` scans `packages/core/src` for `*.doc.mjs` files, so adding the three files is enough — no CLI edit needed for `list`/`docs`/`swizzle`/`check-parity` to see the new component. `check-component-bindings` needs one more step: add the component's PascalCase name to `COMPONENT_NAMES` in `packages/figma-plugin/code.js` (append-only, mirrors the filename) so the plugin's next extraction includes it in `component-bindings.live.json` — until then it reports `no-live-data` for that component, which is informational, not blocking.

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
node packages/cli/bin/latent.mjs check-component-bindings <Component> --json
node packages/cli/bin/latent.mjs check-docs --json
node packages/cli/bin/latent.mjs sync figma --file packages/tokens/figma-export.sample.json --json
node packages/cli/bin/latent.mjs check-styles --file packages/tokens/styles-export.live.json --json
node packages/cli/bin/latent.mjs manifest --json
```

Or run `node packages/cli/bin/latent.mjs verify --json` for the one-command version — `sync figma`/`check-styles` (against the live export files, no `--file` needed) + `check-parity` + `check-component-bindings` for every component + `check-docs`, one aggregated pass/fail.

`check-parity` only checks components that declare `figmaTokens` in their `.doc.mjs` — if it reports `ERR_NO_FIGMA_SPEC`, the mapping is missing, not the CSS. The pre-commit hook runs it automatically for any staged component (warns, doesn't block, on `ERR_NO_FIGMA_SPEC`) — but it only verifies the CSS matches what the `.doc.mjs` *claims*, never whether that claim is actually true against live Figma; a raw value on an undeclared property still isn't caught by anything either. `check-component-bindings` closes the first half of that gap — added 2026-08-26 after `check-parity` alone let real drift (wrong tokens in `Calendar`/`Button`) sit undetected indefinitely — by diffing each `figmaTokens` claim against `packages/tokens/component-bindings.live.json`, a real export of what Figma actually has bound, produced by the Latent Sync plugin. See `CLAUDE.md`'s architecture section for the full mechanics (including the `figmaTokensSkipLiveCheck` opt-out for deliberate code-only additions).

## Reusing Figma Text/Effect Styles

Before creating any text node or shadow/effect on any Figma page in this
file, pull the current style libraries first:

```js
const textStyles = await figma.getLocalTextStylesAsync();
const effectStyles = await figma.getLocalEffectStylesAsync();
```

Apply a matching existing style (`setTextStyleIdAsync` / `setEffectStyleIdAsync`)
rather than recreating its `fontSize`/`fontWeight`/`lineHeight` or `effects`
array by hand — see `STYLES.md` (repo root) for the full inventory, and
`packages/tokens/styles.json` for its machine-checkable source of truth.
`sync figma` never catches drift here — Text/Effect Styles are a different
Figma primitive from Variables — which is exactly what `check-styles` is for
(see the command above); run it after any session that touches the style
library, same discipline as `sync figma` for tokens. If nothing existing
fits, **stop and flag it to the user rather than creating a new style
unilaterally** — describe the role/values you need and let them decide
whether it's a new named style, an adjacent existing one, or a one-off
(page chrome used once doesn't need a style at all). Once a style exists,
bind its properties to tokens the same way the existing styles do, and update
`STYLES.md`'s tables before ending the session — that file only stays useful
if every session that changes the style library updates it in the same pass.

## Boundaries to respect

- Phase 4 is not templates — a first template attempt (2026-08-25) was reverted after passing every structural check (`compose-check`, `tsc`, a real bundler transform) but still rendering visibly wrong, for a reason none of those checks could catch since none execute in a browser. See `GUIDE.md`'s Phase 4 section and `CLAUDE.md`'s "Building and previewing UI work" rules before attempting any generated page/layout — prove a trivial render first (fonts load, theme applies) before building anything real on top of it.
- Don't publish `packages/core`, `packages/theme-neutral`, or `packages/cli` as real npm packages until the API stabilizes — once anyone swizzles a component, its `swizzlePath` and prop names are a de facto public contract.
