import React from "react";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Optional trailing icon, e.g. `<Icon name="chevron-right" size="xs" />`. Omit for no icon. */
  icon?: React.ReactNode;
}

/**
 * Button — primitive action trigger. Styling comes entirely from
 * --lat-* custom properties (see packages/theme-neutral). Never hardcode
 * a color/spacing value here; add a new custom property if one is missing.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", isLoading = false, icon, className, children, disabled, ...rest },
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
        {isLoading ? (
          <>
            <span className="lat-button__visually-hidden">{children}</span>
            <span className="lat-button__spinner" aria-hidden="true">
              <span className="lat-button__spinner-dot" />
              <span className="lat-button__spinner-dot" />
              <span className="lat-button__spinner-dot" />
            </span>
          </>
        ) : (
          <>
            {children}
            {icon ? (
              <span className="lat-button__icon" aria-hidden="true">
                {icon}
              </span>
            ) : null}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
