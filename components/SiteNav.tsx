/**
 * Shared topnav used across the marketing-ish pages (home, about). Square
 * orange DY chip on the left, brand wordmark beside it, four trapezoidal
 * file-tab links on the right with Hobonichi highlighter underlines, then
 * a theme toggle.
 *
 * Pages opt into this instead of inlining the same markup. Pure visual
 * shell — pages still own their own page-level background, sections, and
 * scrolling behaviour. The nav itself is height var(--nav-h) (48px) and
 * stays out of the page's scroll context via position: sticky in callers
 * that scroll, or position: fixed in callers that lock the body.
 */

import { useContext } from "react";
import Link from "next/link";
import { BriefcaseBusiness, FileText, Mail, Moon, Sun } from "lucide-react";

import Context from "./context";
import { gm500, gm800 } from "../global/fonts";
import { ABOUT_PAGE_ENABLED } from "../lib/flags";

const DY_PATHS: readonly string[] = [
  "M 1371.48 700.4 L 1371.67 1013.54 L 1371.67 1063.38 C 1371.67 1238.53 1229.69 1380.51 1054.54 1380.51 L 990.63 1380.51",
  "M 736.58 50.74 L 736.58 380.47 L 736.58 702.5",
  "M 486.58 1021.04 L 420.25 1021.04 C 245.1 1021.04 103.11 879.05 103.11 703.89 C 103.11 528.74 245.1 386.76 420.25 386.76 C 595.4 386.76 737.39 528.74 737.39 703.89 C 737.39 879.05 879.38 1021.04 1054.53 1021.04 C 1229.68 1021.04 1371.67 879.05 1371.67 703.89 L 1371.67 411.42",
];

interface SiteNavProps {
  /** Highlights the current tab via a `data-current` attr on the link. */
  current?: "home" | "work" | "about" | "contact";
  /** Home uses sticky nav inside the page flow; article/detail pages keep it fixed. */
  position?: "fixed" | "sticky";
}

