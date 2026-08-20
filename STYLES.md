# STYLES.md

Figma **Styles** (Text Styles, Effect Styles) used by the Latent DS file.

**`packages/tokens/styles.json` is the source of truth** — this file is a
human-readable summary of it. Unlike the scalar Variable token files
(`primitives.json`, `semantic.json`, ...), which `sync figma` verifies,
Text/Effect Styles are a *different* Figma primitive — compound objects
(font+size+weight+line-height, or a stack of shadow layers) that don't fit
`flattenTokens`' scalar-leaf model — so they get their own file and their own
CLI command:

```
node packages/cli/bin/latent.mjs check-styles --file <export>.json --json
```

(Or run `node packages/cli/bin/latent.mjs verify --json` instead, which runs
this alongside `sync figma`/`check-parity`/`check-docs` in one call against
the current `*.live.json` files — no `--file` needed. See `CLAUDE.md`.)

This diffs `packages/tokens/styles.json` against a fresh Figma pull, the same
three-category report as `sync figma` (`missingInCode`, `missingInFigma`,
`valueMismatches`), non-zero exit on drift. A pre-commit hook (`.githooks/`,
auto-installed via `npm install`) already runs this automatically whenever a
commit touches `packages/tokens/` or this file, blocking the commit on drift
— but it can only check the repo against itself, not against live Figma, so
still **run it after any session that touches Text or Effect Styles** — same
discipline as `sync figma` for Variables.

