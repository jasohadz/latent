# Build Guide

The reference build order for Latent. Follow this top to bottom — later
phases depend on earlier ones being solid, especially the token schema.

## Phase 1 — Foundation (done)

1. Monorepo already set up (`packages/core`, `packages/cli`, `packages/theme-*`, `packages/tokens`)
2. Styling: CSS custom properties (`--lat-*`), consumed by plain CSS today — StyleX is a drop-in upgrade later if wanted
3. Token schema is the single source of truth, split into four files under `packages/tokens/` that mirror Figma's own collection structure (see `TOKEN-SCHEMA-V2.md`):
   - `primitives.json` — raw scale values (color ramps, spacing, radius, font-size/weight, etc.), single mode, Figma `/`-paths converted to nested JSON.
   - `semantic.json` and `density.json` — mode-aware (`{ value: { light, dark } }` / `{ value: { default, condensed } }`); each leaf stores an alias reference into `primitives.json` rather than a resolved literal.
   - `breakpoint.json` — mode-aware across `mobile`/`tablet`/`desktop`.
   Figma's variable collections (Primitives, Semantic, Density, Breakpoint) must mirror these names/nesting exactly — the Semantic collection was briefly misnamed "Style Tokens" in the Figma file itself and renamed back on 2026-08-20; `packages/figma-plugin`'s `matchLayer()` only recognizes the correct name.
4. Primitives: 30 components now live in `packages/core/src/`, each following Button's exact three-file pattern (`.tsx` + `.css` + `.doc.mjs`, each with a `figmaTokens` mapping):
   - **Atoms**: Button, Icon, Badge, Avatar, Toggle, ToggleMultiple, Switch, TextField, TextArea
   - **Composites**: AccordionItem, Card, BadgeGroup, AvatarGroup, Testimonial, Field, SubscribeField, Search, Stat, Panel, Calendar
   - **Navigation**: NavItem, NavSubItem, NavDropdown, SideNav, TopNavLink, MegaMenuItem, TopNav
   - **Chat**: ChatInput, MessageBubble, ChatWindow

   The full Figma design-system component set has been ported — this phase's original goal ("add 4-7 more") is complete. New primitives only get added now if Figma grows a genuinely new one; the default next step is Phase 4, not more atoms.

## Phase 2 — Figma-to-code pipeline (core loop done)

