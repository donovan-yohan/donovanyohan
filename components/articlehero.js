import React from 'react'
import Link from 'next/link'

const ArticleHero = props => (
  <div>
    <div className='container'>
      <div className='hero'>
        {props.image}
      </div>
      <div className='content'>
        <div className='wrapper'>
          <div className='intro'>
            <h1 className="headerText highlightStatic">flowr</h1>
            <p className='body'>
              {props.content}
            </p>
          </div>
          <ul>
            {props.info.map(({ key, label, isLink, href }) => (
              isLink ? (
                <li key={key}>
                  <Link href={href}>
                    <a className='highlight'>{label}</a>
                  </Link>
                </li>
              ) : (
                  <li key={key}>
                    {label}
                  </li>
                )
            ))}
          </ul>
        </div>
      </div>
    </div>

    <style jsx>{`
      :global(body) {
        margin: 0;
        font-family: "Open Sans";
      }
      .container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .hero {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 50px;
        max-height: 400px;
        height: 33vw;
        width: 100vw;
        background: #F5F5F5;
      }
      .content {
        max-width: 1024px;
        font-size: 18px;
      }
      .wrapper {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
      }
      .intro {
        flex-basis: 70%;
      }
      h1 {
        margin: 32px 0 0 0;
        width: fit-content;
        height: fit-content;
      }
      p {
        margin: 16px 0 0 0;
        line-height: 2;
      }
      ul {
        line-height: 36px;
        flex-basis: 25%;
        padding: 0;
        margin:64px 0 0 0;
        display: flex;
        flex-direction: column;
        font-size: 16px;
        font-weight: bold;
      }
      ul li {
        list-style-type: none;
        color: rgba(0,0,0,0.54);
      }
      a {
        text-decoration: none;
        color: rgba(0,0,0,1);
      }


      // adjust for tablet and smaller 
      @media only screen and (max-width: 1024px) {
        .content {
          font-size: 18px;
          margin: 0 16px;
        }
      }
      // Adjust for Mobile

      @media only screen and (max-width: 767px) {
        .hero {
          max-height: 50vw;
          overflow: hidden;
        }
        .wrapper {
          flex-direction: column-reverse;
        }
        p {
          margin-right: 0;
          flex-basis: unset;
        }
        ul {
          flex-basis: unset;
          margin-top: 16px;
        }
      }
    `}</style>
  </div>
);

export default ArticleHero;
