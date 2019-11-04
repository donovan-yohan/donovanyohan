import React, { useEffect, useState } from 'react'
import Nav from '../../components/nav'
import ArticleHero from '../../components/articlehero'
import BottomNav from '../../components/bottomNav'
import Footer from '../../components/footer'
import { MobileWidth, debounce } from '../../global/global'
import { flowrInfo } from '../../global/content'

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
    <div>
      <Nav />
      <div className="content">
        <ArticleHero
          image={
            <div className="placeholder" />
          }
          customImageStyle={{
            margin: '0px'
          }}
          content={'Ullamco elit veniam ipsum nostrud magna in nisi labore fugiat qui mollit excepteur. Occaecat cillum reprehenderit cillum culpa officia officia esse laborum pariatur. Nisi deserunt ipsum sunt officia ea occaecat anim sunt.'}
          info={flowrInfo}
        />
        <Footer />
      </div>
      {windowWidth < MobileWidth &&
        <BottomNav />
      }
      <style jsx>{`
        .content {
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
