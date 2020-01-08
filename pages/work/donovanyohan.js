import React from "react";
import ArticleHero from "../../components/articlehero";
import ArticleImage from "../../components/articleimage";
import Article from "../../components/article";
import WorkLinks from "../../components/worklinks";
import Main from "../../layouts/main";
import { donovanyohanInfo } from "../../global/content";

const Flowr = () => {
  return (
    <Main
      breadcrumbs={[
        { label: "Work", href: "/#work" },
        { label: "donovanyohan.com", href: "/work/donovanyohan" }
      ]}
    >
      <div className="pageRoot">
        <div className="pageContent">
          <ArticleHero
            title={"donovanyohan.com"}
            image={""}
            customImageStyle={{
              margin: "0px"
            }}
            content={`
              This website exists so that I can hopefully convince you, the reader, that I kind of know what I'm doing when it comes to design and coding.
              Crazy, right? Like any design, my goal is to minimize confusion, maximize understanding, and provide rationale for my decision wherever a choice
              over another valid alternative was made.
            `}
            info={donovanyohanInfo}
          />
          <Article>
            <p className="body">
              I love talking about design. Keyword, <i>talking.</i> I don't
              enjoy writing about design, and as it follows, I don't enjoy
              making portfolios. I understand their value and believe in having
              one, but it definitely wasn't easy making this one. I love talking
              about design in conversations-- when I can assess the other
              person's understanding or engagement based on body language,
              facial expression, the questions they ask, and so on. I can change
              my approach, switch up how I want to present the design, focus on
              what I think is most important for that person, and tackle the
              challenge of communicating my design much like how I would tackle
              the challenge of creating a design-- based on the context.
            </p>
            <p className="body">
              Unfortunately, I don't have the luxury of reading your mind, but I
              know where my strengths are, and I know the objective of a
              portfolio. So here's how I went about solving the age-old design
              challenge of the portfolio.
            </p>
            <ul className="body tableOfContents">
              <li>
                <a href="#team">
                  Identifying the actual problem a portfolio solves
                </a>
              </li>
              <li>
                <a href="">Categorizing existing solutions</a>
              </li>
              <li>
                <a href="">Creating a design brief for my portfolio</a>
              </li>
              <li>
                <a href="">
                  Leveraging my skills as a developer to prototype efficiently
                </a>
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
          <WorkLinks type={"projects"} label={"donovanyohan.com"} />
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

export default Flowr;
