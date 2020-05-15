import React from "react";
import ArticleHero from "../../components/articlehero";
import ArticleImage from "../../components/articleimage";
import Article from "../../components/article";
import WorkLinks from "../../components/worklinks";
import Main from "../../layouts/main";
import { shopdonovanyohanInfo } from "../../global/content";

const Webstore = () => {
  return (
    <Main
      breadcrumbs={[
        { label: "Work", href: "/#work" },
        { label: "Webstore Project", href: "/work/webstore" },
      ]}
    >
      <div className="pageRoot">
        <div className="pageContent">
          <ArticleHero
            title={"Webstore Project"}
            image={""}
            customImageStyle={{
              margin: "0px",
            }}
            content={`
              shop.donovanyohan.com is a platform for handling my custom apparel business. I sell designs I've made myself, as well as
              provide a service for others to commission custom apparel using either their own designs or requesting one to be custom made.
            `}
            info={shopdonovanyohanInfo}
          />
          <Article>
            <p className="body">
              As someone who loves fashion and satire, I want to provide high
              quality apparel and decorations with unique and humourous motifs
              to people who care about the clothes they wear, not the status it
              brings.
            </p>
            <p className="body">During my stay, I got to be a part of:</p>
            <ul className="body tableOfContents">
              <li>
                <a href="#team">Making design matter to my project team</a>
              </li>
              <li>
                <a href="">Designing with many lenses</a>
              </li>
              <li>
                <a href="">
                  Balancing business needs with the user's experience
                </a>
              </li>
              <li>
                <a href="">Creating a healthy design feedback environment</a>
              </li>
            </ul>
          </Article>
          <ArticleImage images={"src"} />
          <Article>
            <h2 id="team" className="anchor"></h2>
            <h2 className="highlightStatic">
              Making design matter to my project team
            </h2>
            <p className="body">
              One of the first things I did was estalish a short weekly meeting
              with all my teammates called a, 'Design Check-in.' This was my
              opportunity to get the whole team on board with the design itself,
              the objectives of the design, and the key performance metrics we
              would use to measure its success.
            </p>
            LESSONS
            <p className="body">
              As a designer, I believe in the design decisions I make and the
              rationale behind them. However, I also believe in sometimes being
              wrong and the people around me are a resource to keep myself in
              check. To that end, I strive to foster an environment where
              everyone feels comfortable sharing their opinion on a design
            </p>
          </Article>
          <Article>
            OUTCOMES
            <ul>
              <li className="body">
                I was able to use my team as another resource to verify my
                assumptions, and help me meake informed design decision.
              </li>
              <li className="body">
                Developers started asking questions about design decisions, and
                giving their own suggestions and ideas, helping make all the
                designs better.
              </li>
            </ul>
          </Article>
          <ArticleImage image={"SRC"} />
          <Article>
            <h2 className="highlightStatic">Hello, world!</h2>
            <p className="body">
              Lorum ipsum dolor veniam ipsum nostrud magna in nisi labore fuigat
              qui moilt exceptuer. Lorum ipsum dolor veniam ipsum nostrud magna
              in nisi labore fuigat qui moilt exceptuer. Occaecat cillum
              reprehenderit cillum culpa officia officia esse laborum pariatur.
            </p>
          </Article>
          <WorkLinks type={"projects"} label={"shop.donovanyohan.com"} />
        </div>
        <style jsx>{`
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
        `}</style>
      </div>
    </Main>
  );
};

export default Webstore;
