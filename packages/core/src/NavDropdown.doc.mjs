export default {
  name: "NavDropdown",
  summary: "A real NavItem trigger paired with an indented list of real NavSubItem instances, for expandable nav groups.",
  props: [
    { name: "label", type: "string", default: "—", description: "Passed straight through to the trigger NavItem's own label." },
    { name: "icon", type: "React.ReactNode", default: "undefined", description: "Passed straight through to the trigger NavItem's own icon." },
    { name: "selected", type: "boolean", default: "false", description: "Passed straight through to the trigger NavItem's own selected state." },
    { name: "expanded", type: "boolean", default: "—", description: "Controls whether the sub-list renders and which chevron direction the trigger shows. Controlled — this component holds no internal state." },
    { name: "onToggle", type: "(expanded: boolean) => void", default: "—", description: "Fires when the trigger is clicked, with the requested next `expanded` value (the caller decides whether to honor it)." },
    { name: "subItems", type: "{ label: string; selected?: boolean; onClick?: () => void }[]", default: "—", description: "Rendered as one real NavSubItem per entry, in order, when expanded and not iconOnly." },
    { name: "iconOnly", type: "boolean", default: "false", description: "Renders just the trigger's icon (see NavItem's iconOnly) — used by Side Nav's Collapsed state. The sub-list never renders in this mode, regardless of `expanded`, matching Figma's Collapsed instance." },
  ],
  example: `<NavDropdown label="Resources" icon={<Icon name="boxes" />} expanded={open} onToggle={setOpen} subItems={[{ label: "Tutorials" }, { label: "Academy" }, { label: "Experts" }]} />`,
  doNot: [
    "Don't manage the trigger's chevron direction yourself — it's derived automatically from `expanded` (chevron-down collapsed, chevron-up expanded).",
  ],
  swizzlePath: "packages/core/src/NavDropdown.tsx",
  extends: null,
  // Same "only what's distinct here" logic as figmaTokens below: the
  // trigger and rows are real NavItem/NavSubItem instances, so their own
  // states already live in NavItem.doc.mjs/NavSubItem.doc.mjs. Only the
  // disclosure-specific facts belong here.
  states: [
    { name: "collapsed", description: "Sub-list not rendered; trigger's chevron points down.", tokens: [] },
    { name: "expanded", description: "Sub-list renders with sub-list gap/indent; trigger's chevron points up.", tokens: ["sub-list gap", "sub-list indent"] },
  ],
  // Fixed 2026-08-26 (paired with SideNav's landmark fix in the same
  // nav-family pass — see SideNav.doc.mjs).
  accessibility: {
    keyboardInteractions: [
      { key: "ArrowDown / ArrowUp", action: "Moves focus to the next/previous sub-item, wrapping at both ends. From the trigger itself, ArrowDown enters the sub-list at the first item and ArrowUp at the last. Only active while expanded." },
      { key: "Home / End", action: "Moves focus to the first/last sub-item. Only active while expanded." },
      { key: "Escape", action: "Collapses the dropdown and returns focus to the trigger. Only active while expanded." },
    ],
    ariaAttributes: [
      { attribute: "aria-expanded", description: "Set on the trigger NavItem, reflecting the expanded prop directly — a real disclosure-pattern attribute, confirmed in the source." },
    ],
    focusBehaviors: [
      "Deliberately NOT a roving-tabindex composite widget, unlike Toggle/Calendar: every NavSubItem stays individually Tab-reachable exactly as before this fix — arrow keys are an added convenience on top of, not a replacement for, normal Tab order. This sub-list has no role=\"menu\"/\"listbox\" implying the stricter pattern, and adding one without full menu semantics (typeahead, etc.) would overclaim, the same mistake Toggle's unimplemented ARIA-tabs roles made before that fix.",
    ],
  },
  // Only 2 entries by design, not a gap: NavDropdown renders real NavItem/
  // NavSubItem instances for the trigger and sub-rows, so their own padding/
  // color/typography tokens already live in NavItem.doc.mjs/NavSubItem.doc.mjs
  // and check-parity there — duplicating them here would just assert against
  // NavItem.css/NavSubItem.css, not this component's own CSS file.
  figmaTokens: {
    "sub-list gap": "spacing.2",
    "sub-list indent": "spacing.20",
  },
};
