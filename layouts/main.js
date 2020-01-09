import React, { useState, useEffect } from "react";
import Head from "next/head";
import Nav from "../components/nav";
import Footer from "../components/footer";
import BottomNav from "../components/bottomNav";
import { MobileWidth, debounce } from "../global/global";
import useSmoothScroll from "../hooks/useSmoothScroll";

const Main = props => {
  // logic for finding current viewport size to determine if mobile layout is needed
  const [windowWidth, setWidth] = useState(null);

  useSmoothScroll();

  useEffect(() => {
    if (!windowWidth) setWidth(document.children[0].clientWidth);

    const debouncedHandleResize = debounce(function handleResize() {
      setWidth(document.children[0].clientWidth);
    }, 250);

    window.addEventListener("resize", debouncedHandleResize);

    return _ => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  });

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
        <meta key="og:image" property="og:image" content="../ogimage.png" />
      </Head>

      <Nav
        breadcrumbs={props.breadcrumbs}
        isPhone={windowWidth && windowWidth <= 425}
      />
      {props.children}
      <Footer />
      {windowWidth && windowWidth <= MobileWidth && <BottomNav />}
      <style jsx global>{`
        a {
          text-decoration: none;
          color: black;
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
          color: black;
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
          background-color: #fff500;
        }
        .highlight:hover::before {
          width: 100%;
        }

        // static highlight effect
        .highlightStatic {
          background: linear-gradient(
            0deg,
            #ffffff 10%,
            #fff500 10%,
            #fff500 60%,
            #ffffff 60%
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
            #ffffff 10%,
            #fff500 10%,
            #fff500 60%,
            #ffffff 60%
          );
          transition: 0.2s ease;
        }

        @media only screen and (max-width: 1024px) {
          .highlight {
            background: linear-gradient(
              0deg,
              #ffffff 10%,
              #fff500 10%,
              #fff500 60%,
              #ffffff 60%
            );
          }

          .textLink {
            background: linear-gradient(
              0deg,
              #ffffff 10%,
              #fff500 10%,
              #fff500 60%,
              #ffffff 60%
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
