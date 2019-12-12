import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Nav from '../components/nav'
import Footer from '../components/footer'
import BottomNav from '../components/bottomNav'
import { MobileWidth, debounce } from '../global/global'


const Main = ({ children }) => {
// logic for finding current viewport size to determine if mobile layout is needed
const [windowWidth, setWidth] = useState(null)

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
        <title>Donovan Yohan</title>
    </Head>
    <Nav />
    { children }
    <Footer />
    {windowWidth && windowWidth <= MobileWidth &&
        <BottomNav />
    }
    <style jsx global>{`
        a {
            text-decoration: none;
            color: black;
        }
        // link highlight
        .highlight {
          text-decoration: none;
          color: black;
          font-weight: bold;
          position: relative;
        }
        .highlight:hover {
          cursor: pointer;
        }
        .highlight::before {
          transition: 0.2s;
          content: "";
          z-index: -1;
          position: absolute;
          bottom: 2px;
          width: 0%;
          height: 60%;
          background-color: #FFF500;
        }
        .highlight:hover::before {
          width: 100%;
        }
        @media only screen and (max-width: 1024px) {
          .highlight {
            background: linear-gradient(0deg, #FFFFFF 10%, #FFF500 10%, #FFF500 60%, #FFFFFF 60%);
          }
        }

        // static highlight effect 
        .highlightStatic {
            background: linear-gradient(0deg, #FFFFFF 10%, #FFF500 10%, #FFF500 60%, #FFFFFF 60%);
        }
    `}</style>
  </div>
)}

export default Main