import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Hero from '../components/hero'
import Card from '../components/card'
import { MobileWidth, debounce, hobbies } from '../global/global'
import Main from '../layouts/main'
import { AboutHero, AboutText } from '../global/content'

const About = () => {
  // logic for finding current viewport size to determine if mobile layout is needed
  const [windowWidth, setWidth] = useState(null)

  useEffect(() => {
    // assign initial windowWidth value on first load
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
    <Main breadcrumbs={[{label: 'About', href: '/about'}]}>
      <div className='pageRoot'>
        <div className="pageContent">
          <Hero
            image={
              <img src="img/photos/about.jpg" className="heroImage"/>
            }
            text={AboutHero}
            customImageStyle={{
              margin: '0px',
            }}
          />
          <h1 className='headerText highlightStatic'>
            <Link href='/about'><a>About me</a></Link>
          </h1>
          <span className='body heroBlurb'>{AboutText}</span>
        
          <div className='cardWrapper'>
            {hobbies.map(({ key, href, label, date, content }) => {
              return (
                <div key={key}>
                  <Card title={label} caption={date} href={href} isMobile={windowWidth < MobileWidth} content={content}/>
                </div>
              )
            })}
          </div>
        </div>

        <style jsx>{`

        .heroImage {
          border-radius: 100%;
          max-width: 100%;
          max-height: 100%;
        }

        .cardWrapper {
          width: 100%;
          position: relative;
          margin-top: 250px;
          max-width: 1024px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;


          margin-bottom: -250px;
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
            margin-bottom: 0;
          }
          .cardWrapper div {
            width: 100%;
          }
        }
        `}</style>

      </div>
    </Main>
  )
}

export default About