5. ~~Structure Figma variable collections to mirror `tokens.json` 1:1~~ — done: Figma's Primitives/Semantic/Density/Breakpoint collections (653 variables) now map directly onto the four token files, per `TOKEN-SCHEMA-V2.md`.
6. ~~Use F8igma Console... to pull each collection live~~ — this was the original manual recipe (still works as a fallback, see `TOKEN-SCHEMA-V2.md`'s execution steps); superseded 2026-08-20 by step 9 below for the pull/export half. `theme-neutral/theme.css` still has no generator and is still hand-mirrored from `tokens.json` — that part remains manual.
7. Run `node packages/cli/bin/latent.mjs sync figma --file <export>.json --json` — now diffs per layer *and* per mode (a token that matches in Light but drifted in Dark reports as drift). Clean against a fresh export.
8. Once a component's Figma spec is stable, run `check-parity <name>` to confirm the shipped CSS matches it — all 30 components are wired to semantic paths and pass.
9. ~~(Later) automate steps 6-7 as a script or CI job instead of running by hand~~ — done 2026-08-20: `packages/figma-plugin/` (the "Latent Sync" Figma plugin) pulls variables/styles from the open Figma file and pushes `figma-export.live.json`/`styles-export.live.json` to a `figma-sync` GitHub branch directly, no manual export/paste step. Every push triggers `.github/workflows/latent-sync-check.yml`, which runs `verify` (sync figma + check-styles + check-parity for every component + check-docs, one command — see `CLAUDE.md`) automatically. Reconciling any drift it reports is still a human step by design — see `packages/figma-plugin/README.md`.

## Phase 3 — Agent-readiness layer (done)

10. Every component ships a `.doc.mjs` — keep doing this for every new one, no exceptions
11. CLI supports `list`, `docs`, `swizzle`, `sync figma`, `check-parity`, `check-styles`, `check-docs`, `verify`, `apply-drift`, `manifest`, `index`, `ask --json` — add `init` and `upgrade` once there's a second consuming project. `verify` (added 2026-08-20) runs the other four checks in one call — it's what `.github/workflows/latent-sync-check.yml` runs after every Latent Sync plugin push, and what a human should reach for at the terminal too.
12. Error codes are typed and append-only (`ERR_UNKNOWN_COMPONENT`, etc.) — never remove or repurpose a code once shipped

### Ask Latent (optional, local)

Latent ships a local, offline Q&A layer over its own component contracts and docs — `latent index` / `latent ask`, backed by `node-llama-cpp` (no separate app to install) and a `vectra` file index. No external service, no API key. See `CLAUDE.md`'s "Key mechanics" for how it actually works internally (chunking, the committed-index/gitignored-models split, why `--check` does an exact lookup instead of trusting semantic search).

1. `npm install` — already part of normal repo setup, pulls `vectra` and `node-llama-cpp`
2. `node packages/cli/bin/latent.mjs index --json` — first run downloads the local models into `.latent-models/` (gitignored, a few GB, one-time); every run after is instant. Currently indexes all 30 components (~80 chunks) and 10 root docs (~85 chunks).
3. `node packages/cli/bin/latent.mjs ask "what variants does Button have"` — streams the answer live to your terminal as it generates; add `--json` for a single structured result instead (question/answer/sources), no streaming.

The knowledge index (`.latent-index/`) is committed to the repo and kept fresh by the pre-commit hook once your local models are set up — see `.githooks/pre-commit`'s "Knowledge index" section. Use `--check <Component>` to have `ask` explain a failing `check-parity` result against the component's real declared contract instead of guessing — this reliably surfaces the actual failing property now (verified against a deliberately broken component during testing), not just a generic non-answer.

**To watch it reason, visually, in real time:** add `--monitor` — `node packages/cli/bin/latent.mjs ask "..." --monitor`. It prints a `http://localhost:4791` URL; open that in a browser and the question stays paused until you do. Once connected, you'll watch each pipeline stage light up live: the question, which chunks got retrieved (and why — exact component lookup vs. semantic search), the `check-parity` result if `--check` was used, and the answer typing itself out token by token. No new dependency — a tiny built-in Node HTTP server, `packages/cli/bin/monitor.mjs`.

**To have it prove its answer instead of just asserting it:** add `--cite` — `node packages/cli/bin/latent.mjs ask "..." --cite`. Instead of free prose, the model must back every claim with a verbatim quote from a specific numbered source, and each quote gets mechanically checked afterward — a claim prints ✓ only if its quote is a real match, ✗ if it isn't (including if the model tried to skip citing entirely). This is a genuine, tested defense, not a nicety: building it surfaced a model that would return an empty `{"claims": []}` unless told the expected count up front, and separately, empty-quote claims that were silently passing verification (an empty string is trivially "found" in anything) until that was closed. Useful anywhere you don't want to just trust the prose — a check-parity explanation you're about to act on, for instance: `ask "why is this failing" --check Button --cite`.

**What `--cite`'s ✓ actually guarantees, and what it doesn't** — confirmed with a real example, not a hypothetical: asked whether `Calendar` supports arrow-key navigation, one claim's `text` was *"The absence of arrow key navigation is a design choice, not a technical limitation"* — printed ✓, quote genuinely real, genuinely from the correct source. `Calendar.doc.mjs`'s actual `accessibility` text never says anything about intent — it just states the facts plainly ("No arrow-key grid navigation exists," "Missing," "Neither is set anywhere"). The model attached a fabricated interpretive spin to a real, correctly-cited quote, and verification passed it, because verification only checks that the quote is a real substring of the cited source — it has no way to check whether the surrounding claim honestly follows from that quote. **✓ means "this quote is real and correctly attributed." It does not mean "this sentence is true."** Read the quote yourself, not just the checkmark, whenever the claim is doing more interpretive work than the quote itself supports.

## Phase 4 — not templates; hardening Phase 3 instead (publish gate + 16 open component-bindings findings excepted)

A first template attempt (2026-08-25 — a shared `PageLayout` primitive plus
a portfolio page, both since reverted) got as far as passing every
structural check this repo has (`compose-check`, `tsc`, a real bundler
transform) and was still visibly wrong the first time it actually
rendered — a font never loaded, for a reason none of those checks could
ever catch, since none of them execute in a browser. Decision: templates
aren't the priority right now. The priority is closing the gap that let a
fully-structurally-valid build still be wrong — see `CLAUDE.md`'s
"Building and previewing UI work" section for the rules that came out of
this. Phase 4 is that hardening pass, not page templates:

13. Audit every gitignored location (`packages/chat-app/`, `brand assets/`)
    for load-bearing facts that only exist there — real gotchas, required
    setup steps, known fixes — and promote the genuinely general ones into
    tracked docs. `packages/chat-app/` is done (2026-08-26): found and
    fixed two real source-level bugs this surfaced (`Button.tsx`/`Icon.tsx`
    referenced the Node global `process` directly, with no guard —
    `ReferenceError` in a raw browser consumer, fixed at the source, not
    just documented around) and one stale/wrong comment (chat-app claimed
    "no exact `--lat-spacing` token lands on 64," which is false — `64` is
    real, defined, and now in real use). `brand assets/` is also done
    (2026-08-26) — different risk profile than chat-app: not a hidden-but-
    true fact, a stale-but-plausible one.
    `brand assets/latent_logo_package/DESIGN.md` is a third-party-
    generated "design.md" brand kit (version: alpha, dated 2026-07-11,
    explicitly written to be picked up by AI coding agents) claiming
    `#0066FE` as the primary brand blue — checked against the real tokens,
    that doesn't match `color.blue.600` (`#2563eb`) at all, so it's
    superseded, not current. Added `#0066FE` to `latent.mjs`'s
    `DOC_BLOCKLIST` so if that stale value ever leaks into a tracked doc
    claiming to be current, `check-docs` catches it — the file itself
    stays gitignored and un-fixable-in-place, so this is the only
    mechanical protection available against it spreading.
14. `compose-check <file.json>` (built 2026-08-25, see
    `CATALOG-VALIDATION.md`) still stands on its own regardless of
    templates being paused — it validates *any* generated composition
    against the real component catalog, not just template output.
15. **`states`/`accessibility` backfilled across all 30 components**
    (2026-08-26) — two new optional `.doc.mjs` fields, DSDS-inspired per
    the DSDS fit assessment, hand-rolled not DSDS-conformant (see
    `CLAUDE.md`'s architecture section for the schema). 24 of 30 have one
    or both; the other 6 (`Card`, `AvatarGroup`, `Testimonial`, `Stat`,
    `Icon`, `MessageBubble`) were checked and genuinely have neither.
    Every entry verified against real `.tsx`/`.css` source, not inferred
    — which surfaced **real accessibility bugs in the components
    themselves**, not just documentation gaps. Not fixed as part of the
    backfill itself (documenting honestly was that pass's goal, not
    silently patching behavior while claiming to just be writing docs) —
    fixed in a separate follow-up pass the same day, tracked below in the
    order they were tackled:
    - ~~**`Calendar`** — zero arrow-key grid navigation~~ **Fixed
      2026-08-26** (commit `c83b32d`): implements the WAI-ARIA date-grid
      pattern (`role="grid"`/`"row"`/`"gridcell"`, roving tabindex,
      Arrow/Home/End, full-date `aria-label`s, `aria-selected`).
      Deliberately scoped to the visible month only — doesn't cross month
      boundaries. See `Calendar.doc.mjs`'s `accessibility` field.
    - ~~**`Toggle`/`ToggleMultiple`** — use the WAI-ARIA tabs pattern's
      roles without implementing arrow-key navigation~~ **Fixed
      2026-08-26** (commit `f2e4e29`): roving tabindex plus
      ArrowLeft/ArrowRight/Home/End with automatic activation, same
      recipe in both files. Focus-ring gap (see `Switch` below)
      deliberately left as-is, documented not silently fixed. See
      `Toggle.doc.mjs`/`ToggleMultiple.doc.mjs`'s `accessibility` fields.
    - ~~**The `TopNav` family is systematically weaker than the `SideNav`
      family**~~ **Fixed 2026-08-26** (commit `3f448f0`): `MegaMenuItem`
      got real token-bound hover/pressed/focus-visible styling;
      `TopNavLink` got a focus-visible ring; `TopNav` now passes
      `aria-expanded`/`aria-haspopup="true"` to its Product/Download
      triggers (matching `NavDropdown`'s existing correct handling of the
      same pattern), closes the open panel on Escape, and its root has a
      `role="navigation"` landmark. Deliberately not done: no focus
      returns to the trigger on Escape, no arrow-key nav within an open
      panel. See `TopNav.doc.mjs`/`TopNavLink.doc.mjs`/
      `MegaMenuItem.doc.mjs`'s `accessibility` fields.
    - ~~**`TextField`/`TextArea`** — `error` changes the border color but
      never sets `aria-invalid`~~ **Fixed 2026-08-26** (commit `4aafde9`):
      `aria-invalid={error || undefined}` now derives automatically from
      the same `error` prop, so the two can't drift apart. Overridable
      via `...rest` if a caller passes `aria-invalid` explicitly.
    - ~~**`ChatWindow`** — no `aria-live`/`role="log"` on the message
      list~~ **Fixed 2026-08-26** (commit `2832ea3`): the message slot
      now has `role="log"` + `aria-live="polite"` + `aria-label`.
    - ~~**`ChatInput`** — `outline: none` with no replacement focus
      style~~ **Fixed 2026-08-26** (commit `2832ea3`): a token-bound
      `:focus-visible` style was added. Scoped to the text field only,
      matching what was flagged — the attach/send icon buttons were
      never called out and weren't touched.
    - ~~**`Panel`** — sets no `role` at all despite existing specifically
      to host popovers/dropdowns~~ **Re-examined 2026-08-26** (commit
      `4aafde9`): not a code gap — `role` already passes through via
      `extends`/`...rest` with zero change needed (`<Panel
      role="dialog">` already worked). No default was added deliberately
      — Panel hosts genuinely different semantic roles depending on the
      consumer, and guessing one would announce interaction support that
      may not exist. Fixed in `Panel.doc.mjs` only, not code.
    - ~~**`Field`/`SubscribeField`** — no `<label htmlFor>` association;
      `SubscribeField` also has no way to submit via Enter~~ **Fixed
      2026-08-26** (commit `2832ea3`): `Field` links its label/input via
      `React.useId()`; `SubscribeField` got a `label` prop (default
      "Email address") wired to `aria-label` plus an `onKeyDown` handler
      matching `Search`'s existing Enter-to-submit pattern.
    - ~~**`Button`** — `iconOnly`'s required `aria-label` is enforced
      only as a dev-mode `console.warn`~~ **Fixed 2026-08-26** (commit
      `2832ea3`): `ButtonProps` is now a discriminated union —
      `iconOnly: true` requires `"aria-label": string` at the type
      level, a real compile-time guarantee, not just a runtime hint
      (verified with a throwaway `@ts-expect-error` test). The
      `console.warn` stays as a runtime safety net for what TS can't
      catch. Separately fixed: `secondary`/`ghost` hover/pressed colors
      are now declared in `figmaTokens`, closing the `check-parity`
      blind spot.
    - ~~**`NavItem`/`NavSubItem`** — `selected` is CSS-only, no
      `aria-current`~~ **Fixed 2026-08-26** (commit `1cc2228`): both set
      `aria-current="page"` when `selected`. One documented imprecision
      on `NavItem` specifically (not `NavSubItem`): it's reused as
      `NavDropdown`'s trigger, where `selected` means "contains the
      current page" rather than "is the current page" — a slight
      overclaim, judged the better default over a second prop. See
      `NavItem.doc.mjs`/`NavSubItem.doc.mjs`.
    - ~~**`NavDropdown`** — no arrow-key nav between items, no
      Escape-to-close~~ **Fixed 2026-08-26** (commit `2832ea3`):
      Up/Down/Home/End move focus between sub-items, Escape collapses
      and returns focus to the trigger. Deliberately NOT a
      roving-tabindex composite widget — every `NavSubItem` stays
      individually Tab-reachable exactly as before, since this sub-list
      has no `role="menu"` implying the stricter pattern.
    - ~~**`SideNav`** — root has no `<nav>`/`role="navigation"`
      landmark~~ **Fixed 2026-08-26** (commit `2832ea3`): added to both
      the expanded and collapsed return branches.
    - ~~**`AccordionItem`** — header button has no `aria-controls`/`id`
      link to its answer content~~ **Fixed 2026-08-26** (commit
      `1cc2228`): `aria-controls` + `React.useId()`-generated `id`,
      which also required switching the answer content from
      conditional rendering to always-present-plus-`hidden` so the id
      it points at always exists. The `:focus { outline: none }` on the
      header was re-checked and deliberately left alone — the
      container's existing `:focus-within` border-color change is a
      real, already-verified working focus indicator, not the
      worse-than-missing pattern `ChatInput` has.
    - ~~**`Switch`** — no deliberate focus ring~~ **Fixed 2026-08-26**
      (commit `2832ea3`): a token-bound `:focus-visible` ring was added,
      same pattern as `Button`.
    - Worth naming what's already good, not just gaps: **`Search`**
      correctly wires Enter-to-submit and has well-formed `aria-label`s
      on both its icon-only buttons.
    - **Every bullet above from the original backfill is now resolved**
      — fixed in code except `Panel`'s role, which was re-examined and
      found to be a doc gap rather than a code one (see its bullet
      above). See the commit hashes above for the trail. Any *new*
      accessibility gap found from here on is a fresh finding, not a
      leftover from this pass.
16. **`check-component-bindings` (built 2026-08-26)** — the accessibility
    fixes above all had a `figmaTokens` claim to check against, and
    `check-parity` kept reporting clean for Calendar's and Button's real
    visual mismatches (wrong nav-button border/radius, wrong select font
    token, wrong border-radius everywhere, wrong secondary-variant colors
    everywhere) the whole time. A user comparing the rendered gallery to
    Figma directly found both, not any mechanical check — because
    `check-parity` only verifies the CSS against what the `.doc.mjs`
    *claims*, never whether that claim is actually true against live
    Figma. `check-component-bindings` closes that: the Latent Sync plugin
    now also exports `packages/tokens/component-bindings.live.json` (a
    flat `{ Component: [boundVariableName, ...] }` map from walking each
    real component's full Figma subtree), and the new command diffs every
    `figmaTokens` claim against it. Wired into `verify`/the pre-commit
    hook exactly like `check-parity`. See `CLAUDE.md`'s architecture
    section for the full mechanics — the normalization heuristics needed
    (Figma's own variable naming isn't consistently segmented across
    collections) and the `figmaTokensSkipLiveCheck` opt-out for genuine
    code-only additions or real bindings this coarse check can't see.
    Calendar's and Button's mismatches are fixed (commits `9252eec`,
    `f9a3885`). The tool's first full run (same commit as its build)
    surfaced 16 more components with open findings. **All 16 are now
    resolved** (2026-08-26, follow-up commit after `a1c2712`) — each was
    individually re-verified against a live Figma pull, the same rigor as
    the original Calendar/Button fixes, never guessed or blanket-skipped.
    Real bugs fixed in code:
    - `AccordionItem` — title font-size was `font-size.300`, real Figma
      binding is `font-style.body` (same pattern as its own answer text).
    - `AvatarGroup` — spaced-variant gap was `spacing.4`, real Figma
      `itemSpacing` is 8.
    - `NavItem`/`NavSubItem` — focus ring width was `sizing.border.thin`
      (1px), real Figma Focused-state `strokeWeight` is 2px.
    - `Toggle`/`ToggleMultiple` — option font-size was `font-size.300`
      (16px), real Figma binding is `font-style.body-small` (14px) — a
      genuinely visible size bug.
    - `MegaMenuItem` — padding/gap was `spacing.12`, real Figma value is
      10 (`spacing.10`).
    - `TopNav` — bar padding was uniformly `spacing.16`, real Figma value
      is asymmetric (right/bottom `spacing.8`, left `spacing.12`); panel
      padding was `spacing.12`, real value is `spacing.8`.
    - `Switch` — supporting-text font-size was `font-size.200`, real
      binding is `font-style.body-small`.
    Confirmed-correct, not bugs — resolved via `figmaTokensSkipLiveCheck`
    entries (value already right, but Figma leaves the property unbound,
    or the evidence lives in a different component's usage than the one
    being checked — see each `.doc.mjs`'s inline comment for the specific
    reason): `BadgeGroup` (large-size text font-size), `Card` (body
    font-size, overlay CTA hover), `ChatInput` (field font/send-active
    background), `MessageBubble` (user-sender background/text color —
    verified via ChatWindow's real alternating-instance usage, since
    MessageBubble's own standalone component only has one static
    example), `NavItem`/`NavSubItem` (focus ring width, once corrected to
    2px), `Search` (focus ring width, input font-size), `Stat` (icon
    badge padding, value font-size/weight, label font-size), `Calendar`
    (nav-button hover background, day hover background, day disabled
    text color, focus ring color/width, beyond the already-skipped
    offset). Confirmed clean via `check-component-bindings` on all 16
    plus a full `verify --json` run reporting `status: clean`.
17. Publish `packages/core`, `packages/theme-neutral`, `packages/cli` as scoped npm packages once the API stabilizes — not before, since `swizzle` paths and prop names become breaking changes for anyone who's forked

## Where to pick up

Phases 1-4 are done except two open items — Phase 4 turned out to be a
real hardening pass on Phase 3 (see above), not templates. Don't start
the next session by reaching for another isolated primitive — there
isn't an obvious one left to add, and don't re-open the *accessibility*
punch list (item 15) looking for more work — it's genuinely done, unlike
item 16's newer, separate component-bindings punch list below, which
isn't. Instead:

- The gitignored-location audit (`packages/chat-app/`, `brand assets/`) is
  done for both known locations — check `.gitignore` for new entries
  before assuming there's nothing left to look at.
- **Item 15's accessibility punch list is now fully closed** (2026-08-26,
  commits `c83b32d`, `f2e4e29`, `3f448f0`, `4aafde9`, `1cc2228`,
  `2832ea3`) — every real gap the `states`/`accessibility` backfill found
  is either fixed in code or (`Panel` only) re-examined and found to be
  doc-only. Don't re-check these components looking for more work; if you
  find a *new* gap in one, it's a fresh finding, not a leftover.
- **Item 16's `check-component-bindings` punch list is now fully closed**
  (2026-08-26) — all 16 flagged components individually re-verified
  against live Figma data, same rigor as the original Calendar/Button
  fixes. `verify --json` reports `status: clean`. Don't re-check these
  components looking for more work; if you find a *new*
  `check-component-bindings` finding in one, it's a fresh drift, not a
  leftover from this pass. If a future `check-component-bindings` finding
  ever needs resolving again: it's not pre-verified by definition — pull
  the live Figma node (Desktop Bridge + `figma_execute`) before deciding
  whether it's a real bug, a legitimate `figmaTokensSkipLiveCheck` case,
  or a normalization false positive. Never skip-list one just to make
  `verify` pass — that's exactly the "fix the checker's mood, not the
  reason it's angry" shortcut this whole feature was built to stop
  happening silently.
- Known open item, still unresolved, fold in whenever it's actually
  blocking something rather than fixing it speculatively: Button has no
  true icon-only square variant (see the port session notes) — several
  existing components work around this with plain styled buttons.
- If templates come back, the actual blocker isn't component coverage —
  it's that nothing in this repo has ever been visually verified end to
  end. Prove a trivial render first (fonts load, theme applies, one
  component looks right) before building anything real on top of it, per
  `CLAUDE.md`'s "Building and previewing UI work" rules.
