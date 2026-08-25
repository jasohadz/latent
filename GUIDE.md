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

## Phase 3 — Agent-readiness layer (mostly done)

10. Every component ships a `.doc.mjs` — keep doing this for every new one, no exceptions
11. CLI supports `list`, `docs`, `swizzle`, `sync figma`, `check-parity`, `check-styles`, `check-docs`, `verify`, `apply-drift`, `manifest`, `index`, `ask --json` — add `init` and `upgrade` once there's a second consuming project. `verify` (added 2026-08-20) runs the other four checks in one call — it's what `.github/workflows/latent-sync-check.yml` runs after every Latent Sync plugin push, and what a human should reach for at the terminal too.
12. Error codes are typed and append-only (`ERR_UNKNOWN_COMPONENT`, etc.) — never remove or repurpose a code once shipped

### Ask Latent (optional, local)

Latent ships a local, offline Q&A layer over its own component contracts and docs — `latent index` / `latent ask`, backed by `node-llama-cpp` (no separate app to install) and a `vectra` file index. No external service, no API key. See `CLAUDE.md`'s "Key mechanics" for how it actually works internally (chunking, the committed-index/gitignored-models split, why `--check` does an exact lookup instead of trusting semantic search).

1. `npm install` — already part of normal repo setup, pulls `vectra` and `node-llama-cpp`
2. `node packages/cli/bin/latent.mjs index --json` — first run downloads the local models into `.latent-models/` (gitignored, a few GB, one-time); every run after is instant. Currently indexes all 30 components (~80 chunks) and 10 root docs (~85 chunks).
3. `node packages/cli/bin/latent.mjs ask "what variants does Button have"` — streams the answer live to your terminal as it generates; add `--json` for a single structured result instead (question/answer/sources), no streaming.

The knowledge index (`.latent-index/`) is committed to the repo and kept fresh by the pre-commit hook once your local models are set up — see `.githooks/pre-commit`'s "Knowledge index" section. Use `--check <Component>` to have `ask` explain a failing `check-parity` result against the component's real declared contract instead of guessing — this reliably surfaces the actual failing property now (verified against a deliberately broken component during testing), not just a generic non-answer.

## Phase 4 — Templates & polish (next up)

13. Build 2-3 content-only page templates (dashboard, settings, form) composing existing components into a shared layout primitive with header/content/panel slots — this is the current gap: the component library is deep (30 components across atoms, composites, nav, and chat) but nothing yet demonstrates them assembled into a real page.
14. Keep templates separate from app-shell/nav components
15. Publish `packages/core`, `packages/theme-neutral`, `packages/cli` as scoped npm packages once the API stabilizes — not before, since `swizzle` paths and prop names become breaking changes for anyone who's forked

## Where to pick up

The component-building phase (1-3) is done. Don't start the next session by
reaching for another isolated primitive — there isn't an obvious one left to
add, and doing so would be scope creep against Phase 4. Instead:

- Start Phase 4: pick one real page (dashboard is the best first candidate —
  it exercises Card, Stat, TopNav/SideNav, BadgeGroup/AvatarGroup, and Panel
  together) and compose it from existing components rather than writing new
  ones.
- Build the shared layout primitive (header/content/panel slots) that
  templates will sit inside, before or alongside the first template — don't
  let the first template invent its own one-off layout.
- Known open item to fold in opportunistically while building pages: Button
  has no true icon-only square variant (see the port session notes) —
  several existing components work around this with plain styled buttons.
  If a new page needs a third icon-only trigger, that's the signal to fix it
  at the source (`Button.tsx`) instead of adding a fourth workaround.
