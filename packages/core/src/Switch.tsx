import React from "react";
import "./Switch.css";

export interface SwitchProps {
  pressed: boolean;
  onChange: (pressed: boolean) => void;
  disabled?: boolean;
  /** Optional caption rendered beside the track. Also the switch's accessible name. */
  supportingText?: string;
  /** Accessible name when there's no supportingText — a switch with neither has no name at all. */
  "aria-label"?: string;
  className?: string;
}

/**
 * Switch — an on/off toggle for boolean settings. Styling comes entirely
 * from --lat-* custom properties.
 *
 * @import import { Switch } from "@latent/core/Switch";
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ pressed, onChange, disabled = false, supportingText, className, "aria-label": ariaLabel }, ref) => {
    const classes = ["lat-switch", className].filter(Boolean).join(" ");
    const textId = React.useId();

    if (typeof process !== "undefined" && process.env.NODE_ENV !== "production" && !supportingText && !ariaLabel) {
      console.warn("Switch: pass supportingText or aria-label — without either, the switch has no accessible name.");
    }

    return (
      <span className={classes}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={pressed}
          // The visible caption names the switch (axe's button-name failed
          // on every Switch story until 2026-10-02 — the caption sat beside
          // the button, unconnected).
          aria-labelledby={supportingText ? textId : undefined}
          aria-label={supportingText ? undefined : ariaLabel}
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
          <span id={textId} className="lat-switch__supporting-text">{supportingText}</span>
        ) : null}
      </span>
    );
  }
);

Switch.displayName = "Switch";
