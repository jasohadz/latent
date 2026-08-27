export default {
  name: "Alert",
  summary: "An inline banner for announcements and actionable notices. Two appearances: inverse (dark, dismissible — general announcements) and subtle (bordered, action-oriented — pairs with an expand affordance instead of a dismiss).",
  props: [
    { name: "appearance", type: '"inverse" | "subtle"', default: '"inverse"', description: "inverse: dark background, pairs with onDismiss. subtle: bordered muted background, pairs with onExpand." },
    { name: "icon", type: "React.ReactNode", default: "undefined", description: "Leading icon, e.g. <Icon name=\"megaphone\" />. Optional — the reference this was built from always shows one, but nothing about the component requires it." },
    { name: "children", type: "React.ReactNode", default: "—", description: "The message text." },
    { name: "onDismiss", type: "() => void", default: "undefined", description: "appearance=\"inverse\" only: renders a trailing dismiss (x) button and fires this when clicked. Ignored under appearance=\"subtle\"." },
    { name: "onExpand", type: "() => void", default: "undefined", description: "appearance=\"subtle\" only: renders a trailing circle-fading-plus button and fires this when clicked. Ignored under appearance=\"inverse\"." },
  ],
  example: `<Alert appearance="inverse" icon={<Icon name="megaphone" />} onDismiss={handleDismiss}>New updates are available.</Alert>`,
  doNot: [
    "Don't expect onDismiss to render anything under appearance=\"subtle\", or onExpand under appearance=\"inverse\" — the trailing action is fixed per appearance, matching the Figma reference's own Style→behavior pairing (Default/dismissible for general banners, Dark/actionable for banners requiring a follow-up action). Pass the other appearance if you need the other action.",
    "Don't nest interactive content inside `children` expecting independent focus targets beyond the trailing action button — Alert wasn't built as a generic container, just a message + one action, matching its Figma source.",
  ],
  swizzlePath: "packages/core/src/Alert.tsx",
  extends: "React.HTMLAttributes<HTMLDivElement>",
  states: [
    { name: "inverse", description: "Dark background, inverse text — the general-announcement look.", tokens: ["inverse background", "inverse text/icon color"] },
    { name: "subtle", description: "Bordered, muted background, secondary text — the actionable-notice look.", tokens: ["subtle background", "subtle border", "subtle text/icon color"] },
    { name: "focus-visible (action button)", description: "Outline ring, keyboard-only, matching NavItem/Search's convention.", tokens: ["focus ring color", "focus ring width"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space (on the action button)", action: "Native <button> activation — fires onDismiss or onExpand depending on appearance." },
    ],
    ariaAttributes: [
      { attribute: "role", description: 'Root is role="status" (implicit aria-live="polite", aria-atomic="true") — appropriate for a non-blocking notification; nothing in either appearance represents a critical/blocking error that would call for role="alert" instead. A deliberate choice, not a default left unexamined.' },
      { attribute: "aria-label (action button)", description: '"Dismiss" or "Expand" depending on appearance, since the button has only an icon, no visible text.' },
    ],
    focusBehaviors: [
      "Real :focus-visible outline on the action button, bound to color.border.focus — added at build time, not a backfilled gap.",
    ],
  },
  // Built 2026-08-26 from a foreign reference (a "Latent DS" Figma page
  // with a "Fey"-branded Alert/Alert stack pair, context-only — same
  // treatment as Calendar's foreign reference). The reference's own
  // "Style=Default"/"Style=Dark" naming and its annotation ("Style/Default
  // whenever we have any coming soon... Style/Dark [for alerts] which
  // require some actions") were re-expressed as Latent's own
  // appearance="inverse"/"subtle" naming and dismiss/expand behavior split,
  // not copied verbatim — the reference's hardcoded "Fey logo" and
  // "Coming soon" copy aren't part of the built component.
  //
  // The reference's "Alert stack" (State=Collapsed/Expanded, a stack of
  // overlapping Alert instances) was NOT built — out of scope for this
  // pass, which built the single Alert only. A real gap, not a silent
  // omission: revisit if a stacked-notification use case comes up.
  //
  // One live-Figma-build observation worth recording: appearance="inverse"
  // uses color.background.inverse/color.text.inverse, which are
  // light/dark-mode-flipping tokens by design (light mode: dark bg + white
  // text; dark mode: light bg + dark text) — confirmed by screenshotting
  // this component on Latent's own dark-mode doc-page frame, where
  // "inverse" correctly rendered as a LIGHT bar, not dark. This is the
  // token working as intended (inverse always means "opposite of this
  // context's default"), not a bug — worth knowing before assuming a
  // screenshot of "inverse" that isn't dark means something's wrong.
  figmaTokens: {
    "container padding (vertical)": "spacing.12",
    "container padding (horizontal)": "spacing.16",
    "container gap": "spacing.10",
    "content gap": "spacing.8",
    "container border-radius": "radius.lg",
    "inverse background": "color.background.inverse",
    "inverse text/icon color": "color.text.inverse",
    "subtle background": "color.background.subtle",
    "subtle border color": "color.border.default",
    "subtle border width": "sizing.border.thin",
    "subtle text/icon color": "color.text.secondary",
    "message font-size": "font-style.body-small",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.default",
  },
  // "focus ring color"/"focus ring width" are skipped below: a deliberate
  // code-only addition (Alert's action button focus style) with no
  // equivalent in the foreign reference, which had no accessibility
  // treatment at all — same reasoning as Calendar's focus-ring skip
  // entries.
  figmaTokensSkipLiveCheck: ["focus ring color", "focus ring width"],
  // 2026-08-27, found via a real plugin sync + CI check (not a routine
  // re-verify): the subtle variant's trailing icon changed in Figma from
  // chevron-down to circle-fading-plus, confirmed as a deliberate change
  // by the user, not an accident — ported to Alert.tsx to match. Also
  // found and fixed the same day: the "container gap" binding
  // (spacing.10, between the message content and the trailing icon) had
  // gone unbound in Figma — value was still correct, the Variable
  // reference itself was gone — re-bound directly, no code change needed
  // since the CSS value was already right.
};
