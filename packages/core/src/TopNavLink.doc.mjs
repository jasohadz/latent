export default {
  name: "TopNavLink",
  summary: "The atomic link used inside TopNav's bar for Product, Download, and Pricing.",
  props: [
    { name: "label", type: "string", default: "—", description: "The link's text." },
    { name: "active", type: "boolean", default: "false", description: "Applies the active label color — used by TopNav when its own `menu` matches this link (Product/Download)." },
    { name: "showChevron", type: "boolean", default: "true", description: "Toggles the trailing chevron. TopNav sets this false for its plain Pricing link, which has no dropdown." },
  ],
  example: `<TopNavLink label="Product" active showChevron onClick={openProductMenu} />`,
  doNot: [
    "Don't set active on a link with no corresponding open panel (e.g. Pricing) — active only styles the label color, it doesn't open anything itself; TopNav is what wires active/onClick to its own menu state.",
  ],
  swizzlePath: "packages/core/src/TopNavLink.tsx",
  extends: "React.ButtonHTMLAttributes<HTMLButtonElement>",
  states: [
    { name: "default", description: "Secondary label color.", tokens: ["label color"] },
    { name: "active", description: "Primary label color — TopNav sets this when its own `menu` matches this link.", tokens: ["active label color"] },
  ],
  // Fixed 2026-08-26 (part of the TopNav-family pass — see TopNav.doc.mjs
  // and MegaMenuItem.doc.mjs). Focus ring added here; aria-expanded/
  // aria-haspopup are supplied by the caller (TopNav) through the
  // ButtonHTMLAttributes spread — this component never had to reject
  // them, TopNav simply wasn't passing them.
  accessibility: {
    ariaAttributes: [
      { attribute: "aria-expanded / aria-haspopup", description: 'Not set by TopNavLink itself — passed straight through via the ButtonHTMLAttributes spread (`extends`). TopNav now supplies both on its Product/Download instances; the plain Pricing instance gets neither, correctly, since it has no panel.' },
    ],
    focusBehaviors: [
      "Token-bound focus-visible ring added (same pattern as Button/MegaMenuItem): outline: none on :focus, a real outline on :focus-visible using color.border.focus/sizing.border.thin/sizing.focus-ring-offset. Also added a border-radius (radius.input) so the ring renders rounded instead of a sharp rectangle around inline text.",
    ],
  },
  // Previously: Active=No's Label was raw unbound "Inter Regular" in
  // Figma (a real bug, not reproduced in the original port). Fixed at
  // the source — both Active=No and Active=Yes now share the same real
  // "Body/Small/SemiBold" text style (Geist SemiBold, font-weight.600);
  // only the fill color differs between states.
  figmaTokens: {
    "font-family": "font-family.sans",
    "font-size": "font-style.body-small",
    "label weight": "font-weight.600",
    "label line-height": "font-line-height.200-normal",
    "label color": "color.text.secondary",
    "chevron color": "color.icon.default",
    "active label color": "color.text.primary",
    "border-radius": "radius.input",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.thin",
    "focus ring offset": "sizing.focus-ring-offset",
  },
};
