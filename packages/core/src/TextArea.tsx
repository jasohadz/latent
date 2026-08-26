import React from "react";
import "./TextArea.css";

export type TextAreaAppearance = "filled" | "outline";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  appearance?: TextAreaAppearance;
  /** Not a native pseudo-state — set explicitly (e.g. from form validation). */
  error?: boolean;
}

/**
 * TextArea — multi-line text input. Same visual family as TextField, fixed
 * at 100px height. Styling comes entirely from --lat-* custom properties.
 */
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ appearance = "outline", error = false, className, ...rest }, ref) => {
    const classes = [
      "lat-text-area",
      `lat-text-area--${appearance}`,
      error ? "lat-text-area--error" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <textarea
        ref={ref}
        placeholder="Enter text"
        className={classes}
        aria-invalid={error || undefined}
        {...rest}
      />
    );
  }
);

TextArea.displayName = "TextArea";
