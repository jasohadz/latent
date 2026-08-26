export default {
  name: "NavItem",
  summary: "The atomic row used inside Side Nav's expanded nav list and as Nav Dropdown's trigger.",
  props: [
    { name: "label", type: "string", default: "—", description: "The row's text. Hidden (but still used as the accessible name via aria-label) when iconOnly is true." },
    { name: "selected", type: "boolean", default: "false", description: "Applies the selected background/label styling for the current-page/active-item state." },
    { name: "showIcon", type: "boolean", default: "true", description: "Toggles the leading icon, when one is passed via `icon`." },
    { name: "icon", type: "React.ReactNode", default: "undefined", description: "e.g. <Icon name=\"layout-dashboard\" />, shown leading the label when showIcon is true." },
    { name: "showChevron", type: "boolean", default: "true", description: "Toggles the trailing chevron. Has no effect when iconOnly is true (chevron never renders in that mode)." },
    { name: "chevronName", type: "string", default: '"chevron-down"', description: "Nav Dropdown flips this to \"chevron-up\" based on its own expanded state." },
    { name: "iconOnly", type: "boolean", default: "false", description: "Drops the label and chevron, leaving a square icon button — used by Side Nav's Collapsed state. Existing padding squares up on its own once the label's gone." },
    { name: "disabled", type: "boolean", default: "false", description: "Standard HTML disabled." },
  ],
  example: `<NavItem label="Dashboard" icon={<Icon name="layout-dashboard" />} selected onClick={handleClick} />`,
  doNot: [
    "Don't set iconOnly without a meaningful `label` — with iconOnly there's no visible text, and label becomes the button's only accessible name (via aria-label).",
  ],
  swizzlePath: "packages/core/src/NavItem.tsx",
  extends: "React.ButtonHTMLAttributes<HTMLButtonElement>",
  states: [
    { name: "default", description: "Secondary label/icon color, no background.", tokens: ["label color", "icon/chevron color"] },
    { name: "hover", description: "Secondary-action hover background.", tokens: ["hover background"] },
    { name: "pressed", description: "Secondary-action pressed background.", tokens: ["pressed background"] },
    { name: "selected", description: "Muted background, primary-color bold label — the current-page/active-item look.", tokens: ["selected background", "selected label color", "selected label weight"] },
    { name: "focus-visible", description: "Outline ring, keyboard-only (:focus-visible, not :focus) — confirmed in NavItem.css.", tokens: ["focus ring color", "focus ring width"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Activates the item — native <button> behavior, no custom handler." },
    ],
    ariaAttributes: [
      { attribute: "aria-label", description: "Set to `label` only when iconOnly is true, since there's no visible text in that mode." },
      { attribute: "aria-current", description: 'Fixed 2026-08-26: set to "page" whenever `selected` is true (previously `selected` was purely a visual CSS class with no ARIA equivalent). One honest imprecision, not silently glossed over: NavItem is reused as NavDropdown\'s trigger, where `selected` really means "one of my sub-items is the current page," not "I myself am the current page" — aria-current="page" is a slight overclaim in that specific reuse, but was judged the better default over adding a second prop just to disambiguate a case NavDropdown.doc.mjs already documents as having its own gaps (no arrow-key nav, no Escape-to-close, still open). Overridable via aria-current in ...rest if a consumer needs the precise value.' },
    ],
    focusBehaviors: [
      "Real :focus-visible outline confirmed in NavItem.css, bound to color.border.focus.",
    ],
  },
  // "focus ring width" is skipped below (figmaTokensSkipLiveCheck):
  // confirmed correct (2px, matching sizing.border.default exactly) via
  // the live node read that fixed this token 2026-08-26 — but Figma
  // leaves the Focused variant's stroke weight as an unbound literal, not
  // a Variable, so no amount of value-correctness makes this check pass.
  figmaTokensSkipLiveCheck: ["focus ring width"],
  figmaTokens: {
    "padding (vertical)": "spacing.8",
    "padding (horizontal) / gap": "spacing.10",
    "border-radius": "radius.lg",
    "hover background": "color.action.secondary.hover",
    "pressed background": "color.action.secondary.pressed",
    "focus ring color": "color.border.focus",
    // Fixed 2026-08-26: was sizing.border.thin (1px) — a real, visible
    // size bug. Figma's real Focused variant has a 2px stroke weight,
    // confirmed by reading the live node directly; sizing.border.default
    // matches exactly.
    "focus ring width": "sizing.border.default",
    "icon/chevron color": "color.icon.default",
    "label color": "color.text.secondary",
    "label font-family": "font-family.sans",
    "label font-size": "font-style.body",
    "selected background": "color.background.muted",
    "selected label color": "color.text.primary",
    "selected label weight": "font-weight.600",
  },
};
