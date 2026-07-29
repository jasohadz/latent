import React from "react";
import "./ToggleMultiple.css";

export interface ToggleMultipleProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  className?: string;
}

/**
 * ToggleMultiple — Toggle's 2-option recipe generalized to N options.
 * Styling comes entirely from --lat-* custom properties.
 */
export const ToggleMultiple = React.forwardRef<HTMLDivElement, ToggleMultipleProps>(
  ({ options, selectedIndex, onChange, className }, ref) => {
    const classes = ["lat-toggle-multiple", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} role="tablist">
        {options.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={i === selectedIndex}
            className={[
              "lat-toggle-multiple__option",
              i === selectedIndex ? "lat-toggle-multiple__option--selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onChange(i)}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }
);

ToggleMultiple.displayName = "ToggleMultiple";
