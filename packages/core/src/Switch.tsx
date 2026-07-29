import React from "react";
import "./Switch.css";

export interface SwitchProps {
  pressed: boolean;
  onChange: (pressed: boolean) => void;
  disabled?: boolean;
  /** Optional caption rendered beside the track. */
  supportingText?: string;
  className?: string;
}

/**
 * Switch — an on/off toggle for boolean settings. Styling comes entirely
 * from --lat-* custom properties.
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ pressed, onChange, disabled = false, supportingText, className }, ref) => {
    const classes = ["lat-switch", className].filter(Boolean).join(" ");

    return (
      <span className={classes}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={pressed}
          disabled={disabled}
          className={[
            "lat-switch__track",
            pressed ? "lat-switch__track--on" : "",
            disabled ? "lat-switch__track--disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onChange(!pressed)}
        >
          <span className="lat-switch__thumb" />
        </button>
        {supportingText ? (
          <span className="lat-switch__supporting-text">{supportingText}</span>
        ) : null}
      </span>
    );
  }
);

Switch.displayName = "Switch";
