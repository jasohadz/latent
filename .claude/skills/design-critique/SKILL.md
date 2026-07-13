---
name: design-critique
description: Use this whenever the user shares a UI, component, page, mockup, screenshot, or design-system artifact and wants feedback, a review, or a critique — trigger on "what do you think of this", "critique this", "review this design", "does this look right", or when a component/template is finished and about to be presented. Also trigger proactively after building or scaffolding a visual component, before calling it done. Covers visual hierarchy, spacing/rhythm, accessibility, consistency with an existing design system or token set, and interaction/UX quality — not just aesthetics.
---

# Design Critique

Structured feedback for UI and design-system artifacts. Goal is a critique that's specific enough to act on, not a vibe check.

## Pass order

1. **Consistency with the system first.** If this lives inside a design system (tokens, theme, existing components), check it against that before judging it in isolation: does it use existing tokens/custom properties, or hardcode values that will drift from the theme? Does it reuse existing primitives, or duplicate something that already exists?
2. **Hierarchy and structure.** Is there one clear primary action/focal point per view? Does spacing communicate grouping (related things closer together, unrelated things farther apart) rather than uniform padding everywhere?
3. **Accessibility, concretely.** Contrast ratios on text and interactive states (not just resting state — check hover/focus/disabled), focus order, tap target size, whether color alone conveys meaning (status, errors).
4. **Interaction and edge states.** Empty state, loading state, error state, long-content overflow — a component isn't reviewed until these are considered, not just the happy path.
5. **Restraint.** Flag anything decorative that doesn't serve hierarchy or feedback — an extra shadow, gradient, or animation added without a functional reason is a cost, not a bonus.

## Delivering the critique

- Lead with the 2-3 things that matter most, not an exhaustive list — a wall of nitpicks buries the real issues.
- Be specific: name the element and the concrete change ("the CTA and secondary link have equal visual weight — drop the secondary to a text button") rather than general impressions ("hierarchy feels off").
- Distinguish must-fix (accessibility failures, broken states, inconsistency with the token system) from stylistic suggestions the user can take or leave.
- If something is genuinely well done, say so specifically — don't manufacture criticism to seem thorough, and don't pad praise either.

## Related skills

If the critique surfaces a token/theme inconsistency in a system built on the Astryx pattern, hand off to the `design-system-builder` skill for how to fix it correctly (don't hardcode a one-off override).
