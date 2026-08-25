# Catalog Validation — Design Spec for Phase 4

Design spec for validating agent-generated page compositions against a real
component catalog, before they're trusted. Written for a future Claude Code
session to execute once Phase 4 (templates) actually starts — not needed
before then, and nothing here is built yet.

## Why this exists

Two projects came up in a conversation about preventing hallucination in
this repo's local SLM (`latent ask`, see `CLAUDE.md`): [A2UI](https://a2ui.org)
and [json-render.dev](https://json-render.dev). Neither is about Q&A prose —
both are about constraining *agent-generated UI* to a predefined component
catalog, so an agent can't invent a component or prop that doesn't exist.
The client only ever renders real, known things; a generated reference to
something outside the catalog fails validation instead of rendering wrong
or crashing at runtime.

That's a different problem from what `ask --cite` solves (see `CLAUDE.md`)
— `--cite` grounds free-text answers about existing docs in real quoted
source text. This is about grounding *generated compositions* (Phase 4's
actual next task, per `GUIDE.md`'s "Where to pick up") in real component
contracts. **This mechanism doesn't use the SLM at all** — it's plain
deterministic schema validation, the same category of check as
`check-parity`, not an LLM call. Worth being explicit about that so the two
don't get conflated later.

## The core insight: the catalog already exists

Every component's `packages/core/src/*.doc.mjs` already declares `name`,
`props` (array of `{ name, type, default, description }`), `swizzlePath`,
and `figmaTokens` — CLAUDE.md documents this shape as mandatory, and
`checkDocSchema` in `latent.mjs` already enforces it. This is most of what
A2UI/json-render need hand-built elsewhere. Building a second, separately
maintained catalog would recreate the exact two-sources-of-truth drift
problem this repo has spent significant effort preventing everywhere else
(`sync figma`, `check-parity`, `check-docs`) — so the catalog must be
*generated from* `.doc.mjs` files at validation time, never hand-maintained
alongside them.

## Target shape

### 1. `buildComponentCatalog()` — new function, `packages/cli/bin/latent.mjs`

Iterates `discoverComponents()` + `loadDoc()` (both already exist) and
produces, per component, a validation schema derived from its `props`
array. The `type` field in `.doc.mjs` is a loose TS-like string today
(`'"primary" | "secondary" | "ghost"'`, `"boolean"`, `"React.ReactNode"`,
function signatures for callbacks) — this needs a small parser, not a
rewrite of `.doc.mjs`'s format:

- `"boolean"` / `"string"` / `"number"` → the obvious JSON-schema type
- `'"a" | "b" | "c"'` (quoted string-literal unions — the common case for
  `variant`/`size`-style props) → `enum: ["a", "b", "c"]`
- Function types (`onChange`, `onSubmit`, etc.) and `React.ReactNode` →
  intentionally **not** constrained to a scalar type. A `React.ReactNode`
  prop (e.g. Button's `icon`) represents nesting, not a scalar value — see
  the composition shape below, not a prop-schema problem to solve here.

### 2. Composition shape

A generated page isn't flat prop values — components nest (Button's `icon`
prop takes an `<Icon>` element; a layout composes multiple components).
The thing actually being validated is a tree:

```
CompositionNode = {
  component: <one of discoverComponents()'s real names>,
  props: { ...validated per-prop against that component's own catalog entry... },
  children?: CompositionNode[]   // only for components whose props/doNot imply children are valid
}
```

### 3. New CLI command: `latent compose-check <file.json>`

Deterministic, no model involved — same category as `check-parity`, not
`ask`. Validates a composition file against the catalog built in step 1.
Same conventions as every other command in this file: typed result object,
non-zero exit on invalid, `--json` support, new error codes appended to the
existing (append-only) `ERROR_CODES` object rather than reusing an
unrelated one.

```
node packages/cli/bin/latent.mjs compose-check <file.json> --json
```

```json
{
  "type": "compose-check-result",
  "status": "invalid",
  "errors": [
    { "path": "children[2].props.variant", "message": "\"danger\" is not a valid variant for Button (expected: primary | secondary | ghost)" },
    { "path": "children[3].component", "message": "\"IconBadge\" is not a real component" }
  ]
}
```

### Open decision: hand-rolled validator vs. a dependency

This repo hand-rolls every check it has (`checkDocSchema`, `check-parity`,
`diffStyleValue`) rather than reaching for a validation library — no
exceptions so far, and `package.json` currently has exactly two runtime
dependencies (`vectra`, `node-llama-cpp`), both load-bearing for `ask`.
Zod (what json-render.dev itself uses) would mean less code and a more
battle-tested validator, at the cost of a third dependency for something
this repo has always done by hand. Whoever picks this up should decide
deliberately, not default into it — same discipline CLAUDE.md already
asks for elsewhere in this repo.

## What this does NOT solve

Being direct about this, same as `HOW-TO.md`'s "The gap" section is about
sync drift:

- **Doesn't validate visual/design correctness.** A composition can be
  100% schema-valid — every component real, every prop real, every value
  in range — and still look wrong. This catches "the agent invented
  something that doesn't exist," not "the agent used real things badly."
- **Doesn't replace `check-parity`/`check-docs`.** Those validate a
  component's own CSS/docs against its declared contract. This validates a
  *composition of already-validated components* against those same
  contracts — a different layer, checking a different thing.
- **Not a gate on `ask`.** `ask --cite`'s citation-checking and this are
  both "verify before trusting," but for entirely different outputs (prose
  answers vs. generated UI trees) via entirely different mechanisms (LLM
  self-citation vs. deterministic schema validation). Neither replaces the
  other.

## Execution steps, once Phase 4 actually starts

1. Decide the validator question above.
2. Build `buildComponentCatalog()` — the string-union-type parser is the
   only genuinely fiddly part; fall back permissively (accept any value)
   for prop types it can't confidently parse rather than guessing wrong,
   consistent with how `checkDocSchema` already treats `extends: null` as
   a deliberate, valid state rather than an omission.
3. Add `compose-check` to `COMMANDS`/`ERROR_CODES`/the dispatch `switch` in
   `latent.mjs`, following the existing conventions exactly.
4. Write a sample composition fixture with a few intentional violations —
   same pattern as `packages/tokens/figma-export.sample.json`'s "exactly 3
   intentional drift cases" — so `compose-check` has something concrete to
   exercise, and so a later refactor can tell if it silently regressed.
5. Wire it into the actual Phase 4 template-building workflow once that
   work starts: an agent's proposed composition gets `compose-check`'d
   before its JSX is generated from it, not after.
