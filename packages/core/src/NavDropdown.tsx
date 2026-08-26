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
  /**
   * Renders just the trigger's icon, matching NavItem's own iconOnly —
   * used by Side Nav's Collapsed state. The sub-list never renders in this
   * mode regardless of `expanded`, matching Figma's Collapsed instance
   * (which has no sub-list content at all, not just a hidden one).
   */
  iconOnly?: boolean;
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
  ({ label, icon, selected = false, expanded, onToggle, subItems, iconOnly = false, className }, ref) => {
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const subItemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

    // Escape closes and returns focus to the trigger. Up/Down/Home/End move
    // focus between sub-items as a keyboard convenience — deliberately NOT a
    // roving-tabindex composite widget (unlike Toggle/Calendar): NavSubItem
    // stays individually Tab-reachable exactly as before, since this sub-list
    // has no role="menu"/"listbox" implying that pattern, and adding one
    // without full menu semantics (typeahead, etc.) would overclaim, the same
    // mistake Toggle's unimplemented ARIA-tabs roles made before that fix.
    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      if (e.key === "Escape" && expanded) {
        e.preventDefault();
        onToggle(false);
        triggerRef.current?.focus();
        return;
      }
      if (!expanded || subItems.length === 0) return;
      const count = subItems.length;
      const current = subItemRefs.current.findIndex((el) => el === document.activeElement);
      let next: number;
      if (e.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % count;
      else if (e.key === "ArrowUp") next = current < 0 ? count - 1 : (current - 1 + count) % count;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = count - 1;
      else return;
      e.preventDefault();
      subItemRefs.current[next]?.focus();
    }

    return (
      <div
        ref={ref}
        className={["lat-nav-dropdown", className].filter(Boolean).join(" ")}
        onKeyDown={handleKeyDown}
      >
        <NavItem
          ref={triggerRef}
          label={label}
          icon={icon}
          selected={selected}
          iconOnly={iconOnly}
          chevronName={expanded ? "chevron-up" : "chevron-down"}
          onClick={() => onToggle(!expanded)}
          aria-expanded={expanded}
        />
        {!iconOnly && expanded ? (
          <div className="lat-nav-dropdown__sub-list">
            {subItems.map((item, i) => (
              <NavSubItem
                key={item.label}
                ref={(el) => {
                  subItemRefs.current[i] = el;
                }}
                label={item.label}
                selected={item.selected}
                onClick={item.onClick}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

NavDropdown.displayName = "NavDropdown";
