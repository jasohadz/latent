import React from "react";
import "./Stat.css";

export interface StatProps {
  showIcon?: boolean;
  icon?: React.ReactNode;
  value: string;
  label: string;
  className?: string;
}

/**
 * Stat — a compact highlight card for a single number or metric with a
 * supporting label. For landing pages and dashboards. Styling comes
 * entirely from --lat-* custom properties.
 */
export const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ showIcon = true, icon, value, label, className }, ref) => {
    const classes = ["lat-stat", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes}>
        {showIcon && icon ? <span className="lat-stat__icon">{icon}</span> : null}
        <span className="lat-stat__value">{value}</span>
        <span className="lat-stat__label">{label}</span>
      </div>
    );
  }
);

Stat.displayName = "Stat";
