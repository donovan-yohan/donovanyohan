import React from "react";
import Link from "next/link";

const ArticleHero = props => (
  <div>
    <div className="container">
      <div className="hero">
        <img src={props.image} />
      </div>
      <div className="content">
        <div className="wrapper">
          <h1>
            <span className="headerText highlightStatic">
              <a href="#">{props.title}</a>
            </span>
          </h1>
          <div className="intro">
            <p className="body">{props.content}</p>
            <ul>
              {props.info.map(({ key, label, isLink, href }) =>
                isLink ? (
                  <li key={key}>
                    <Link href={href}>
                      <a target="_blank" className="highlight">
                        {label}
                      </a>
                    </Link>
                  </li>
                ) : (
                  <li key={key}>{label}</li>
                )
              )}
            </ul>
          </div>
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
        margin-bottom: 16px;
      }
      .hero {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 56px;
        max-height: 400px;
        height: 33vw;
        width: 100%;
        max-width: 100vw;
        overflow: hidden;
      }
      img {
        height: 100%;
        width: auto;
      }

      .content {
        max-width: 1024px;
        font-size: 18px;
      }
      .intro {
        display: flex;
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
        line-height: 2;
        padding-left: 32px;
        display: flex;
        flex-direction: column;
        flex-basis: 75%;
        font-size: 16px;
        font-weight: bold;
      }
      ul li {
        list-style-type: none;
        color: rgba(0, 0, 0, 0.54);
      }
      a {
        text-decoration: none;
        color: rgba(0, 0, 0, 1);
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
        .intro {
          flex-direction: column-reverse;
        }
        ul {
          flex-basis: unset;
          padding-left: 0px;
        }
        p {
          margin: 0;
        }
      }
    `}</style>
  </div>
);

export default ArticleHero;
