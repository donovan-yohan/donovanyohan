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
              <li>
                <a href="#promotional-design" className="textLink">
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
              <div className="image col-25">
                <img
                  src="/img/photos/work/graphicdesign/logos/scienceolympics.png"
                  className="needsDarkMode"
                />
              </div>
            </div>
            <div className="imageWrapper">
              <div className="image col-33">
                <img
                  src="/img/photos/work/graphicdesign/logos/justparched.png"
                  className="needsDarkMode"
                />
              </div>
              <div className="image">
                <img
                  src={
                    theme == "dark"
                      ? "/img/photos/work/graphicdesign/logos/lucidnexus-dark.png"
                      : "/img/photos/work/graphicdesign/logos/lucidnexus.png"
                  }
                />
              </div>
            </div>
            <div className="imageWrapper">
              <div className="image col-4">
                <img src="/img/photos/work/graphicdesign/logos/aceseng.png" />
              </div>
              <div className="image col-4">
                <img
                  src="/img/photos/work/graphicdesign/logos/acesengsolid.png"
                  className="needsDarkMode"
                />
              </div>
              <div className="image col-4">
                <img src="/img/photos/work/graphicdesign/logos/aces.png" />
              </div>
              <div className="image col-4">
                <img
                  src="/img/photos/work/graphicdesign/logos/acessolid.png"
                  className="needsDarkMode"
                />
              </div>
            </div>
            <div className="imageWrapper">
              <div className="image">
                <img
                  src={
                    theme == "dark"
                      ? "/img/photos/work/graphicdesign/logos/goldenhacks-dark.png"
                      : "/img/photos/work/graphicdesign/logos/goldenhacks.png"
                  }
                />
              </div>
              <div className="image">
                <img
                  src={
                    theme == "dark"
                      ? "/img/photos/work/graphicdesign/logos/goldenhacksbanner-dark.png"
                      : "/img/photos/work/graphicdesign/logos/goldenhacksbanner.png"
                  }
                />
              </div>
            </div>
          </Article>
          <Article>
            <h2 id="promotion-design" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">Promotional design</span>
            </h2>
            <div className="imageWrapper">
              <div className="image">
                <img src="/img/photos/work/graphicdesign/socialmedia/competitiveprogramming.jpg" />
              </div>
              <div className="image">
                <img src="/img/photos/work/graphicdesign/socialmedia/phidiscord.png" />
              </div>
            </div>
            <div className="imageWrapper">
              <div className="image col-50">
                <img src="/img/photos/work/graphicdesign/socialmedia/goldenspeakers.jpg" />
              </div>
              <div className="image">
                <img src="/img/photos/work/graphicdesign/socialmedia/ace.png" />
              </div>
            </div>
          </Article>
          <Article>
            <h2 id="apparel-design" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">Apparel design</span>
            </h2>
            <div className="imageWrapper">
              <div className="image">
                <img src="/img/photos/work/graphicdesign/apparel/balance.png" />
              </div>
              <div className="image">
                <img src="/img/photos/work/graphicdesign/apparel/panther.png" />
              </div>
            </div>
            <div className="imageWrapper">
              <div className="image">
                <img src="/img/photos/work/graphicdesign/apparel/press.png" />
              </div>
              <div className="image">
                <img src="/img/photos/work/graphicdesign/apparel/improv.png" />
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
            justify-content: space-between;
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
          .col-25 {
            min-width: 25%;
            max-width: 25%;
          }
          .col-33 {
            min-width: 33%;
            max-width: 33%;
          }
          .col-50 {
            min-width: 50%;
            max-width: 50%;
          }
          .col-4 {
            min-width: 22%;
            max-width: 22%;
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
          @media only screen and (max-width: 1024px) {
            .image {
              padding: 4px 0;
            }
            .imageWrapper {
              flex-wrap: wrap;
            }
            .col-25,
            .col-33,
            .col-50 {
              min-width: 100%;
              max-width: 100%;
            }
            .col-4 {
              min-width: 48%;
              max-width: 48%;
            }
          }
        `}</style>
      </div>
    </Main>
  );
};

export default Graphicdesign;
