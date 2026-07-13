# STYLES.md

Figma **Styles** (Text Styles, Effect Styles) used by the Latent DS file. This is
documentation only — unlike `packages/tokens/*.json`, nothing here is enforced
by `sync figma`. That CLI command only diffs Figma **Variables**; Text Styles
and Effect Styles are a different Figma primitive entirely (compound objects —
font+size+weight+line-height, or a stack of shadow layers — that don't fit the
scalar FLOAT/COLOR/STRING token schema `flattenTokens` expects), so they're
tracked here by hand instead.

**This file can drift from Figma.** Before relying on it, re-pull live:

```js
// in a use_figma / figma_execute call
const textStyles = await figma.getLocalTextStylesAsync();
const effectStyles = await figma.getLocalEffectStylesAsync();
```

## Before building anything in Figma: check this file first

Every text node and every shadow/effect in this file should use one of the
named styles below via `setTextStyleIdAsync` / `setEffectStyleIdAsync` —
**never** recreate the equivalent raw properties (`fontSize`, `fontWeight`,
manual `effects` array) by hand when a matching named style already exists.
That's exactly how the `font/style/eyebrow` gap happened: a style was built
correctly in Figma but the discipline of "check first, reuse before creating"
wasn't written down anywhere durable, so nothing forced a future session to
notice or record it.

**Workflow for any new Figma build in this file:**
1. Pull the current style lists (script above) before creating text or shadows.
2. If an existing style matches the role you need, apply it — don't hand-roll.
3. If nothing fits, decide: is this a one-off (documentation-page chrome, like
   a section label used once) or a reusable role? Reusable roles get a new
   named style — create it, bind its `fontSize`/`lineHeight`/`fontWeight`/
   `fontFamily` to the matching token per the pattern below, then re-run this
   file's audit (see "Keeping this file honest") and update the tables here
   in the same session.

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
| `Body/Large` | Geist | Regular | 18 (static) | 27px | `font/style/body-large`, `line-height/400/normal` |
| `Body/Default` | Geist | Regular | responsive but flat (16 at all breakpoints) | 150% | `font-size/body` (Breakpoint) |
| `Body/Small` | Geist | Regular | 14 (static) | 21px | `font/style/body-small`, `line-height/200/normal` |
| `Body/Large/SemiBold` | Geist | SemiBold | 18 | 27px | `font/style/body-large`, `font-family/sans`, `font-weight/600`, `line-height/400/normal` |
| `Body/Large/Bold` | Geist | Bold | 18 | 27px | `font/style/body-large`, `font-family/sans`, `font-weight/700`, `line-height/400/normal` |
| `Body/Default/SemiBold` | Geist | SemiBold | 16 | 24px | `font/style/body`, `font-family/sans`, `font-weight/600`, `line-height/300/normal` |
| `Body/Default/Bold` | Geist | Bold | 16 | 24px | `font/style/body`, `font-family/sans`, `font-weight/700`, `line-height/300/normal` |
| `Body/Small/SemiBold` | Geist | SemiBold | 14 | 21px | `font/style/body-small`, `font-family/sans`, `font-weight/600`, `line-height/200/normal` |
| `Body/Small/Bold` | Geist | Bold | 14 | 21px | `font/style/body-small`, `font-family/sans`, `font-weight/700`, `line-height/200/normal` |

`Special/Display`, `/H1`, `/H2`, `/H3`, `/Default` (Body) are **responsive** —
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

Whenever a Figma session in this file creates or renames a Text Style or
Effect Style, update the relevant table above **in that same session** —
don't defer it. If you're auditing for drift, re-run the pull script at the
top of this file and diff the names/values against these tables by hand
(there's no CLI command for this the way `sync figma` covers Variables).
