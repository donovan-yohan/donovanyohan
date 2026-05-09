import React from "react";
import Image from "next/image";

interface ArticleImageProps {
  image?: string;
  /** Legacy alias. Prefer `image` for new article imagery. */
  images?: string;
  alt?: string;
  zoomable?: boolean;
}

const PLACEHOLDER_IMAGE_VALUES = new Set(["image", "images", "placeholder", "src"]);

export const normalizeArticleImageSrc = (src?: string) => {
  const image = src?.trim();

  if (!image || PLACEHOLDER_IMAGE_VALUES.has(image.toLowerCase())) {
    return null;
  }

  if (
    image.startsWith("/") ||
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  if (image.startsWith("img/")) {
    return `/${image}`;
  }

  return null;
};

const ArticleImage = (props: ArticleImageProps) => {
  const image = normalizeArticleImageSrc(props.image ?? props.images);

  if (!image) {
    return null;
  }

  const alt = props.alt ?? "";

  return (
    <div className="container">
      <div className="image">
        {!props.zoomable && (
          <Image
            className="articleImage"
            src={image}
            alt={alt}
            width={1024}
            height={430}
            sizes="(max-width: 1024px) calc(100vw - 32px), 1024px"
          />
        )}
        {props.zoomable && (
          <a href={image} target="_blank" rel="noreferrer">
            <Image
              className="articleImage"
              src={image}
              alt={alt}
              width={1024}
              height={430}
              sizes="(max-width: 1024px) calc(100vw - 32px), 1024px"
            />
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
        .articleImage {
          width: 100%;
          height: auto;
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
