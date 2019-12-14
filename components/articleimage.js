import React from 'react'

const ArticleImage = props => (
  <div className='container'>
    <div className="image">
      <img src={props.image} />
    </div>

    <style jsx>{`
      .container {
        margin: 48px 0 0 0;
        width: 100%;
        height: 32vw;
        max-height: calc(1024px / 3);

      }
      .image {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: lightblue;
      }

      // Adjust for tablets

      @media only screen and (max-width: 1024px) {
        .container {
          margin: 24px 0 0 0;
        }
      }
    `}</style>
  </div>
);

export default ArticleImage;
