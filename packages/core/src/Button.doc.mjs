export default {
  name: "Button",
  summary: "Primitive action trigger. Three variants, three sizes, optional loading state, optional icon-only square mode.",
  props: [
    { name: "variant", type: '"primary" | "secondary" | "ghost"', default: "primary", description: "Visual weight. Use primary for the single main action per view; secondary for everything else. ghost is borderless/transparent — verified in Figma only for iconOnly buttons (e.g. a toolbar trigger); using it with visible text is unverified and warns in dev." },
    { name: "size", type: '"sm" | "md" | "lg"', default: "md", description: "Padding and font-size scale. When iconOnly is true, this instead selects Figma's icon-only spacing tier: sm=spacing-6, md=spacing-8, lg=spacing-12 (radius stays radius.slimlg across all three)." },
    { name: "isLoading", type: "boolean", default: "false", description: "Disables the button, sets aria-busy, and swaps content for a 3-dot bounce spinner (matches the Figma LoadingSpinner prototype). Children remain in the DOM for the accessible name, just visually hidden — unless iconOnly is also true, in which case there are no children to hide and the aria-label alone carries the accessible name." },
    { name: "disabled", type: "boolean", default: "false", description: "Standard HTML disabled." },
    { name: "icon", type: "React.ReactNode", default: "undefined", description: "Trailing icon when iconOnly is false (e.g. <Icon name=\"chevron-right\" size=\"xs\" />, rendered after children, aria-hidden). The button's only content when iconOnly is true — size/weight are forced to Figma's xs/light regardless of what's passed to <Icon>." },
    { name: "iconOnly", type: "boolean", default: "false", description: "Renders a square icon-only trigger (Figma's Button \"icon only\" variant). Pass the icon via icon, omit children, and always pass aria-label — with iconOnly there's no visible text to derive an accessible name from." },
  ],
  example: `<Button variant="primary" size="md" icon={<Icon name="chevron-right" size="xs" />} onClick={handleSave}>Save</Button>`,
  doNot: [
    "Don't use more than one primary-variant button per view — it defeats the hierarchy signal.",
    "Don't hardcode colors via className overrides; add or reuse a --lat-* custom property instead.",
    "Don't set iconOnly without an aria-label — the button would have no accessible name at all.",
    "Don't use the ghost variant with visible text (children) — Figma only defines it for iconOnly.",
  ],
  swizzlePath: "packages/core/src/Button.tsx",
  extends: "React.ButtonHTMLAttributes<HTMLButtonElement>",
  // Verified against the real .tsx/.css, not inferred from props alone.
  states: [
    { name: "primary default", description: "Primary variant, resting state.", tokens: ["background (primary default)"] },
    { name: "primary hover", description: "Primary variant, :not(:disabled):hover.", tokens: ["background (primary hover)"] },
    { name: "primary pressed", description: "Primary variant, :not(:disabled):active.", tokens: ["background (primary pressed)"] },
    { name: "secondary/ghost hover + active", description: "Both use color.action.secondary.hover/pressed in the real CSS, but neither is declared in figmaTokens below — a real gap: check-parity can't verify these against a spec that doesn't name them (see CLAUDE.md's note that check-parity only checks declared tokens).", tokens: [] },
    { name: "disabled (any variant)", description: "Background/text/border all switch to their disabled tokens; ghost's disabled state instead stays fully transparent (background/border unset, not disabled-colored) per its own CSS rule.", tokens: ["background (disabled)", "text (disabled)", "border (disabled)"] },
    { name: "loading", description: "Disables the button and swaps content for a 3-dot bounce spinner. Text buttons keep children in the DOM, visually hidden, for the accessible name; iconOnly buttons have no children to hide.", tokens: ["spinner dot resting color", "spinner dot active color", "spinner dot size"] },
    { name: "focus-visible", description: "Visible outline ring, keyboard-triggered only (:focus-visible, not :focus).", tokens: ["border color (focus ring)", "border width (focus ring)", "focus ring offset"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Activates the button — native <button> element, not a custom key handler." },
    ],
    ariaAttributes: [
      { attribute: "aria-busy", description: "Set automatically while isLoading is true." },
      { attribute: "aria-label", description: "Required when iconOnly is true, since there's no visible text for the accessible name. Enforced only as a dev-mode console.warn in Button.tsx — not a hard runtime requirement, and not enforced at the TypeScript level either. A real gap: nothing actually prevents an iconOnly button shipping without one in production." },
    ],
    focusBehaviors: [
      "Real, visible :focus-visible outline bound to color.border.focus/sizing.border.thin/sizing.focus-ring-offset — confirmed in Button.css. Unlike Switch, which has no focus-ring style at all.",
    ],
  },
  // Token paths this component is expected to consume, keyed by the CSS
  // property they should end up styling. check-parity greps the compiled
  // CSS for the corresponding --lat-* variable to confirm no drift.
  figmaTokens: {
    "border-radius": "radius.input",
    "padding (md, all sides)": "spacing.8",
    "font-size (md)": "typography.button.font-size.md",
    "line-height (md)": "typography.button.line-height.md",
    "background (primary default)": "color.action.primary.default",
    "background (primary hover)": "color.action.primary.hover",
    "background (primary pressed)": "color.action.primary.pressed",
    "background (disabled)": "color.action.secondary.disabled",
    "text (disabled)": "color.text.disabled",
    "border (primary)": "color.border.brand",
    "border (disabled)": "color.border.strong",
    "border color (focus ring)": "color.border.focus",
    "border width (focus ring)": "sizing-border.thin",
    // Not in primitives/semantic/density.json — Figma's Plugin API has no
    // x/y-position variable binding, so this can't be pulled from a Figma
    // variable. Value is measured off the Button focus-ring layer (46:41)
    // directly; see theme.css for the fixed 3px and the reasoning.
    "focus ring offset": "sizing.focus-ring-offset",
    "gap (icon)": "spacing.4",
    "spinner dot resting color": "color.icon.subtle",
    "spinner dot active color": "color.icon.inverse",
    "spinner dot size": "spacing.4",
    // Icon-only variant (verified 2026-07-29, re-verified 2026-07-30 after
    // the size-tier padding changed and a "ghost" appearance was added, both
    // in Figma directly — against Button's component set, node 43:21945,
    // appearance x state x size x "icon only" axis, 90 variants total).
    "icon-only border-radius": "radius.slimlg",
    // Constant across all three "size" values and density-mode-independent
    // (Default and Condensed both alias the same primitive, border.radius.150
    // = 6px). Originally ported under a placeholder "6" name (that numeric
    // entry existed, unused, from a prior session) to avoid adding a
    // duplicate token; renamed to match Figma's real "slimlg" name once the
    // Latent Sync plugin's first live pull surfaced it as drift (2026-08-20).
    "icon-only padding (sm/small)": "spacing.6",
    "icon-only padding (md/default)": "spacing.8",
    "icon-only padding (lg/xl)": "spacing.12",
    // Figma's "small" tier is actually 24x28 (non-square, inner icon wrapper
    // 12x16) rather than a clean scaled-down square — not reproduced; code's
    // sm icon-only stays square (24x24) absent an explicit reason to match
    // that asymmetry.
    "icon-only padding (inner, around icon)": "spacing.4",
    "icon-only icon size": "sizing.icon.xs",
    "icon-only icon weight": "stroke-width.light",
    // All Button icons (icon-only or trailing, every appearance and state,
    // including disabled) were rebound in Figma 2026-07-30 to a single
    // uniform color/icon/icon/button, per explicit instruction — superseding
    // the earlier per-appearance icon.inverse/icon.default workarounds this
    // repo used to carry for the invisible-icon-bug on outline/ghost's
    // transparent background. That bug is real and still present (this token
    // is the same near-white value in both light and dark mode, aliasing
    // primitive slate/50) — it is simply no longer worked around, by choice.
    "icon color (all variants/states)": "color.icon.icon.button",
  },
};
