import React, { useState, useEffect, useRef } from 'react'
import Hero from '../components/hero'
import Card from '../components/card'
import Lottie from 'lottie-react-web'
import Link from 'next/link'
import logoAnimation from '../public/img/animations/dy.json'
import { MobileWidth, debounce, projects } from '../global/global'
import { AboutText } from '../global/content'
import { Link as ScrollLink, animateScroll as scroll } from "react-scroll";
import Main from '../layouts/main'


const Index = () => {
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
    <Main>
      <index>
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
            text={
              <span>
                <span>Hi! I'm a </span>
                <ScrollLink to='work' smooth={true} duration={750} offset={-64}><span className='highlight'>UI & UX designer</span></ScrollLink> 
                <span> and a </span>
                <Link href='http://github.com/donovan-yohan'><a target='_blank' className='highlight'>front end developer</a></Link>
                .
              </span>
            }
            delay={1200}
            speed={85}
          />
          <h1 className='headerText highlightStatic'>Who I am</h1>
          <span className='aboutText'>{AboutText}</span>
          <h1 name='work' className='headerText highlightStatic'>Work I've done</h1>
          <div className='cardWrapper'>
            {projects.map(({ key, href, label, date, content }) => {
              return (
                <div key={key}>
                  <Card title={label} caption={date} href={href} isMobile={windowWidth < MobileWidth}/>
                </div>
              )
            }
            )}
          </div>
        </div>

        <style jsx>{`
        index {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .content {
          max-width: 1024px;
          width: calc(100% - 32px);
          margin: 0 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        // mimicks behaviour of hero text
        .headerText {
          align-self: flex-start;
          font-size: 47px;
          margin-bottom: 64px;
          margin-top: 0;
        }
        @media only screen and (max-width: 1130px) {
          .headerText {
            font-size: 4.1717vw;
          }
        }
        @media only screen and (max-width: 767px) {
          .headerText {
            font-size: 8.5vw;
            margin-bottom: 32px;
          }
        }
        .aboutText {
          font-size: 18px;
          line-height: 2;
          margin-bottom: 32px;
        }

        .cardWrapper {
          width: 100%;
          position: relative;
          margin-top: 235px;
          max-width: 1024px;
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

      </index>
    </Main>
  )
}

export default Index
