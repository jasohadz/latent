import React from "react";
import { icons, type LucideIcon } from "lucide-react";
import "./Icon.css";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconWeight = "light" | "regular" | "bold";

const WEIGHT_STROKE: Record<IconWeight, number> = {
  light: 1.5,
  regular: 2,
  bold: 2.5,
};

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  /** Icon name in kebab-case, matching Lucide's own naming (e.g. "arrow-up", "trash-2"). */
  name: string;
  size?: IconSize;
  /** Matches the Weight property on the Figma Icons foundations page. */
  weight?: IconWeight;
}

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Icon — thin wrapper around lucide-react. Size comes from --lat-sizing-icon-*
 * custom properties; color is inherited via currentColor (set on an ancestor,
 * or override --lat-color-icon-* through a className) — never hardcode a fill.
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = "md", weight = "regular", className, ...rest }, ref) => {
    const LucideIcon = icons[toPascalCase(name) as keyof typeof icons] as LucideIcon | undefined;

    if (!LucideIcon) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Icon: no Lucide icon named "${name}"`);
      }
      return null;
    }

    const classes = ["lat-icon", `lat-icon--${size}`, className].filter(Boolean).join(" ");

    return (
      <LucideIcon ref={ref} className={classes} strokeWidth={WEIGHT_STROKE[weight]} {...rest} />
    );
  }
);

Icon.displayName = "Icon";
