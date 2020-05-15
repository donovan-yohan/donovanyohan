import React from "react";
import Main from "../../layouts/main";
import ArticleHero from "../../components/articlehero";
import { hobbies } from "../../global/global";

const Origami = () => {
  return (
    <Main
      breadcrumbs={[
        {
          label: "About",
          href: "/about",
        },
        {
          label: "Origami",
          href: "/about/origami",
        },
      ]}
    >
      <div className="pageRoot">
        <div className="pageContent">
          <ArticleHero
            title={"Origami"}
            customImageStyle={{
              margin: "0px",
            }}
            content={hobbies.find((x) => x.label === "Origami").content}
          />
          <div className="imageGrid"></div>
        </div>
        <style jsx>
          {`
            .anchor {
              position: relative;
              top: -100px;
            }
            h2 {
              margin: 16px 0 0 0;
              font-size: 20px;
            }
            p {
              margin: 16px 0 0 0;
            }
            .tableOfContents {
              text-decoration: underline;
            }
          `}
        </style>
      </div>
    </Main>
  );
};

export default Origami;
