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

## Phase 4 — not templates; hardening Phase 3 instead

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
    themselves**, not just documentation gaps. Not fixed as part of this
    pass (documenting honestly was the goal, not silently patching
    behavior while claiming to just be writing docs). Worth fixing,
    roughly in priority order:
    - **`Calendar`** — zero arrow-key grid navigation; day buttons have no
      `aria-label` with the actual date (bare number only), no
      `aria-current`/`aria-selected`. A keyboard user tabs through up to
      42 individual buttons with no date context announced.
    - **`Toggle`/`ToggleMultiple`** — use the WAI-ARIA tabs pattern's
      roles (`role="tablist"`/`"tab"`/`aria-selected`) without
      implementing that pattern's required arrow-key navigation —
      arguably worse than using no ARIA role at all, since it announces
      behavior that isn't there.
    - **The `TopNav` family is systematically weaker than the `SideNav`
      family** — not isolated one-offs. `MegaMenuItem` is a real
      clickable `<button>` with zero hover/pressed/focus styling
      anywhere in its CSS; `TopNavLink` has zero focus-visible styling
      and no `aria-expanded`/`aria-haspopup` despite controlling a
      dropdown; `TopNav`'s Product/Download triggers get no
      `aria-expanded` at all, inconsistent with `NavDropdown` solving the
      same trigger+panel pattern correctly elsewhere in the same repo.
    - **`TextField`/`TextArea`** — `error` changes the border color but
      never sets `aria-invalid`; the error state is visual-only.
    - **`ChatWindow`** — no `aria-live`/`role="log"` on the message list;
      new messages are never announced to screen reader users.
    - **`ChatInput`** — `outline: none` with no replacement focus style —
      actively worse than simply missing one.
    - **`Panel`** — sets no `role` at all despite existing specifically to
      host popovers/dropdowns; zero semantics toward its own stated
      purpose.
    - **`Field`/`SubscribeField`** — no `<label htmlFor>` association to
      their nested input at all (placeholder-only); `SubscribeField` also
      has no way to submit via Enter while focused in the field.
    - **`Button`** — `iconOnly`'s required `aria-label` is enforced only
      as a dev-mode `console.warn`, nothing stops it shipping without one
      in production. Separately: `secondary`/`ghost` hover/pressed colors
      are real in the CSS but were never declared in `figmaTokens` — a
      real `check-parity` blind spot, it can't check a token that was
      never declared.
    - **`NavItem`/`NavSubItem`** — `selected` is CSS-only, no
      `aria-current`/`aria-selected`. **`NavDropdown`** — no arrow-key
      nav between items, no Escape-to-close. **`SideNav`** — root has no
      `<nav>`/`role="navigation"` landmark. **`AccordionItem`** — header
      button has no `aria-controls`/`id` link to its answer content.
    - **`Switch`** — no deliberate focus ring (the browser's unstyled
      default still shows, since `outline: none` was never set either —
      it's an accident of omission, not a broken state, but not a
      designed one).
    - Worth naming what's already good, not just gaps: **`Search`**
      correctly wires Enter-to-submit and has well-formed `aria-label`s
      on both its icon-only buttons.
16. Publish `packages/core`, `packages/theme-neutral`, `packages/cli` as scoped npm packages once the API stabilizes — not before, since `swizzle` paths and prop names become breaking changes for anyone who's forked

## Where to pick up

The component-building phase (1-3) is done, and Phase 3 just got a real
hardening pass (see above) rather than being left alone in favor of
templates. Don't start the next session by reaching for another isolated
primitive — there isn't an obvious one left to add. Instead:

- The gitignored-location audit (`packages/chat-app/`, `brand assets/`) is
  done for both known locations — check `.gitignore` for new entries
  before assuming there's nothing left to look at.
- **The real next body of work**: item 15 above lists real accessibility
  bugs found by actually reading the component source, not documentation
  gaps. `Calendar`'s missing grid keyboard nav and the `Toggle`/
  `ToggleMultiple` ARIA-tabs-pattern mismatch are the two most worth
  fixing first — both are places where a screen reader user gets told
  something about the interface that isn't actually true, not just a
  missing nicety.
- Known open item, still unresolved, fold in whenever it's actually
  blocking something rather than fixing it speculatively: Button has no
  true icon-only square variant (see the port session notes) — several
  existing components work around this with plain styled buttons.
- If templates come back, the actual blocker isn't component coverage —
  it's that nothing in this repo has ever been visually verified end to
  end. Prove a trivial render first (fonts load, theme applies, one
  component looks right) before building anything real on top of it, per
  `CLAUDE.md`'s "Building and previewing UI work" rules.
