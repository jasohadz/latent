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
node packages/cli/bin/latent.mjs check-component-bindings <Component> --json
node packages/cli/bin/latent.mjs check-styles --file <export>.json --json
node packages/cli/bin/latent.mjs check-docs --json
node packages/cli/bin/latent.mjs verify --json
node packages/cli/bin/latent.mjs apply-drift --json [--write] [--force] [--tokens-file <export>.json] [--styles-file <export>.json]
node packages/cli/bin/latent.mjs index --json
node packages/cli/bin/latent.mjs ask "<question>" [--check <Component>] [--monitor] [--cite] [--json]
node packages/cli/bin/latent.mjs compose-check <file.json> --json
```

(also available as `npm run ds -- <command>`, via the `ds` script in `package.json`). There is no automated test suite — verify changes by running the relevant CLI command(s) above and checking the JSON output / exit code. **`verify` is the one-command version**: it runs `sync figma`/`check-styles` against `packages/tokens/{figma-export.live,styles-export.live}.json`, `check-parity` for every discovered component, and `check-docs`, and aggregates them into one `verify-result` with a single pass/fail. Run it yourself at the terminal any time you want to know "is everything actually consistent right now" — it's the same command `.github/workflows/latent-sync-check.yml` runs automatically after every Latent Sync plugin push.

## Architecture

**Data flow: tokens → theme → components → CLI.**

- `packages/tokens/tokens.json` is the single source of truth for spacing, color, radius, and typography. Figma variable collections are expected to mirror its names/nesting exactly.
- `packages/tokens/flatten.mjs` provides `flattenTokens()` (nested token object → dotted-path map, e.g. `color.bg.default`) and `tokenPathToCssVar()` (dotted path → `--lat-*` custom property name). Both the CLI's Figma diffing and parity checking depend on this dotted-path representation.
- `packages/theme-neutral/theme.css` is the token values hand-authored as `--lat-*` CSS custom properties. It's a generated artifact conceptually ("Generated from tokens.json — keep in sync, don't hand-edit values") but there's currently no script that actually generates it — edits to `tokens.json` must be mirrored here by hand.
  - **`theme.css` declares `font-family.sans`/`.mono` as `"Geist"`/`"Geist Mono"` with no fallback and ships no webfont of its own** — it's a token file, not a font loader, so nothing in `packages/core` or `packages/theme-neutral` ever loads the actual font. Every real consumer has to load it themselves, or every component silently renders in whatever the browser falls back to (with no `sans-serif` etc. in the value, that fallback is browser-default, not even a graceful one) — this can look like "everything is broken/off" with no error anywhere, since nothing actually fails, it just silently isn't Geist. Fix: add the Google Fonts `<link>` block `packages/chat-app/index.html` already carries (a gitignored, easy-to-miss example — this is the load-bearing copy of that fact). Any new template or consuming app needs this in its own HTML entry point; nothing upstream provides it automatically.
- `packages/core/src/` holds primitive components. **Every primitive is exactly three files sharing a basename** (see `Button.tsx` / `Button.css` / `Button.doc.mjs`):
  - `.tsx` — the component, styled only via `--lat-*` custom properties, no hardcoded values
  - `.css` — the styles
  - `.doc.mjs` — a machine-readable doc module (`default export`) with `name`, `summary`, `props`, `example`, `doNot`, `swizzlePath`, `extends`, and a `figmaTokens` map (CSS property → token dotted-path). This file is what makes the CLI's `docs`, `swizzle`, and `check-parity` commands work — there are no exceptions to shipping one. `extends` is the component's Props interface's literal TS `extends` clause (e.g. `"React.ButtonHTMLAttributes<HTMLButtonElement>"`), or `null` if it doesn't extend one — this is the documented contract for props that pass through via `{...rest}` but aren't listed in `props` (standard HTML attributes like `onClick`, `disabled`, `aria-*`). One exception, added 2026-08-26: `Button`'s exported `ButtonProps` is a discriminated union (`iconOnly: true` requires `"aria-label": string`, see below), not a single interface — its `extends` value still names the real passthrough contract (an internal `ButtonBaseProps` does literally extend it), just not off a single top-level `interface X extends Y` the way every other component's does. `check-docs`' schema check (below) enforces all of this — every field is required, `extends` is the one allowed to be `null`.
    - Two more fields, **optional** (added 2026-08-26, DSDS-inspired but hand-rolled, not DSDS-conformant — see the DSDS fit assessment): `states` (array of `{ name, description, tokens? }`, `tokens` referencing real keys already in that component's own `figmaTokens`) and `accessibility` (object with any of `keyboardInteractions`/`ariaAttributes`/`focusBehaviors`, at least one required if the field is present at all). Same opt-out-by-omission discipline as `figmaTokens`/`ERR_NO_FIGMA_SPEC` — a component with no meaningful state variation or no accessibility surface omits the field entirely, not an empty array/object. 24 of 30 components have one or both now; the other 6 (`Card`, `AvatarGroup`, `Testimonial`, `Stat`, `Icon`, `MessageBubble`) were checked and genuinely have neither. Backfilled by reading each component's real `.tsx`/`.css`, not inferred — this surfaced several real, previously-undocumented accessibility bugs in the actual components (not just doc gaps), see `GUIDE.md`'s Phase 4 section for the list.
- `packages/cli/bin/latent.mjs` is the CLI. Every command supports `--json` (agent output is the primary consumer, human-readable text is secondary). Key mechanics:
  - `discoverComponents()` scans `packages/core/src` for `*.doc.mjs` files and derives each component's name from the filename — adding a new component's three files is enough for `list`/`docs`/`swizzle`/`check-parity` to pick it up, no CLI edit required.
  - `swizzle <name>` copies a component's source file (resolved from its `.doc.mjs`'s `swizzlePath`) out to a consumer's own tree (`--dest`, default `./swizzled`). Once a component has been swizzled, its `swizzlePath` and prop names are effectively a public API — changing them is a breaking change.
  - `sync figma --file <export.json>` diffs a flattened Figma export against flattened `tokens.json` and reports three drift categories: `missingInCode`, `missingInFigma`, `valueMismatches`. Exits non-zero on any drift (CI-gateable). `packages/tokens/figma-export.sample.json` has exactly 3 intentional drift cases for exercising this — it's generated (`npm run generate-sample-fixture`, or automatically via the pre-commit hook whenever `primitives/semantic/density/breakpoint.json` change), so it can't accumulate unrelated staleness the way a hand-edited copy can. Never hand-edit it; regenerate instead.
  - `check-parity <name>` reads a component's `figmaTokens` map and greps the compiled CSS for each expected `--lat-*` custom property, to catch a component silently drifting from its declared design spec. The pre-commit hook runs this automatically for any component whose files are staged (warns instead of blocking if the component has no `figmaTokens` yet — it hasn't opted in, it isn't drifting). It only checks *declared* tokens; a raw value on a property nobody declared is still invisible to everything in this repo — see `HOW-TO.md`'s component-editing section.
  - `check-component-bindings <name>` (added 2026-08-26) answers a different question than `check-parity`: not "does the CSS match what the `.doc.mjs` claims" (self-consistency — passes forever even if the original claim was simply wrong) but "does the `.doc.mjs`'s claim actually match what Figma has bound right now." Built after exactly that gap let real drift sit undetected in `Calendar` (wrong nav-button border/radius, wrong select font token) and `Button` (wrong border-radius everywhere, wrong secondary-variant colors everywhere) despite `verify` reporting clean the whole time — a user comparing the rendered gallery to Figma directly is what surfaced it, not any mechanical check. Reads `packages/tokens/component-bindings.live.json` — a flat `{ ComponentName: [boundVariableName, ...] }` map produced by the Latent Sync plugin's extraction (see below) by walking each real component's full Figma subtree (every variant, for a `COMPONENT_SET`) and collecting every bound-variable name found on any style property (fills, strokes, corner radius, padding, `itemSpacing`, and text properties like `fontSize`/`lineHeight`). For each `figmaTokens` entry, checks whether that claimed token appears *anywhere* in the component's live set — deliberately coarse, not scoped to the exact CSS property, both because that's resilient to internal Figma node renames and because it's what actually catches real mismatches without hard-coding a node path per property. Comparison is normalized (separators/case stripped, with fallback matching for a leading `typography/` or `font-` prefix) rather than exact string equality, since Figma's own variable naming isn't consistently segmented across collections (confirmed real examples: `font-size/caption` in Breakpoint vs `font/size/200` in Primitives; a text node binding directly to `typography/font-family/sans` instead of going through the `font-family.sans` semantic alias) — without that normalization nearly every text-related token in every component false-positived as missing. Optional `.doc.mjs` field `figmaTokensSkipLiveCheck` (array of `figmaTokens` keys, same opt-out-by-omission discipline as `figmaTokens`/`states`/`accessibility`) skips specific entries for one of two honest reasons, which should be explained in a comment next to the key: a deliberate code-only addition with no Figma precedent (most often an accessibility fix, e.g. a focus ring Figma's own component doesn't have), or a real Figma binding this coarse single-static-instance check genuinely can't see (e.g. a `:hover` token on a component that's a plain Figma `COMPONENT` — one static example — rather than a `COMPONENT_SET` with every state as its own variant). Neither reason means "unverified" — it means verified by other means (reading the real source, an earlier live pull) that this particular mechanical check can't independently confirm. Wired into `verify` and the pre-commit hook exactly like `check-parity`, including the same `ERR_NO_FIGMA_SPEC`-warns-not-blocks exception; skipped (not blocking) if `component-bindings.live.json` doesn't exist yet, same as `sync figma`/`check-styles`. First real run (2026-08-26) found 16 components with genuine open findings after the two known-real bugs (Calendar, Button) and known-honest skips (elevation.* Effect Style references, accessibility-only focus rings) were resolved — see `GUIDE.md` for the tracked list; not yet individually re-verified and fixed the way Calendar/Button were.
  - `check-styles --file <export.json>` is `sync figma`'s counterpart for Text/Effect Styles — diffs `packages/tokens/styles.json` (the source of truth, mirrored in human-readable form by `STYLES.md`) against a fresh Figma export, same three drift categories, non-zero exit on drift. Run it after any session that creates, edits, or renames a Text or Effect Style.
  - `check-docs` runs two independent checks and reports one merged `violations` list, each entry tagged `kind`: `"stale-term"` or `"doc-schema"`.
    - `stale-term`: scans every tracked `*.md` file (via `git ls-files '*.md'`) for `DOC_BLOCKLIST` terms — known-stale facts that have appeared in prose before, e.g. Figma's Semantic collection's old "Style Tokens" name. Append-only, same discipline as `ERROR_CODES`; add an entry whenever a doc turns out to have baked in a fact that later changed. Checks per-paragraph, not per-line, so a qualifying phrase like "renamed from" on a different wrapped source line still exempts the term from being flagged.
    - `doc-schema`: loads every component's `*.doc.mjs` and enforces the shape described above — all eight top-level fields present, `summary`/`example` non-empty, `doNot` and `figmaTokens` non-empty (opt out of `figmaTokens` by omitting it, not by shipping `{}` — see `ERR_NO_FIGMA_SPEC`), `extends` is `null` or a non-empty string, and every entry in `props` has `name`/`type`/`default`/`description`. This was previously just a documented convention nothing enforced; it's now load-bearing the same way `check-parity` is for CSS/token drift.
  - `verify` runs `sync figma`/`check-styles` (against the `*.live.json` files directly, no `--file` needed) + `check-parity` + `check-component-bindings` for every component (honoring the same `ERR_NO_FIGMA_SPEC`-warns-not-blocks exception the pre-commit hook applies) + `check-docs`, all in one call, one aggregated `verify-result`. This is what `.github/workflows/latent-sync-check.yml` runs after every Latent Sync plugin push, and what a human should run at the terminal instead of the five commands separately.
  - `apply-drift` mechanically writes what `sync figma`/`check-styles` already report as drift into the real `primitives/semantic/density/breakpoint/styles.json` files — additions (`missingInCode`) and value overwrites (`valueMismatches`) only, never deletions (`missingInFigma` stays a human call, listed in the result as `tokenSkipped`/`styleSkipped` instead). Dry-run by default; `--write` actually writes, and even then refuses if the target files already have uncommitted changes unless `--force` is also passed. This doesn't replace the "investigate which side is actually wrong" judgment call in HOW-TO.md step 3 — it's what you reach for *after* deciding Figma's side is right, to skip the hand-typing. Never invoked by the plugin, the pre-commit hook, or CI — always a deliberate human/agent action.
  - Error codes (`ERR_UNKNOWN_COMPONENT`, `ERR_UNKNOWN_COMMAND`, `ERR_MISSING_ARG`, `ERR_FILE_NOT_FOUND`, `ERR_NO_FIGMA_SPEC`, `ERR_NO_INDEX`, `ERR_MODEL_DOWNLOAD_FAILED`) are typed and **append-only** — never remove or repurpose one once shipped, add a new one instead.
  - `index`/`ask` are a local RAG layer over component contracts and repo docs — `latent ask "<question>"` answers using only retrieved context, `latent index` rebuilds that context from scratch. Fully local: `node-llama-cpp` runs embeddings/chat in-process (an npm dependency, not a separate app — `npm install` fetches a prebuilt native binary, no Ollama or other runtime to install separately), `vectra` stores the index as flat files. No API key, no network dependency once models are cached.
    - Two directories with **opposite** git treatment: `.latent-index/` (small, text/JSON, **committed** — same generated-artifact discipline as `figma-export.sample.json`, never hand-edit it) holds the embedded chunks; `.latent-models/` (a few GB, **gitignored**) holds the downloaded model weights, fetched automatically via `resolveModelFile()` the first time `index` or `ask` runs — no manual install step.
    - `index` always fully rebuilds (`deleteIndex()` then `createIndex()`) rather than upserting in place — `vectra`'s `upsertItem` only replaces an entry given a stable `id`, none is assigned here, so re-running without wiping first would silently double the index every time (this is exactly what the pre-commit hook does automatically whenever `.doc.mjs`/root docs change, so it matters — see below).
    - Every chunk goes through `chunkTextForEmbedding()` (paragraph-aware, ~1000 chars) before embedding — the pinned embedding model's real context window is small (confirmed 512 tokens), and several root docs are multiple KB, which throws outright rather than degrading if sent whole.
    - `ask --check <Component>` does an *exact* metadata lookup (`listItemsByMetadata`) for that component's own chunks rather than trusting semantic search to surface them, and also rewrites the question to name the component explicitly before it reaches the model. Both were fixed after live testing showed a vague question ("why is this failing") plus generic semantic-search noise produced a broken or unhelpful answer even with the correct `check-parity` JSON already sitting in context — mechanically present context is not the same as the model actually using it.
    - Non-`--json` output streams the answer to stderr token-by-token as it generates (`onTextChunk`); `--json` output stays one clean JSON object on stdout, never interleaved with partial text.
    - `ask ... --monitor` starts a tiny local HTTP+SSE server (`packages/cli/bin/monitor.mjs`, Node's built-in `http` module — no new dependency) and blocks until a browser opens the printed `http://localhost:4791` URL, then streams the whole pipeline to it live: the retrieved chunks (with snippets, exact-lookup vs. semantic search labeled), the `check-parity` result when `--check` is used, and the answer generating token by token. Independent of `--json` — the terminal and the monitor page are separate output channels, both can be on at once. The process stays alive after the answer completes so the page stays viewable; exit with Ctrl+C.
    - The pre-commit hook refreshes `.latent-index/` when `.doc.mjs`/root docs change, but skips (never blocks a commit) if `.latent-models/` isn't present yet on that machine — see `.githooks/pre-commit`'s "Knowledge index" section. Run `latent index` once yourself first to set it up.
    - `ask ... --cite` trades free-text prose for a verification pass: the model must respond as grammar-constrained JSON (`llama.createGrammarForJsonSchema`, guarantees valid structure — per node-llama-cpp's own docs this "reduces," not eliminates, hallucination, since it constrains shape, not truth) — an array of `{ text, quote, source }` claims, where `quote` must be an exact substring of the numbered source it cites. Every claim gets mechanically checked after generation: `quote` either really exists in that source or the claim prints as unverified (✗) instead of being silently trusted. Two failure modes found and fixed by actually running it, not by reasoning about it: (1) without `minItems`/`maxItems` on the schema *and* stating the expected count in the prompt, the model reliably emitted a valid-but-empty `{"claims": []}` — node-llama-cpp's grammar docs warn about exactly this; (2) an empty or near-empty `quote` (`""`) trivially matches as a substring of anything in JS (`"x".includes("")` is `true`), which was silently marking unsupported claims as verified — fixed by requiring `≥4` real characters, failing closed instead of open. Case-insensitive comparison, since the model tends to capitalize a quoted fragment as if it were a sentence start even when the source has it mid-sentence lowercase. Also strips markdown emphasis (`*`/`_`) and every quote-mark variant (straight/curly, single/double) plus backticks before comparing — caught two more real false negatives this way: a doc source's `**bold**` markers not surviving into the model's (correct) plain-text quote, and a source's backtick code-span (`` `PowerShell` ``) coming back re-rendered in the model's own curly-smart-quote style (`'PowerShell'`) instead of reproduced literally. Confirmed the verification is still doing real work, not just newly permissive: tested a case where the model cited the right quote but the wrong source index (an off-by-one) — correctly printed unverified, since checking happens against the source the model actually claimed, not "found anywhere in context." No streaming in this mode (raw JSON tokens read as garbled text, not prose) — waits for the full result, then prints each claim with ✓/✗ and its quote.
    - **What ✓ actually guarantees, confirmed with a real example, not hypothetically:** a claim's `text` — "the absence of arrow key navigation [on Calendar] is a design choice, not a technical limitation" — printed ✓ with a genuinely real, correctly-attributed quote. `Calendar.doc.mjs`'s real `accessibility` text never characterizes it as intentional; it just states facts ("No arrow-key grid navigation exists"). The model fabricated an interpretive spin and attached it to a real quote; verification passed it, because it only checks the quote is a real substring of the cited source, not whether the surrounding claim is an honest reading of it. **✓ means the quote is real and correctly attributed — it does not mean the claim's own sentence is true.** This is inherent to the design (verifying arbitrary NL claims against arbitrary NL sources is a much harder problem than substring matching), not a bug to fix — but it means always reading the quote, not just trusting the checkmark, when a claim is doing interpretive work the quote itself doesn't obviously support.
- `packages/figma-plugin/` is a Figma plugin ("Latent Sync") that generates `packages/tokens/figma-export.live.json`, `styles-export.live.json`, and (added 2026-08-26) `component-bindings.live.json` directly from the open Figma file and commits all three to a `figma-sync` GitHub branch — this replaced the old manual "pull via an MCP tool, hand-write the export file" step described in `STYLES.md`/`GUIDE.md`. It does not touch `primitives.json`/`semantic.json`/`density.json`/`breakpoint.json`/`styles.json` themselves or auto-merge — `sync figma`/`check-styles` still gate a human reconciliation step same as before. Every push triggers `.github/workflows/latent-sync-check.yml`, which runs `verify`. See `packages/figma-plugin/README.md` for setup.
- `compose-check <file.json>` validates a generated page composition — a tree of `{ component, props, children }` — against the real component catalog, built fresh from every `.doc.mjs`'s `props` on every call (`buildComponentCatalog()`), never a second hand-maintained catalog. Deterministic, no model involved — same category as `check-parity`, unrelated to `ask`/`index`/anything SLM. See `CATALOG-VALIDATION.md` for the full design rationale (built to spec, not deviated from). `parsePropType()` only constrains what `.doc.mjs`'s loose TS-like `type` strings can confidently parse — booleans, strings, numbers, and quoted string-literal unions (`'"a" | "b"'` → an enum) — a function-typed or `React.ReactNode` prop falls back to unconstrained (`"any"`) rather than guessing wrong, since those represent nesting (see `children`), not a scalar to validate. Reports every violation in one pass, not just the first (same as `check-parity`). Verified against `packages/cli/compose-check.sample.json` — a real composition of `Card`/`Stat`/`BadgeGroup`/`Panel` as they actually exist, with exactly 3 planted violations (an invalid enum value, an undeclared prop, a fabricated component name) — confirmed it reports exactly those 3, no false positives on the valid parts, no false negatives on the planted ones.

## Conventions

- All custom properties are namespaced `--lat-*`; dotted token paths map to them via `tokenPathToCssVar` (`color.bg.default` → `--lat-color-bg-default`).
- Don't hardcode colors/spacing in component CSS — add or reuse a `--lat-*` custom property instead.
- Don't publish `packages/core`, `packages/theme-neutral`, or `packages/cli` as real npm packages until the API stabilizes (per `GUIDE.md`) — swizzle paths and prop names become breaking changes for anyone who's already forked.

## Building and previewing UI work — read before rendering anything

This repo has no build step for the component library itself, so nothing
in `packages/core` has ever been rendered by its own tooling — every real
render happens in some consumer, each of which will independently
rediscover the same handful of gotchas unless they're written down here
once. A first Phase 4 template attempt hit exactly this (built end to end,
rendered once at the very end, and the render was wrong) — reverted, not
because the approach was unsalvageable, but because it surfaced these
gaps clearly enough to fix at the source instead of per-consumer.

**Two real Vite/bundler gotchas** (confirmed via `packages/chat-app`'s own
`vite.config.ts` — gitignored, so this is the tracked copy of that
knowledge, not a duplicate of something already discoverable):
- `Icon.tsx`/`Button.tsx` used to read `process.env.NODE_ENV` directly — a
  Node global Vite doesn't shim automatically, so a raw browser consumer
  would throw `ReferenceError: process is not defined`. Fixed at the
  source (both now guard with `typeof process !== "undefined"` first,
  plus `packages/core/src/global.d.ts` for the type side of the same gap
  — TypeScript had no declaration for the global at all, a separate issue
  from the runtime crash) — a consumer no longer needs a `define` shim
  just to render without crashing. Still worth adding
  `define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development") }`
  in a Vite config if you actually want the dev-only `console.warn`s to
  fire — without it they're silently treated as non-production and warn
  regardless, which is the safe default, not the precise one.
- `packages/core/src`/`packages/theme-neutral` live outside any consumer
  package's own root. Vite's dev server refuses to serve files outside its
  configured root by default — a consumer needs
  `server: { fs: { allow: [<repo-level ancestor path>] } }`.
- Also required, already documented above: the Google Fonts `<link>` block
  and `data-latent-theme="neutral"` (or your theme) on the root element.

**Rules below exist because of that real failure, not hypothetically:**
- Structural checks (`compose-check`, `tsc`, "the bundler transforms it
  without error") are necessary but never sufficient signal that UI work
  is correct — none of them execute in a browser, so none can catch a font
  never loading, a layout that's visually wrong, or anything else that
  only shows up on screen. No visual work gets called "done" without an
  actual rendered look (screenshot or live browser). If that's not
  available, report the work as blocked, not as a caveated deliverable.
- Render the smallest possible real thing first, before building anything
  on top of it — prove the plumbing (fonts, theme, base layout) with a
  trivial case before investing in a full build.
- Nothing genuinely load-bearing — a real gotcha, a required setup step, a
  known fix — gets written only into a gitignored file. `check-docs`, the
  `ask` index, and a plain `git grep` are all blind to anything outside
  `git ls-files`; a fact that only exists in a gitignored file is invisible
  to every mechanism this repo has for surfacing it, agent or human.
- If visual fidelity to a reference matters, look at the reference —
  screenshot it, don't just read a text summary of it. A text description
  of a site's structure is fine for content/section planning; it carries
  none of the actual visual information needed to design matching CSS.

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
