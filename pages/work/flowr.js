import React from "react";
import ArticleHero from "../../components/articlehero";
import ArticleImage from "../../components/articleimage";
import Article from "../../components/article";
import WorkLinks from "../../components/worklinks";
import Main from "../../layouts/main";
import { flowrInfo } from "../../global/content";

const Flowr = () => {
  return (
    <Main
      breadcrumbs={[
        { label: "Work", href: "/#work" },
        { label: "flowr", href: "/work/flowr" }
      ]}
    >
      <div className="pageRoot">
        <div className="pageContent">
          <ArticleHero
            title={"flowr"}
            image={""}
            customImageStyle={{
              margin: "0px"
            }}
            content={`
              Spend less time on time management. Flowr is an organizational tool designed by a frustrated UX student for students. 
              Its 3 core functions are enabling students to prioritize work, giving students a way to keep track of work, and quickly
              providing a summary of their grades in their classes.
              `}
            info={flowrInfo}
          />
          <Article>
            <p className="body">
              As one of my first user-centered projects, I picked something
              where I could use my own experience as a significant research
              resource. From there, I was able to create a concept that I would
              go on to iterate and gain feedback on.
            </p>
            <p className="body">Here's what I learned while working on it:</p>
            <ul className="body tableOfContents">
              <li>
                <a href="">Doing user interviews, without the interview</a>
              </li>
              <li>
                <a href="">
                  Spending time on the problem makes the solution clear
                </a>
              </li>
            </ul>
          </Article>
          <ArticleImage images={"src"} />
          <Article>
            <h2 className="highlightStatic">Hello, world!</h2>
            <p className="body">
              Lorum ipsum dolor veniam ipsum nostrud magna in nisi labore fuigat
              qui moilt exceptuer. Occaecat cillum reprehenderit cillum culpa
              officia officia esse laborum pariatur. Nisi deserunt ipsum sunt
              officia ea occaecat anim sunt.
            </p>
          </Article>
          <ArticleImage image={"SRC"} />
          <Article>
            <h2 className="highlightStatic">Hello, world!</h2>
            <p className="body"></p>
          </Article>
          <WorkLinks type={"projects"} label={"flowr"} />
        </div>
        <style jsx>{`
          h2 {
            margin: 16px 0 0 0;
          }
          p {
            margin: 16px 0 0 0;
          }
        `}</style>
      </div>
    </Main>
  );
};

export default Flowr;
