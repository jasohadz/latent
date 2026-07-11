<img width="300" height="155" alt="og-image-pattern" src="https://github.com/user-attachments/assets/3141a38d-366e-4a28-8feb-0ba4ab5dc3c1" />

# Latent — a remix on the Astryx design system pattern

Working proof-of-concept, verified by actually running every CLI command
(see the commands below — all tested, including the error path).

See [GUIDE.md](./GUIDE.md) for the full phase-by-phase build order.


## What's here

- `packages/tokens/tokens.json` — single source of truth for spacing/color/radius/type
- `packages/theme-neutral/theme.css` — token values as CSS custom properties (`--lat-*`)
- `packages/core/src/Button.tsx` + `.css` + `.doc.mjs` — one full component, styled
  entirely via custom properties, with a machine-readable doc file
- `packages/cli/bin/latent.mjs` — the agent-facing CLI

## Try it

```
node packages/cli/bin/latent.mjs list --json
node packages/cli/bin/latent.mjs docs Button --json
node packages/cli/bin/latent.mjs manifest --json
node packages/cli/bin/latent.mjs swizzle Button --dest ./out
node packages/cli/bin/latent.mjs sync figma --file packages/tokens/figma-export.sample.json --json
node packages/cli/bin/latent.mjs check-parity Button --json
```

## The differentiator: Figma is a first-class citizen, not an afterthought

Astryx's CLI has no native design-tool round trip — token/theme sync with
Figma is left entirely to whoever adopts it. Latent treats that sync as a
CLI-native operation with the same fail-loudly discipline as everything else:

- **`sync figma --file <export.json>`** — diffs a Figma variable export
  against `packages/tokens/tokens.json` and reports three drift categories:
  `missingInCode` (new in Figma, not yet in the schema), `missingInFigma`
  (in code, not in the Figma export), and `valueMismatches` (same token
  name, different value — usually someone edited only one side). Exits
  non-zero on any drift so it can gate CI.
- **`check-parity <component>`** — reads a component's `figmaTokens`
  mapping (declared in its `.doc.mjs`) and confirms the compiled CSS
  actually references the expected `--lat-*` custom property for each
  one. Catches a component quietly drifting from its design spec.

The sample export at `packages/tokens/figma-export.sample.json` has
intentional drift (one renamed key, one changed value, one missing key)
so you can see `sync figma` catch all three categories right away —
run the command above against it before wiring up a real export.

**Real workflow:** use F8igma Console (`figma_get_variables` /
`figma_export_tokens`) to pull your actual Figma variable collection to
a JSON file with the same nesting as `tokens.json`, then run `sync figma
--file` against it.


