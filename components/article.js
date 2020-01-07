import React from "react";

const Article = props => (
  <div className="content">
    {props.children}

    <style jsx>{`
      .content {
        width: 100%;
        font-size: 16px;
        line-height: 2;
      }
    `}</style>
  </div>
);

export default Article;
