<img width="300" height="155" alt="og-image-pattern" src="https://github.com/user-attachments/assets/3141a38d-366e-4a28-8feb-0ba4ab5dc3c1" />

# Latent

Working proof-of-concept, verified by actually running every CLI command
(see the commands below — all tested, including the error path).

See [GUIDE.md](./GUIDE.md) for the full phase-by-phase build order, or
[HOW-TO.md](./HOW-TO.md) if you're adopting this for your own brand —
clone → rebrand in Figma → sync into the repo → build with agents.

If you're a designer building components (not the CLI/schema itself),
start with [DESIGNER-CHECKLIST.md](./DESIGNER-CHECKLIST.md) — a plain-language,
step-by-step guide with no assumed technical background.

See [NAMING-CONVENTIONS.md](./NAMING-CONVENTIONS.md) for how Figma
layers and properties should be named so they map predictably to code.


## What's here

- `packages/tokens/tokens.json` — single source of truth for spacing/color/radius/type
- `packages/theme-neutral/theme.css` — token values as CSS custom properties (`--lat-*`)
- `packages/core/src/Button.tsx` + `.css` + `.doc.mjs` — one full component, styled
  entirely via custom properties, with a machine-readable doc file
- `packages/cli/bin/latent.mjs` — the agent-facing CLI
- `.latent-index/` — committed, local RAG index over every component's
  contract and the repo's docs, queried by `latent ask` (see below)

## Try it

```
node packages/cli/bin/latent.mjs list --json
node packages/cli/bin/latent.mjs docs Button --json
node packages/cli/bin/latent.mjs manifest --json
node packages/cli/bin/latent.mjs swizzle Button --dest ./out
node packages/cli/bin/latent.mjs sync figma --file packages/tokens/figma-export.sample.json --json
node packages/cli/bin/latent.mjs check-parity Button --json
node packages/cli/bin/latent.mjs check-docs --json
node packages/cli/bin/latent.mjs verify --json
node packages/cli/bin/latent.mjs index --json
node packages/cli/bin/latent.mjs ask "what variants does Button have"
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
- **`check-docs`** — scans every tracked `.md` file for known-stale facts
  (an append-only blocklist, e.g. a Figma collection's old pre-rename
  name). Catches documentation drift with the same non-zero-exit discipline
  as everything else here.
- **`verify`** — runs all of the above (`sync figma`/`check-styles` against
  the live export files, `check-parity` for every component, `check-docs`)
  in one call, one aggregated result. The single command to reach for,
  whether that's you at the terminal or CI.
- **`ask "<question>"`** — a local, offline Q&A layer over every component's
  `.doc.mjs` contract and the repo's own docs, backed by `node-llama-cpp`
  (in-process, no separate app or API key) and a committed `vectra` index
  (`latent index` to (re)build it — models auto-download on first run,
  a few GB, one-time). Streams the answer live to your terminal. Pass
  `--check <Component>` to have it explain a failing `check-parity` result
  against that component's real declared contract instead of guessing.
  Pass `--monitor` to watch the whole pipeline — retrieval, the check
  result, the answer generating — visually, live, in a browser tab.

The sample export at `packages/tokens/figma-export.sample.json` has
exactly 3 intentional drift cases (one missing-in-code, one value
mismatch, one missing-in-Figma) so you can see `sync figma` catch all
three categories right away — run the command above against it before
wiring up a real export. It's generated, not hand-edited — see
`packages/tokens/generate-sample-fixture.mjs`.

**Real workflow:** run the **Latent Sync** Figma plugin
(`packages/figma-plugin/` — see its README for setup) to pull your
actual Figma variables/styles and push them to a `figma-sync` branch
automatically, no manual export step. That push triggers a GitHub Actions
check that runs `verify` for you; run the exact same command yourself —
`node packages/cli/bin/latent.mjs verify --json` — any time you want a
single pass/fail answer without waiting on CI. Without the plugin, you can
still pull one-off via an MCP Figma tool (e.g. F8igma Console's
`figma_get_variables`) to a JSON file with the same nesting as
`tokens.json`, then run `sync figma --file` against it by hand.


