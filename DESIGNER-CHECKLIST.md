# Building a Component for Latent — Designer Checklist

A simple guide for getting your Figma design ready to hand off to an AI
agent — any AI coding agent, not just one specific tool. Follow these
steps in order and you won't need to go back and fix anything later.
The last few steps also cover what happens after a component exists:
how you actually use a library of finished components to have an agent
build whole pages, not just one piece at a time.

---

## ✅ Step 1: Use colors, sizes, and spacing from the library — never type your own

When you're setting a color, a corner radius, a spacing value, or anything
else, always pick it from the variables panel instead of typing in a
number or picking a color from the color wheel.

**Why:** If you type in your own value instead of picking from the
library, there's no way for anyone (or any tool) to know that value is
supposed to match something else in the system. It just becomes a
one-off that quietly drifts out of sync over time.

**How to check yourself:** Before moving on, click through every color
fill, border, spacing, and corner radius on your component. Each one
should show a small icon or highlight meaning "this is bound to a
variable." If it just shows a plain color swatch with no binding, fix it.

---

## ✅ Step 2: Always pick the "meaning" version, not the "raw" version

When you open the variable picker, you'll often see two similar-looking
options, like:
- `blue/600` (a raw color)
- `action/primary/default` (what that color is used *for*)

**Always pick the second kind** — the one named after what it's used for,
not the one named after the raw color itself.

**Why:** If the brand's blue ever changes, everything bound to the
"meaning" version updates automatically. Anything bound to the raw color
directly does not, and someone has to go fix it by hand later.

---

## ✅ Step 3: Check if a text style or shadow already exists before making a new one

Before creating a new text style (font size + weight + line height) or a
new shadow/effect, check the existing style list first. There's a good
chance something like "Body," "Heading," or "Elevation" already fits
what you need.

**How to check:** Open the Text Styles or Effect Styles panel in Figma
and scroll through what's already there before making something new.

**If nothing fits:** That's okay — just make a note of it (in a comment
on the file, or when you hand off the file) instead of quietly creating
a new style no one else knows about.

---

## ✅ Step 4: Design every state, not just the "normal" look

A component isn't done until you've designed how it looks in each of
these situations, where they apply:

- [ ] **Default** — the normal, resting look
- [ ] **Hover** — when a mouse is over it
- [ ] **Focused** — when it's selected/active (like clicking into a text field)
- [ ] **Disabled** — when it can't be interacted with
- [ ] **Error** — when something's wrong (mainly for form fields)

It's easy to design the default look and stop there. The other states
are just as important — they're the ones people forget, and they're
also the ones most likely to cause confusion later.

---

## ✅ Step 5: Name it clearly and simply

Name your component something short, clear, and consistent with what's
already in the file — for example `Input`, `Select`, `Checkbox`.

**Avoid:**
- Version numbers in the name (`Input v2`)
- Extra notes in the name (`Input (new)`, `Input - draft`)
- Lowercase or inconsistent casing (`input`, `INPUT`)

---

## ✅ Step 6: Put it in the right place in the file

Keep your new component on the same canvas/page where the other
components already live (not a random new page, not your personal scratch
area). This makes it easy to find later — for you and for anyone else.

---

## ✅ Step 7: Give it one last look before handing it off

Before you say it's ready, take a minute to look it over with fresh eyes:

- Is there one clear "main" thing to look at, or does everything compete
  for attention equally?
- Does the spacing group related things together and separate unrelated
  things? (Not just even spacing everywhere.)
- Can you read the text easily on every state, especially error and
  disabled?
- Is there anything decorative that isn't really doing anything (an extra
  shadow, an unnecessary color) that you could remove?

---

## ✅ Step 8: Hand it to your AI coding agent

This works with any AI coding agent connected to your Figma file and
your codebase — Claude Code, Cursor, or whatever you're using. Open it
and paste this in, swapping in the actual component name:

```
Add an [Input] component following Button's three-file pattern. Pull its
bound variables via figma_get_component_for_development, use that for
the figmaTokens mapping. Check STYLES.md for any text/effect styles it
uses. Register it in the CLI, then run docs, check-parity, and sync
figma until clean before committing.
```

You don't need to understand everything in that sentence — it's telling
the agent exactly what checks to run before it's allowed to call the
work finished. That's on purpose.

---

## ✅ Step 9: Ask it to critique its own work before moving on

Every component in this system comes with a built-in checklist the
agent can run against itself — covering things like consistent hierarchy,
proper contrast on every state, and whether it reused existing patterns
instead of inventing new ones. Ask for it directly:

```
Before you commit, run a design critique on the component you just
built and tell me what it finds.
```

If it flags something, have it fix that before moving on to the next
step. This is the same kind of check a design lead would do in a
review — just happening automatically, every time, instead of only
when someone remembers to ask.

---

## ✅ Step 10: Make sure it actually gets pushed to GitHub

Most AI coding agents can commit and push on their own, but it's worth
asking directly rather than assuming it happened. Once it says it's
done, ask:

```
Did you push this to GitHub? Confirm the commit is live on the main
branch.
```

If it hasn't pushed yet, ask it to do so before you move on.

---

## ⬜ Step 11 (optional): Get it double-checked by a second AI

This one's optional — worth doing on bigger or riskier components, or
whenever something felt uncertain during the build. Bring this same
conversation (or a new one) to Claude and ask it to verify the work —
Claude will pull the actual repo from GitHub and check it directly,
rather than just trusting what your other agent reported:

```
[Your other agent] just finished [Input]. Can you check GitHub and make
sure everything's good?
```

This catches anything the building agent might have missed or gotten
slightly wrong — a second, independent look. Skip it for small or
low-risk components if you're confident everything checked out in
Steps 9-10.

---

## ✅ Step 12: Repeat for each new component

Every new component follows Steps 1-11 the same way. It gets faster
each time — the first one is where you're proving the process works,
after that it's mostly repetition.

---

## ✅ Step 13: Once you have a few components, build actual pages

This is where it starts paying off. Once you've got a handful of
components done (a button, an input, maybe a card), you can ask your
agent to assemble them into a real page or screen instead of building
each thing one at a time.

Ask your agent something like:

```
Show me what components currently exist. Then build me a [sign-up form
/ settings page / dashboard] using only those existing components — 
don't invent new styling, and flag anything you can't build with what's
already available.
```

That first sentence matters — it tells the agent to check what's
actually available before building anything, instead of guessing or
inventing something new. The "flag anything you can't build" part
matters too — if it hits something the library doesn't have yet, that's
useful information: it tells you exactly what component to design next.

---

## ✅ Step 14: Treat missing pieces as your next design task, not a workaround

If your agent says "I don't have a component for X, so I made something
close," don't just accept that — that's a sign a real component is
missing from the system. Take it back to Step 1 and design it properly,
rather than letting a one-off, ungoverned piece sneak into a page. This
is how the library grows — one real gap at a time, not by accumulating
exceptions.
