import React from "react";
import Link from "next/link";
import Icon from "../components/icon"
import links from "../global/global"

const Nav = () => (
  <nav>
    <ul>
      <div className="homeLink">
        <li className="smallLogo">
          <Link href="/">
            <a><Icon src='/img/icons/dy.svg' size='small' /></a>
          </Link>
        </li>
        <li>
          <Link href="/">
            <a>Donovan Yohan</a>
          </Link>
        </li>
      </div>
      <div className="navLinks">
        <li>
          <a target="_blank" href="/DonovanYohanResume.pdf">Resume</a>
        </li>
        {links.map(({ key, href, label }) => (
          <li key={key}>
            <Link href={href}>
              <a>{label}</a>
            </Link>
          </li>
        ))}
      </div>

    </ul>

    <style jsx>{`
      :global(body) {
        margin: 0;
        font-family: 'Open Sans';
      }
      nav {
        z-index: 1000;
        text-align: center;
        display: flex;
        justify-content: center;
        width: 100%;
        background-color: white;
        position: fixed;
        min-height: 62px;
        height: 62px;
        top: 0;
      }
      ul {
        padding: 0 40px;
        width: 100%;
        max-width: 1024px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: "Roboto";
        font-weight: bold;
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
        transition: 0.1s;
        position: relative;
      }
      .navLinks, .homeLink {
        display: flex;
      }
      .homeLink a {
        display: flex;
        line-height: 26px;
        font-size: 22px;
        text-transform: none;
        color: black;
        letter-spacing: 0;
      }
      .homelink li {
        padding-left: 0px;
      }
      .smallLogo {
        display: none;
      }
      a:hover {
        color: black;
      }
      a::before {
        content: "";
        transition: .3s;
        z-index: -1;
        position: absolute;
        bottom: 2px;
        width: 0%;
        height: 60%
      }
      a:hover::before {
        width:100%;
        background-color: #FFF500
      }


      // Adjust for mobile

      @media only screen and (max-width: 1024px) {
        .smallLogo {
          display: flex;
          padding-right: 16px;
        }
        nav {
          min-height: 56px;
          height: 56px;
        }
        ul {
          padding: 0 16px;
        }

        .navLinks {
          display: none;
        }

        .homeLink a {
          font-size: 14px;
        }
      }
    `}</style>
  </nav>
);

export default Nav;
