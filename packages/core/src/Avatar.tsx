import React from "react";
import "./Avatar.css";

export type AvatarSize = "small" | "medium" | "large";
export type AvatarShape = "circle" | "square";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Single-character initial, e.g. "F". Multi-character strings will overflow — the shape has a fixed width. */
  initial?: string;
  /** Generic pictogram icon, e.g. <Icon name="user" />. Ignored if `src` is set. */
  icon?: React.ReactNode;
  /** Real photo URL. Takes precedence over `initial`/`icon` if provided. */
  src?: string;
  alt?: string;
}

/**
 * Avatar — user representation as initials, an icon, or a placeholder image.
 * Styling comes entirely from --lat-* custom properties.
 */
export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ size = "medium", shape = "circle", initial, icon, src, alt = "", className, ...rest }, ref) => {
    const classes = [
      "lat-avatar",
      `lat-avatar--${size}`,
      `lat-avatar--${shape}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <span ref={ref} className={classes} {...rest}>
        {src ? (
          <img className="lat-avatar__image" src={src} alt={alt} />
        ) : icon ? (
          <span className="lat-avatar__icon" aria-hidden="true">{icon}</span>
        ) : initial ? (
          <span className="lat-avatar__initial">{initial.charAt(0)}</span>
        ) : null}
      </span>
    );
  }
);

Avatar.displayName = "Avatar";
