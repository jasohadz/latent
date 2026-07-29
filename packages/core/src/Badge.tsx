import React from "react";
import { Icon } from "./Icon";
import "./Badge.css";

export type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "danger";
export type BadgeSize = "small" | "medium" | "large";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Leading icon, e.g. <Icon name="sparkles" />. Sized automatically to match `size`. */
  icon?: React.ReactNode;
  /** Renders a trailing dismiss (x) button and fires this when clicked. */
  onDismiss?: () => void;
}

/**
 * Badge — a small status/label pill. Styling comes entirely from --lat-*
 * custom properties; never hardcode a color/spacing value here.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "neutral", size = "medium", icon, onDismiss, className, children, ...rest }, ref) => {
    const classes = [
      "lat-badge",
      `lat-badge--${variant}`,
      `lat-badge--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    // Figma's icon size is 12px at size=small and 14px at medium/large — the
    // closest available Icon tokens are xs (12px) and sm (16px); no exact
    // 14px token exists.
    const iconSize = size === "small" ? "xs" : "sm";

    return (
      <span ref={ref} className={classes} {...rest}>
        {icon ? (
          <span className="lat-badge__icon" aria-hidden="true">
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<{ size?: string }>, { size: iconSize })
              : icon}
          </span>
        ) : null}
        <span className="lat-badge__label">{children}</span>
        {onDismiss ? (
          <button
            type="button"
            className="lat-badge__dismiss"
            aria-label="Dismiss"
            onClick={onDismiss}
          >
            <Icon name="x" size={iconSize} />
          </button>
        ) : null}
      </span>
    );
  }
);

Badge.displayName = "Badge";
