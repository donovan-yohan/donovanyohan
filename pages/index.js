import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Nav from '../components/nav'
import BottomNav from '../components/bottomNav'
import Hero from '../components/hero'
import Card from '../components/card'
import Lottie from 'lottie-react-web'
import logoAnimation from '../public/img/animations/dy.json'
import { MobileWidth, debounce } from '../global/global'

const HomeText = "Hi! I'm a UI & UX designer, full stack programmer, graphic designer, motion graphics artist, and video editor."


const Main = () => {
  // logic for finding current viewport size to determine if mobile layout is needed
  const [width, setWidth] = useState(null)

  useEffect(() => {
    if (!width) setWidth(document.children[0].clientWidth);

    const debouncedHandleResize = debounce(function handleResize() {
      setWidth(document.children[0].clientWidth);
    }, 250);

    window.addEventListener("resize", debouncedHandleResize);

    return _ => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  });

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
          delay={750}
          speed={125}
        />
        <div className='cardWrapper'>
          <div>
            <Card
              title="Manulife Mobile"
              caption="Fall 2019"
              colour="limegreen"
            />
          </div>
          <div>
            <Card
              title="flowr"
              caption="Fall 2019"
              colour="turquoise"
            />
          </div>
          <div>
            <Card
              title="Cooperators Mobile App"
              caption="Winter 2019"
              colour="skyblue"
            />
          </div>
          <div>
            <Card
              title="Motion Graphics"
              caption="2014 - Present"
              colour="orange"
            />
          </div>
          <div>
            <Card
              title="Graphic Design"
              caption="2012 - Present"
              colour="purple"
            />
          </div>

        </div>
      </div>


      {width && width < MobileWidth &&
        <BottomNav />
      }

      <style jsx>{`
      .content {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .cardWrapper {
        margin: 0 40px;
        max-width: 1000px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
      }

      @media only screen and (min-width: 1025px) {
        .cardWrapper div:nth-child(even) {
          position: relative;
          top: 212px;
        }
      }

      @media only screen and (max-width: 1024px) {
        .cardWrapper {
          margin: 0 0 64px 0;
          max-width: 100%;
        }
      }

    `}</style>
    </main>
  )
}

export default Main
