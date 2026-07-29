import React from "react";
import "./Toggle.css";

export interface ToggleProps {
  options: [string, string];
  selectedIndex: 0 | 1;
  onChange: (index: 0 | 1) => void;
  className?: string;
}

/**
 * Toggle — a 2-option segmented control for mutually exclusive choices.
 * See ToggleMultiple for the same recipe generalized to N options.
 * Styling comes entirely from --lat-* custom properties.
 */
export const Toggle = React.forwardRef<HTMLDivElement, ToggleProps>(
  ({ options, selectedIndex, onChange, className }, ref) => {
    const classes = ["lat-toggle", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} role="tablist">
        {options.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={i === selectedIndex}
            className={["lat-toggle__option", i === selectedIndex ? "lat-toggle__option--selected" : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onChange(i as 0 | 1)}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }
);

Toggle.displayName = "Toggle";
