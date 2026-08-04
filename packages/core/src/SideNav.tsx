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
 * SideNav — a floating sidebar navigation panel. Expanded shows the brand
 * header, full nav list, and a footer row. Collapsed is a narrow icon
 * rail: brand/footer hide entirely, and the same nav items render
 * icon-only above just the expand toggle. Styling comes entirely from
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
          <div className="lat-side-nav__header lat-side-nav__header--collapsed">
            {showToggleIcon ? (
              <button type="button" className="lat-side-nav__toggle" aria-label="Expand" onClick={onToggleCollapse}>
                <Icon name="panel-left" size="sm" weight="light" />
              </button>
            ) : null}
          </div>
          <div className="lat-side-nav__list">
            {React.Children.map(children, (child) =>
              React.isValidElement(child)
                ? React.cloneElement(child as React.ReactElement<{ iconOnly?: boolean }>, { iconOnly: true })
                : child
            )}
          </div>
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
