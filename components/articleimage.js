import React from 'react'

const ArticleImage = props => (
  <div>
    <div className='container'>
      <div className='images'>
        {props.images.map(({ key, src }) => (
          <div key={key} className="image">
            <img src={src} />
          </div>
        ))}
        {props.image}
      </div>
    </div>

    <style jsx>{`
      .test {
        width: 100%;
        height: 100%;
        background-color: pink;
      }

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
      .images {
        display: flex;
        margin: 48px 40px 0 40px;
        width: calc(100% - 64px);
        max-width: 1024px;
        height: 366px;
      }
      .image {
        overflow: hidden;
        flex-grow: 1;
        margin: 8px;
        background-color: lightblue;
      }

      // Adjust for Small screen

      @media only screen and (max-width: 1180px) {
        .images {
          height: 31vw;
        }
      }

      // Adjust for Mobile

      @media only screen and (max-width: 767px) {
        .content {
          margin: 
          font-size: 18px;
          line-height: 36px;
          margin-bottom: 64px;
        }
        .images {
          margin: 24px 16px 0 16px;
          width: calc(100% - 16px);
          height: 32vw;
        }
        .image {
          flex-basis: 50%;
          flex-wrap: wrap;
        }
      }
    `}</style>
  </div>
);

export default ArticleImage;
