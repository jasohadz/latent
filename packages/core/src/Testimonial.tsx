import React from "react";
import { Avatar } from "./Avatar";
import "./Testimonial.css";

export interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  avatarInitial?: string;
  className?: string;
}

/**
 * Testimonial — a quote card pairing a customer statement with a real
 * Avatar instance, name, and role. No boolean properties — every field is
 * always shown; use Card for an icon-less/button-less variant instead.
 * Styling comes entirely from --lat-* custom properties.
 */
export const Testimonial = React.forwardRef<HTMLDivElement, TestimonialProps>(
  ({ quote, name, role, avatarInitial, className }, ref) => {
    const classes = ["lat-testimonial", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes}>
        <p className="lat-testimonial__quote">{quote}</p>
        <div className="lat-testimonial__footer">
          <Avatar size="medium" shape="circle" initial={avatarInitial ?? name.charAt(0)} />
          <div className="lat-testimonial__name-col">
            <span className="lat-testimonial__name">{name}</span>
            <span className="lat-testimonial__role">{role}</span>
          </div>
        </div>
      </div>
    );
  }
);

Testimonial.displayName = "Testimonial";
