import React from 'react'
import ArticleHero from '../../components/articlehero'
import ArticleImage from '../../components/articleimage'
import Article from '../../components/article'
import Main from '../../layouts/main'
import { manulifeInfo } from '../../global/content'

const Flowr = () => {
  return (
    <Main breadcrumbs={[{label: 'Work', href: '/#work'}, {label: 'Manulife Mobile', href: '/work/manulife'}]}>
      <div className="pageRoot">
        <div className="pageContent">
          <ArticleHero
            title={'Manulife Mobile'}
            image={''}
            customImageStyle={{
              margin: '0px'
            }}
            content={`
            At Manulife, I worked as a Mobile UI/UX designer, and had the opportunity to bring user-centered design to a diverse team in a very large fin-tech corporation.
            I worked on the Manulife Mobile Group Retirement app, as the sole UX designer on a scrum-based agile team.
            `}
            info={manulifeInfo}
          />
          <Article>
            <p className='body'>During my stay, I got to be a part of:</p>
            <ul className='body tableOfContents'>
              <li><a href="#team">Using stories to make design matter to my agile team</a></li>
              <li><a href="">Identifying the actual problem rather than accepting blanket solutions</a></li>
              <li><a href="">Research, design, validate, rinse, repeat</a></li>
            </ul>
          </Article>
          <ArticleImage
            images={'src'}
          />
          <Article>
            <h2 id="team" className='anchor'></h2>
            <h2 className="highlightStatic">Using stories to make design matter to my agile team</h2>
            <p className='body'>
              One of the first things I did at Manulife, was estalish a short weekly meeting with my entire team called a, 'Design Check-in.' This 
              was my opportunity to talk about design with my whole team, and what better way to get a message across than to tell a story.
            </p>
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
          .anchor {
            position: relative;
            top: -100px;
          }
          h2 {
            margin: 16px 0 0 0;
          }
          p {
            margin: 16px 0 0 0;
          }
          .tableOfContents {
            text-decoration: underline;
          }
        `}</style>

      </div>
    </Main>
  )
}

export default Flowr
