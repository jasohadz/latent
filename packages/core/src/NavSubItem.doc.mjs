export default {
  name: "NavSubItem",
  summary: "The indented row used inside Nav Dropdown's expanded sub-list. Same Selected x State pattern as NavItem, with a fixed leading branch icon and no chevron.",
  props: [
    { name: "label", type: "string", default: "—", description: "The row's text." },
    { name: "selected", type: "boolean", default: "false", description: "Applies the same selected background/label styling as NavItem's selected state." },
    { name: "showIcon", type: "boolean", default: "true", description: "Fixed to a corner-down-right branch icon — not swappable, unlike NavItem's leading icon." },
    { name: "disabled", type: "boolean", default: "false", description: "Standard HTML disabled." },
  ],
  example: `<NavSubItem label="Tutorials" onClick={handleClick} />`,
  doNot: [
    "Don't try to swap the leading icon — it's fixed to corner-down-right by design, unlike NavItem.",
  ],
  swizzlePath: "packages/core/src/NavSubItem.tsx",
  extends: "React.ButtonHTMLAttributes<HTMLButtonElement>",
  states: [
    { name: "default", description: "Secondary label/icon color, no background.", tokens: ["label color", "icon color"] },
    { name: "hover", description: "Secondary-action hover background.", tokens: ["hover background"] },
    { name: "pressed", description: "Secondary-action pressed background.", tokens: ["pressed background"] },
    { name: "selected", description: "Muted background, primary-color bold label.", tokens: ["selected background", "selected label color", "selected label weight"] },
    { name: "focus-visible", description: "Outline ring, keyboard-only — confirmed in NavSubItem.css.", tokens: ["focus ring color", "focus ring width"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Activates the item — native <button> behavior, no custom handler." },
    ],
    ariaAttributes: [
      { attribute: "aria-current", description: 'Fixed 2026-08-26, same change as NavItem: set to "page" whenever `selected` is true. NavSubItem is only ever used inside NavDropdown\'s sub-list of real navigable pages, so unlike NavItem\'s dropdown-trigger reuse there\'s no imprecision here — `selected` on a NavSubItem always means "this page".' },
    ],
    focusBehaviors: [
      "Real :focus-visible outline confirmed in NavSubItem.css, bound to color.border.focus.",
    ],
  },
  figmaTokens: {
    "padding (vertical)": "spacing.6",
    "padding (horizontal) / gap": "spacing.10",
    "border-radius": "radius.lg",
    "hover background": "color.action.secondary.hover",
    "pressed background": "color.action.secondary.pressed",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.thin",
    "icon color": "color.icon.default",
    "label color": "color.text.secondary",
    "label font-family": "font-family.sans",
    "label font-size": "font-style.body",
    "selected background": "color.background.muted",
    "selected label color": "color.text.primary",
    "selected label weight": "font-weight.600",
  },
};
