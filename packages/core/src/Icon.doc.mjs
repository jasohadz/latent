export default {
  name: "Icon",
  summary: "Thin wrapper around lucide-react. Renders any Lucide icon by its kebab-case name, sized and colored entirely from tokens.",
  props: [
    { name: "name", type: "string", default: "—", description: "Icon name in kebab-case, matching Lucide's own naming and the names shown on the Figma Icons foundations page (e.g. \"arrow-up\", \"trash-2\")." },
    { name: "size", type: '"xs" | "sm" | "md" | "lg" | "xl"', default: "md", description: "Maps to --lat-sizing-icon-* (12/16/20/24/32px)." },
    { name: "weight", type: '"light" | "regular" | "bold"', default: "regular", description: "Stroke weight (1.5 / 2 / 2.5px). Matches the Weight variant property on the Figma Icons foundations page." },
  ],
  example: `<Icon name="arrow-up" size="md" />`,
  doNot: [
    "Don't pass a hardcoded width/height or fill color via style/className overrides — use the size prop and let color inherit via currentColor.",
    "Don't guess an icon name — check the Icons foundations page or STYLES.md-adjacent icon list; an unmatched name silently renders nothing (with a dev-mode console warning).",
  ],
  swizzlePath: "packages/core/src/Icon.tsx",
  // lucide-react is a runtime dependency of this component (see root
  // package.json) — unlike Button, which has zero external dependencies.
  // Anyone who swizzles Icon.tsx out needs lucide-react installed too.
  figmaTokens: {
    "width/height (md)": "sizing.icon.md",
    "color (default)": "color.icon.default",
  },
};
