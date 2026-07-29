export default {
  name: "AvatarGroup",
  summary: "Stacks multiple real Avatar instances to represent a group of users.",
  props: [
    { name: "spacing", type: '"overlap" | "spaced"', default: "overlap", description: "overlap: avatars overlap with a -8px gap (not token-bound in Figma either — no negative spacing token exists). spaced: 4px gap, bound to spacing/4." },
    { name: "avatars", type: "AvatarProps[]", default: "—", description: "One entry per Avatar instance, spread onto a real <Avatar size=\"medium\" shape=\"circle\" />." },
    { name: "overflowCount", type: "number", default: "undefined", description: "Shows a \"+N\" chip. Omit or pass 0 to hide it." },
  ],
  example: `<AvatarGroup spacing="overlap" avatars={[{ initial: "F" }, { icon: <Icon name="user" /> }]} overflowCount={2} />`,
  doNot: [
    "Don't render the overflow count as an <Avatar initial=\"+2\"> — Avatar's single-character constraint would clip it; AvatarGroup's overflow chip is a separate, matching-styled element on purpose.",
  ],
  swizzlePath: "packages/core/src/AvatarGroup.tsx",
  figmaTokens: {
    "spaced gap": "spacing.4",
    "overflow width/height": "sizing.avatar.md",
    "overflow border-radius": "radius.full",
    "overflow background": "color.background.muted",
    "overflow text color": "color.text.secondary",
    "overflow font-family": "font-family.sans",
    "overflow font-size": "font-size.300",
    "overflow font-weight": "font-weight.600",
  },
};
