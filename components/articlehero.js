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
            <h2>flowr</h2>
            <p>
              {props.content}
            </p>
          </div>
          <ul>
            {props.info.map(({ key, label, isLink, href }) => (
              isLink ? (
                <li key={key}>
                  <Link href={href}>
                    <a>{label}</a>
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
        min-height: 50%;
        width: 100%;
        background: #F5F5F5;
      }
      .content {
        font-size: 18px;
        line-height: 2;
        max-width: 1024px;
        margin: 16px 40px;
      }
      .wrapper {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
      }
      .intro {
        flex-basis: 65%;
      }
      h2 {
        font-size: 22px;
        margin: 32px 0 0 0;
      }
      p {
        margin: 16px 0 0 0;
      }
      ul {
        flex-basis: 25%;
        padding: 0;
        margin:64px 0 0 0;
        display: flex;
        flex-direction: column;
        font-size: 16px;
        font-weight: bold;
        color: gray;
      }
      ul li {
        list-style-type: none;
      }
      a {
        text-decoration: none;
        color: black;
      }

      // Adjust for Mobile

      @media only screen and (max-width: 767px) {
        .hero {
          max-height: 50vw;
          overflow: hidden;
        }
        .content {
          font-size: 18px;
          line-height: 36px;
          margin: 16px 16px 0px 16px
        }
        h2 {
          font-size: 22px;
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
          margin-top: 0;
        }
      }
    `}</style>
  </div>
);

export default ArticleHero;
