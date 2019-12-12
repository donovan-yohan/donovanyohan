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
import { MobileWidth, PhoneWidth, debounce, projects } from '../global/global'
import { HomeText } from '../global/content'



const Main = () => {
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
          delay={1200}
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
      </div>
      <Footer />

      {windowWidth && windowWidth <= MobileWidth &&
        <BottomNav />
      }

      <style jsx>{`
      main {
        display: flex;
        flex-direction: column;
        align-items: center;

      }
      .content {
        max-width: 1100px;
        width: calc(100% - 32px);
        margin: 0 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .cardWrapper {
        width: 100%;
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
      .cardWrapper div:nth-child(odd) {
        position: relative;
        top: -250px;
      }

      @media only screen and (max-width: 1024px) {
        .cardWrapper div {
          width: 49%;
        }
        .cardWrapper div:nth-child(odd) {
          // calculated based on ratio of card height to desired spacing
          top: calc(50vw * 9 / 16 / 1.1 * -1);
        }
        .cardWrapper {
          margin-top: calc(50vw * 9 / 16 / 1.1);;
        }
      }

      @media only screen and (max-width: 425px) {
        .cardWrapper div:nth-child(odd) {
          top: 0;
        }
        .cardWrapper {
          flex-direction: column;
          margin-top: 0;
        }
        .cardWrapper div {
          width: 100%;
        }
      }

    `}</style>

    </main>
  )
}

export default Main
