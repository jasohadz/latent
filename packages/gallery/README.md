# Latent Component Gallery

A local, live-rendered page showing every component in `packages/core/src` —
built to actually prove the plumbing works (fonts, theme, layout, keyboard
interactions) instead of only checking `compose-check`/`tsc`, neither of
which executes in a browser. See `CLAUDE.md`'s "Building and previewing UI
work" section for why this matters.

Local-only right now — not published, not deployed anywhere.

## Run it

```
cd packages/gallery
node ../../node_modules/.bin/vite
```

(No `npm install` needed here — react/react-dom/vite/@vitejs/plugin-react
are all already available at the repo root; this package deliberately
carries no dependencies of its own to avoid a second copy drifting out of
sync with what `packages/core`/`packages/chat-app` use.)

Opens at `http://localhost:5173` by default (or whatever port Vite picks if
that one's busy).

## What it's for

- **Visual verification** — the one thing structural checks (`compose-check`,
  `tsc`, a bundler transform) can't do. Confirmed real bugs this way that no
  other check in this repo would have caught: an `overflow: auto` on the
  gallery's own card layout was clipping `TopNav`'s absolutely-positioned
  dropdown panel.
- **Interactive/keyboard testing** — every component renders with real,
  wired-up state (not static mockups), so arrow-key navigation, Escape-to-
  close, focus rings, etc. can actually be exercised, not just read as code.
  Confirmed working this way: `Toggle`'s roving-tabindex arrow keys,
  `NavDropdown`'s arrow-key sub-item navigation, `TopNav`'s Escape-to-close.
- **Drift detection** — since every instance here imports the real component
  from `packages/core/src` (not a copy), any visual drift shows up here
  immediately after a token or component change, the same session it happens
  in.

## What it doesn't replace

`check-parity`, `check-docs`, `verify` — those are still the mechanical,
CI-gateable checks. This is the visual complement to them, not a substitute.
