import React from "react";
import { Icon } from "./Icon";
import "./NavItem.css";

export interface NavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  selected?: boolean;
  showIcon?: boolean;
  icon?: React.ReactNode;
  showChevron?: boolean;
  /** e.g. "chevron-down" / "chevron-up" — Nav Dropdown flips this based on its own expanded state. */
  chevronName?: string;
  /**
   * Renders just the icon in a square button, dropping the label and
   * chevron regardless of `showChevron` — used by Side Nav's Collapsed
   * state. The existing padding naturally squares up once the label's
   * gone (no separate fixed size needed).
   */
  iconOnly?: boolean;
}

/**
 * NavItem — the atomic row used inside Side Nav's expanded nav list and as
 * Nav Dropdown's trigger. Styling comes entirely from --lat-* custom
 * properties.
 */
export const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
  (
    {
      label,
      selected = false,
      showIcon = true,
      icon,
      showChevron = true,
      chevronName = "chevron-down",
      iconOnly = false,
      disabled,
      className,
      ...rest
    },
    ref
  ) => {
    const classes = [
      "lat-nav-item",
      selected ? "lat-nav-item--selected" : "",
      iconOnly ? "lat-nav-item--icon-only" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type="button"
        className={classes}
        disabled={disabled}
        aria-label={iconOnly ? label : undefined}
        aria-current={selected ? "page" : undefined}
        {...rest}
      >
        {showIcon && icon ? <span className="lat-nav-item__icon">{icon}</span> : null}
        {iconOnly ? null : <span className="lat-nav-item__label">{label}</span>}
        {!iconOnly && showChevron ? (
          <Icon name={chevronName} size="sm" weight="light" className="lat-nav-item__chevron" />
        ) : null}
      </button>
    );
  }
);

NavItem.displayName = "NavItem";
