import React from "react";
import { TopNavLink } from "./TopNavLink";
import { MegaMenuItem, type MegaMenuItemProps } from "./MegaMenuItem";
import { Button } from "./Button";
import "./TopNav.css";

export type TopNavMenu = "none" | "product" | "download";

export interface TopNavProps {
  menu?: TopNavMenu;
  onMenuChange?: (menu: TopNavMenu) => void;
  /** Latent's own logo mark isn't a ported component — supply your own brand icon. */
  logo?: React.ReactNode;
  ctaLabel?: string;
  onCtaClick?: () => void;
  /** 4 Standard-layout items for the Product panel's 2x2 grid. */
  productItems?: Omit<MegaMenuItemProps, "layout">[];
  /** The single Featured-layout item in the Download panel. */
  downloadFeatured?: Omit<MegaMenuItemProps, "layout">;
  /** 3 Standard-layout items in the Download panel's row. */
  downloadItems?: Omit<MegaMenuItemProps, "layout">[];
  className?: string;
}

/**
 * TopNav — a floating glass top navigation bar with mega-menu dropdowns
 * for Product and Download. Styling comes entirely from --lat-* custom
 * properties.
 */
export const TopNav = React.forwardRef<HTMLDivElement, TopNavProps>(
  (
    {
      menu = "none",
      onMenuChange,
      logo,
      ctaLabel = "Free Trial",
      onCtaClick,
      productItems = [],
      downloadFeatured,
      downloadItems = [],
      className,
    },
    ref
  ) => {
    const toggle = (target: TopNavMenu) => onMenuChange?.(menu === target ? "none" : target);

    return (
      <div ref={ref} className={["lat-top-nav", className].filter(Boolean).join(" ")}>
        <div className="lat-top-nav__bar">
          {logo}
          <div className="lat-top-nav__nav-row">
            <TopNavLink label="Product" active={menu === "product"} onClick={() => toggle("product")} />
            <TopNavLink label="Download" active={menu === "download"} onClick={() => toggle("download")} />
            <TopNavLink label="Pricing" active={false} showChevron={false} />
          </div>
          <Button variant="primary" size="sm" onClick={onCtaClick}>
            {ctaLabel}
          </Button>
        </div>
        {menu === "product" ? (
          <div className="lat-top-nav__panel lat-top-nav__panel--grid">
            {productItems.map((item, i) => (
              <MegaMenuItem key={i} layout="standard" {...item} />
            ))}
          </div>
        ) : null}
        {menu === "download" ? (
          <div className="lat-top-nav__panel lat-top-nav__panel--download">
            {downloadFeatured ? <MegaMenuItem layout="featured" {...downloadFeatured} /> : null}
            <div className="lat-top-nav__panel-row">
              {downloadItems.map((item, i) => (
                <MegaMenuItem key={i} layout="standard" {...item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);

TopNav.displayName = "TopNav";
