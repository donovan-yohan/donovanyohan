/**
 * WorkHero.tsx — renders work-type note frontmatter as a hero section.
 *
 * Used in pages/writing/[slug].tsx when note.frontmatter.type === "work".
 * All props are optional (Phase A schema extension adds them; current schema
 * does not define them — we gracefully handle their absence).
 *
 * Dark-mode support is deferred to a follow-up PR. This render passes
 * banner.light and bgColor.light only. The `dark` variants are stored in
 * the props shape for Phase A readiness but not yet consumed.
 *
 * Styled inline (no global stylesheets) with `note-workhero-*` class prefix.
 */

import React from "react";
import NextImage from "next/image";

export interface WorkHeroProps {
  /** Note title (always present). */
  title: string;
  /** Optional subtitle rendered as a paragraph below the title. */
  subtitle?: string;
  /**
   * Optional banner image paths. `light` is used by default.
   * `dark` is reserved for dark-mode support (future PR).
   */
  banner?: { light?: string; dark?: string };
  /**
   * Optional background colour for the banner area.
   * `light` is used by default; `dark` reserved for future.
   */
  bgColor?: { light?: string; dark?: string };
  /**
   * Optional info list: roles, dates, links, etc.
   * Items with `href` are rendered as anchor links.
   */
  info?: Array<{ label: string; href?: string }>;
}

export function WorkHero({ title, subtitle, banner, bgColor, info }: WorkHeroProps) {
  const bannerSrc = banner?.light;
  const bgColorValue = bgColor?.light;

  return (
    <div className="note-workhero">
      {/* Banner image area */}
      {bannerSrc ? (
        <div
          className="note-workhero-banner"
          style={{ backgroundColor: bgColorValue ?? "transparent" }}
        >
          <NextImage
            src={bannerSrc}
            alt={title}
            width={1600}
            height={900}
            priority
            sizes="100vw"
            className="note-workhero-banner-img"
          />
        </div>
      ) : (
        <div className="note-workhero-spacer" />
      )}

      {/* Content block */}
      <div className="note-workhero-content">
        <h1 className="note-workhero-title">
          <span className="note-workhero-title-text">{title}</span>
        </h1>

        {subtitle && (
          <p className="note-workhero-subtitle">{subtitle}</p>
        )}

        {info && info.length > 0 && (
          <ul className="note-workhero-info">
            {info.map((item, idx) =>
              item.href ? (
                <li key={idx}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="note-workhero-info-link"
                  >
                    {item.label}
                  </a>
                </li>
              ) : (
                <li key={idx} className="note-workhero-info-item">
                  {item.label}
                </li>
              )
            )}
          </ul>
        )}
      </div>

      <style jsx>{`
        .note-workhero {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 48px;
        }

        .note-workhero-banner {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 56px;
          max-height: 400px;
          height: 33vw;
          width: 100vw;
          overflow: hidden;
          opacity: 0;
          animation: note-hero-fade-in 0.1s linear 0.1s 1 forwards;
        }

        :global(.note-workhero-banner-img) {
          height: 100%;
          width: auto;
          max-width: 100%;
        }

        .note-workhero-spacer {
          margin-top: 64px;
        }

        .note-workhero-content {
          max-width: 1024px;
          width: calc(100% - 32px);
          padding: 0 16px;
        }

        .note-workhero-title {
          margin: 32px 0 0;
          width: fit-content;
        }

        .note-workhero-title-text {
          font-size: 47px;
          line-height: 1.5;
          /* Matches site-wide .highlightStatic treatment */
          background: linear-gradient(
            0deg,
            var(--background, #ffffff) 10%,
            var(--note-accent, var(--highlight, #ffef00)) 10%,
            var(--note-accent, var(--highlight, #ffef00)) 60%,
            var(--background, #ffffff) 60%
          );
        }

        .note-workhero-subtitle {
          font-size: 18px;
          line-height: 2;
          margin: 16px 0 0;
          color: var(--gray, #757575);
        }

        .note-workhero-info {
          list-style: none;
          padding: 0;
          margin: 16px 0 0;
          display: flex;
          flex-direction: column;
          font-size: 16px;
          font-weight: bold;
          line-height: 2;
        }

        .note-workhero-info li {
          color: var(--gray, #757575);
        }

        .note-workhero-info-link {
          color: var(--main, #000000);
          text-decoration: none;
          font-weight: bold;
        }

        .note-workhero-info-link:hover {
          color: var(--note-accent, var(--highlight, #ffef00));
        }

        @keyframes note-hero-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @media only screen and (max-width: 767px) {
          .note-workhero-banner {
            max-height: 50vw;
          }
          .note-workhero-spacer {
            margin-top: 32px;
          }
          .note-workhero-title-text {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
}
