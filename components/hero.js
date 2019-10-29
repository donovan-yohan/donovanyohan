import React, { useState, useEffect } from 'react'


const TypedText = ({ speed, text }) => {
  const [currentText, setCurrentText] = useState("");
  useEffect(() => {
    let id = window.setInterval(() => {
      setCurrentText(currentText => {
        let nextChar = text[currentText.length];
        if (nextChar === undefined) {
          clearInterval(id);
          return currentText;
        }
        return currentText + nextChar;
      });
    }, 3000 / speed);
  }, []);
  return <p>{currentText}|</p>;
};

const Hero = props => (
  <div>
    <div className='container'>
      <div className='wrapper'>
        <div className='logo' style={props.customImageStyle}>
          {props.image}
        </div>
        <div className='text'>
          <TypedText speed={225} text={props.text} />
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
        height: 95vh;
        display: flex;
        justify-content: center;
      }
      .wrapper {
        display: flex;
        align-items: center;
        width: 95vw;
        max-width: 1280px;
      }
      .text {
        display: inline-block;
        margin-left: 48px;
        font-family: 'Open Sans';
        font-weight: 300;
        font-size: 58px;
        line-height: 1.3em;
        letter-spacing: -0.01em;
        height: 416px;
      }
      .typedText {
        display: inline-block !important;
      }
      .logo {
        margin-top: -58px;
        width: 442px;
        min-width: 442px;
      }

      @media only screen and (max-width: 1290px) {
        .text {
          flex-basis: 62%;
          flex-shrink: 1;
          font-size: 4.53125vw;
          margin-left: 4vw;
          height: 32.8vw;
        }
        .logo {
          flex-shrink: 2;
          flex-basis: 34%;
          margin-top: -6.25vw;
          min-width: 34%;
        }
      }
    `}</style>
  </div>
);

export default Hero;
