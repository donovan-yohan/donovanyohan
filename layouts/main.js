import React from "react";
import Head from "next/head";
import Nav from "../components/nav";
import Footer from "../components/footer";
import BottomNav from "../components/bottomNav";
import { MobileWidth } from "../global/global";
import useSmoothScroll from "../hooks/useSmoothScroll";
import useWindowWidth from "../hooks/useWindowWidth";

const cssRootVars = {
  background: "#ffffff",
  main: "#000000",
  highlight: "#FFEF00",
  gray: "#757575",
  disabled: "#ededed",
  border: "#757575",
  hoverFilter:
    "invert(94%) sepia(7%) saturate(6933%) hue-rotate(-2deg) brightness(101%) contrast(110%);",
  grayOpacity: "0.54",
};

const cssDarkVars = {
  background: "#000000",
  main: "#ffffff",
  highlight: "#DC267F",
  gray: "#bcbcbc",
  disabled: "#505050",
  border: "#505050",
  hoverFilter:
    "brightness(0) saturate(100%) invert(15%) sepia(94%) saturate(7163%) hue-rotate(-40deg) brightness(91%) contrast(102%);",
  grayOpacity: "0.7",
};

const Main = (props) => {
  // logic for finding current viewport size to determine if mobile layout is needed
  const windowWidth = useWindowWidth();
  useSmoothScroll();

  return (
    <div>
      <Head>
        <title>Donovan Yohan - UI/UX Designer & Web Developer</title>
        <meta
          name="description"
          content="Hi, I'm Donovan Yohan! I'm a UI & UX designer and a front end developer."
        />
        <meta name="theme-color" content="#FFFFFF" />
        <meta
          key="og:title"
          property="og:title"
          content="Donovan Yohan - UI/UX Designer & Web Developer"
        />
        <meta
          key="og:description"
          property="og:description"
          content="Hi, I'm Donovan Yohan! I'm a UI & UX designer and a front end developer."
        />
        <meta
          key="og:image"
          property="og:image"
          content="https://donovanyohan.donovanyohan.now.sh/ogimage.jpg"
        />
      </Head>
      <Nav
        breadcrumbs={props.breadcrumbs}
        isPhone={windowWidth && windowWidth <= 425}
      />
      {props.children}
      <Footer />
      {windowWidth && windowWidth <= MobileWidth && <BottomNav />}
      <style jsx global>{`
        @font-face {
          font-family: "icomoon";
          src: url("/img/icons/icomoon.eot?c46m5p");
          src: url("/img/icons/icomoon.eot?c46m5p#iefix")
              format("embedded-opentype"),
            url("/img/icons/icomoon.ttf?c46m5p") format("truetype"),
            url("/img/icons/icomoon.woff?c46m5p") format("woff"),
            url("/img/icons/icomoon.svg?c46m5p#icomoon") format("svg");
          font-weight: normal;
          font-style: normal;
          font-display: block;
        }

        html {
          ${Object.entries(cssRootVars)
            .map(([key, val]) => `--${key}: ${val}`)
            .join(";")}
        }

        html[data-theme="dark"] {
          ${Object.entries(cssDarkVars)
            .map(([key, val]) => `--${key}: ${val}`)
            .join(";")}
        }

        body {
          background-color: var(--background);
          color: var(--main);
        }

        a {
          color: var(--main);
          text-decoration: none;
        }
        h2 {
          font-size: 28px;
          line-height: 1.8;
          width: fit-content;
        }

        .pageRoot {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pageContent {
          max-width: 1024px;
          width: calc(100% - 32px);
          margin: 0 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .body {
          font-size: 16px;
          line-height: 2;
        }

        // mimicks behaviour of hero text
        .headerText {
          align-self: flex-start;
          width: fit-content;
          font-size: 47px;
          line-height: 1.5;
          margin-bottom: 64px;
          margin-top: 0;
          cursor: pointer;
        }

        .articleWrapper {
          display: flex;
        }

        .articleWrapper .blurb {
          flex-basis: 55%;
          padding-right: 24px;
        }

        .articleWrapper .list {
          flex-basis: 45%;
        }

        .articleWrapper .list ul {
          margin-top: 0;
        }

        .articleWrapper .list ul li {
          margin-top: 8px;
        }

        .articleWrapper div {
          margin-top: 16px;
        }

        @media only screen and (max-width: 767px) {
          .headerText {
            font-size: 32px;
            margin-bottom: 32px;
          }
        }
        .heroBlurb {
          margin-bottom: 64px;
        }

        // link highlight
        .highlight,
        .textLink {
          text-decoration: none;
          font-weight: bold;
          position: relative;
        }
        .highlight:hover {
          cursor: pointer;
        }
        .highlight::before {
          transition: 0.35s cubic-bezier(0.51, 0.07, 0.09, 0.95);
          content: "";
          z-index: -1;
          position: absolute;
          bottom: 2px;
          width: 0%;
          height: 60%;
          background-color: var(--highlight);
        }
        .highlight:hover::before {
          width: 100%;
        }

        // static highlight effect
        .highlightStatic {
          background: linear-gradient(
            0deg,
            var(--background) 10%,
            var(--highlight) 10%,
            var(--highlight) 60%,
            var(--background) 60%
          );
        }

        .textLink:hover::before {
          opacity: 1;
        }

        .textLink::before {
          z-index: -1;
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          background: linear-gradient(
            0deg,
            var(--background) 10%,
            var(--highlight) 10%,
            var(--highlight) 60%,
            var(--background) 60%
          );
          transition: 0.2s ease;
        }

        #transition {
          background-color: var(--background);
          position: fixed;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          z-index: 99999;
          animation: fade 1s ease-in-out;
        }

        @keyframes fade {
          0% {
            opacity: 0;
          }
          35% {
            opacity: 1;
          }
          65% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @media only screen and (max-width: 1024px) {
          .highlight {
            background: linear-gradient(
              0deg,
              var(--background) 10%,
              var(--highlight) 10%,
              var(--highlight) 60%,
              var(--background) 60%
            );
          }

          .articleWrapper {
            flex-direction: column;
          }

          .textLink {
            background: linear-gradient(
              0deg,
              var(--background) 10%,
              var(--highlight) 10%,
              var(--highlight) 60%,
              var(--background) 60%
            );
            opacity: 1;
          }

          .nav {
            background: none;
          }
        }

        @media only screen and (max-width: 767px) {
          h2 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default Main;
