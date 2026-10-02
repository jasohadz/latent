import React from "react";
import "./Panel.css";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Panel — generic elevated floating surface for popovers/dropdowns (e.g.
 * Calendar as a date-picker popover). Styling comes entirely from --lat-*
 * custom properties; never hardcode a color/spacing/shadow value here.
 *
 * @import import { Panel } from "@latent/core/Panel";
 */
export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["lat-panel", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  }
);

Panel.displayName = "Panel";