export const SiteNav = ({ current, position = "fixed" }: SiteNavProps) => {
  const { theme, toggleTheme } = useContext(Context);

  return (
    <nav className={`topnav topnav-${position}`}>
      <div className="topnavInner">
        <Link href="/" className={`navHome ${gm800.className}`} aria-label="Home">
          <span className="navMarkBox" aria-hidden>
            <svg viewBox="0 0 1500 1500" className="navHomeMark" aria-hidden>
              {DY_PATHS.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={130}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                />
              ))}
            </svg>
          </span>
          <span className="navTitle">Donovan Yohan</span>
        </Link>
        <span className="navSpacer" aria-hidden />
        <div className="navTabs">
          <a
            className={`navTab tabResume ${gm500.className}`}
            href="/DonovanYohanResume.pdf"
            target="_blank"
            rel="noreferrer"
          >
            <span className="navTabLabel">Resume</span>
          </a>
          <Link
            className={`navTab tabWork ${gm500.className}`}
            href="/#work"
            data-current={current === "work" ? "true" : undefined}
          >
            <span className="navTabLabel">Work</span>
          </Link>
          {ABOUT_PAGE_ENABLED ? (
            <Link
              className={`navTab tabAbout ${gm500.className}`}
              href="/about"
              data-current={current === "about" ? "true" : undefined}
            >
              <span className="navTabLabel">About</span>
            </Link>
          ) : null}
          <Link
            className={`navTab tabContact ${gm500.className}`}
            href="/#footer"
            data-current={current === "contact" ? "true" : undefined}
          >
            <span className="navTabLabel">Contact</span>
          </Link>
        </div>
        <button
          type="button"
          className="themeToggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <svg
            className="themeIcon sun"
            viewBox="0 0 24 24"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <svg
            className="themeIcon moon"
            viewBox="0 0 24 24"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>

      <div className={`mobileBottomNav ${gm500.className}`} aria-label="Mobile navigation">
        <Link href="/" className="mobileNavItem" aria-label="Home">
          <span className="mobileHomeLogo" aria-hidden>
            <svg viewBox="0 0 1500 1500" className="mobileHomeMark" aria-hidden>
              {DY_PATHS.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={130}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                />
              ))}
            </svg>
          </span>
          <span>Home</span>
        </Link>
        <a
          className="mobileNavItem"
          href="/DonovanYohanResume.pdf"
          target="_blank"
          rel="noreferrer"
          aria-label="Resume"
        >
          <FileText className="mobileNavIcon" aria-hidden />
          <span>Resume</span>
        </a>
        <Link
          href="/#work"
          className="mobileNavItem"
          data-current={current === "work" ? "true" : undefined}
          aria-label="Work"
        >
          <BriefcaseBusiness className="mobileNavIcon" aria-hidden />
          <span>Work</span>
        </Link>
        <Link
          href="/#footer"
          className="mobileNavItem"
          data-current={current === "contact" ? "true" : undefined}
          aria-label="Contact"
        >
          <Mail className="mobileNavIcon" aria-hidden />
          <span>Contact</span>
        </Link>
        <button
          type="button"
          className="mobileNavItem mobileThemeButton"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="mobileNavIcon" aria-hidden />
          ) : (
            <Moon className="mobileNavIcon" aria-hidden />
          )}
          <span>Theme</span>
        </button>
      </div>

      <style jsx global>{`
        .topnav {
          --nav-h: 48px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: var(--paper);
          border-bottom: 1px solid var(--rule);
        }
        .topnav-sticky {
          position: sticky;
        }
        .topnav-fixed {
          position: fixed;
        }
        .topnavInner {
          display: flex;
          align-items: center;
          width: 100%;
          height: var(--nav-h);
          padding: 0 var(--gutter-w);
          justify-content: space-between;
        }
        .navHome {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          color: var(--ink);
          text-decoration: none;
          height: 100%;
        }
        .navMarkBox {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--nav-h);
          height: var(--nav-h);
          flex: 0 0 var(--nav-h);
          background: var(--logo-bg);
          color: var(--tab-ink);
        }
        .navHomeMark {
          width: 60%;
          height: 60%;
          display: block;
        }
        .navTitle {
          font-size: 14px;
          letter-spacing: 0.12em;
          font-weight: 800;
          text-transform: uppercase;
        }
        .navSpacer {
          flex: 1 1 auto;
        }
        .navTabs {
          display: inline-flex;
          align-items: stretch;
          gap: 0;
          height: 100%;
        }
        .navTab {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: var(--nav-h);
          padding: 0 16px;
          font-size: 12px;
          letter-spacing: 0.12em;
          font-weight: 700;
          text-transform: uppercase;
          text-decoration: none;
          color: var(--ink);
        }
        .navTabLabel {
          display: inline-block;
          transition: transform 140ms ease;
        }
        .navTab::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 8px;
          background: var(--tab-c);
          transition: height 140ms ease;
        }
        .navTab:hover .navTabLabel {
          transform: translateY(-4px);
        }
        .navTab:hover::after,
        .navTab[data-current="true"]::after {
          height: 12px;
        }
        .tabResume { --tab-c: var(--tab-resume); }
        .tabWork { --tab-c: var(--tab-work); }
        .tabAbout { --tab-c: var(--tab-about); }
        .tabContact { --tab-c: var(--tab-contact); }

        .themeToggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          min-width: 32px;
          min-height: 32px;
          margin-left: 8px;
          padding: 0;
          border: 1px solid var(--rule);
          border-radius: 50%;
          background: transparent;
          color: var(--ink-soft);
          cursor: pointer;
          transition:
            color 140ms ease,
            border-color 140ms ease,
            background-color 140ms ease;
        }
        .themeToggle:hover {
          color: var(--ink);
          border-color: var(--ink-faint);
        }
        .themeIcon {
          width: 16px;
          height: 16px;
          display: block;
        }
        [data-theme="light"] .themeIcon.sun,
        :root:not([data-theme="dark"]) .themeIcon.sun {
          display: none;
        }
        [data-theme="dark"] .themeIcon.moon {
          display: none;
        }
        .mobileBottomNav {
          display: none;
        }
        @media (max-width: 900px) {
          :root,
          [data-theme="light"],
          [data-theme="dark"] {
            --nav-h: 0px;
            --mobile-bottom-nav-h: 64px;
          }
          body {
            padding-bottom: calc(var(--mobile-bottom-nav-h) + env(safe-area-inset-bottom));
          }
          .topnav {
            --nav-h: 0px;
            background: transparent;
            border-bottom: 0;
            pointer-events: none;
          }
          .topnavInner {
            display: none;
          }
          .navSpacer {
            flex: 1 1 auto;
            min-width: 0;
          }
          .mobileBottomNav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 60;
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            min-height: calc(var(--mobile-bottom-nav-h) + env(safe-area-inset-bottom));
            padding: 7px clamp(10px, 3vw, 16px) calc(7px + env(safe-area-inset-bottom));
            background: color-mix(in srgb, var(--paper) 94%, transparent);
            border-top: 1px solid var(--rule);
            backdrop-filter: blur(14px);
            pointer-events: auto;
          }
          .mobileNavItem {
            appearance: none;
            border: 0;
            border-radius: 12px;
            background: transparent;
            color: var(--ink-mute);
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            min-width: 0;
            min-height: 48px;
            padding: 4px 2px;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 9px;
            line-height: 1;
            font-family: inherit;
            font-weight: inherit;
            cursor: pointer;
            transition:
              background-color 140ms ease,
              color 140ms ease;
          }
          .mobileNavItem:hover,
          .mobileNavItem:active,
          .mobileNavItem[data-current="true"] {
            background: var(--accent-soft);
            color: var(--ink);
          }
          .mobileNavIcon {
            width: 20px;
            height: 20px;
            stroke-width: 1.9;
          }
          .mobileHomeLogo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 22px;
            background: var(--logo-bg);
            color: var(--tab-ink);
            border-radius: 2px;
          }
          .mobileHomeMark {
            width: 62%;
            height: 62%;
            display: block;
          }
          .mobileThemeButton span {
            font-family: inherit;
            font-weight: inherit;
          }
        }
        @media (max-width: 420px) {
          .mobileBottomNav {
            padding-left: 8px;
            padding-right: 8px;
          }
          .mobileNavItem {
            letter-spacing: 0.04em;
            font-size: 8px;
          }
        }
      `}</style>
    </nav>
  );
};

export default SiteNav;
