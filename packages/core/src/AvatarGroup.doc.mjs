export default {
  name: "AvatarGroup",
  summary: "Stacks multiple real Avatar instances to represent a group of users.",
  props: [
    { name: "spacing", type: '"overlap" | "spaced"', default: "overlap", description: "overlap: avatars overlap with a -8px gap (not token-bound in Figma either — no negative spacing token exists). spaced: 8px gap (fixed 2026-08-26, was incorrectly documented as 4px — confirmed by reading the live node directly; unbound to a Variable in Figma, spacing.8 matches the real pixel value exactly)." },
    { name: "avatars", type: "AvatarProps[]", default: "—", description: "One entry per Avatar instance, spread onto a real <Avatar size=\"medium\" shape=\"circle\" />." },
    { name: "overflowCount", type: "number", default: "undefined", description: "Shows a \"+N\" chip. Omit or pass 0 to hide it." },
  ],
  example: `<AvatarGroup spacing="overlap" avatars={[{ initial: "F" }, { icon: <Icon name="user" /> }]} overflowCount={2} />`,
  doNot: [
    "Don't render the overflow count as an <Avatar initial=\"+2\"> — Avatar's single-character constraint would clip it; AvatarGroup's overflow chip is a separate, matching-styled element on purpose.",
  ],
  swizzlePath: "packages/core/src/AvatarGroup.tsx",
  extends: null,
  // "spaced gap" is skipped below (figmaTokensSkipLiveCheck): value
  // corrected 2026-08-26 to match Figma's real 8px exactly, but Figma
  // itself has this as an unbound literal, not a Variable — nothing for
  // check-component-bindings to find regardless of correctness.
  figmaTokensSkipLiveCheck: ["spaced gap"],
  figmaTokens: {
    "spaced gap": "spacing.8",
    "overflow width/height": "sizing.avatar.md",
    "overflow border-radius": "radius.full",
    "overflow background": "color.background.muted",
    "overflow text color": "color.text.secondary",
    "overflow font-family": "font-family.sans",
    "overflow font-size": "font-size.300",
    "overflow font-weight": "font-weight.600",
  },
};
