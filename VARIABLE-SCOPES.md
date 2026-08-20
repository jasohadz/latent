# Figma Variable Scopes

Design spec applied via `figma_import_tokens` to restrict which node
properties each Figma variable can be bound to. Before this, every
variable in the "Latent DS" file had `scopes: ["ALL_SCOPES"]` (no
restriction) — e.g. a color meant for a stroke would still show up when
picking a fill.

This is Figma-side metadata, not part of this repo's token schema
(`packages/tokens/*.json` store values/aliases only), so applying it
doesn't change any files here. This doc is the record of what was applied
and why, in case the mapping needs to be re-applied or extended later.

## Mapping applied

**Primitives** (`packages/tokens/primitives.json` collection) — kept broad,
since these are reused across many semantic aliases:

| Category | Scopes |
|---|---|
| `color/*` (all ramps) | `ALL_FILLS`, `STROKE_COLOR`, `EFFECT_COLOR` |
| `border/radius/*` | `CORNER_RADIUS` |
| `border/width/*` | `STROKE_FLOAT` |
| `dimensions/*` | `WIDTH_HEIGHT`, `GAP` |
| `opacity/*` | `OPACITY` |
| `blur/*` | `EFFECT_FLOAT` |
| `typography/font-size/*` | `FONT_SIZE` |
| `typography/line-height/*` | `LINE_HEIGHT` |
| `typography/font-weight/*` | `FONT_WEIGHT` |
| `typography/font-family/*` | `FONT_FAMILY` |
| `typography/list-spacing/*` | `LETTER_SPACING` |
| `grid/*` | left `ALL_SCOPES` — no dedicated layout-grid scope exists |

**Semantic** (`packages/tokens/semantic.json`, Figma's "Semantic" collection
— briefly misnamed "Style Tokens" in the Figma file itself, renamed back
2026-08-20) — narrower, since these are what designers pick from directly:

| Category | Scopes |
|---|---|
| `color/text/*` | `TEXT_FILL` |
| `color/background/*`, `color/surface/*`, `color/action/*` | `FRAME_FILL`, `SHAPE_FILL` |
| `color/border/*`, `color/divider/*` | `STROKE_COLOR` |
| `color/icon/*` | `SHAPE_FILL` |
| `color/feedback/*` | `ALL_FILLS` |
| `radius/*` | `CORNER_RADIUS` |
| `spacing/*` | `GAP`, `WIDTH_HEIGHT` |
| `sizing/action/*`, `sizing/icon/*`, `sizing/avatar/*`, `sizing/container/*` | `WIDTH_HEIGHT` |
| `sizing-border/*` | `STROKE_FLOAT` |
| `color/selection/*`, `color/scrim/*`, `font/*` (size/weight/family/line-height/list-spacing/style aliases), `blur/*` | left `ALL_SCOPES` — not covered by this pass |

**Density and Breakpoint** collections — left `ALL_SCOPES` entirely; these
modify already-bound values rather than being picked directly from a
property dropdown.

## Coverage

480 of 628 variables were scoped (80 intentionally left `ALL_SCOPES` per
the table above — 13 `grid/*`, 2 primitive `blur/*`, 3 `color/selection/*`
+ `color/scrim/*`, 62 semantic `font/*` — plus 62 Density + 6 Breakpoint
variables untouched by design).

## How it was applied

Via `figma_import_tokens` with a DTCG payload where each token's
`$extensions["figma-console-mcp"].scopes` carries the target array and
`$extensions["figma-console-mcp"].variableId` (preserved from a prior
`figma_export_tokens` pull) matches it to the existing Figma variable —
so the import only touches the `scopes` field, not values. Applied with
`strategy: "merge"` after a 100%-coverage dry run confirmed every change
was scope-only (`changes: {values: false, scopes: true}`) with zero
renames and zero unexpected deletes.

One implementation note for future runs: the DTCG payload's group-level
`$extensions["figma-console-mcp"].originalName` (e.g. `"Primitives"`,
`"Semantic"`) must be preserved on every request — without it the
import tool can't map the payload's lowercase set name (`primitives`,
`semantic`) back to Figma's real collection name and misclassifies
every token as a rename into a new collection instead of an update. (At
the time this was originally run, the Semantic collection was named
"Style Tokens" in Figma — use whatever the collection is actually named
now, per `figma_get_variables`, not this doc's original wording.)
