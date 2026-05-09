import React from "react";

interface ArticleImageProps {
  image?: string;
  images?: string;
  alt?: string;
  zoomable?: boolean;
}

const ArticleImage = (props: ArticleImageProps) => {
  const image = props.image ?? props.images ?? "";
  return (
    <div className="container">
      <div className="image">
        {!props.zoomable && <img src={image} alt={props.alt} />}
        {props.zoomable && (
          <a href={image} target="_blank" rel="noreferrer">
            <img src={image} alt={props.alt} />
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
