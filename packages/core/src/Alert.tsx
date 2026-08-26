import React from "react";
import { Icon } from "./Icon";
import "./Alert.css";

export type AlertAppearance = "inverse" | "subtle";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  appearance?: AlertAppearance;
  /** Leading icon, e.g. <Icon name="megaphone" />. */
  icon?: React.ReactNode;
  /** The message text. */
  children: React.ReactNode;
  /** inverse only: renders a trailing dismiss (x) button and fires this when clicked. */
  onDismiss?: () => void;
  /** subtle only: renders a trailing chevron-down expand affordance and fires this when clicked. */
  onExpand?: () => void;
}

/**
 * Alert — an inline banner for announcements and actionable notices.
 * Styling comes entirely from --lat-* custom properties, never hardcoded.
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ appearance = "inverse", icon, children, onDismiss, onExpand, className, ...rest }, ref) => {
    const classes = ["lat-alert", `lat-alert--${appearance}`, className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} role="status" {...rest}>
        <div className="lat-alert__content">
          {icon ? (
            <span className="lat-alert__icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <span className="lat-alert__message">{children}</span>
        </div>
        {appearance === "inverse" && onDismiss ? (
          <button type="button" className="lat-alert__action" aria-label="Dismiss" onClick={onDismiss}>
            <Icon name="x" size="sm" />
          </button>
        ) : null}
        {appearance === "subtle" && onExpand ? (
          <button type="button" className="lat-alert__action" aria-label="Expand" onClick={onExpand}>
            <Icon name="chevron-down" size="sm" />
          </button>
        ) : null}
      </div>
    );
  }
);

Alert.displayName = "Alert";
