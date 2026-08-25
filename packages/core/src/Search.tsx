import React from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";
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
 * Search — a search field with an optional trailing clear button (shown
 * when there's a value) and an attached submit button rendered as a real
 * Button instance (variant="primary" iconOnly). No leading icon — Figma's
 * Search component has a leading-icon boolean property, but it's off in
 * all 16 variants.
 * Built at one size (Density=Default) — a small/condensed tier is a
 * documented gap, not yet built (matches the Figma component's own noted
 * v1 scope). Styling comes entirely from --lat-* custom properties.
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
        <Button
          variant="primary"
          iconOnly
          className="lat-search__submit"
          aria-label="Submit search"
          disabled={disabled}
          onClick={onSubmit}
          icon={<Icon name="search" size="xs" />}
        />
      </div>
    );
  }
);

Search.displayName = "Search";
