import React, { useState, useEffect } from 'react'
import Hero from '../components/hero'
import Card from '../components/card'
import Lottie from 'lottie-react-web'
import Link from 'next/link'
import logoAnimation from '../public/img/animations/dy.json'
import { MobileWidth, debounce, projects } from '../global/global'
import Main from '../layouts/main'
import useSmoothScroll from '../hooks/useSmoothScroll'
import VisibilitySensor from 'react-visibility-sensor'


const Index = () => {
  // logic for finding current viewport size to determine if mobile layout is needed
  const [windowWidth, setWidth] = useState(null)
  const [heroVisible, setVisible] = useState(true);

  function onChange(isVisible) {
    setVisible(isVisible);
  }

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

  useSmoothScroll();

  return (
    <Main>
      <div className="pageRoot">
        <div className='pageContent'>
          <Hero
            image={
              <VisibilitySensor partialVisibility={true} onChange={onChange}>
                <Lottie
                  options={{
                    animationData: logoAnimation,
                    loop: false,
                  }}
                  isStopped={!heroVisible}
                />
              </VisibilitySensor>
            }
            text={
              <span>
                <span>Hi! I'm Donovan Yohan, and I'm a </span>
                <a href='#work' className='highlight heroHighlight'>UI & UX designer</a> 
                <span> and a </span>
                <a href='http://github.com/donovan-yohan' target='_blank' className='highlight heroHighlight'>front end developer</a>
                .
              </span>
            }
          />
          <h1 className='headerText highlightStatic'>
            <Link href='/about'><a>Nice to meet you!</a></Link>
          </h1>
          <span className='body heroBlurb'>
            <span>I'm a designer & developer passionate about creating user-focused, robust, and well-researched digital solutions. In addition to UI & UX, I'm an experienced </span>
            <a className='textLink' href="#">graphic designer</a>
            <span> and </span>
            <a className='textLink' href="#">motion graphics artist</a>
            <span>. I'm well versed in native mobile design languages for both iOS and Android, and have built numerous responsive websites using React, Vue, and Angular. But, believe it or not, </span>
            <span><Link href='/about'><a className='textLink'>I don't just draw and code!</a></Link></span>
          </span>
            
          <a id='work'> </a>
          <a href='#work' id='workWrapper'>
            <h1 name='work' className='headerText highlightStatic'>Work I've done.</h1>
          </a>
          <div className='cardWrapper'>
            {projects.map(({ key, href, label, date, content }) => {
              return (
                <div key={key}>
                  <Card title={label} caption={date} href={href} isMobile={windowWidth < MobileWidth}/>
                </div>
              )
            })}
          </div>
        </div>

    <style jsx>{`
        {/* .heroHighlight {
        }
        .heroHighlight::before {
          animation: 700ms cubic-bezier(0.51, 0.07, 0.09, 0.95) 1.5s 2 alternate highlighterOn;
        } */}

        #work {
          position: relative;
          align
          top: -64px;
        }
        
        #workWrapper {
          align-self: flex-start;
        }

        .cardWrapper {
          width: 100%;
          position: relative;
          margin-top: 250px;
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

        @keyframes highlighterOn {
          0% {
            width: 0%;
          }

          100% {
            width: 100%;
          }
        }
      `}</style>

      </div>
    </Main>
  )
}

export default Index
