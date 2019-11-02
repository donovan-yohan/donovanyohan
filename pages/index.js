import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Nav from '../components/nav'
import BottomNav from '../components/bottomNav'
import Hero from '../components/hero'
import Card from '../components/card'
import Footer from '../components/footer'
import Lottie from 'lottie-react-web'
import Link from 'next/link'
import logoAnimation from '../public/img/animations/dy.json'
import { MobileWidth, debounce } from '../global/global'

const HomeText = "Hi! I'm a UI & UX designer, full stack programmer, graphic designer, motion graphics artist, and video editor."

const projects = [
  {
    href: "",
    label: "Manulife Mobile",
    date: "Fall 2019",
    content: "",
  },
  {
    href: "",
    label: "flowr",
    date: "Fall 2019",
    content: "",
  },
  {
    href: "",
    label: "donovanyohan.com",
    date: "Fall 2019",
    content: "",
  },
  {
    href: "",
    label: "Cooperators Mobile App",
    date: "Winter 2019",
    content: "",
  }
].map(project => {
  project.key = `nav-link-${project.href}-${project.label}`;
  return project;
});


const Main = () => {
  // logic for finding current viewport size to determine if mobile layout is needed
  const [windowWidth, setWidth] = useState(null)

  useEffect(() => {
    if (!windowWidth) setWidth(document.children[0].clientWidth);
    console.log(document.children);

    const debouncedHandleResize = debounce(function handleResize() {
      setWidth(document.children[0].clientWidth);
    }, 250);

    window.addEventListener("resize", debouncedHandleResize);

    return _ => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  });

  // logic for finding currently visible element

  return (
    <main>
      <Head>
        <title>Donovan Yohan</title>
      </Head>

      <Nav />
      <div className='content'>
        <Hero
          image={
            <Lottie
              options={{
                animationData: logoAnimation,
                loop: false
              }}
            />
          }
          text={HomeText}
          delay={650}
          speed={85}
        />
        <div className='cardWrapper'>
          {projects.map(({ key, href, label, date, content }) => {
            return (
              <div key={key}>
                <Card title={label} caption={date} href={href} isMobile={windowWidth < MobileWidth}>

                </Card>
              </div>
            )
          }
          )}
        </div>
        <Footer />
      </div>

      {windowWidth && windowWidth < MobileWidth &&
        <BottomNav />
      }

      <style jsx>{`
      main {
        display: flex;
        justify-content: center;
      }
      .content {
        width: 100%;
        max-width: 1100px;
        margin: 0 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .cardWrapper {
        position: relative;
        margin-top: 235px;
        max-width: 1100px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
      }
      .cardWrapper div {
        width: 48%
      }
      .cardWrapper a {
        text-decoration: none;
        color: black;
      }


      // only use stagger effect when on desktop sized screens
      @media only screen and (min-width: 1024px) {
        .cardWrapper div:nth-child(odd) {
          position: relative;
          top: -235px;
        }
      }


      // mobile scaling
      @media only screen and (max-width: 1023px) {
        .cardWrapper {
          margin: 0 0 64px 0;
          max-width: 100%;
          flex-direction: column;
        }
      }

    `}</style>
    </main>
  )
}

export default Main
