import React from "react";
import { Icon } from "./Icon";
import "./NavSubItem.css";

export interface NavSubItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  selected?: boolean;
  showIcon?: boolean;
}

/**
 * NavSubItem — the indented row used inside Nav Dropdown's expanded
 * sub-list. Same Selected x State pattern and token recipe as NavItem,
 * with a fixed leading corner-down-right icon instead of a swappable one
 * and no trailing chevron. Styling comes entirely from --lat-* custom
 * properties.
 */
export const NavSubItem = React.forwardRef<HTMLButtonElement, NavSubItemProps>(
  ({ label, selected = false, showIcon = true, disabled, className, ...rest }, ref) => {
    const classes = [
      "lat-nav-sub-item",
      selected ? "lat-nav-sub-item--selected" : "",
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
        aria-current={selected ? "page" : undefined}
        {...rest}
      >
        {showIcon ? (
          <Icon name="corner-down-right" size="sm" weight="light" className="lat-nav-sub-item__icon" />
        ) : null}
        <span className="lat-nav-sub-item__label">{label}</span>
      </button>
    );
  }
);

NavSubItem.displayName = "NavSubItem";
