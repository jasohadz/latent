# Naming Conventions

How to name things in Figma so they translate predictably into code —
and vice versa. The rule underneath all of this: **a Figma property name
and its corresponding code prop name should be the same word, differing
only in casing.** An agent pulling a bound property from Figma should
never have to guess what the matching code prop is called.

## Figma layers (inside a component)

- Name every layer by **what it is**, not what it looks like —
  `Container`, `Label`, `Icon`, `Helper Text`. Never `Rectangle 1`,
  `Group 4`, or anything Figma auto-generated.
- Use **Title Case with spaces** — `Helper Text`, not `helperText` or
  `helper-text`. This is Figma-native and reads clearly in the layers
  panel.
- If a layer needs to be found programmatically (a slot, a swappable
  icon), name it exactly what the code will call it once it's converted
  to kebab or camelCase — e.g. a layer named `Icon` becomes a prop
  called `icon`, not `Icon` becoming some unrelated `leadingGraphic`.

## Figma component properties

**Variant properties** (multiple-choice, like weight or size):
lowercase property name, lowercase values. This is already established
by Icon's `weight` property (`light` / `regular` / `bold`) — keep
following that exact pattern for every new variant property.

**Boolean properties** (on/off toggles):
Name them as the state itself, not a question — `Disabled`, `Loading`.
Not `Is Disabled?`, not `Show Loading`.

**Instance-swap properties** (a swappable icon slot, etc.):
Name the slot, not the action — `Icon`, not `Swap Icon` or
`Icon Selector`.

**Text properties** (editable label content):
Name it after the content itself — `Label`, `Value`, `Placeholder`.

## Code props

Same word as the Figma property, camelCase, lowercase first letter:

| Figma property | Code prop |
|---|---|
| `weight` | `weight` |
| `Disabled` | `disabled` |
| `Loading` | `isLoading` (boolean props that read as a question in code — "is it loading?" — get an `is` prefix; this is a code-side convention only, doesn't change the Figma name) |
| `Icon` | `icon` |
| `Label` | `label` |

## Why this matters here specifically

Every component's `.doc.mjs` file has a `figmaTokens` mapping that ties
a code property to a Figma-side name. If the names don't correspond
predictably, that mapping has to be manually reconciled by a human every
time — which is exactly the kind of silent, error-prone step this whole
project exists to remove. Consistent naming is what lets an agent pull a
Figma spec and generate a correct prop interface without guessing.

## Checklist before calling a component's naming "done"

- [ ] Every layer named for what it is, Title Case with spaces
- [ ] Every variant property name lowercase, values lowercase
- [ ] Every boolean property named as the state, not a question
- [ ] Every property name has an obvious, predictable code-prop
      equivalent (same word, different casing)
- [ ] No Figma-default names left un-renamed (`Frame 12`, `Group 3`, etc.)
