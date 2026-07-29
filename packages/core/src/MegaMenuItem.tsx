import React from "react";
import { Badge } from "./Badge";
import "./MegaMenuItem.css";

export type MegaMenuItemLayout = "standard" | "featured";

export interface MegaMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  layout?: MegaMenuItemLayout;
  icon?: React.ReactNode;
  title: string;
  description: string;
  /** Only rendered when layout="featured". */
  badgeLabel?: string;
}

/**
 * MegaMenuItem — the atomic row used inside TopNav's Product and Download
 * dropdown panels. Styling comes entirely from --lat-* custom properties.
 */
export const MegaMenuItem = React.forwardRef<HTMLButtonElement, MegaMenuItemProps>(
  ({ layout = "standard", icon, title, description, badgeLabel = "New", className, ...rest }, ref) => {
    const classes = [
      "lat-mega-menu-item",
      `lat-mega-menu-item--${layout}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} type="button" className={classes} {...rest}>
        {icon ? <span className="lat-mega-menu-item__icon">{icon}</span> : null}
        <span className="lat-mega-menu-item__text-col">
          <span className="lat-mega-menu-item__title">{title}</span>
          <span className="lat-mega-menu-item__description">{description}</span>
        </span>
        {layout === "featured" ? <Badge variant="neutral" size="small">{badgeLabel}</Badge> : null}
      </button>
    );
  }
);

MegaMenuItem.displayName = "MegaMenuItem";
