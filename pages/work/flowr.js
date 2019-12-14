import React, { useEffect, useState } from 'react'
import Nav from '../../components/nav'
import ArticleHero from '../../components/articlehero'
import ArticleImage from '../../components/articleimage'
import Article from '../../components/article'
import BottomNav from '../../components/bottomNav'
import Footer from '../../components/footer'
import Main from '../../layouts/main'
import { MobileWidth, debounce } from '../../global/global'
import { flowrInfo } from '../../global/content'

const About = () => {
  return (
    <Main>
      <div className="pageRoot">
        <div className="pageContent">
          <ArticleHero
            image={''}
            customImageStyle={{
              margin: '0px'
            }}
            content={'Ullamco elit veniam ipsum nostrud magna in nisi labore fugiat qui mollit excepteur. Occaecat cillum reprehenderit cillum culpa officia officia esse laborum pariatur. Nisi deserunt ipsum sunt officia ea occaecat anim sunt.'}
            info={flowrInfo}
          />
          <ArticleImage
            images={'src'}
          />
          <Article>
            <h2 className="highlightStatic">Hello, world!</h2>
            <p className='body'>Lorum ipsum dolor veniam ipsum nostrud magna in nisi labore fuigat qui moilt exceptuer. Occaecat cillum reprehenderit cillum culpa officia officia esse laborum pariatur. Nisi deserunt ipsum sunt officia ea occaecat anim sunt. </p>
          </Article>
          <ArticleImage
            image={'SRC'}
          />
          <Article>
            <h2 className="highlightStatic">Hello, world!</h2>
            <p className='body'>Lorum ipsum dolor veniam ipsum nostrud magna in nisi labore fuigat qui moilt exceptuer. Lorum ipsum dolor veniam ipsum nostrud magna in nisi labore fuigat qui moilt exceptuer. Occaecat cillum reprehenderit cillum culpa officia officia esse laborum pariatur.</p>
          </Article>
        </div>
        <style jsx>{`
          h2 {
            margin: 16px 0 0 0;
          }
          p {
            margin: 16px 0 0 0;
          }
        `}</style>

      </div>
    </Main>
  )
}

export default About
