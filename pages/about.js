import React, { useEffect, useState } from 'react'
import Nav from '../components/nav'
import Hero from '../components/hero'
import BottomNav from '../components/bottomNav'
import { MobileWidth, debounce } from '../global/global'

const text = "Hi! I'm a gymnast, dancer, computer nerd, origami lover, bubble tea enthusiast, and more than just my work."

const About = () => {
  const [width, setWidth] = useState(null);

  if (process.browser) {
    useEffect(() => {
      const debouncedHandleResize = debounce(function handleResize() {
        setWidth(document.children[0].clientWidth);
      }, 250);

      window.addEventListener("resize", debouncedHandleResize);

      return _ => {
        window.removeEventListener("resize", debouncedHandleResize);
      };
    }, []);
  };
  return (
    <div>
      <Nav />
      <Hero
        image={
          <div className="placeholder" />
        }
        text={text}
        customImageStyle={{
          margin: '0px'
        }}
      />

      {width < MobileWidth &&
        <BottomNav />
      }
      <style jsx>{`
      .placeholder {
      border-radius: 100%;
        width: 400px;
        height: 400px;
        background-color: gray;
      }
    `}</style>
    </div>
  )
}

export default About
