import React from "react";
import "./Spinner.css";

export type SpinnerSize = "sm" | "md" | "lg";
export type SpinnerVariant = "primary" | "secondary";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  /** Screen-reader text; visually hidden. */
  label?: string;
}

/**
 * Spinner — indeterminate loading indicator. Sized and colored from the
 * same tokens Button already uses (size from --lat-typography-button-*
 * font-size / --lat-font-size-500, color from --lat-color-action-primary-*
 * and --lat-color-text-*) so it drops into Button's isLoading state — see
 * Button's isLoading prop — without introducing a new token vocabulary.
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ size = "md", variant = "primary", label = "Loading", className, ...rest }, ref) => {
    const classes = ["lat-spinner", `lat-spinner--${size}`, `lat-spinner--${variant}`, className]
      .filter(Boolean)
      .join(" ");

    return (
      <span ref={ref} className={classes} role="status" aria-live="polite" {...rest}>
        <span className="lat-spinner__sr-only">{label}</span>
      </span>
    );
  }
);

Spinner.displayName = "Spinner";
