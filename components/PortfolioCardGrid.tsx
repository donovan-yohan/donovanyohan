import Link from "next/link";
import type { CSSProperties } from "react";

import { gm500, gm800, cp400 } from "../global/fonts";

export interface PortfolioCardLink {
  href: string;
  label: string;
  ariaLabel?: string;
  kind?: "github" | "external" | "internal";
}

export interface PortfolioCardItem {
  id: string;
  indexLabel: string;
  categoryLabel: string;
  metaLabel?: string | null;
  title: string;
  blurb?: string | null;
  tags?: string[];
  accent: string;
  accentInk?: string;
  image?: string;
  imageLight?: string;
  imageDark?: string;
  imageBg?: string;
  footerLabel?: string | null;
  primaryHref?: string | null;
  links?: PortfolioCardLink[];
}

interface PortfolioCardGridProps {
  items: PortfolioCardItem[];
  ariaLabel: string;
  emptyMessage?: string;
}

const GithubIcon = () => (
  <svg className="portfolioCardIcon" aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" focusable="false">
    <path
      fill="currentColor"
      d="M8 0C3.58 0 0 3.67 0 8.2c0 3.63 2.29 6.7 5.47 7.79.4.08.55-.18.55-.4 0-.2-.01-.86-.01-1.56-2.01.38-2.53-.5-2.69-.95-.09-.23-.48-.95-.82-1.14-.28-.15-.68-.52-.01-.53.63-.01 1.08.59 1.23.83.72 1.24 1.87.89 2.33.68.07-.53.28-.89.51-1.1-1.78-.21-3.64-.91-3.64-4.05 0-.89.31-1.63.82-2.2-.08-.21-.36-1.04.08-2.17 0 0 .67-.22 2.2.84A7.42 7.42 0 0 1 8 3.97c.68 0 1.36.09 2 .27 1.52-1.06 2.19-.84 2.19-.84.44 1.13.16 1.96.08 2.17.51.57.82 1.3.82 2.2 0 3.15-1.87 3.84-3.65 4.05.29.26.54.75.54 1.52 0 1.1-.01 1.98-.01 2.25 0 .22.15.48.55.4A8.14 8.14 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z"
    />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="portfolioCardIcon portfolioCardIconExternal" aria-hidden="true" viewBox="0 0 16 16" width="15" height="15" focusable="false">
    <path
      fill="currentColor"
      d="M10.75 1.5a.75.75 0 0 0 0 1.5h1.19L6.47 8.47a.75.75 0 1 0 1.06 1.06L13 4.06v1.19a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 13.75 1.5h-3Z"
    />
    <path
      fill="currentColor"
      d="M3.25 3.5A1.75 1.75 0 0 0 1.5 5.25v7.5c0 .97.78 1.75 1.75 1.75h7.5c.97 0 1.75-.78 1.75-1.75V9.5a.75.75 0 0 0-1.5 0v3.25a.25.25 0 0 1-.25.25h-7.5a.25.25 0 0 1-.25-.25v-7.5A.25.25 0 0 1 3.25 5H6.5a.75.75 0 0 0 0-1.5H3.25Z"
    />
  </svg>
);

const isExternalHref = (href: string): boolean => /^https?:\/\//i.test(href);

const expandHex = (hex: string): string | null => {
  const trimmed = hex.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(trimmed);
  if (short) {
    return `#${short[1]
      .split("")
      .map((char) => char + char)
      .join("")}`;
  }
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : null;
};

const contrastInk = (hex: string): string => {
  const expanded = expandHex(hex);
  if (!expanded) return "var(--paper)";
  const value = expanded.slice(1);
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const linear = [r, g, b].map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.46 ? "#0e0d0a" : "#fdfdf9";
};

const cardInitials = (title: string): string =>
  title
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3);

const linkIcon = (kind: PortfolioCardLink["kind"], href: string) => {
  if (kind === "github") return <GithubIcon />;
  if (kind === "external" || isExternalHref(href)) return <ExternalLinkIcon />;
  return null;
};

