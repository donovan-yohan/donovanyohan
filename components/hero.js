import React, { useState, useEffect } from 'react'


const TypedText = ({ speed, text, delay }) => {
  const [currentText, setCurrentText] = useState("");

  useEffect(() => {
    setTimeout(() => {
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
    }, delay);
  }, []);


  return (
    <p>
      {currentText}
      <span className="cursor">|</span>
      <style jsx>{`
      .cursor {
        animation: fade 0.9s ease infinite;
      }
      @keyframes fade {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      } 
    `}</style>
    </p>

  );
};

const Hero = props => (
  <div>
    <div className='container'>
      <div className='wrapper'>
        <div className='logo' style={props.customImageStyle}>
          {props.image}
        </div>
        <div className='text'>
          <TypedText speed={props.speed ? props.speed : 150} text={props.text} delay={props.delay ? props.delay : 0} />
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
        height: 90vh;
        display: flex;
        justify-content: center;
      }
      .wrapper {
        margin-top: 5vh;
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



      // Adjust for small displays

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



      // Adjust for Mobile

      @media only screen and (max-width: 767px) {
        .wrapper {
          width: 100%;
          margin-top: 0;
        }
        .text {
          flex-basis: 100%;
          flex-shrink: unset;
          font-size: 8.5vw;
          margin: 0 16px 0 48px;
          height: 71.875vw;
          text-size-adjust: none;
        }
        .logo {
          display: none;
        }
      }
    `}</style>
  </div>
);

export default Hero;
