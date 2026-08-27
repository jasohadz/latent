import React from "react";
import "./SelectOption.css";

export interface SelectOptionProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  /** Only affects aria-selected — no distinct visual treatment, matching the Figma reference's own Dropdown Item (which has just default/hover, no separate selected style). Selection is communicated by the option's chip appearing in the trigger, not by the row itself. */
  selected?: boolean;
}

/**
 * SelectOption — a single row inside Select's or MultiSelect's floating
 * panel. A <div role="option">, not a <button> (see the 2026-08-27 fix
 * note below for why). role="option" is also a pragmatic simplification,
 * not a full ARIA listbox/roving-tabindex pattern: each option is
 * individually Tab-reachable rather than managed via a single roving
 * tabindex plus aria-activedescendant, same honest tradeoff NavDropdown's
 * own sub-list already documents.
 */
export const SelectOption = React.forwardRef<HTMLDivElement, SelectOptionProps>(
  ({ label, selected = false, className, onClick, onKeyDown, ...rest }, ref) => {
    const classes = ["lat-select-option", className].filter(Boolean).join(" ");

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    }

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={selected}
        tabIndex={0}
        className={classes}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <span className="lat-select-option__label">{label}</span>
      </div>
    );
  }
);

SelectOption.displayName = "SelectOption";
