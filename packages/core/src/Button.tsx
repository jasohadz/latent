import React from "react";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

/**
 * Button — primitive action trigger. Styling comes entirely from
 * --lat-* custom properties (see packages/theme-neutral). Never hardcode
 * a color/spacing value here; add a new custom property if one is missing.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", isLoading = false, className, children, disabled, ...rest },
    ref
  ) => {
    const classes = [
      "lat-button",
      `lat-button--${variant}`,
      `lat-button--${size}`,
      isLoading ? "lat-button--loading" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
