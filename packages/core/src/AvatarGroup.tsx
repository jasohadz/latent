import React from "react";
import { Avatar, type AvatarProps } from "./Avatar";
import "./AvatarGroup.css";

export type AvatarGroupSpacing = "overlap" | "spaced";

export interface AvatarGroupProps {
  spacing?: AvatarGroupSpacing;
  avatars: AvatarProps[];
  /** Remaining-count shown in a "+N" chip. Omit or pass 0 to hide it. */
  overflowCount?: number;
  className?: string;
}

/**
 * AvatarGroup — stacks multiple real Avatar instances to represent a group
 * of users. The overflow "+N" chip is deliberately NOT an Avatar instance
 * (Avatar's single-character constraint would clip multi-digit counts) —
 * it's styled to match instead. Styling comes entirely from --lat-*
 * custom properties.
 */
export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ spacing = "overlap", avatars, overflowCount, className }, ref) => {
    const classes = ["lat-avatar-group", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes}>
        <div className={`lat-avatar-group__avatars lat-avatar-group__avatars--${spacing}`}>
          {avatars.map((props, i) => (
            <Avatar key={i} size="medium" shape="circle" {...props} />
          ))}
        </div>
        {overflowCount ? (
          <span className="lat-avatar-group__overflow">{`+${overflowCount}`}</span>
        ) : null}
      </div>
    );
  }
);

AvatarGroup.displayName = "AvatarGroup";