**To regenerate the export file**, run the **Latent Sync** Figma plugin
(`packages/figma-plugin/` — see its README) — its "Extract from Figma" step
pulls `getLocalTextStylesAsync()`/`getLocalEffectStylesAsync()` and resolves
each style's `boundVariables` to names automatically, then its "Sync to
GitHub branch" step pushes `packages/tokens/styles-export.live.json` for you.
Without the plugin, the same resolution done by hand (raw variable IDs
aren't stable/comparable across sessions):

```js
// in a use_figma / figma_execute call — see packages/figma-plugin/code.js's
// resolveBoundVars for the version the plugin actually runs
async function resolveBoundVars(boundVariables) {
  if (!boundVariables) return {};
  const out = {};
  for (const [field, alias] of Object.entries(boundVariables)) {
    if (!alias?.id) continue;
    const v = await figma.variables.getVariableByIdAsync(alias.id);
    out[field] = v ? v.name : null;
  }
  return out;
}
// walk getLocalTextStylesAsync() / getLocalEffectStylesAsync(), resolving
// each style's boundVariables the same way — see packages/tokens/styles.json
// for the exact shape to match, then write the result to a file and run
// check-styles against it.
```

## Before building anything in Figma: check first, flag gaps, don't invent

Every text node and every shadow/effect should use one of the named styles
below via `setTextStyleIdAsync` / `setEffectStyleIdAsync` — **never** recreate
the equivalent raw properties (`fontSize`, `fontWeight`, a manual `effects`
array) by hand when a matching named style already exists. That's exactly how
the `font/style/eyebrow` gap happened: a style was built correctly in Figma
but nothing durable required checking first or recording it, so it went
unnoticed until an explicit audit caught it.

**Workflow for any new Figma build in this file:**
1. Pull the current style lists (script above, or `figma_get_text_styles`)
   before creating any text or shadow.
2. If an existing style matches the role you need, apply it — don't hand-roll.
3. **If nothing fits, stop and flag it to the user instead of creating a new
   style unilaterally.** Describe the role/values you need; let them decide
   whether it becomes a new named style, an adjacent existing one, or stays a
   one-off (page chrome used once doesn't need a style at all).
4. If a style is created — by you after confirmation, or by the user directly
   in Figma — update **both** `packages/tokens/styles.json` and this file's
   tables in the same session, then run `check-styles` to confirm zero drift
   before ending the turn.

## Text Styles

All bind `fontSize` to a `font/style/*` (or `font-size/*` Breakpoint) semantic
variable — never a raw primitive. Most also bind `fontFamily`/`fontWeight`/
`lineHeight`; where a cell says "literal," see the style's own `description`
field in Figma for why (usually a Figma variable-binding limitation, not an
oversight — e.g. letter-spacing tokens are unitless floats that Figma applies
as raw px, not %, so `Special/Eyebrow`'s 4% tracking is a literal match to
`list-spacing/wider` rather than a binding).

| Style | Family | Weight | Size | Line-height | Bound to |
|---|---|---|---|---|---|
| `Special/Display` | Geist | Bold | responsive (36 shown = Mobile default) | 120% | `font-size/display` (Breakpoint) |
| `Special/Caption` | Geist | Medium | responsive (12 shown = Mobile default) | 150% | `font-size/caption` (Breakpoint) |
| `Special/Eyebrow` | Geist Mono | Medium | 12 | 18px | `font/style/eyebrow`, `font-family/mono`, `font-weight/500`, `line-height/100/normal`; letter-spacing 4% literal |
| `Heading/H1` | Geist | Bold | responsive (28 shown = Mobile default) | 120% | `font-size/h1` (Breakpoint) |
| `Heading/H2` | Geist | SemiBold | responsive (24 shown = Mobile default) | 120% | `font-size/h2` (Breakpoint) |
| `Heading/H3` | Geist | SemiBold | responsive (20 shown = Mobile default) | 120% | `font-size/h3` (Breakpoint) |
| `Heading/H4` | Geist | SemiBold | 24 (static — no breakpoint entry) | 36px | `font/style/h4`, `line-height/600/normal` |
| `Body/Large/Large` | Geist | Regular | 18 (static) | 27px | `font/style/body-large`, `line-height/400/normal` |
| `Body/Default/Default` | Geist | Regular | responsive but flat (16 at all breakpoints) | 150% | `font-size/body` (Breakpoint) |
| `Body/Small/Small` | Geist | Regular | 14 (static) | 21px | `font/style/body-small`, `line-height/200/normal` |
| `Body/Large/SemiBold` | Geist | SemiBold | 18 | 27px | `font/style/body-large`, `font-family/sans`, `font-weight/600`, `line-height/400/normal` |
| `Body/Large/Bold` | Geist | Bold | 18 | 27px | `font/style/body-large`, `font-family/sans`, `font-weight/700`, `line-height/400/normal` |
| `Body/Default/SemiBold` | Geist | SemiBold | 16 | 24px | `font/style/body`, `font-family/sans`, `font-weight/600`, `line-height/300/normal` |
| `Body/Default/Bold` | Geist | Bold | 16 | 24px | `font/style/body`, `font-family/sans`, `font-weight/700`, `line-height/300/normal` |
| `Body/Small/SemiBold` | Geist | SemiBold | 14 | 21px | `font/style/body-small`, `font-family/sans`, `font-weight/600`, `line-height/200/normal` |
| `Body/Small/Bold` | Geist | Bold | 14 | 21px | `font/style/body-small`, `font-family/sans`, `font-weight/700`, `line-height/200/normal` |

`Special/Display`, `/H1`, `/H2`, `/H3`, `/Default/Default` (Body) are **responsive** —
their bound variable lives in the Breakpoint collection (Mobile/Tablet/Desktop
modes), so the same style resolves to a different size depending on the
Breakpoint mode set on the frame it's applied to. The "size shown" column is
whatever mode a fresh Figma session defaults to (Mobile); don't read it as the
style's only value.

**Weight variants exist only for Body** (Large/Default/Small × Regular/
SemiBold/Bold) — deliberately, not an oversight. Headings and Display don't
have weight variants; use a local per-character weight override (bound to
`font/weight/*`, already scoped to `FONT_WEIGHT` only) for one-off emphasis
instead of expecting a named style for every combination.

## Effect Styles

All 5 use Tailwind CSS's standard shadow scale (matches this file's color
primitives, which are also Tailwind's exact values). Theme-invariant — no
Light/Dark or Density variants exist or are planned; shadows read the same
regardless of theme/density in this system.

| Style | CSS-equivalent |
|---|---|
| `Elevation/sm` | `0 1px 2px rgba(0,0,0,.05)` |
| `Elevation/md` | `0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)` |
| `Elevation/lg` | `0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)` |
| `Elevation/xl` | `0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)` |
| `Elevation/2xl` | `0 25px 50px -12px rgba(0,0,0,.25)` |

None of the shadow parameters (offset/blur/spread/color) are bound to
Variables — a deliberate scope call, not a gap. Binding every parameter
across 5 steps × up to 2 layers would be ~15 bindings for a property most
design systems don't tokenize this granularly.

## Keeping this file honest

Whenever a Figma session creates or renames a Text Style or Effect Style,
update **both** `packages/tokens/styles.json` and the tables above in that
same session, then run `check-styles` against a fresh export to confirm zero
drift before ending the turn — don't defer it.
