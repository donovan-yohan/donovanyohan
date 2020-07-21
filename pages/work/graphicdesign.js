import React, { useContext } from "react";
import ArticleHero from "../../components/articlehero";
import ArticleImage from "../../components/articleimage";
import Article from "../../components/article";
import WorkLinks from "../../components/worklinks";
import Main from "../../layouts/main";
import { graphicInfo } from "../../global/content";
import Context from "../../components/context";

const Graphicdesign = () => {
  const { theme } = useContext(Context);
  return (
    <Main
      breadcrumbs={[
        { label: "Work", href: "/#work" },
        { label: "Graphic Design", href: "/work/graphicdesign" },
      ]}
    >
      <div className="pageRoot">
        <div className="pageContent">
          <ArticleHero
            title={"Freelance Graphic Design"}
            image={
              theme == "light"
                ? "/img/photos/graphicdesignbanner.png"
                : "/img/photos/graphicdesignbanner-dark.png"
            }
            bgColor={theme == "light" ? "#FFEF00" : "#5a3ec8"}
            customImageStyle={{
              margin: "0px",
            }}
            content={`
              See some examples of various visual designs I've worked on for various companies, clients, clubs, and projects, 
              including logo designs, promotional material, and presentations. If you'd like to learn more about a specific design, 
              work with me on a project, or learn more about my process, please reach out and I'd be more than happy to chat!
            `}
            info={graphicInfo}
          />
          <Article>
            <ul className="body tableOfContents">
              <li>
                <a href="#logo-design" className="textLink">
                  Logo design
                </a>
              </li>
            </ul>
          </Article>
          <Article>
            <h2 id="logo-design" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">Logo design</span>
            </h2>
            <div className="imageWrapper">
              <div className="image">
                <img
                  src={
                    theme == "dark"
                      ? "/img/photos/work/graphicdesign/logos/djlabrie-dark.png"
                      : "/img/photos/work/graphicdesign/logos/djlabrie.png"
                  }
                />
              </div>
              <div className="image">
                <img
                  src="/img/photos/work/graphicdesign/logos/labrie.png"
                  className="needsDarkMode"
                />
              </div>
            </div>
            <div className="imageWrapper">
              <div className="image">
                <img src="/img/photos/work/graphicdesign/logos/shakespearience.png" />
              </div>
              <div className="image" style={{ maxWidth: "25%" }}>
                <img
                  src="/img/photos/work/graphicdesign/logos/scienceolympics.png"
                  className="needsDarkMode"
                />
              </div>
            </div>
          </Article>
        </div>
        <style jsx>{`
          .anchor {
            position: relative;
            top: -100px;
          }
          .imageWrapper {
            display: flex;
          }
          .image {
            flex-grow: 1;
            padding: 16px;
            max-width: 100%;
            margin: auto;
          }
          .image img {
            max-height: 100%;
            max-width: 100%;
            object-fit: cover;
            vertical-align: center;
          }
          .needsDarkMode {
            filter: var(--colorInvert);
          }
          h2 {
            margin: 16px 0 0 0;
          }
          h3 {
            margin: 0;
          }
          p {
            margin: 8px 0 0 0;
          }
        `}</style>
      </div>
    </Main>
  );
};

export default Graphicdesign;
