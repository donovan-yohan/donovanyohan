import React, { useState } from "react";

const ArticleImage = (props) => {
  const [isZoomed, setZoom] = useState(false);

  return (
    <div className="container">
      <div className="image">
        {!props.zoomable && <img src={props.image} />}
        {props.zoomable && (
          <a href={props.image} target="_blank">
            <img src={props.image} />
          </a>
        )}
      </div>

      <style jsx>{`
        .container {
          margin: 48px 0 0 0;
          width: 100%;
          max-height: calc(1024px * 0.42);
          overflow: hidden;
        }
        .image {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        img {
          width: 100%;
        }

        // Adjust for mobile

        @media only screen and (max-width: 1024px) {
          .container {
            margin: 24px 0 0 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ArticleImage;
