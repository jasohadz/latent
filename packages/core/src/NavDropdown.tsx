import React from "react";
import { NavItem } from "./NavItem";
import { NavSubItem } from "./NavSubItem";
import "./NavDropdown.css";

export interface NavDropdownSubItem {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export interface NavDropdownProps {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  subItems: NavDropdownSubItem[];
  className?: string;
}

/**
 * NavDropdown — a real NavItem trigger paired with an indented list of
 * real NavSubItem instances, for expandable nav groups. The trigger's
 * chevron flips chevron-down (collapsed) / chevron-up (expanded), matching
 * the standard open/closed disclosure convention. Styling comes entirely
 * from --lat-* custom properties.
 */
export const NavDropdown = React.forwardRef<HTMLDivElement, NavDropdownProps>(
  ({ label, icon, selected = false, expanded, onToggle, subItems, className }, ref) => {
    return (
      <div ref={ref} className={["lat-nav-dropdown", className].filter(Boolean).join(" ")}>
        <NavItem
          label={label}
          icon={icon}
          selected={selected}
          chevronName={expanded ? "chevron-up" : "chevron-down"}
          onClick={() => onToggle(!expanded)}
          aria-expanded={expanded}
        />
        {expanded ? (
          <div className="lat-nav-dropdown__sub-list">
            {subItems.map((item) => (
              <NavSubItem key={item.label} label={item.label} selected={item.selected} onClick={item.onClick} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

NavDropdown.displayName = "NavDropdown";
