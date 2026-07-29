import React from "react";
import { Icon } from "./Icon";
import "./Search.css";

export type SearchAppearance = "filled" | "outline";

export interface SearchProps {
  appearance?: SearchAppearance;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Search — a search field with a leading search icon, optional trailing
 * clear button (shown when there's a value), and an attached circular
 * submit button reusing Button's primary color ramp. Built at one size
 * (Density=Default) — a small/condensed tier is a documented gap, not
 * yet built (matches the Figma component's own noted v1 scope).
 * Styling comes entirely from --lat-* custom properties.
 */
export const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  (
    { appearance = "outline", value, onChange, onSubmit, placeholder = "Search...", disabled = false, className },
    ref
  ) => {
    const classes = [
      "lat-search",
      `lat-search--${appearance}`,
      disabled ? "lat-search--disabled" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={classes}>
        <div className="lat-search__field">
          <Icon name="search" size="md" className="lat-search__leading-icon" />
          <input
            ref={ref}
            type="text"
            className="lat-search__input"
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
          />
          {value ? (
            <button
              type="button"
              className="lat-search__clear"
              aria-label="Clear search"
              onClick={() => onChange("")}
            >
              <Icon name="x" size="xs" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="lat-search__submit"
          aria-label="Submit search"
          disabled={disabled}
          onClick={onSubmit}
        >
          <Icon name="search" size="xs" className="lat-search__submit-icon" />
        </button>
      </div>
    );
  }
);

Search.displayName = "Search";
