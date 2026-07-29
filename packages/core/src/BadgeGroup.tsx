import React from "react";
import { Badge } from "./Badge";
import { Icon } from "./Icon";
import "./BadgeGroup.css";

export type BadgeGroupPosition = "leading" | "trailing" | "none";
export type BadgeGroupSize = "small" | "large";

export interface BadgeGroupProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** leading: Badge -> text -> chevron. trailing: text -> Badge (no chevron). none: text -> chevron (no Badge). */
  position?: BadgeGroupPosition;
  size?: BadgeGroupSize;
  badgeLabel?: string;
  children: React.ReactNode;
}

/**
 * BadgeGroup — a clickable label row that optionally pairs with a real
 * Badge instance, for "what's new" banners or filter-summary links.
 * Styling comes entirely from --lat-* custom properties.
 */
export const BadgeGroup = React.forwardRef<HTMLButtonElement, BadgeGroupProps>(
  ({ position = "leading", size = "small", badgeLabel = "New", children, className, ...rest }, ref) => {
    const classes = [
      "lat-badge-group",
      `lat-badge-group--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    const badgeSize = size === "small" ? "small" : "medium";

    return (
      <button ref={ref} type="button" className={classes} {...rest}>
        {position === "leading" ? (
          <Badge variant="brand" size={badgeSize}>{badgeLabel}</Badge>
        ) : null}
        <span className="lat-badge-group__text">{children}</span>
        {position === "trailing" ? (
          <Badge variant="brand" size={badgeSize}>{badgeLabel}</Badge>
        ) : null}
        {position !== "trailing" ? (
          <Icon name="chevron-right" size="xs" weight="light" className="lat-badge-group__chevron" />
        ) : null}
      </button>
    );
  }
);

BadgeGroup.displayName = "BadgeGroup";
