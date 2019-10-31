import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Nav from '../components/nav'
import BottomNav from '../components/bottomNav'
import Hero from '../components/hero'
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

      <div className='row'>
        <a href='' className='card'>
          <h3>Documentation &rarr;</h3>
          <p>Learn more about Next.js in the documentation.</p>
        </a>
        <a href='' className='card'>
          <h3>Next.js Learn &rarr;</h3>
          <p>Learn about Next.js by following an interactive tutorial!</p>
        </a>
        <a
          href=''
          className='card'
        >
          <h3>Examples &rarr;</h3>
          <p>Find other example boilerplates on the Next.js GitHub.</p>
        </a>
      </div>

      {width && width < MobileWidth &&
        <BottomNav />
      }

      <style jsx>{`
      .row {
        max-width: 880px;
        margin: 80px auto 40px;
        display: flex;
        flex-direction: row;
        justify-content: space-around;
      }
      .card {
        padding: 18px 18px 24px;
        width: 220px;
        text-align: left;
        text-decoration: none;
        color: #434343;
        border: 1px solid #9b9b9b;
      }
      .card:hover {
        border-color: #067df7;
      }
      .card h3 {
        margin: 0;
        color: #067df7;
        font-size: 18px;
      }
      .card p {
        margin: 0;
        padding: 12px 0 0;
        font-size: 13px;
        color: #333;
      }
    `}</style>
    </main>
  )
}

export default Main
