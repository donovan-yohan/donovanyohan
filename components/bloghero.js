import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const isInternalHref = (href = "") => href.startsWith("/");

const BlogHeroLink = ({ href, className, ariaLabel, children }) =>
  isInternalHref(href) ? (
    <Link className={className} href={href} aria-label={ariaLabel}>
      {children}
    </Link>
  ) : (
    <a
      className={className}
      href={href}
      aria-label={ariaLabel}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );

const BlogHero = ({ eyebrow, title, date, quote, image, imageAlt, linkHref, linkLabel }) => (
  <section className="blogHero" aria-label={title}>
    <div className="heroShell">
      <BlogHeroLink
        className="imageLink"
        href={linkHref}
        ariaLabel={linkLabel}
      >
        <motion.img
          src={image}
          alt={imageAlt || ""}
          animate={{ y: [0, -4, 0] }}
          whileHover={{ scale: 1.025, rotate: -1 }}
          transition={{
            y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 0.35 },
            rotate: { duration: 0.35 },
          }}
        />
      </BlogHeroLink>

      <motion.div
        className="copy"
      >
        <div className="meta">
          {eyebrow && <span>{eyebrow}</span>}
          {title && <span>{title}</span>}
          {date && <span>{date}</span>}
        </div>
        <h1>{quote}</h1>
        {linkHref && linkLabel && (
          <BlogHeroLink className="highlight readLink" href={linkHref}>
            {linkLabel}
          </BlogHeroLink>
        )}
      </motion.div>
    </div>

    <style jsx>{`
      .blogHero {
        min-height: 92vh;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .heroShell {
        align-items: center;
        display: flex;
        max-width: 1024px;
        width: 95vw;
      }

      :global(.imageLink) {
        background: var(--disabled);
        border-radius: 100%;
        display: block;
        flex: 0 0 420px;
        height: 420px;
        margin-top: -24px;
        overflow: hidden;
        text-decoration: none;
        width: 420px;
      }

      img {
        display: block;
        height: 100%;
        object-fit: cover;
        width: 100%;
      }

      :global(.copy) {
        display: flex;
        flex-direction: column;
        margin-left: 32px;
        min-height: 240px;
      }

      .meta {
        color: var(--gray);
        display: flex;
        flex-wrap: wrap;
        font-family: "Roboto", sans-serif;
        font-size: 13px;
        font-weight: 700;
        gap: 8px 12px;
        letter-spacing: 0.11em;
        line-height: 1.6;
        margin-bottom: 16px;
        text-transform: uppercase;
      }

      .meta span:not(:last-child)::after {
        content: "·";
        margin-left: 12px;
      }

      h1 {
        font-family: "Open Sans", sans-serif;
        font-size: 47px;
        font-weight: 300;
        letter-spacing: -0.01em;
        line-height: 1.3em;
        margin: 0;
      }

      .readLink {
        margin-top: 24px;
        width: fit-content;
      }

      a {
        text-decoration: none;
      }

      @media only screen and (max-width: 1130px) {
        :global(.imageLink) {
          flex-basis: 38vw;
          height: 38vw;
          margin-top: -2.1818vw;
          width: 38vw;
        }

        :global(.copy) {
          flex-basis: 60%;
          margin-left: 2.8vw;
          min-height: 22vw;
        }

        h1 {
          font-size: 4.1717vw;
          line-height: 1.4;
        }
      }

      @media only screen and (max-width: 767px) {
        .blogHero {
          min-height: 88vh;
          padding: 112px 0 48px;
        }

        .heroShell {
          flex-direction: column;
          max-width: 100%;
        }

        :global(.imageLink) {
          flex: 0 0 66vw;
          height: 66vw;
          margin-top: 0;
          width: 66vw;
        }

        :global(.copy) {
          align-items: center;
          flex-basis: 100%;
          margin: 24px;
          min-height: auto;
          text-align: center;
        }

        .meta {
          justify-content: center;
        }

        h1 {
          font-size: 8.3vw;
          text-size-adjust: none;
        }
      }
    `}</style>
  </section>
);

export default BlogHero;
