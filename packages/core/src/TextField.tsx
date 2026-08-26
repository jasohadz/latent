import React from "react";
import "./TextField.css";

export type TextFieldAppearance = "filled" | "outline";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  appearance?: TextFieldAppearance;
  /** Not a native pseudo-state — set explicitly (e.g. from form validation). */
  error?: boolean;
}

/**
 * TextField — single-line text input. Styling comes entirely from --lat-*
 * custom properties.
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ appearance = "outline", error = false, className, ...rest }, ref) => {
    const classes = [
      "lat-text-field",
      `lat-text-field--${appearance}`,
      error ? "lat-text-field--error" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <input
        ref={ref}
        type="text"
        placeholder="Enter text"
        className={classes}
        aria-invalid={error || undefined}
        {...rest}
      />
    );
  }
);

TextField.displayName = "TextField";
