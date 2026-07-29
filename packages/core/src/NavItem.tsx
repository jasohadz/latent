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
      disabled,
      className,
      ...rest
    },
    ref
  ) => {
    const classes = [
      "lat-nav-item",
      selected ? "lat-nav-item--selected" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} type="button" className={classes} disabled={disabled} {...rest}>
        {showIcon && icon ? <span className="lat-nav-item__icon">{icon}</span> : null}
        <span className="lat-nav-item__label">{label}</span>
        {showChevron ? (
          <Icon name={chevronName} size="sm" weight="light" className="lat-nav-item__chevron" />
        ) : null}
      </button>
    );
  }
);

NavItem.displayName = "NavItem";
