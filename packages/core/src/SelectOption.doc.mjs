export default {
  name: "SelectOption",
  summary: "A single row inside Select's or MultiSelect's floating panel — the shared building block both compose. Optionally shows a leading Checkbox for multi-choice rows.",
  props: [
    { name: "label", type: "string", default: "—", description: "The row's text." },
    { name: "selected", type: "boolean", default: "false", description: "Muted background + bold label — the current-choice look, matching NavItem's own selected-row convention exactly." },
    { name: "showCheckbox", type: "boolean", default: "false", description: "Renders a leading Checkbox reflecting `selected`, decorative (tabIndex=-1, aria-hidden) — the row itself, not the checkbox, is the real interactive/focusable target." },
  ],
  example: `<SelectOption label="Hiking" selected={isSelected} showCheckbox onClick={handleToggle} />`,
  doNot: [
    "Don't rely on the inner Checkbox for keyboard interaction — it's decorative (tabIndex=-1). Click/keyboard activation happens on the row itself.",
    "Don't use this outside a Select/MultiSelect panel expecting standalone listbox semantics — role=\"option\" here assumes a role=\"listbox\" ancestor, which only those two components provide.",
  ],
  swizzlePath: "packages/core/src/SelectOption.tsx",
  extends: "React.HTMLAttributes<HTMLDivElement>",
  states: [
    { name: "default", description: "Transparent background, regular-weight label.", tokens: ["label color", "label font-size"] },
    { name: "hover", description: "Secondary-action hover background — same token NavItem/NavSubItem use.", tokens: ["hover background"] },
    { name: "selected", description: "Muted background, bold label — matches NavItem's selected convention exactly, deliberately reused rather than inventing a new one.", tokens: ["selected background", "selected label weight"] },
    { name: "focus-visible", description: "Outline ring, keyboard-only.", tokens: ["focus ring color", "focus ring width"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Activates the row — a custom onKeyDown handler, not native <button> behavior. The row is a <div role=\"option\">, not a <button>, specifically because showCheckbox nests a real (decorative) Checkbox, which is itself a <button> — and a <button> can't be a descendant of another <button> (invalid HTML). Caught via a real React DOM-nesting warning while testing in the gallery, not anticipated in advance." },
    ],
    ariaAttributes: [
      { attribute: "role, aria-selected", description: 'role="option" with aria-selected reflecting `selected` — assumes a role="listbox" ancestor (Select/MultiSelect\'s own panel).' },
    ],
    focusBehaviors: [
      "Real :focus-visible outline, bound to color.border.focus. Individually Tab-reachable — not a full roving-tabindex/aria-activedescendant listbox pattern, the same honest simplification NavDropdown's sub-list already documents.",
    ],
  },
  // Built 2026-08-27 in Figma, synthesizing the two competing foreign
  // references on the Select page: Style 1's checkbox-less "Dropdown Item"
  // and Style 4's checkbox-driven "Multiselect Item" (which composes the
  // "◈ Checkbox - Dark Mode" reference, see Checkbox.doc.mjs) were merged
  // into one component with a showCheckbox boolean, rather than kept as
  // two separate Figma-mirrored components — Select uses showCheckbox=false,
  // MultiSelect uses true. Hover/selected background colors were re-derived
  // from Latent's own NavItem convention (color.action.secondary.hover /
  // color.background.muted), not the references' own raw hover-blue and
  // muted-gray values, for consistency with the rest of the system rather
  // than matching either reference's specific palette.
  figmaTokens: {
    "row padding": "spacing.8",
    "row gap": "spacing.8",
    "row border-radius": "radius.lg",
    "label color": "color.text.primary",
    "label font-size": "font-style.body-small",
    "hover background": "color.action.secondary.hover",
    "selected background": "color.background.muted",
    "selected label weight": "font-weight.600",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.default",
  },
  figmaTokensSkipLiveCheck: ["focus ring color", "focus ring width"],
};
