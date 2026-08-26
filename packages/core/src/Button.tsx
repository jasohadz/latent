import React from "react";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Optional trailing icon, e.g. `<Icon name="chevron-right" size="xs" />`. Omit for no icon. */
  icon?: React.ReactNode;
}

/**
 * iconOnly is a discriminated union, not a plain optional boolean: when
 * true, aria-label becomes required at the type level, not just enforced
 * by a dev-mode console.warn (which a production build silently drops).
 * This is the standard pattern real component libraries use for exactly
 * this problem (Radix, Chakra, etc.) — it only helps TypeScript consumers,
 * but nothing in this repo ships to a non-TS consumer today, and it's a
 * real compile-time guarantee rather than a runtime hint that can be missed.
 */
export type ButtonProps =
  | (ButtonBaseProps & {
      /**
       * Renders a square, icon-only trigger (Figma's Button "icon only"
       * variant). Pass the icon via `icon`, omit `children`. Same fixed
       * size (36×36) regardless of `size` — Figma's icon-only variant
       * doesn't scale with it either.
       */
      iconOnly: true;
      /** Required when iconOnly is true — no visible text remains for the accessible name. */
      "aria-label": string;
    })
  | (ButtonBaseProps & { iconOnly?: false });

/**
 * Button — primitive action trigger. Styling comes entirely from
 * --lat-* custom properties (see packages/theme-neutral). Never hardcode
 * a color/spacing value here; add a new custom property if one is missing.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", isLoading = false, icon, iconOnly = false, className, children, disabled, ...rest },
    ref
  ) => {
    // typeof process check first — this file has no bundler-config
    // dependency otherwise, and a raw browser environment (no Vite/webpack
    // `define` shim for process.env) would throw ReferenceError on
    // `process.env` directly rather than just skipping the dev-only warning.
    // Confirmed as a real gap, not hypothetical: packages/chat-app's own
    // vite.config.ts needs an explicit `define` for exactly this.
    const isProd = typeof process !== "undefined" && process.env?.NODE_ENV === "production";
    if (!isProd && iconOnly && !rest["aria-label"]) {
      console.warn("Button: iconOnly buttons must have an aria-label — there is no visible text for the accessible name.");
    }
    if (!isProd && variant === "ghost" && !iconOnly) {
      console.warn("Button: the ghost variant is only defined in Figma for iconOnly buttons — its look with visible text is unverified.");
    }

    const classes = [
      "lat-button",
      `lat-button--${variant}`,
      `lat-button--${size}`,
      isLoading ? "lat-button--loading" : "",
      iconOnly ? "lat-button--icon-only" : "",
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
            {!iconOnly && <span className="lat-button__visually-hidden">{children}</span>}
            <span className="lat-button__spinner" aria-hidden="true">
              <span className="lat-button__spinner-dot" />
              <span className="lat-button__spinner-dot" />
              <span className="lat-button__spinner-dot" />
            </span>
          </>
        ) : iconOnly ? (
          <span className="lat-button__icon" aria-hidden="true">
            {icon}
          </span>
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
