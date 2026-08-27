import React from "react";
import { Checkbox } from "./Checkbox";
import "./SelectOption.css";

export interface SelectOptionProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  selected?: boolean;
  /** Shows a leading Checkbox reflecting `selected` — MultiSelect's rows use this; Select's own rows omit it. */
  showCheckbox?: boolean;
}

/**
 * SelectOption — a single row inside Select's or MultiSelect's floating
 * panel. A <div role="option">, not a <button> — showCheckbox renders a
 * real (decorative) Checkbox, which is itself a <button>, and a <button>
 * can't be a descendant of another <button> (invalid HTML, breaks click
 * semantics — caught via a real React DOM-nesting warning, not
 * theoretically). role="option" is also a pragmatic simplification, not a
 * full ARIA listbox/roving-tabindex pattern: each option is individually
 * Tab-reachable rather than managed via a single roving tabindex plus
 * aria-activedescendant, same honest tradeoff NavDropdown's own sub-list
 * already documents.
 */
export const SelectOption = React.forwardRef<HTMLDivElement, SelectOptionProps>(
  ({ label, selected = false, showCheckbox = false, className, onClick, onKeyDown, ...rest }, ref) => {
    const classes = ["lat-select-option", selected ? "lat-select-option--selected" : "", className]
      .filter(Boolean)
      .join(" ");

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
        {showCheckbox ? (
          <Checkbox
            checked={selected}
            onChange={() => {}}
            size="sm"
            tabIndex={-1}
            aria-hidden="true"
            className="lat-select-option__checkbox"
          />
        ) : null}
        <span className="lat-select-option__label">{label}</span>
      </div>
    );
  }
);

SelectOption.displayName = "SelectOption";
