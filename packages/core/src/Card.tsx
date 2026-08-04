import React from "react";
import { Button } from "./Button";
import "./Card.css";

export type CardLayout =
  | "content"
  | "media"
  | "media-left"
  | "media-right"
  | "image-overlay"
  | "image-overlay-horizontal";

export interface CardProps {
  layout?: CardLayout;
  /** Has no effect on the two image-overlay layouts, which have no icon badge. */
  showIcon?: boolean;
  showEyebrow?: boolean;
  showAction?: boolean;
  icon?: React.ReactNode;
  eyebrowText?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  /** Required for media/media-left/media-right/image-overlay* layouts. */
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
}

// 5 stacked bands approximating Figma's progressive blur (2→30px) and
// dark-tint ramp (6%→62%) toward the anchored edge.
const BLUR_STEPS = [2, 9, 16, 23, 30];
const TINT_STEPS = [0.06, 0.2, 0.34, 0.48, 0.62];

function ProgressiveBlur({ horizontal }: { horizontal: boolean }) {
  // Vertical: array order (ascending blur) maps top→bottom, which is
  // correct as-is — text sits at the bottom (margin-top: auto), so the
  // bottom band should be the most blurred/tinted, matching [2..30] in
  // document order. Horizontal: text is anchored LEFT instead, so the
  // *left* band needs to be the most blurred/tinted — reversing the arrays
  // for this case, rather than the vertical case's natural order.
  const blurSteps = horizontal ? [...BLUR_STEPS].reverse() : BLUR_STEPS;
  const tintSteps = horizontal ? [...TINT_STEPS].reverse() : TINT_STEPS;
  const n = blurSteps.length;
  // 0% on this axis must land on the anchored (heaviest-blur) edge: left
  // for horizontal (already true given the reversal above via "to right"),
  // bottom for vertical — hence "to top", not "to bottom".
  const axis = horizontal ? "to right" : "to top";

  return (
    <div className={horizontal ? "lat-card__blur-stack--horizontal" : "lat-card__blur-stack"}>
      {blurSteps.map((blur, i) => {
        // rank 0 = heaviest band, sitting right at the anchor edge (0% on
        // the axis above). Each successive rank covers a wider swath
        // reaching further from the anchor before fading to transparent,
        // so bands pile up near the anchor (max cumulative blur/tint) and
        // thin out one by one toward the clear side of the image — not a
        // one-directional ramp that stays opaque past its own band, which
        // was darkening/blurring almost the entire frame.
        const rank = horizontal ? i : n - 1 - i;
        const feather = 100 / n;
        // Pulled the whole ramp 15% back toward the anchor edge for the
        // horizontal layout per feedback — the blur/tint was extending too
        // far into the clear side of the photo.
        const anchorOffset = horizontal ? 15 : 0;
        const coverage = Math.max(0, ((rank + 1) / n) * 100 - anchorOffset);
        const solidEnd = Math.max(0, coverage - feather);
        const mask = `linear-gradient(${axis}, black 0%, black ${solidEnd}%, transparent ${coverage}%)`;
        return (
          <div
            key={blur}
            className="lat-card__blur-band"
            style={{
              backdropFilter: `blur(${blur}px)`,
              backgroundColor: `rgba(0, 0, 0, ${tintSteps[i]})`,
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Card — flexible content container. 6 layout variants share one set of
 * boolean and text properties. Styling comes entirely from --lat-* custom
 * properties.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      layout = "content",
      showIcon = true,
      showEyebrow = true,
      showAction = true,
      icon,
      eyebrowText = "OVERLINE",
      title = "Get started with Latent",
      body = "Simply sign up, set up your team, and see the difference in how you work together.",
      ctaLabel = "Get started",
      onCtaClick,
      imageSrc,
      imageAlt = "",
      className,
    },
    ref
  ) => {
    const classes = ["lat-card", `lat-card--${layout}`, className].filter(Boolean).join(" ");

    const content = (
      <div className="lat-card__content">
        {showIcon && icon ? <span className="lat-card__icon">{icon}</span> : null}
        {showEyebrow ? <span className="lat-card__eyebrow">{eyebrowText}</span> : null}
        <span className="lat-card__title">{title}</span>
        <span className="lat-card__body">{body}</span>
        {showAction ? (
          <Button variant="secondary" size="sm" onClick={onCtaClick}>
            {ctaLabel}
          </Button>
        ) : null}
      </div>
    );

    if (layout === "image-overlay" || layout === "image-overlay-horizontal") {
      const horizontal = layout === "image-overlay-horizontal";
      return (
        <div ref={ref} className={classes}>
          {imageSrc ? <img className="lat-card__overlay-image" src={imageSrc} alt={imageAlt} /> : null}
          <ProgressiveBlur horizontal={horizontal} />
          <div className="lat-card__overlay-content">
            {showEyebrow ? <span className="lat-card__eyebrow lat-card__eyebrow--inverse">{eyebrowText}</span> : null}
            <span className="lat-card__title lat-card__title--inverse">{title}</span>
            <span className="lat-card__body lat-card__body--inverse">{body}</span>
            {showAction ? (
              <Button variant="secondary" size="sm" onClick={onCtaClick}>
                {ctaLabel}
              </Button>
            ) : null}
          </div>
        </div>
      );
    }

    if (layout === "media") {
      return (
        <div ref={ref} className={classes}>
          {imageSrc ? <img className="lat-card__media-image lat-card__media-image--top" src={imageSrc} alt={imageAlt} /> : null}
          {content}
        </div>
      );
    }

    if (layout === "media-left" || layout === "media-right") {
      return (
        <div ref={ref} className={classes}>
          {layout === "media-left" && imageSrc ? (
            <img className="lat-card__media-image lat-card__media-image--side" src={imageSrc} alt={imageAlt} />
          ) : null}
          {content}
          {layout === "media-right" && imageSrc ? (
            <img className="lat-card__media-image lat-card__media-image--side" src={imageSrc} alt={imageAlt} />
          ) : null}
        </div>
      );
    }

    return (
      <div ref={ref} className={classes}>
        {content}
      </div>
    );
  }
);

Card.displayName = "Card";
