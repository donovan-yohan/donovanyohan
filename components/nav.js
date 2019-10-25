import React from "react";
import Link from "next/link";

const links = [
  { href: "https://github.com/zeit/next.js", label: "Resume" },
  { href: "https://github.com/zeit/next.js", label: "Work" },
  { href: "https://github.com/zeit/next.js", label: "Process" },
  { href: "https://github.com/zeit/next.js", label: "About" }
].map(link => {
  link.key = `nav-link-${link.href}-${link.label}`;
  return link;
});

const Nav = () => (
  <nav>
    <ul>
      <div className="homeLink">
        <li>
          <Link href="/">
            <a>Donovan Yohan</a>
          </Link>
        </li>
      </div>
      <div className="navLinks">
        {links.map(({ key, href, label }) => (
          <li key={key}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </div>

    </ul>

    <style jsx>{`
      :global(body) {
        margin: 0;
        font-family: "Open Sans";
      }
      nav {
        z-index: 1000;
        text-align: center;
        display: flex;
        justify-content: center;
        min-width: 100vw;
        background-color: white;
        position: fixed;
        height: 62px;
      }
      ul {
        width: 95vw;
        max-width: 1000px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: "Roboto";
        font-weight: bold;
      }
      nav > ul {
        padding: 4px 16px;
      }
      li {
        display: flex;
      }
      .navLinks li {
        padding: 6px 0px 6px 50px
      }
      a {
        line-height: 19px;
        letter-spacing: 0.1em;
        color: rgba(0, 0, 0, 0.54);
        text-decoration: none;
        font-size: 16px;
        text-transform: uppercase;
      }
      .navLinks {
        display: flex;
      }
      .homeLink a {
        line-height: 26px;
        font-size: 22px;
        text-transform: none;
        color: black;
        letter-spacing: 0;
      }
      .homelink li {
        padding-left: 0px;
      }
    `}</style>
  </nav>
);

export default Nav;
