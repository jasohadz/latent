import React from "react";
import "./AlertStack.css";

export interface AlertStackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Multiple <Alert> elements to stack — collapsed into a peeking fan by default. */
  children: React.ReactNode;
}

/**
 * AlertStack — composes real Alert instances into a collapsed, peeking fan
 * that separates on hover/focus. Pure CSS: no expanded/collapsed prop, since
 * the Figma reference's own annotation defines this as a hover behavior, not
 * a controlled state.
 */
export const AlertStack = React.forwardRef<HTMLDivElement, AlertStackProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["lat-alert-stack", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  }
);

AlertStack.displayName = "AlertStack";
