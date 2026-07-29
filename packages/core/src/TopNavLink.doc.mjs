export default {
  name: "TopNavLink",
  summary: "The atomic link used inside TopNav's bar for Product, Download, and Pricing.",
  props: [
    { name: "label", type: "string", default: "—" },
    { name: "active", type: "boolean", default: "false" },
    { name: "showChevron", type: "boolean", default: "true" },
  ],
  example: `<TopNavLink label="Product" active showChevron onClick={openProductMenu} />`,
  doNot: [],
  swizzlePath: "packages/core/src/TopNavLink.tsx",
  // Bug found in Figma, not reproduced here: the Active=No variant's Label
  // text is literally raw "Inter Regular" (unbound font family/size/weight
  // — only fill color is bound), the same "Legacy Reference" pattern
  // flagged elsewhere in this file (Toggle/Switch superseded similar
  // hardcoded-Inter components). Used font-family.sans (Geist) here
  // instead, matching every other component and the Active=Yes state's
  // own Geist SemiBold.
  figmaTokens: {
    "font-family": "font-family.sans",
    "font-size": "font-style.body-small",
    "label color": "color.text.secondary",
    "label weight": "font-weight.400",
    "chevron color": "color.icon.default",
    "active label color": "color.text.primary",
    "active label weight": "font-weight.600",
  },
};
