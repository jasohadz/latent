# @latent/storybook

Storybook for every Latent component, plus the tools around it: Story UI
(an AI story generator), an MCP endpoint for coding agents, accessibility
checks, and Chromatic for visual review.

## Run it

From the repo root (or this folder):

```bash
npm run storybook            # http://localhost:6006
npm run storybook-with-ui    # same, plus the Story UI server on port 4001
npm run build-storybook      # static build into storybook-static/
```

The toolbar switches **Light/Dark** and **Default/Condensed** density. They
set `data-latent-mode` and `data-latent-density` on `<html>`, the same
attributes the generated `theme.css` reads.

## What's in here

| Path | What it is |
|---|---|
| `stories/` | One `<Component>.stories.tsx` per component in `packages/core/src` |
| `.storybook/main.ts` | Stories globs, addons, the Vite aliases (`@latent/core`, `@latent/theme`) |
| `.storybook/preview.tsx` | Imports `fonts.css` then `theme.css`; mode/density toolbar; Chromatic modes; a11y settings |
| `story-ui.config.js` | Story UI: where components are (`../core/src`) and how generated stories import them |
| `story-ui-docs/`, `story-ui-considerations.md` | **Generated** — what Story UI's AI reads. Don't edit; see below |
| `src/stories/StoryUI*` | Story UI's own panels, installed by `story-ui init` |

## Adding a component's story

Copy an existing story (`stories/Select.stories.tsx` is a good template).
The component also needs an `@import` tag in the JSDoc above its export, so
the component manifest shows the right import:

```tsx
/**
 * ComboBox — an editable, searchable dropdown...
 *
 * @import import { ComboBox } from "@latent/core/ComboBox";
 */
export const ComboBox = ...
```

## Story UI (AI story generator)

1. Put an Anthropic API key in `packages/storybook/.env` (gitignored):
   `ANTHROPIC_API_KEY=...`
2. `npm run storybook-with-ui`, then click **Story UI** in the toolbar or open
   `http://localhost:6006/?path=/workspace/`.

Story UI learns Latent from `story-ui-docs/` and `story-ui-considerations.md`.
Both are generated from the components' `.doc.mjs` files and the token JSON
by `node packages/cli/bin/latent.mjs story-ui-docs --write`. The pre-commit
hook reruns it when a component doc or token changes. Generated stories
(`src/stories/generated/`) and chat history are gitignored.

`npx story-ui check` always reports "@tpitre/story-ui is not installed": it
only looks in this folder's `node_modules`, and npm workspaces install it at
the repo root. Everything else it checks should pass.

## MCP endpoint for coding agents

While Storybook runs, `@storybook/addon-mcp` serves component docs, story
snippets, and preview links at `http://localhost:6006/mcp`. The repo's
`.mcp.json` registers it for Claude Code.

## Accessibility

`@storybook/addon-a11y` runs axe on every story. Results show in the
**Accessibility** panel, and Chromatic runs the same checks on each build.
`parameters.a11y.test` in `preview.tsx` decides whether violations fail;
it's `"todo"` (report, don't fail) because the one open finding is color
contrast on two tokens, a Figma palette decision — see `GUIDE.md` item 20.
Once that's resolved, switching it to `"error"` makes any new violation
fail the build.

## Chromatic

`.github/workflows/storybook.yml` publishes to Chromatic on every push to
`main` and every pull request, if the repo has a `CHROMATIC_PROJECT_TOKEN`
secret. Each story is snapshotted in light and dark mode. Review and accept
visual changes in Chromatic. To publish by hand:
`npm run chromatic -- --project-token <token>` from the repo root.

## Rebrands

Nothing here needs editing for a rebrand. Stories render the real
components, which read only `--lat-*` variables, and `theme.css`,
`fonts.css`, and the Story UI docs are regenerated from the synced token
JSON. See `HOW-TO.md`, step 4.
