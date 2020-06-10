import React, { useState, useContext } from "react";
import Link from "next/link";
import Icon from "../components/icon";
import links from "../global/global";
import { useRouter } from "next/router";
import Context from "../components/context";
import Lottie from "lottie-react-web";
import themeAnimation from "../public/img/animations/darkmode.json";

export default function Nav(props) {
  const router = useRouter();
  const contactRoute = router.pathname + "#footer";
  const { theme, toggleTheme } = useContext(Context);
  const themeMultiplier = theme == "light" ? 1 : -1;
  const [hover, setHover] = useState(false);

  return (
    <nav>
      <ul>
        <div className="homeLink">
          <li className="smallLogo">
            <Link href="/">
              <a>
                <Icon size="small" link={true} icon={""} />
              </a>
            </Link>
          </li>
          {(!props.breadcrumbs || !props.breadcrumbs[0]) && (
            <li className="title">
              <Link href="/">
                <a className="highlight">Donovan Yohan</a>
              </Link>
            </li>
          )}
          {props.breadcrumbs &&
            props.breadcrumbs.map(({ href, label }, i) => {
              return (
                <li
                  className="breadcrumb"
                  key={"nav-breadcrumb-" + label + href}
                >
                  <span className="divider">/</span>
                  <Link href={href}>
                    <a className={"highlight path"}>{label}</a>
                  </Link>
                </li>
              );
            })}
        </div>
        <div className="navLinks">
          <li>
            <a
              target="_blank"
              href="/DonovanYohanResume.pdf"
              className="highlight"
            >
              Resume
            </a>
          </li>
          {links.map(({ key, href, label }) => (
            <li key={key}>
              <Link href={href}>
                <a className="highlight">{label}</a>
              </Link>
            </li>
          ))}
          <li>
            <Link href={contactRoute}>
              <a className="highlight">Contact</a>
            </Link>
          </li>
        </div>
      </ul>
      <div
        className="themeToggle"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={toggleTheme}
      >
        <Lottie
          options={{
            animationData: themeAnimation,
            autoplay: false,
            loop: false,
          }}
          height={30}
          width={30}
          direction={hover ? 1 * themeMultiplier : -1 * themeMultiplier}
          style={{
            filter: `${theme == "dark" ? "invert(97%)" : ""}`,
          }}
        />
      </div>

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
          width: 100%;
          background-color: var(--background);
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
          font-family: "Roboto", sans-serif;
          font-weight: bold;
        }
        li {
          display: flex;
        }
        .navLinks li {
          padding: 6px 0px 6px 50px;
        }
        a {
          color: var(--gray);
          line-height: 19px;
          letter-spacing: 0.1em;
          text-decoration: none;
          font-size: 16px;
          text-transform: uppercase;
          transition: 0.35s;
          position: relative;
        }
        .navLinks,
        .homeLink {
          display: flex;
        }
        .homeLink a {
          display: flex;
          line-height: 26px;
          font-size: 22px;
          text-transform: none;
          color: var(--main);
          opacity: 1;
          letter-spacing: 0;
        }
        .title {
          padding-left: 16px;
        }
        a:hover {
          color: var(--main);
        }
        .divider {
          padding: 0 16px;
          font-size: 22px;
          line-height: 26px;
          font-weight: normal;
        }
        .path {
          font-weight: normal;
        }

        .themeToggle {
          height: 100%;
          position: absolute;
          right: 16px;
          display: flex;
          align-items: center;
          cursor: pointer;
          opacity: var(--grayOpacity);
          transition: all 0.8s cubic-bezier(0.51, 0.07, 0.09, 0.95);
        }

        .themeToggle:hover {
          opacity: 1;
          filter: var(--hoverFilter);
        }

        // Adjust for mobile

        @media only screen and (max-width: 1024px) {
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
          .divider {
            font-size: 14px;
            padding: 0 12px;
          }
          .highlight {
            background: var(--background) !important;
          }
          .path {
            text-decoration: underline;
          }
        }
      `}</style>
    </nav>
  );
}