const CardLink = ({ link }: { link: PortfolioCardLink }) => {
  const className = "portfolioCardLink";
  const content = (
    <>
      {linkIcon(link.kind, link.href)}
      <span>{link.label}</span>
    </>
  );

  return isExternalHref(link.href) ? (
    <a className={className} href={link.href} target="_blank" rel="noreferrer" aria-label={link.ariaLabel}>
      {content}
    </a>
  ) : (
    <Link className={className} href={link.href} aria-label={link.ariaLabel}>
      {content}
    </Link>
  );
};

const PrimaryOverlay = ({ href, label }: { href: string; label: string }) =>
  isExternalHref(href) ? (
    <a className="portfolioCardOverlay" href={href} target="_blank" rel="noreferrer" aria-label={label} />
  ) : (
    <Link className="portfolioCardOverlay" href={href} aria-label={label} />
  );

const PortfolioCardGrid = ({ items, ariaLabel, emptyMessage = "Nothing to show yet." }: PortfolioCardGridProps) => {
  if (items.length === 0) {
    return <p className={`portfolioCardEmpty ${cp400.className}`}>{emptyMessage}</p>;
  }

  return (
    <div className="portfolioCardGrid" aria-label={ariaLabel}>
      {items.map((item) => {
        const accentInk = item.accentInk ?? contrastInk(item.accent);
        const style: CSSProperties = {
          ["--portfolio-card-accent" as string]: item.accent,
          ["--portfolio-card-accent-ink" as string]: accentInk,
          ["--portfolio-card-image-bg" as string]: item.imageBg ?? "transparent",
        };
        const links = item.links ?? [];
        const footerLinks = [...links];
        if (item.primaryHref && footerLinks.length === 0) {
          footerLinks.push({ href: item.primaryHref, label: "Read", kind: "internal" });
        }

        return (
          <article className="portfolioCard" key={item.id} style={style}>
            <header className={`portfolioCardTop ${gm500.className}`}>
              <span className="portfolioCardTopLeft">
                <span>{item.indexLabel}</span>
                <span>{item.categoryLabel}</span>
              </span>
              {item.metaLabel ? <span className="portfolioCardTopRight">{item.metaLabel}</span> : null}
            </header>

            <div className="portfolioCardCover" aria-hidden>
              {item.imageLight && item.imageDark ? (
                <>
                  <img className="portfolioCardImage portfolioCardImageLight" src={item.imageLight} alt="" />
                  <img className="portfolioCardImage portfolioCardImageDark" src={item.imageDark} alt="" />
                </>
              ) : item.image ? (
                <img className="portfolioCardImage" src={item.image} alt="" />
              ) : (
                <div className="portfolioCardMonogram">{cardInitials(item.title)}</div>
              )}
            </div>

            <div className="portfolioCardBody">
              <h3 className={`portfolioCardTitle ${gm800.className}`}>{item.title}</h3>
              {item.blurb ? <p className={`portfolioCardBlurb ${cp400.className}`}>{item.blurb}</p> : null}
            </div>

            {item.tags && item.tags.length > 0 ? (
              <div className={`portfolioCardTags ${gm500.className}`}>
                {item.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            ) : null}

            <footer className={`portfolioCardFooter ${gm500.className}`}>
              <span>{item.footerLabel ?? ""}</span>
              {footerLinks.length > 0 ? (
                <span className="portfolioCardLinks">
                  {footerLinks.map((link) => (
                    <CardLink key={`${link.href}-${link.label}`} link={link} />
                  ))}
                </span>
              ) : null}
            </footer>

            {item.primaryHref ? <PrimaryOverlay href={item.primaryHref} label={item.title} /> : null}
          </article>
        );
      })}

      <style jsx global>{`
        .portfolioCardGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          grid-auto-rows: minmax(420px, 1fr);
          gap: var(--u);
        }
        .portfolioCard {
          --portfolio-card-accent: var(--accent);
          --portfolio-card-accent-ink: var(--paper);
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 420px;
          height: 100%;
          border: 1px solid var(--rule);
          border-radius: 2px;
          background: var(--paper);
          color: var(--ink);
          overflow: hidden;
          box-shadow: none;
        }
        .portfolioCardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 38px;
          padding: 10px var(--u);
          background: var(--portfolio-card-accent);
          color: var(--portfolio-card-accent-ink);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          line-height: 1;
          text-transform: uppercase;
        }
        .portfolioCardTopLeft {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          overflow: hidden;
        }
        .portfolioCardTopRight {
          flex: 0 0 auto;
          font-variant-numeric: tabular-nums;
          opacity: 0.82;
        }
        .portfolioCardCover {
          display: grid;
          place-items: center;
          aspect-ratio: 16 / 9;
          margin: var(--u) var(--u) 0;
          border: 1px solid var(--rule);
          background: var(--paper);
          overflow: hidden;
        }
        .portfolioCardImage {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: var(--portfolio-card-image-bg, transparent);
        }
        .portfolioCardImageDark {
          display: none;
        }
        :global(html[data-theme="dark"]) .portfolioCardImageLight {
          display: none;
        }
        :global(html[data-theme="dark"]) .portfolioCardImageDark {
          display: block;
        }
        .portfolioCardMonogram {
          color: var(--ink);
          font-size: clamp(48px, 7vw, 92px);
          font-weight: 800;
          letter-spacing: -0.08em;
          opacity: 0.88;
        }
        .portfolioCardBody {
          flex: 1 1 auto;
          padding: var(--u);
        }
        .portfolioCardTitle {
          margin: 0 0 10px;
          color: var(--ink);
          font-size: clamp(24px, 2.2vw, 34px);
          line-height: 1.02;
          letter-spacing: -0.03em;
        }
        .portfolioCardBlurb {
          display: -webkit-box;
          margin: 0;
          color: var(--ink-soft);
          font-size: clamp(17px, 1.35vw, 20px);
          line-height: 1.35;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 4;
        }
        .portfolioCardTags {
          position: relative;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 var(--u) var(--u);
        }
        .portfolioCardTags span {
          border: 1px solid var(--ink-faint);
          border-radius: 2px;
          color: var(--ink-mute);
          font-size: 10px;
          letter-spacing: 0.12em;
          line-height: 1;
          padding: 6px 8px;
          text-transform: uppercase;
        }
        .portfolioCardFooter {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 42px;
          border-top: 1px solid var(--rule);
          color: var(--ink-mute);
          font-size: 11px;
          letter-spacing: 0.14em;
          line-height: 1;
          padding: 12px var(--u);
          text-transform: uppercase;
        }
        .portfolioCardFooter > span:first-child {
          flex: 1 1 auto;
          min-width: 0;
        }
        .portfolioCardLinks {
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 10px;
          margin-left: auto;
          min-width: max-content;
        }
        .portfolioCardLink {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--ink);
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 4px;
          white-space: nowrap;
        }
        .portfolioCardLink:hover {
          text-decoration-thickness: 2px;
        }
        .portfolioCardIcon {
          display: block;
          width: 16px;
          height: 16px;
        }
        .portfolioCardIconExternal {
          width: 15px;
          height: 15px;
        }
        .portfolioCardOverlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          color: inherit;
          text-decoration: none;
        }
        .portfolioCardOverlay:focus-visible {
          outline: 2px solid var(--portfolio-card-accent);
          outline-offset: -2px;
        }
        .portfolioCardEmpty {
          color: var(--ink-soft);
          font-size: clamp(18px, 1.5vw, 24px);
          line-height: 1.4;
          margin: 0;
        }
        @media (min-width: 1800px) {
          .portfolioCardGrid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (max-width: 1180px) {
          .portfolioCardGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .portfolioCardGrid {
            grid-template-columns: 1fr;
            grid-auto-rows: auto;
          }
          .portfolioCard {
            min-height: 0;
          }
          .portfolioCardTop,
          .portfolioCardFooter {
            min-width: 0;
          }
          .portfolioCardTopLeft,
          .portfolioCardTopRight,
          .portfolioCardFooter > span:first-child {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
};

export default PortfolioCardGrid;
