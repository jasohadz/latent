export default {
  name: "Button",
  summary: "Primitive action trigger. Three variants, three sizes, optional loading state, optional icon-only square mode.",
  props: [
    { name: "variant", type: '"primary" | "secondary" | "ghost"', default: "primary", description: "Visual weight. Use primary for the single main action per view; secondary for everything else — fixed 2026-08-26: secondary (Figma's \"outline\" appearance) is a transparent, brand-bordered, link-colored button, not a neutral gray one; see states below. ghost is borderless/transparent — verified in Figma only for iconOnly buttons (e.g. a toolbar trigger); using it with visible text is unverified and warns in dev." },
    { name: "size", type: '"sm" | "md" | "lg"', default: "md", description: "Padding and font-size scale. When iconOnly is true, this instead selects Figma's icon-only spacing tier: sm=spacing-6, md=spacing-8, lg=spacing-12 (radius stays radius.slimlg across all three)." },
    { name: "isLoading", type: "boolean", default: "false", description: "Disables the button, sets aria-busy, and swaps content for a 3-dot bounce spinner (matches the Figma LoadingSpinner prototype). Children remain in the DOM for the accessible name, just visually hidden — unless iconOnly is also true, in which case there are no children to hide and the aria-label alone carries the accessible name." },
    { name: "disabled", type: "boolean", default: "false", description: "Standard HTML disabled." },
    { name: "icon", type: "React.ReactNode", default: "undefined", description: "Trailing icon when iconOnly is false (e.g. <Icon name=\"chevron-right\" size=\"xs\" />, rendered after children, aria-hidden). The button's only content when iconOnly is true — size/weight are forced to Figma's xs/light regardless of what's passed to <Icon>." },
    { name: "iconOnly", type: "boolean", default: "false", description: "Renders a square icon-only trigger (Figma's Button \"icon only\" variant). Pass the icon via icon, omit children. Fixed 2026-08-26: iconOnly is now a discriminated union with aria-label, not a plain boolean — pass true and TypeScript requires aria-label at the same call site, it's not just a documented convention." },
  ],
  example: `<Button variant="primary" size="md" icon={<Icon name="chevron-right" size="xs" />} onClick={handleSave}>Save</Button>`,
  doNot: [
    "Don't use more than one primary-variant button per view — it defeats the hierarchy signal.",
    "Don't hardcode colors via className overrides; add or reuse a --lat-* custom property instead.",
    "Don't set iconOnly without an aria-label — the button would have no accessible name at all.",
    "Don't use the ghost variant with visible text (children) — Figma only defines it for iconOnly.",
  ],
  swizzlePath: "packages/core/src/Button.tsx",
  // The literal exported ButtonProps is now a discriminated union
  // (see the iconOnly/aria-label fix above), not a single interface with
  // an extends clause — but every branch is built from an internal
  // ButtonBaseProps that does extend this, so the real HTML-attribute
  // passthrough contract described by this field is still accurate.
  extends: "React.ButtonHTMLAttributes<HTMLButtonElement>",
  // Verified against the real .tsx/.css, not inferred from props alone.
  states: [
    { name: "primary default", description: "Primary variant, resting state.", tokens: ["background (primary default)"] },
    { name: "primary hover", description: "Primary variant, :not(:disabled):hover.", tokens: ["background (primary hover)"] },
    { name: "primary pressed", description: "Primary variant, :not(:disabled):active.", tokens: ["background (primary pressed)"] },
    { name: "secondary default/pressed", description: "Fixed 2026-08-26: always transparent background, brand-colored border, link-colored text — pressed reverts to this exact same look, it has no distinct pressed styling of its own.", tokens: ["text (secondary default/pressed)", "border (secondary default/pressed)"] },
    { name: "secondary hover", description: "Border swaps to color.border.focus and text to color.text.link-hover — no background change.", tokens: ["text (secondary hover)", "border (secondary hover)"] },
    { name: "ghost hover + active", description: "Uses color.action.secondary.hover/pressed in the real CSS — declared in figmaTokens below so check-parity actually covers them (previously it couldn't verify a token it didn't know to look for; see CLAUDE.md's note on that blind spot).", tokens: ["background (secondary/ghost hover)", "background (secondary/ghost pressed)"] },
    { name: "disabled (primary)", description: "Background/text/border all switch to their disabled tokens.", tokens: ["background (disabled)", "text (disabled)", "border (disabled)"] },
    { name: "disabled (secondary/ghost)", description: "Both stay transparent (no background token) — secondary's border switches to color.border.subtle (fixed 2026-08-26, was previously undeclared/untested), ghost's border/background both stay fully unset per its own CSS rule. Text color (color.text.disabled) is shared with primary via the base .lat-button:disabled rule.", tokens: ["border (secondary disabled)", "text (disabled)"] },
    { name: "loading", description: "Disables the button and swaps content for a 3-dot bounce spinner. Text buttons keep children in the DOM, visually hidden, for the accessible name; iconOnly buttons have no children to hide.", tokens: ["spinner dot resting color", "spinner dot active color", "spinner dot size"] },
    { name: "focus-visible", description: "Visible outline ring, keyboard-triggered only (:focus-visible, not :focus).", tokens: ["border color (focus ring)", "border width (focus ring)", "focus ring offset"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Activates the button — native <button> element, not a custom key handler." },
    ],
    ariaAttributes: [
      { attribute: "aria-busy", description: "Set automatically while isLoading is true." },
      { attribute: "aria-label", description: 'Required when iconOnly is true. Fixed 2026-08-26: ButtonProps is now a discriminated union — `{ iconOnly: true; "aria-label": string }` vs. `{ iconOnly?: false }` — so a TypeScript consumer gets a real compile error for `<Button iconOnly icon={...} />` with no aria-label, not just a dev-mode console.warn. The console.warn stays too, as a runtime safety net for what the type system can\'t catch (spread props, plain-JS consumers) — this repo has no non-TS consumer today, but the warn costs nothing to keep.' },
    ],
    focusBehaviors: [
      "Real, visible :focus-visible outline bound to color.border.focus/sizing.border.thin/sizing.focus-ring-offset — confirmed in Button.css. Unlike Switch, which has no focus-ring style at all.",
    ],
  },
  // Token paths this component is expected to consume, keyed by the CSS
  // property they should end up styling. check-parity greps the compiled
  // CSS for the corresponding --lat-* variable to confirm no drift.
  // Fixed 2026-08-26 — border-radius and the secondary variant's
  // background/text/border were re-verified against the live Figma node
  // directly (script-queried the actual boundVariables, not screenshots
  // or the prior doc text), after a user comparing the rendered gallery
  // to Figma spotted it looked wrong. Two real, confirmed mismatches:
  // - border-radius was declared as radius.input for the base .lat-button
  //   rule (with a separate, then-seemingly-special-case radius.slimlg
  //   override just for icon-only). Every appearance/size/icon-only
  //   combination actually binds to radius.slimlg — icon-only was never
  //   special, the base rule was just wrong for everyone.
  // - The secondary variant (Figma's "outline" appearance) was styled as
  //   a neutral gray button (background.default fill, text.primary,
  //   border.default) — the real component is always transparent with a
  //   brand-colored border and link-colored text, i.e. a bordered link,
  //   not a neutral secondary button. See the new secondary-specific
  //   entries below.
  //
  // "focus ring offset" is skipped below (figmaTokensSkipLiveCheck): per
  // the comment on that entry itself, it was never a Figma Variable to
  // begin with (Figma's Plugin API has no x/y-position variable binding)
  // — check-component-bindings only walks bound Variables and can never
  // see a raw measured pixel value like this one.
  figmaTokensSkipLiveCheck: ["focus ring offset"],
  figmaTokens: {
    "border-radius": "radius.slimlg",
    "padding (md, all sides)": "spacing.8",
    "font-size (md)": "typography.button.font-size.md",
    "line-height (md)": "typography.button.line-height.md",
    "background (primary default)": "color.action.primary.default",
    "background (primary hover)": "color.action.primary.hover",
    "background (primary pressed)": "color.action.primary.pressed",
    "background (secondary/ghost hover)": "color.action.secondary.hover",
    "background (secondary/ghost pressed)": "color.action.secondary.pressed",
    "background (disabled)": "color.action.secondary.disabled",
    "text (disabled)": "color.text.disabled",
    "border (primary)": "color.border.brand",
    "border (disabled)": "color.border.strong",
    // Secondary is always transparent (no fill token — "transparent" isn't
    // a --lat-* var, same as ghost's background), so only text/border are
    // declared here.
    "text (secondary default/pressed)": "color.text.link",
    "text (secondary hover)": "color.text.link-hover",
    "border (secondary default/pressed)": "color.border.brand",
    "border (secondary hover)": "color.border.focus",
    "border (secondary disabled)": "color.border.subtle",
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
    // appearance x state x size x "icon only" axis, 90 variants total). No
    // separate "icon-only border-radius" entry anymore (fixed 2026-08-26)
    // — radius.slimlg is the shared "border-radius" entry above now, not
    // an icon-only special case; see that entry's comment.
    //
    // Padding is still icon-only-specific and density-mode-independent
    // (Default and Condensed both alias the same primitive, border.radius.150
    // = 6px, for what it's worth on the radius side too). Originally ported
    // under a placeholder "6" name (that numeric entry existed, unused,
    // from a prior session) to avoid adding a duplicate token; renamed to
    // match Figma's real "slimlg" name once the Latent Sync plugin's first
    // live pull surfaced it as drift (2026-08-20).
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
