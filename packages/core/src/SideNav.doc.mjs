export default {
  name: "SideNav",
  summary: "A floating sidebar navigation panel. Expanded shows the full item list plus brand header and footer; Collapsed is a narrow icon rail — brand/footer hide, and the same nav items render icon-only above just the expand toggle.",
  props: [
    { name: "collapsed", type: "boolean", default: "false", description: "Switches between the full Expanded layout (brand header, nav list, footer) and the narrow icon-rail Collapsed layout." },
    { name: "brand", type: "string", default: '"Acme Inc."', description: "Hidden while collapsed — Figma's Collapsed instance shows only the toggle in its header, no logo/brand." },
    { name: "logo", type: "React.ReactNode", default: "undefined", description: "Latent's own logo mark isn't a ported component — supply your own brand icon. Hidden while collapsed, same as brand." },
    { name: "showToggleIcon", type: "boolean", default: "true", description: "Toggles the expand/collapse button rendered in the header, in both states." },
    { name: "onToggleCollapse", type: "() => void", default: "undefined", description: "Fires when the expand/collapse button is clicked. This component doesn't manage its own collapsed state — the caller owns it via `collapsed`." },
    { name: "footerLabel", type: "string", default: '"Privacy"', description: "Not rendered while collapsed — Figma's Collapsed instance has no footer row at all." },
    { name: "showFooterIcon", type: "boolean", default: "true", description: "Toggles the shield icon in the footer row. No effect while collapsed (footer doesn't render at all)." },
    { name: "children", type: "React.ReactNode", default: "undefined", description: "Real NavItem / NavDropdown instances, in order. Rendered in both states — collapsed clones each child with iconOnly, so pass the same children regardless of collapsed state." },
  ],
  example: `<SideNav brand="Acme Inc." collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)}><NavItem label="Overview" selected /><NavDropdown label="Resources" expanded={open} onToggle={setOpen} subItems={subs} /></SideNav>`,
  doNot: [
    "Don't build the nav list as a data-array prop — compose real NavItem/NavDropdown children directly, matching Figma's own instance-based structure.",
  ],
  swizzlePath: "packages/core/src/SideNav.tsx",
  extends: null,
  states: [
    { name: "expanded", description: "Brand header, full nav list, footer row all render; children get no iconOnly override.", tokens: ["expanded padding", "expanded gap"] },
    { name: "collapsed", description: "Brand/footer hidden entirely; every child is cloned with iconOnly forced true, regardless of what was passed.", tokens: ["collapsed padding (horizontal)", "collapsed padding (vertical)", "collapsed gap"] },
  ],
  accessibility: {
    ariaAttributes: [
      { attribute: "aria-label", description: "Set on the toggle button to \"Expand\" or \"Collapse\" depending on current state — confirmed dynamically correct in the source, not a static label." },
      { attribute: 'role="navigation" / aria-label="Main navigation" (root)', description: 'Fixed 2026-08-26: added to both the expanded and collapsed return branches (confirmed both were updated, not just one) — same landmark fix TopNav got in the same pass, same reasoning for using the role attribute over swapping to a real <nav> element (avoids changing the forwardRef\'d element type for existing consumers).' },
    ],
  },
  // "panel shadow" is skipped below (figmaTokensSkipLiveCheck): elevation.*
  // is an Effect Style reference, not a Variable — check-component-bindings
  // only walks bound Variables and can never see this; check-styles/
  // styles.json already covers Effect Styles separately.
  figmaTokensSkipLiveCheck: ["panel shadow"],
  figmaTokens: {
    "panel background": "color.surface.raised",
    "panel border": "color.border.subtle",
    "panel border-radius": "radius.card",
    "panel shadow": "elevation.lg",
    "expanded padding": "spacing.12",
    "expanded gap": "spacing.4",
    "collapsed padding (horizontal)": "spacing.12",
    "collapsed padding (vertical)": "spacing.8",
    "collapsed gap": "spacing.8",
    "brand color": "color.text.primary",
    "brand font-family": "font-family.sans",
    "brand font-size": "font-style.body",
    "brand font-weight": "font-weight.600",
    "toggle icon color": "color.icon.default",
    "nav list gap": "spacing.2",
    "divider color": "color.border.subtle",
    "footer label color": "color.text.tertiary",
    "footer label font-size": "font-style.body-small",
  },
};
