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
      ::selection {
        background: #FFF500; /* WebKit/Blink Browsers */
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
        height: 100vh;
        display: flex;
        justify-content: center;
      }
      .wrapper {
        display: flex;
        align-items: center;
        width: 95vw;
        max-width: 1100px;
      }
      .text {
        display: inline-block;
        margin-left: 32px;
        font-family: 'Open Sans';
        font-weight: 300;
        font-size: 47px;
        line-height: 1.3em;
        letter-spacing: -0.01em;
        height: 338px;
      }
      .typedText {
        display: inline-block !important;
      }
      .logo {
        margin-top: -24px;
        width: 429px;
        min-width: 429px;
      }



      // Adjust for small displays

      @media only screen and (max-width: 1130px) {
        .text {
          flex-basis: 60%;
          flex-shrink: 1;
          font-size: 4.1717vw;
          margin-left: 2.8vw;
          height: 30.7272vw;
        }
        .logo {
          flex-shrink: 2;
          flex-basis: 40%;
          margin-top: -2.1818vw;
          min-width: 38%;
        }
      }



      // Adjust for Mobile

      @media only screen and (max-width: 767px) {
        .wrapper {
          width: 100%;
          margin-top: 0;
          margin-bottom: 10vh;
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
