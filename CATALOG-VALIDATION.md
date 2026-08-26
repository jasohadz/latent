# Catalog Validation — Design Spec for Phase 4

**Built 2026-08-25**, ahead of Phase 4 starting rather than during it — see
`compose-check` in `CLAUDE.md`'s architecture section for the real
mechanics, and `packages/cli/compose-check.sample.json` for a working
example with 3 planted violations. This doc is kept as-is below as the
design rationale, not rewritten past tense — everything it describes was
built to spec, not deviated from. The one open decision it left (hand-
rolled validator vs. a dependency) was resolved as hand-rolled, for the
reason the doc itself gives: zero exceptions elsewhere in this repo to
hand-rolling checks.

---

Design spec for validating agent-generated page compositions against a real
component catalog, before they're trusted. Originally written for a future
Claude Code session to execute once Phase 4 (then still "templates")
actually started — see the header above for what actually happened: built
ahead of that, and Phase 4 itself later became a hardening pass on Phase 3
rather than templates. The rest of this doc is preserved as originally
written (the design rationale doesn't depend on either of those facts), so
read anything below this point as the target spec that was built to, not a
live to-do.

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

1. ~~Decide the validator question above.~~ — done: hand-rolled, consistent
   with every other check in this repo.
2. ~~Build `buildComponentCatalog()`~~ — done, `packages/cli/bin/latent.mjs`.
   The string-union-type parser (`parsePropType()`) turned out to be exactly
   as fiddly as expected and no more; falls back to unconstrained (`"any"`)
   for anything it can't confidently parse, same call `checkDocSchema`
   already makes treating `extends: null` as deliberate rather than an
   omission.
3. ~~Add `compose-check` to `COMMANDS`/`ERROR_CODES`/the dispatch `switch`~~
   — done, following the existing conventions exactly (new error code
   `ERR_INVALID_COMPOSITION_JSON`, appended, not repurposing one).
4. ~~Write a sample composition fixture with a few intentional
   violations~~ — done: `packages/cli/compose-check.sample.json`, a real
   composition of `Card`/`Stat`/`BadgeGroup`/`Panel` as they actually
   exist, with exactly 3 planted violations (invalid enum value, undeclared
   prop, fabricated component name). Verified directly: `compose-check`
   against it reports exactly those 3, nothing else — no false positives on
   the valid nodes, no false negatives on the planted ones.
5. **Still open, actually needs Phase 4 to exist first:** wire it into the
   real template-building workflow — an agent's proposed composition gets
   `compose-check`'d before its JSX is generated from it, not after. Static
   fixture (step 4) demonstrates the mechanism works; it isn't itself that
   integration.
