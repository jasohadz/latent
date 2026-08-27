export default {
  name: "AlertStack",
  summary: "Composes multiple real Alert instances into a collapsed, peeking fan that separates into a fully readable list on hover or keyboard focus. Built from the Figma reference's own annotated behavior (\"When user hovers over the Collapse state it will change to Expand state\"), not a generic stack primitive — tuned for 3 children.",
  props: [
    { name: "children", type: "React.ReactNode", default: "—", description: "Multiple <Alert> elements. Built and visually tuned for 3; more will still collapse/expand but without additional fan-out styling beyond the third." },
  ],
  example: `<AlertStack>\n  <Alert icon={<Icon name="megaphone" />} onDismiss={dismissFirst}>First notice</Alert>\n  <Alert icon={<Icon name="megaphone" />} onDismiss={dismissSecond}>Second notice</Alert>\n  <Alert icon={<Icon name="megaphone" />} onDismiss={dismissThird}>Third notice</Alert>\n</AlertStack>`,
  doNot: [
    "Don't expect a controlled expanded/collapsed prop — the Figma reference defines this as a hover interaction, not a state a consumer sets, so there isn't one. If a click-to-expand alternative is ever needed, that's a different, new component, not an AlertStack prop.",
    "Don't stack non-Alert children expecting the fan/peek styling — the negative-margin overlap and inset rules target direct children generically, but the visual design (dark background peeking through) assumes Alert's own appearance.",
  ],
  swizzlePath: "packages/core/src/AlertStack.tsx",
  extends: "React.HTMLAttributes<HTMLDivElement>",
  states: [
    { name: "collapsed (default)", description: "Cards overlap with a negative margin, each layer back narrower/inset — a receding-stack look.", tokens: ["expanded gap"] },
    { name: "expanded (hover or focus-within)", description: "Cards separate to a real gap, full width, no overlap.", tokens: ["expanded gap"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Tab", action: "Moving focus into any stacked Alert's action button expands the whole stack via :focus-within — not hover-only, so keyboard users reach the same expanded state a mouse user gets." },
    ],
    focusBehaviors: [
      "Expand triggers on :hover OR :focus-within, deliberately, not hover alone — content that only reveals on hover with no keyboard-equivalent trigger fails WCAG 2.1 SC 1.4.13 (Content on Hover or Focus). Decided at build time, not backfilled.",
    ],
  },
  // Built 2026-08-27 from the same foreign reference as Alert (a "Fey"-
  // branded "Alert stack" component set, context-only — same treatment as
  // Calendar's foreign reference). The reference's State=Collapsed/Expanded
  // naming and its annotation ("When user hovers over the Collapse state it
  // will change to Expand state") were re-expressed as a pure-CSS hover/
  // focus-within interaction, not a React-state-driven variant — there's no
  // "state" prop because the reference itself never describes this as
  // something a consumer controls.
  //
  // The reference's per-card inset amounts in the collapsed state (its own
  // instances sit at x=16/8/0 with widths 334/350/366, i.e. progressively
  // less inset toward the front) were never bound to Figma variables in the
  // reference, and weren't bound here either when rebuilding it — same
  // treatment given to any layout detail Figma itself leaves as a literal.
  // The peek offset (itemSpacing -24 in the collapsed variant) is the same:
  // a literal, matching the reference's own unbound choice, not a Latent
  // token binding.
  figmaTokens: {
    "expanded gap": "spacing.16",
  },
};
