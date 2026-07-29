export default {
  name: "Switch",
  summary: "An on/off toggle for boolean settings.",
  props: [
    { name: "pressed", type: "boolean", default: "—", description: "Whether the switch is on." },
    { name: "onChange", type: "(pressed: boolean) => void", default: "—", description: "Fires with the new pressed value when clicked." },
    { name: "disabled", type: "boolean", default: "false", description: "50% opacity on the track; the on+disabled track uses a distinct dimmed brand color, not just opacity over the normal on-color." },
    { name: "supportingText", type: "string", default: "undefined", description: "Optional caption rendered beside the track." },
  ],
  example: `<Switch pressed={enabled} onChange={setEnabled} supportingText="Enable notifications" />`,
  doNot: [
    "Don't hardcode the thumb travel distance in a consumer override — it's derived from the track/thumb/padding sizes here; change those instead.",
  ],
  swizzlePath: "packages/core/src/Switch.tsx",
  figmaTokens: {
    "track background (off)": "color.background.muted",
    "track background (on)": "color.action.primary.default",
    "track background (on + disabled)": "color.action.primary.disabled",
    "track/thumb border-radius": "radius.full",
    "thumb background": "color.surface.raised",
    "supporting text color": "color.text.tertiary",
    "supporting text font-size": "font-size.200",
    "supporting text line-height": "font-line-height.200-normal",
  },
};
