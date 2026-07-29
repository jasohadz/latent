import React from "react";
import { Icon } from "./Icon";
import "./SideNav.css";

export interface SideNavProps {
  collapsed?: boolean;
  brand?: string;
  /** Latent's own logo mark isn't a ported component — supply your own brand icon. */
  logo?: React.ReactNode;
  showToggleIcon?: boolean;
  onToggleCollapse?: () => void;
  footerLabel?: string;
  showFooterIcon?: boolean;
  /** Real NavItem / NavDropdown instances, in order. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * SideNav — a floating sidebar navigation panel. Collapsed tucks
 * everything into a compact brand pill with an expand toggle; Expanded
 * shows the full nav list plus a footer row. Styling comes entirely from
 * --lat-* custom properties.
 */
export const SideNav = React.forwardRef<HTMLDivElement, SideNavProps>(
  (
    {
      collapsed = false,
      brand = "Acme Inc.",
      logo,
      showToggleIcon = true,
      onToggleCollapse,
      footerLabel = "Privacy",
      showFooterIcon = true,
      children,
      className,
    },
    ref
  ) => {
    const classes = [
      "lat-side-nav",
      collapsed ? "lat-side-nav--collapsed" : "lat-side-nav--expanded",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (collapsed) {
      return (
        <div ref={ref} className={classes}>
          {logo}
          <span className="lat-side-nav__brand">{brand}</span>
          {showToggleIcon ? (
            <button type="button" className="lat-side-nav__toggle" aria-label="Expand" onClick={onToggleCollapse}>
              <Icon name="panel-left" size="sm" weight="light" />
            </button>
          ) : null}
        </div>
      );
    }

    return (
      <div ref={ref} className={classes}>
        <div className="lat-side-nav__header">
          {logo}
          <span className="lat-side-nav__brand">{brand}</span>
          {showToggleIcon ? (
            <button type="button" className="lat-side-nav__toggle" aria-label="Collapse" onClick={onToggleCollapse}>
              <Icon name="panel-left" size="sm" weight="light" />
            </button>
          ) : null}
        </div>
        <div className="lat-side-nav__list">{children}</div>
        <div className="lat-side-nav__divider" />
        <div className="lat-side-nav__footer">
          <span className="lat-side-nav__footer-label">{footerLabel}</span>
          {showFooterIcon ? <Icon name="shield" size="sm" weight="light" /> : null}
        </div>
      </div>
    );
  }
);

SideNav.displayName = "SideNav";
