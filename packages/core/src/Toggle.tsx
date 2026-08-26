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
    const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

    // role="tablist"/"tab" (below) is the WAI-ARIA tabs pattern, which
    // requires roving tabindex + arrow-key navigation between tabs — using
    // the roles without them (the previous state of this file) is worse
    // than using no ARIA role at all, since a screen reader announces tab
    // behavior that doesn't exist. Automatic activation (arrow moves focus
    // AND selection together) since this is an instant segmented control,
    // not a tabs-with-heavy-panel-loading widget — matches the APG's
    // "Tabs with Automatic Activation" example. Wraps at both ends.
    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      let next: number;
      if (e.key === "ArrowRight") next = selectedIndex === 1 ? 0 : 1;
      else if (e.key === "ArrowLeft") next = selectedIndex === 0 ? 1 : 0;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = 1;
      else return;
      e.preventDefault();
      onChange(next as 0 | 1);
      buttonRefs.current[next]?.focus();
    }

    return (
      <div ref={ref} className={classes} role="tablist" onKeyDown={handleKeyDown}>
        {options.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            tabIndex={i === selectedIndex ? 0 : -1}
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
