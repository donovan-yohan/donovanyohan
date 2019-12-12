import React from 'react'

const Article = props => (
  <div>
    <div className='container'>
      <div className='content'>
        <h2>{props.title}</h2>
        <p>{props.content}</p>
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
      .content {
        font-size: 18px;
        line-height: 2;
        max-width: 1024px;
        margin: 16px 40px;
      }
      h2 {
        font-size: 22px;
        margin: 16px 0 0 0;
      }
      p {
        margin: 16px 0 0 0;
      }


      // Adjust for Mobile

      @media only screen and (max-width: 767px) {
        .content {
          font-size: 18px;
          line-height: 36px;
          margin: 8px 16px 16px 16px;
        }
        h2 {
          font-size: 22px;
        }
        p {
          margin-right: 0;
        }
      }
    `}</style>
  </div>
);

export default Article;
