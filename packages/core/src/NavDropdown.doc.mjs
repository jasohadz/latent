export default {
  name: "NavDropdown",
  summary: "A real NavItem trigger paired with an indented list of real NavSubItem instances, for expandable nav groups.",
  props: [
    { name: "label", type: "string", default: "—" },
    { name: "icon", type: "React.ReactNode", default: "undefined" },
    { name: "selected", type: "boolean", default: "false" },
    { name: "expanded", type: "boolean", default: "—" },
    { name: "onToggle", type: "(expanded: boolean) => void", default: "—" },
    { name: "subItems", type: "{ label: string; selected?: boolean; onClick?: () => void }[]", default: "—" },
  ],
  example: `<NavDropdown label="Resources" icon={<Icon name="boxes" />} expanded={open} onToggle={setOpen} subItems={[{ label: "Tutorials" }, { label: "Academy" }, { label: "Experts" }]} />`,
  doNot: [
    "Don't manage the trigger's chevron direction yourself — it's derived automatically from `expanded` (chevron-down collapsed, chevron-up expanded).",
  ],
  swizzlePath: "packages/core/src/NavDropdown.tsx",
  figmaTokens: {
    "sub-list gap": "spacing.2",
    "sub-list indent": "spacing.20",
  },
};
