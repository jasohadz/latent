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
  `breakpoint.json` / `styles.json` directly.** Those stay hand-reconciled —
  run `sync figma --file packages/tokens/figma-export.live.json` and
  `check-styles --file packages/tokens/styles-export.live.json` after
  merging the plugin's branch, same as today, and resolve drift the way
  `CLAUDE.md`/`STYLES.md` describe (investigate which side is wrong, don't
  default to "Figma wins" blindly if a value looks off — see the
  `latent-figma-source-of-truth` discipline).
- **Doesn't run `check-parity`** or touch any component file.
- **Doesn't auto-merge.** You review the diff on the `figma-sync` branch
  like any other PR before merging to `main`.
