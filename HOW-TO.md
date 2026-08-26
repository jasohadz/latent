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
2. Reconcile whatever drift it reports into the actual token files —
   investigate which side is actually wrong before just copying Figma's
   value over (see `CLAUDE.md`). Once you've decided Figma's side is
   right, `node packages/cli/bin/latent.mjs apply-drift --write` writes
   the reconciliation for you instead of hand-typing it — dry-run without
   `--write`, and it never deletes a code-only token/style on its own
   (that direction of drift still needs a manual decision either way).
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

For a faster, conversational alternative to reading `.doc.mjs` files
directly — "what variants does Button have," "why is check-parity failing
on this component" — see step 6 below.

**Before generating a composition of multiple components** — a page
section, a template, anything assembling several real components
together — validate the plan before writing JSX, not after:

```
node packages/cli/bin/latent.mjs compose-check <file.json> --json
```

It checks a `{ component, props, children }` tree against the real
component catalog (built fresh from every `.doc.mjs` on every call, never
a second hand-maintained catalog) — an invented component name, a made-up
prop, or an out-of-range enum value fails validation instead of silently
shipping. See `CLAUDE.md`'s architecture section and `CATALOG-VALIDATION.md`
for the full design. Deterministic, no model involved — a different tool
from `ask`, checking a different thing (real component/prop existence, not
grounded natural-language answers).

**What this does not catch:** whether the generated composition actually
*renders* correctly — a real webfont loading, a layout looking right on
screen. Passing `compose-check` (and `tsc`, if you're checking types too)
proves every reference is real; it proves nothing about what a browser
actually shows. See `CLAUDE.md`'s "Building and previewing UI work"
section before treating either as sufficient on its own — confirmed the
hard way, not hypothetically.

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

## 6. Set up the local Q&A assistant (optional)

Latent ships a local, offline "ask it a question" layer over every component's contract and this repo's own docs — no API key, no account, nothing sent over the network once it's set up. It runs entirely on your machine via `node-llama-cpp` (an npm dependency, not a separate app to install) and a committed `vectra` search index.

1. `npm install` — already done in step 1, this is what pulled in the two packages above.
2. `node packages/cli/bin/latent.mjs index --json` — the *first* time you run this, it downloads two small AI models to your machine (a few GB total, one-time, automatic — see `GUIDE.md`'s "Ask Latent" section for exactly what happens). Every run after this is instant.
3. `node packages/cli/bin/latent.mjs ask "what variants does Button have"` — answers, streaming live to your terminal, sourced only from this repo's real `.doc.mjs` files and docs.

From there: `--check <Component>` explains a failing `check-parity` result against that component's real declared contract instead of you reading raw JSON; `--monitor` opens a live visual page in your browser instead of a terminal; `--cite` forces the model to back every claim with a verifiable quote instead of trusting free prose. Full depth on all of this — including two rounds of real bugs found by actually running it, not just reading the code — lives in `CLAUDE.md`'s "Key mechanics" and `GUIDE.md`'s "Ask Latent" section.

If you're setting this up for someone who isn't comfortable in a terminal at all, skip ahead to **"Using the Q&A assistant if you've never used a terminal"** at the very bottom of this doc — it starts from "what is a terminal."

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

## Using the Q&A assistant if you've never used a terminal

Everything above assumes you're comfortable with git, npm, and a command
line. If you're not — a designer or PM who just wants to ask Latent
questions like "what variants does Button have," without touching any of
the workflow above — this section starts from zero. Nothing here can break
anything: you're only ever asking questions, never changing files.

**What you're setting up:** a small program that runs on your own computer
and can answer questions about Latent's components by actually reading
their real definitions — not a chatbot that might make things up, and not
a website. It costs nothing, needs no account or sign-up, and once it's
set up, it works without an internet connection. Nothing you type is sent
anywhere.

### Step 1: Open a terminal

A terminal is just a window where you type commands instead of clicking
things — it's already installed on your computer, you're just opening it
for the first time.

- **Windows:** click the Start menu, type `PowerShell`, and open
  "Windows PowerShell."
- **Mac:** press `Cmd + Space`, type `Terminal`, and press Enter.

A plain, mostly-empty window will open with some text and a blinking
cursor. That's it — that's the terminal.

### Step 2: Go to the Latent folder

Type `cd ` (with a space after it — don't press Enter yet), then drag the
Latent folder from your file explorer/Finder straight into the terminal
window. The folder's path will appear automatically after `cd `. Now press
Enter. If it worked, nothing dramatic happens — the terminal just goes to
a new line, ready for the next command. That's normal; commands in a
terminal usually don't celebrate success, only report problems.

### Step 3: One-time setup

Copy this line exactly, paste it into the terminal (right-click to paste,
or `Ctrl+V` / `Cmd+V`), and press Enter:

```
npm install
```

You'll see a bunch of text scroll by — that's normal, it's downloading the
free, open-source pieces this needs. It can take a minute or two. When it
stops and you see your cursor again, it's done. Don't worry about reading
any of the text that scrolled by.

### Step 4: Build the search index (also one-time)

Paste this and press Enter:

```
node packages/cli/bin/latent.mjs index --json
```

**The first time only**, this also downloads two small AI models to your
computer — a few gigabytes, so it can take a few minutes depending on your
internet speed. This is the only step that needs an internet connection at
all, and only this one time. You'll see more scrolling text, possibly
including lines that look alarming (mentioning "error," "GPU," or
"tokenizer") — as long as the command finishes and returns you to a normal
prompt, those are known, harmless warnings, not something gone wrong.
Every run after this one is instant, since nothing needs downloading again.

### Step 5: Ask a question

Paste this, but change the question inside the quotes to whatever you
actually want to ask:

```
node packages/cli/bin/latent.mjs ask "what variants does Button have"
```

Press Enter and wait a few seconds — you'll see the answer appear word by
word, like it's typing itself out. That's it. Ask anything about any
component or how Latent's workflow works; run the same command again with
a different question any time.

### Step 6 (optional): Watch it work in a browser instead

If you'd rather see something more visual than a terminal — a real page
that shows what's being looked up before the answer appears — add
`--monitor` to the end of the command:

```
node packages/cli/bin/latent.mjs ask "what variants does Button have" --monitor
```

The terminal will print a line like `Monitor running at
http://localhost:4791` and then pause. **Wait until you see that exact
line before opening anything** — the most common mix-up here is opening
the browser link too early or after the terminal command has already
finished, which shows "This site can't be reached" simply because nothing
is running yet to answer it. Once you see that line, open
`http://localhost:4791` in Chrome (or paste it into any browser's address
bar) and it'll pick up right where it paused.

### If something goes wrong

- **"This site can't be reached"** on the monitor page almost always means
  the terminal command isn't currently running and paused — re-run step 6
  and wait for the exact `Monitor running at...` line before opening the
  browser.
- **Scary-looking red or yellow text** mentioning GPU/Vulkan or a
  tokenizer warning is expected and doesn't mean it failed — it only
  failed if the command never finishes or the terminal shows the word
  `Error` followed by the whole thing stopping.
- **Still stuck?** Copy the last 10-15 lines of text from the terminal and
  send them to whoever set this repo up, or ask Claude Code (or any AI
  coding assistant) pointed at this repo to read `CLAUDE.md` and help —
  that file has the full technical explanation of how this all works.
