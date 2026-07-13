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

This is the step that actually needs an agent (Claude Code or otherwise)
with a live connection to your Figma file — nothing in the repo can pull
Figma data on its own. Point your agent at `CLAUDE.md` (repo-wide) and the
`design-system-builder` skill; both describe the pull/reconcile workflow in
detail. The short version:

1. Pull fresh variable data from all four collections (Primitives, Style
   Tokens, Density, Breakpoint) and fresh style data (`getLocalTextStylesAsync`/
   `getLocalEffectStylesAsync`), resolving bound variable IDs to names.
2. Update `packages/tokens/{primitives,semantic,density,breakpoint,styles}.json`
   to match.
3. Regenerate `packages/tokens/{figma-export.live,styles-export.live}.json`
   from that same pull.
4. Run `sync figma` and `check-styles` against those export files and fix
   anything they report before moving on.
5. Commit. The pre-commit hook (`.githooks/`, installed via step 1's
   `npm install`) re-runs both checks automatically and blocks the commit
   if the files you just wrote are inconsistent with each other — a safety
   net for step 2–3, not a replacement for doing them.

## 4. Build layouts

Once step 3 is clean, agents building actual product layouts should read
`packages/tokens/*.json` and `styles.json` directly — fast, no live Figma
connection required, and guaranteed self-consistent by the hook. This is
the payoff: the repo is now a portable source of truth any agent can trust
without needing Figma access at all.

## 5. Editing or adding components

If a brand needs more than a token rebrand — a new component, or changes to
`packages/core/src/*.tsx`/`.css` — the same rule from `CLAUDE.md` applies
with zero exceptions: **every color, spacing, radius, and font value in a
component's CSS must be a `var(--lat-*)` reference, never a raw literal.**
A hardcoded `#2563eb` or `16px` in a component's stylesheet is invisible to
`sync figma`, `check-styles`, and the pre-commit hook — none of them read
component CSS — so it won't get caught by anything built so far. If the
token you need doesn't exist yet, add it to the primitives/semantic layer
first (through the Figma sync workflow in step 3), then reference it —
don't invent a one-off value to unblock yourself.

`check-parity <Component>` (see `GUIDE.md` / the `design-system-builder`
skill) verifies that a component's *declared* `figmaTokens` mapping is
actually present in its compiled CSS — useful, but it only checks tokens
the component's `.doc.mjs` already claims to use. It won't catch a raw
value on a property nobody declared. Closing that gap for real would mean
a CSS scanner (flag hex colors / raw px outside `var()`) wired into
`check-parity` or the pre-commit hook — not built yet; flagging it here
rather than pretending "note: don't do it" is sufficient enforcement.

## The gap: nothing detects "Figma changed and nobody re-synced"

Be direct with yourself about this one. The pre-commit hook and the
`sync figma`/`check-styles` commands only compare the repo against its own
`*-export.live.json` snapshot — they verify internal consistency, not that
the snapshot still matches what's actually in Figma right now. If you (or
a teammate, or an agent) edit Figma directly and don't run step 3
afterward, **every check in this repo will report "in-sync" while actually
being stale.** There's no automated tripwire for this today — closing it
for real would mean a Figma personal access token wired into a scheduled
job (CI, most likely), which is a real credential/infrastructure decision,
not something wired up by default.

Until/unless you set that up: treat "did I re-sync after editing Figma?"
as a manual discipline, the same way you'd remember to run tests before
pushing on a repo with no CI. The hook catches you forgetting to finish
step 3 once you've started it; it can't catch you skipping step 3 entirely.
