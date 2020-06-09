import React from "react";

const Hero = (props) => (
  <div>
    <div className="container">
      <div className="wrapper">
        <div className="logo" style={props.customImageStyle}>
          <div style={props.dark ? { filter: "invert(95%)" } : {}}>
            {props.image}
          </div>
        </div>
        <div className="text">{props.text}</div>
      </div>
    </div>
    <style jsx>{`
      :global(body) {
        margin: 0;
        font-family: "Open Sans";
      }
      .container {
        width: 100%;
        height: 100vh;
        display: flex;
        justify-content: center;
      }
      .wrapper {
        display: flex;
        align-items: center;
        width: 95vw;
        max-width: 1024px;
      }
      .text {
        display: inline-block;
        margin-left: 32px;
        font-family: "Open Sans";
        font-weight: 300;
        font-size: 47px;
        line-height: 1.3em;
        letter-spacing: -0.01em;
        height: 240px;
      }
      .typedText {
        display: inline-block !important;
      }
      .logo {
        margin-top: -24px;
        width: 420px;
        min-width: 420px;
      }

      // Adjust for small displays

      @media only screen and (max-width: 1130px) {
        .text {
          flex-basis: 60%;
          flex-shrink: 1;
          font-size: 4.1717vw;
          margin-left: 2.8vw;
          height: 22vw;
          line-height: 1.4;
        }
        .logo {
          flex-shrink: 2;
          flex-basis: 47%;
          margin-top: -2.1818vw;
          min-width: 38%;
        }
      }

      // Adjust for Mobile

      @media only screen and (max-width: 450px) {
        .container {
          min-width: 100%;
          min-height: 95vh;
        }
        .wrapper {
          max-width: 100%;
          margin-top: 15vh;
          flex-direction: column;
        }
        .text {
          flex-basis: 100%;
          flex-shrink: unset;
          font-size: 8.3vw;
          margin: 24px;
          text-align: center;
          height: auto;
          text-size-adjust: none;
        }
        .logo {
          margin-top: 0;
          max-width: 66%;
          min-height: 66vw;
        }
      }
    `}</style>
  </div>
);

export default Hero;
