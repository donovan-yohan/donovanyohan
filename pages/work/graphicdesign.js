import React, { useContext } from "react";
import ArticleHero from "../../components/articlehero";
import ArticleImage from "../../components/articleimage";
import Article from "../../components/article";
import WorkLinks from "../../components/worklinks";
import Main from "../../layouts/main";
import { graphicInfo, logos, promotions, apparel } from "../../global/content";
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
              <li>
                <a href="#promotion-design" className="textLink">
                  Promotion design
                </a>
              </li>
              <li>
                <a href="#apparel-design" className="textLink">
                  Apparel design
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
              {logos.map(({ key, src, label, width, invertForDarkMode }) => {
                return (
                  <div
                    key={key}
                    className="image"
                    style={{ flexBasis: width + "%" }}
                  >
                    <img
                      alt={label}
                      src={
                        "/img/photos/work/graphicdesign/logos/" +
                        (src.dark && theme == "dark" ? src.dark : src.light)
                      }
                      className={invertForDarkMode ? "needsDarkMode" : ""}
                    />
                  </div>
                );
              })}
            </div>
          </Article>
          <Article>
            <h2 id="promotion-design" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">Promotion design</span>
            </h2>
            <div className="imageWrapper">
              {promotions.map(
                ({ key, src, label, width, invertForDarkMode }) => {
                  return (
                    <div
                      key={key}
                      className="image"
                      style={{ flexBasis: width + "%" }}
                    >
                      <img
                        alt={label}
                        src={
                          "/img/photos/work/graphicdesign/socialmedia/" +
                          src.light
                        }
                        className={invertForDarkMode ? "needsDarkMode" : ""}
                      />
                    </div>
                  );
                }
              )}
            </div>
          </Article>
          <Article>
            <h2 id="apparel-design" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">Apparel design</span>
            </h2>
            <div className="imageWrapper">
              {apparel.map(({ key, src, label, width, invertForDarkMode }) => {
                return (
                  <div
                    key={key}
                    className="image"
                    style={{ flexBasis: width + "%" }}
                  >
                    <img
                      alt={label}
                      src={
                        "/img/photos/work/graphicdesign/apparel/" + src.light
                      }
                      className={invertForDarkMode ? "needsDarkMode" : ""}
                    />
                  </div>
                );
              })}
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
            flex-wrap: wrap;
            justify-content: space-between;
          }
          .image {
            margin: auto 0;
            padding: 8px 0;
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
          @media only screen and (max-width: 425px) {
            .image {
              padding: 4px 0;
              min-width: 190px;
              flex-grow: 1;
            }
          }
        `}</style>
      </div>
    </Main>
  );
};

export default Graphicdesign;
