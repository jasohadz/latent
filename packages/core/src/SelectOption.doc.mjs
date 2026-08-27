export default {
  name: "SelectOption",
  summary: "A single row inside Select's or MultiSelect's floating panel — the shared building block both compose.",
  props: [
    { name: "label", type: "string", default: "—", description: "The row's text." },
    { name: "selected", type: "boolean", default: "false", description: "Only affects aria-selected — no distinct visual treatment (see doNot). Selection is communicated by the option's chip appearing in the trigger, not by the row itself." },
  ],
  example: `<SelectOption label="Hiking" selected={isSelected} onClick={handleToggle} />`,
  doNot: [
    "Don't expect a persistent \"selected\" background/bold style on a chosen row — the Figma reference (\"Dropdown Item\") only has two states, default and hover, no third selected treatment. `selected` still sets aria-selected for real screen-reader value; it's a deliberate accessibility-only prop, not a visual one.",
    "Don't use this outside a Select/MultiSelect panel expecting standalone listbox semantics — role=\"option\" here assumes a role=\"listbox\" ancestor, which only those two components provide.",
  ],
  swizzlePath: "packages/core/src/SelectOption.tsx",
  extends: "React.HTMLAttributes<HTMLDivElement>",
  states: [
    { name: "default", description: "Transparent background.", tokens: ["label color", "label font-size"] },
    { name: "hover", description: "Light brand-blue background — color.background.brand, not a neutral gray hover like NavItem's own convention. A deliberate difference: this component follows its own Figma reference's real hover color, not another component's.", tokens: ["hover background"] },
    { name: "focus-visible", description: "Outline ring, keyboard-only.", tokens: ["focus ring color", "focus ring width"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Activates the row — a custom onKeyDown handler, not native <button> behavior. The row is a <div role=\"option\">, not a <button> (see the 2026-08-27 note below)." },
    ],
    ariaAttributes: [
      { attribute: "role, aria-selected", description: 'role="option" with aria-selected reflecting `selected` — assumes a role="listbox" ancestor (Select/MultiSelect\'s own panel).' },
    ],
    focusBehaviors: [
      "Real :focus-visible outline, bound to color.border.focus. Individually Tab-reachable — not a full roving-tabindex/aria-activedescendant listbox pattern, the same honest simplification NavDropdown's sub-list already documents.",
    ],
  },
  // Rebuilt 2026-08-27 to match "Style 1" specifically — the one foreign
  // reference the user kept on the Select page after deleting the other
  // three competing style explorations that were there when this
  // component was first built (see git history for that first version).
  // Two real differences from the first pass, confirmed via a fresh live
  // Figma pull of Style 1's own "Dropdown Item": (1) no checkbox at all —
  // Style 1's rows are plain hover-highlighted text, unlike the other
  // (now-deleted) style's checkbox-driven rows; the showCheckbox prop and
  // Checkbox composition were removed entirely, not just unused. (2) hover
  // background is color.background.brand (light blue), not
  // color.action.secondary.hover (neutral gray) — Style 1's own hover
  // color is genuinely blue-tinted, confirmed via the reference's real
  // fill value before mapping it to the closest matching Latent token.
  // Also dropped the "selected" bg-muted+bold row styling the first pass
  // invented (borrowed from NavItem's convention) — Style 1's real
  // Dropdown Item only has default/hover, nothing else.
  figmaTokens: {
    "row padding": "spacing.8",
    "label color": "color.text.primary",
    "label font-size": "font-style.body-small",
    "hover background": "color.background.brand",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.default",
  },
  figmaTokensSkipLiveCheck: ["focus ring color", "focus ring width"],
};
