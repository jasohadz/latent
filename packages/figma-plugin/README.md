# Latent Sync (Figma plugin)

Replaces the manual "export variables/styles from Figma, paste into a JSON
file" step that `sync figma` and `check-styles` (see `CLAUDE.md`) depend on.
It does **not** replace those commands or the human judgment call of how to
resolve drift — see "What this doesn't do" below.

## What it does

1. Reads local Variable collections and Text/Effect Styles straight from the
   open Figma file via the Plugin API.
2. Shapes them into the exact JSON `packages/tokens/figma-export.live.json`
   and `packages/tokens/styles-export.live.json` already use — same nesting,
   same `{color.blue.600}`-style alias references for multi-mode layers, same
   `boundVariables` resolution `STYLES.md` documents for the old manual pull
   script.
3. Commits both files in one atomic commit to a dedicated branch (default
   `figma-sync`) via the GitHub REST API, and prints a compare/PR link.
   **Nothing is pushed to `main` automatically.**
4. That push triggers `.github/workflows/latent-sync-check.yml`, which runs
   the real CLI — `sync figma`, `check-styles`, and `check-parity` for every
   component — against the files the plugin just committed, and reports
   pass/fail as a check on the branch/commit. This only fires when the sync
   branch is the default `figma-sync`; a renamed branch needs those commands
   run by hand (see "What this doesn't do" below).

## Setup

1. In Figma desktop: **Plugins → Development → Import plugin from manifest…**,
   select `packages/figma-plugin/manifest.json`. Since this repo travels with
   the plugin, anyone who clones it and has Figma desktop can do this — no
   publishing required.
2. Create a GitHub **fine-grained personal access token**
   (github.com/settings/personal-access-tokens/new) scoped to:
   - **Repository access**: only this repo (e.g. `jasohadz/latent`)
   - **Permissions**: Contents → Read and write. Nothing else.
3. Run the plugin (Plugins → Development → Latent Sync), fill in Owner /
   Repo / Base branch / Sync branch / token. Settings (including the token)
   are saved via `figma.clientStorage` — local to your Figma account, only
   ever sent to `api.github.com` on sync.

## Variable collection naming

Extraction buckets each Variable collection into `primitives` / `semantic` /
`density` / `breakpoint` by matching the **collection's name** (case-
insensitive, substring match) against those four words. A collection that
doesn't match any of them is skipped with a warning printed in the plugin
log rather than silently dropped or guessed into the wrong layer — rename
the collection or flag it if that happens.

Multi-mode collections (2+ modes) export each variable as
`{ value: { <mode>: ... } }`, matching `semantic.json`/`density.json`/
`breakpoint.json`; single-mode collections export flat scalars, matching
`primitives.json`. This mirrors `flatten.mjs`'s existing mode-map handling —
no new schema was introduced.

## What this doesn't do

- **Doesn't touch `primitives.json` / `semantic.json` / `density.json` /
  `breakpoint.json` / `styles.json` directly.** Those stay hand-reconciled.
  The CI check (see above) tells you *whether* there's drift against
  `figma-export.live.json`/`styles-export.live.json`, same three categories
  `sync figma`/`check-styles` always report — resolving it is still on you,
  the way `CLAUDE.md`/`STYLES.md` describe (investigate which side is wrong,
  don't default to "Figma wins" blindly if a value looks off — see the
  `latent-figma-source-of-truth` discipline).
- **Doesn't run `check-parity` itself** — CI does, on push to `figma-sync`,
  but the plugin's own JS never touches a component file, by design (see
  `latent-figma-sync-plugin` memory for why: reimplementing that check in
  the plugin would mean the diff/parity logic exists in two places that
  could quietly drift from each other).
- **Doesn't auto-merge.** You review the diff — and the CI check result —
  on the `figma-sync` branch like any other PR before merging to `main`.
