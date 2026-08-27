import React from "react";
import { Icon } from "./Icon";
import "./Checkbox.css";

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: CheckboxSize;
}

/**
 * Checkbox — a standalone boolean control, role="checkbox" on a real
 * <button> (same pattern as Switch's role="switch"), not a native
 * <input type="checkbox"> — matches this codebase's existing convention
 * rather than introducing a second one.
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, onChange, size = "md", disabled = false, className, ...rest }, ref) => {
    const classes = ["lat-checkbox", `lat-checkbox--${size}`, checked ? "lat-checkbox--checked" : "", className]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        className={classes}
        onClick={() => onChange(!checked)}
        {...rest}
      >
        {checked ? <Icon name="check" size="xs" className="lat-checkbox__icon" /> : null}
      </button>
    );
  }
);

Checkbox.displayName = "Checkbox";
