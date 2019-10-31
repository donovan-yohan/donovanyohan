import React, { useEffect, useState } from 'react'
import Nav from '../components/nav'
import Hero from '../components/hero'
import BottomNav from '../components/bottomNav'
import { MobileWidth, debounce } from '../global/global'

const text = "Hi! I'm a gymnast, dancer, computer nerd, origami lover, bubble tea enthusiast, and more than just my work."

const About = () => {
  // logic for finding current viewport size to determine if mobile layout is needed
  const [width, setWidth] = useState(null)

  useEffect(() => {
    // assign initial width value on first load
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
    <div>
      <Nav />
      <div className="content">
        <Hero
          image={
            <div className="placeholder" />
          }
          text={text}
          customImageStyle={{
            margin: '0px'
          }}
        />
      </div>

      {width < MobileWidth &&
        <BottomNav />
      }
      <style jsx>{`
        .content {
          width: 100%;
        }
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
