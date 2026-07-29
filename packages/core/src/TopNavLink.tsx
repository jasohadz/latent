import React from "react";
import { Icon } from "./Icon";
import "./TopNavLink.css";

export interface TopNavLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  showChevron?: boolean;
}

/**
 * TopNavLink — the atomic link used inside TopNav's bar for Product,
 * Download, and Pricing. Styling comes entirely from --lat-* custom
 * properties.
 */
export const TopNavLink = React.forwardRef<HTMLButtonElement, TopNavLinkProps>(
  ({ label, active = false, showChevron = true, className, ...rest }, ref) => {
    const classes = [
      "lat-top-nav-link",
      active ? "lat-top-nav-link--active" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} type="button" className={classes} {...rest}>
        <span className="lat-top-nav-link__label">{label}</span>
        {showChevron ? <Icon name="chevron-down" size="xs" weight="light" className="lat-top-nav-link__chevron" /> : null}
      </button>
    );
  }
);

TopNavLink.displayName = "TopNavLink";
