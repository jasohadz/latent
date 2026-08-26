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
      const count = options.length;
      let next: number;
      if (e.key === "ArrowRight") next = (selectedIndex + 1) % count;
      else if (e.key === "ArrowLeft") next = (selectedIndex - 1 + count) % count;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = count - 1;
      else return;
      e.preventDefault();
      onChange(next);
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
