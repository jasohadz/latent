import React from "react";
import { Icon } from "./Icon";
import "./AccordionItem.css";

export interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * AccordionItem — a single collapsible FAQ-style row. Not a full list —
 * stack multiple instances and control `open` per-instance to build one.
 * Styling comes entirely from --lat-* custom properties.
 */
export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ title, children, open, onToggle, disabled = false, className }, ref) => {
    const classes = [
      "lat-accordion-item",
      disabled ? "lat-accordion-item--disabled" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const answerId = React.useId();

    return (
      <div ref={ref} className={classes}>
        <button
          type="button"
          className="lat-accordion-item__header"
          aria-expanded={open}
          aria-controls={answerId}
          disabled={disabled}
          onClick={() => onToggle(!open)}
        >
          <span className="lat-accordion-item__title">{title}</span>
          <span
            className="lat-accordion-item__chevron"
            style={open ? { transform: "rotate(180deg)" } : undefined}
            aria-hidden="true"
          >
            <Icon name="chevron-down" />
          </span>
        </button>
        <div id={answerId} className="lat-accordion-item__answer" hidden={!open}>
          {children}
        </div>
      </div>
    );
  }
);

AccordionItem.displayName = "AccordionItem";
