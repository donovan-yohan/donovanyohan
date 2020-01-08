import React from "react";
import ArticleHero from "../../components/articlehero";
import ArticleImage from "../../components/articleimage";
import Article from "../../components/article";
import WorkLinks from "../../components/worklinks";
import Main from "../../layouts/main";
import { cooperatorsInfo } from "../../global/content";

const Flowr = () => {
  return (
    <Main
      breadcrumbs={[
        { label: "Work", href: "/#work" },
        { label: "The Co-operators Mobile", href: "/work/cooperators" }
      ]}
    >
      <div className="pageRoot">
        <div className="pageContent">
          <ArticleHero
            title={"The Co-operators Mobile"}
            image={""}
            customImageStyle={{
              margin: "0px"
            }}
            content={`
              The Co-operators is an insurance company that provides home, auto, life, business, farm, and wealth insurance. The Co-operators Mobile App
              allows clients to make claims, payments, and view all their policy details, as well as their auto liability slips, all from their mobile device.
            `}
            info={cooperatorsInfo}
          />
          <Article>
            <p className="body">
              At The Co-operators, I was a full-stack mobile developer, working
              on an agile team with other developers and a UI/UX team. In
              addition to growing my skillset as a developer, I had the
              opportunity to learn a lot about the UX process from my
              colleagues. We worked closely together to bring their vision to
              life, and I was able to contribute my own technical knowledge and
              motion graphics experience.
            </p>
            <ul className="body tableOfContents">
              <li>
                <a href="#team">Why leave the grid behind in Sketch?</a>
              </li>
              <li>
                <a href="">Developing with the user in mind</a>
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
          <WorkLinks type={"projects"} label={"The Co-operators Mobile"} />
        </div>
        <style jsx>{`
          .anchor {
            position: relative;
            top: -100px;
          }
          h2 {
            margin: 16px 0 0 0;
            font-size: 24px;
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

export default Flowr;
