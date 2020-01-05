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
              Manulife provides group retirement and benefits services to other businesses' employees. Manulife Mobile allows Manulife account holders to
              make and view their benefits claims for various medical, dental, and well-being services as well as see how their retirement investment 
              portfolio is performing.
            `}
            info={manulifeInfo}
          />
          <Article>
            <p className='body'>
              At Manulife, I worked as a Mobile UI/UX designer, and had the opportunity to bring user-centered design to a diverse team in a very large fin-tech corporation.
              I worked on the Manulife Mobile Group Retirement project, as the sole UX designer on a scrum-based agile team.
            </p>
            <p className='body'>During my stay, I got to be a part of:</p>
            <ul className='body tableOfContents'>
              <li><a href="#team">Making design matter to my agile team</a></li>
              <li><a href="">Vying for what's best for the user</a></li>
              <li><a href="">Research, design, validate, rinse, repeat</a></li>
            </ul>
          </Article>
          <ArticleImage
            images={'src'}
          />
          <Article>
            <h2 id="team" className='anchor'></h2>
            <h2 className="highlightStatic">Making design matter to my agile team</h2>
            <p className='body'>
              One of the first things I did at Manulife, was estalish a short weekly meeting with my entire team called a, 'Design Check-in.' This 
              was my opportunity to get the whole team on board with the design itself, the objectives of the design, and how we would measure its success.
              By involving the entire team, including developers, from the beginning, I was able to use my team as a design resource that helped verify my
              own design decisions. 
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
