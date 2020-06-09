import React from "react";

const ArticleHero = (props) => (
  <div>
    <div className="container">
      {props.image && (
        <div className="hero" style={{ backgroundColor: props.bgColor }}>
          <img src={props.image} />
        </div>
      )}
      {!props.image && <div className="spacer" />}
      <div className="content">
        <div className="wrapper">
          <h1>
            <span className="headerText highlightStatic">
              <a href="#">{props.title}</a>
            </span>
          </h1>
          <div className="intro">
            <p className="body">{props.content}</p>
            {props.info && (
              <ul>
                {props.info.map(({ key, label, isLink, href }) =>
                  isLink ? (
                    <li key={key}>
                      <a href={href} target="_blank" className="highlight">
                        {label}
                      </a>
                    </li>
                  ) : (
                    <li key={key}>{label}</li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
      :global(body) {
        margin: 0;
        font-family: "Open Sans";
        overflow-x: hidden;
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
        margin-top: 56px;
        max-height: 400px;
        height: 33vw;
        width: 100vw;
        overflow: hidden;
      }

      .spacer {
        width: 100vw;
        margin-top: 64px;
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
        color: var(--gray);
      }
      a {
        text-decoration: none;
        color: var(--main);
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
        }
        .spacer {
          margin-top: 32px;
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
