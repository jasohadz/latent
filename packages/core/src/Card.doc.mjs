export default {
  name: "Card",
  summary: "Flexible content container. 6 layout variants share one set of boolean and text properties.",
  props: [
    { name: "layout", type: '"content" | "media" | "media-left" | "media-right" | "image-overlay" | "image-overlay-horizontal"', default: "content", description: "content has no media. media puts a full-width image above the content block. media-left/media-right put it beside the block. image-overlay(-horizontal) are full-bleed image cards with a progressive-blur text scrim." },
    { name: "showIcon", type: "boolean", default: "true", description: "Has no effect on the two image-overlay layouts, which have no icon badge." },
    { name: "showEyebrow", type: "boolean", default: "true", description: "Toggles the small overline label above the title. On image-overlay layouts it renders in the inverse (on-brand) text color instead." },
    { name: "showAction", type: "boolean", default: "true", description: "Toggles the secondary-variant CTA Button rendered at the end of the content block." },
    { name: "icon", type: "React.ReactNode", default: "undefined", description: "e.g. <Icon name=\"sparkles\" />, shown inside the icon badge." },
    { name: "eyebrowText", type: "string", default: '"OVERLINE"', description: "The overline label text, shown when showEyebrow is true." },
    { name: "title", type: "string", default: '"Get started with Latent"', description: "The card's headline." },
    { name: "body", type: "string", default: "—", description: "The supporting paragraph below the title." },
    { name: "ctaLabel", type: "string", default: '"Get started"', description: "Label for the CTA Button, shown when showAction is true." },
    { name: "onCtaClick", type: "() => void", default: "undefined", description: "Fires when the CTA Button is clicked." },
    { name: "imageSrc", type: "string", default: "undefined", description: "Required for media/media-left/media-right/image-overlay* layouts." },
    { name: "imageAlt", type: "string", default: '""', description: "Alt text for imageSrc. Empty by default, matching Figma's own image layers (decorative, no bound alt text)." },
  ],
  example: `<Card layout="media" imageSrc="/hero.jpg" title="Ship faster" body="..." ctaLabel="Learn more" />`,
  doNot: [
    "Don't use image-overlay layouts without imageSrc — there's no fallback background, so the progressive-blur scrim would render over nothing.",
    "Don't expect exact 1:1 parity on the progressive blur — Figma uses 5 fixed bands (2–30px blur, 6%–62% tint); this is a CSS approximation of the same technique, not a pixel-identical port.",
    "Don't assume image-overlay-horizontal fills its container — Figma ships it as a fixed 640x280 standalone instance size, not a responsive one. If it needs to span a full-width row/column, set width explicitly on the instance (e.g. width: 100%) — confirmed as a real gap by a real consumer needing exactly this override, not a hypothetical.",
  ],
  swizzlePath: "packages/core/src/Card.tsx",
  extends: null,
  // CTA reuses the real Button component with variant="secondary" — this
  // used to be flagged as an inexact match to Figma's CTA (appearance=
  // outline, blue border + link-colored text), since code's secondary was
  // a neutral gray button at the time. Button's secondary was fixed
  // 2026-08-26 to actually be Figma's outline look (see Button.doc.mjs) —
  // it's an exact match now, not an approximation.
  //
  // "surface shadow" is skipped below (figmaTokensSkipLiveCheck): elevation.*
  // is an Effect Style reference, not a Variable — check-component-bindings
  // only walks bound Variables, so it can never see this; check-styles/
  // styles.json already covers Effect Styles separately.
  // "body font-size": Figma's real text node binds font-size/body
  // (Breakpoint) — resolves to the same primitive as our declared
  // font-style.body (Semantic) at desktop. Same deliberate-simplification
  // pattern as Calendar's weekday font-size.
  // "overlay CTA background/text (hover)": confirmed the CTA instance
  // placed in Card's Image Overlay variant is state=default, not hover —
  // Card's canvas has no hover-state CTA instance to check against, the
  // same "single static instance" limitation Calendar's nav-button-hover
  // has. Kept as-is (matches Button's own secondary/outline hover recipe:
  // border→color.border.focus, text→color.text.link-hover) rather than
  // guess at something different for the overlay context specifically.
  figmaTokensSkipLiveCheck: ["surface shadow", "body font-size", "overlay CTA background (hover)", "overlay CTA text (hover)"],
  figmaTokens: {
    "surface background": "color.surface.raised",
    "surface border": "color.border.subtle",
    "surface border-radius": "radius.card",
    "surface shadow": "elevation.sm",
    "content padding/gap": "spacing.32",
    "content gap (items)": "spacing.16",
    "icon badge padding": "spacing.12",
    "icon badge background": "color.background.muted",
    "icon badge border-radius": "radius.lg",
    "icon color": "color.icon.default",
    "eyebrow color": "color.text.tertiary",
    "eyebrow font-family": "font-family.mono",
    "eyebrow font-size": "font-style.eyebrow",
    "eyebrow font-weight": "font-weight.500",
    "eyebrow line-height": "font-line-height.100-normal",
    "title color": "color.text.primary",
    "title font-size": "font-style.h4",
    "title line-height": "font-line-height.600-normal",
    "title font-weight": "font-weight.600",
    "body color": "color.text.secondary",
    "body font-size": "font-style.body",
    "overlay text color": "color.text.on-brand",
    "overlay CTA border": "color.border.brand",
    "overlay CTA text": "color.text.link",
    "overlay CTA background (hover)": "color.background.brand",
    "overlay CTA text (hover)": "color.text.link-hover",
  },
};
