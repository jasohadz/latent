# How to use Latent for your own brand

The intended workflow: clone this repo, point it at your own Figma file,
reconcile your brand into the token/style files, then build with agents that
trust those files as their source of truth. This doc walks through it end to
end, including the one gap in the automation that's still on you to close.

## 1. Clone both halves

Latent is two things that have to travel together: this git repo, and a
Figma file (`Latent DS`, or your duplicate of it). Clone the repo normally,
and duplicate the Figma file into your own drafts/team (Figma → right-click
the file → Duplicate). `npm install` right away — it wires up the pre-commit
hook automatically (see step 3).

## 2. Rebrand in Figma

Edit the **Primitives** collection to your brand: color ramps, font
families, the spacing/radius scale if you're not keeping Tailwind's. The
five Foundations pages (Typography, Density, Color, Spacing, Radius,
Elevation) are your checklist and your visual QA — after editing primitives,
walk each page and confirm it still reads correctly, since they render
straight from the live variables/styles, not from hardcoded values.

## 3. Sync your rebrand into the repo

**Run the Latent Sync Figma plugin** (`packages/figma-plugin/` — see its
README for setup) — Plugins → Development → Latent Sync in Figma desktop,
Extract, then Sync to GitHub branch. It pulls variable data from all four
collections (Primitives, Semantic, Density, Breakpoint — the Semantic one
was briefly misnamed "Style Tokens" in the Figma file, if you're rebranding
an older clone check it's actually called "Semantic") and style data
(`getLocalTextStylesAsync`/`getLocalEffectStylesAsync`, bound variable IDs
resolved to names), pushes both `packages/tokens/{figma-export.live,
styles-export.live}.json` to a `figma-sync` branch, and a GitHub Actions
check (`.github/workflows/latent-sync-check.yml`) automatically runs
`verify` — `sync figma` + `check-styles` + `check-parity` for every
component + `check-docs`, one command — against what it just pushed.

That leaves one manual step — the plugin generates the *export* files, not
`packages/tokens/{primitives,semantic,density,breakpoint,styles}.json`
themselves:

1. Review the CI check on the `figma-sync` branch, or run the same thing
   locally: `node packages/cli/bin/latent.mjs verify --json`.
2. Reconcile whatever drift it reports into the actual token files by hand
   — investigate which side is actually wrong before just copying Figma's
   value over (see `CLAUDE.md`).
3. Commit. The pre-commit hook (`.githooks/`, installed via step 1's
   `npm install`) re-runs the relevant checks automatically and blocks the
   commit if the files you just wrote are inconsistent with each other — a
   safety net for step 2, not a replacement for doing it.

No plugin, or a Figma file you can't install a dev plugin into? Point an
agent (Claude Code or otherwise) at `CLAUDE.md` and the
`design-system-builder` skill instead — both describe the same pull/
reconcile workflow the plugin automates, done by hand via an MCP Figma tool.

## 4. Build layouts

Once step 3 is clean, agents building actual product layouts should read
`packages/tokens/*.json` and `styles.json` directly — fast, no live Figma
connection required, and guaranteed self-consistent by the hook. This is
the payoff: the repo is now a portable source of truth any agent can trust
without needing Figma access at all.

## 5. Editing or adding components

A new component is exactly three files in `packages/core/src/` sharing a
basename — `Name.tsx`, `Name.css`, `Name.doc.mjs` — following `Button` as
the reference. `list`/`docs`/`swizzle`/`check-parity` discover it
automatically (`discoverComponents()` scans for `*.doc.mjs`, nothing to
register by hand).

If a brand needs more than a token rebrand — a new component, or changes to
`packages/core/src/*.tsx`/`.css` — the same rule from `CLAUDE.md` applies
with zero exceptions: **every color, spacing, radius, and font value in a
component's CSS must be a `var(--lat-*)` reference, never a raw literal.**
If the token you need doesn't exist yet, add it to the primitives/semantic
layer first (through the Figma sync workflow in step 3), then reference it
— don't invent a one-off value to unblock yourself.

This is now partially enforced: the pre-commit hook runs `check-parity` for
any staged component and blocks the commit if the compiled CSS no longer
matches the tokens declared in its `.doc.mjs`'s `figmaTokens` map (a
component with no `figmaTokens` yet warns instead of blocking — it hasn't
opted in). What's still **not** caught: a raw value on a property nobody
declared in `figmaTokens` in the first place. A hardcoded `#2563eb` on a
property that was never listed is invisible to `check-parity`, `sync
figma`, `check-styles`, and the rest of the hook. Closing that for real
would mean a CSS scanner (flag hex colors / raw px outside `var()`,
independent of what's declared) — not built yet; flagging it here rather
than implying the current check is exhaustive.

## The gap: nothing detects "Figma changed and nobody re-synced"

Be direct with yourself about this one. The pre-commit hook, `verify` (and
the individual `sync figma`/`check-styles`/`check-parity`/`check-docs`
commands it wraps), and `.github/workflows/latent-sync-check.yml` all only
compare the repo against a `*-export.live.json` snapshot — they verify
internal consistency (and, since 2026-08-20, do so automatically once that
snapshot is pushed), not that the snapshot still matches what's actually in
Figma *right now*. The Latent Sync plugin closed the "remembered to sync,
forgot to run the checks" gap — it doesn't touch the "forgot to sync at
all" gap. If you (or a teammate, or an agent) edit Figma directly and never
open the plugin afterward, **every check in this repo will report "in-sync"
while actually being stale.** Closing that for real would mean a Figma
personal access token wired into a scheduled job that polls Figma
independent of anyone remembering to click Sync — a real credential/
infrastructure decision, not something wired up by default.

Until/unless you set that up: treat "did I run the plugin after editing
Figma?" as a manual discipline, the same way you'd remember to run tests
before pushing on a repo with no CI. The plugin + CI catch you forgetting
to finish step 3 once you've started it; nothing catches you skipping step
3 entirely.
