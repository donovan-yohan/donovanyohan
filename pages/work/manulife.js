import React from "react";
import ArticleHero from "../../components/articlehero";
import ArticleImage from "../../components/articleimage";
import Article from "../../components/article";
import WorkLinks from "../../components/worklinks";
import Main from "../../layouts/main";
import { manulifeInfo } from "../../global/content";

const Flowr = () => {
  return (
    <Main
      breadcrumbs={[
        { label: "Work", href: "/#work" },
        { label: "Manulife Mobile", href: "/work/manulife" }
      ]}
    >
      <div className="pageRoot">
        <div className="pageContent">
          <ArticleHero
            title={"Manulife Mobile"}
            image={"/img/photos/manulifebanner.jpg"}
            customImageStyle={{
              margin: "0px"
            }}
            content={`
              Manulife provides group retirement and benefits services to other businesses' employees. Manulife Mobile allows Manulife account holders to
              make and view their benefits claims for various medical, dental, and well-being services as well as see how their retirement investment 
              portfolio is performing.
            `}
            info={manulifeInfo}
          />
          <Article>
            <p className="body">
              At Manulife, I worked as a Mobile UI/UX designer on a young design
              team of just four designers, including myself. The team consisted
              of a UI/UX lead and three designers, each dedicated to a different
              project. As the sole UI/UX designer on the Manulife Mobile Group
              Retirement project, I had to consider the interests of both the
              UI/UX team and the scrum-based agile project team. My design team
              was my resource for whiteboard brainstorming, design feedback, and
              establishing patterns for the first steps of our design system.
              Day to day, I worked with my project team to set priorities,
              gather requirements, validate technical feasability, and deliver a
              final product.
            </p>
            <p className="body">During my stay, I got to be a part of:</p>
            <ul className="body tableOfContents">
              <li>
                <a href="">Reinstating UX practices on my project team</a>
              </li>
              <li>
                <a href="#team">
                  Making user-centered design matter to my project team
                </a>
              </li>
              <li>
                <a href="#balance">
                  Balancing business needs with the user experience
                </a>
              </li>

              {/* <li>
                <a href="">Establishing patterns for usability testing</a>
              </li> */}
            </ul>
          </Article>

          <ArticleImage image={"SRC"} />
          <Article>
            <h2 id="balance" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">
                Reinstating UX practices on my project team
              </span>
            </h2>
            <p className="body">
              Although this was a co-op position, I was filling a full-time
              role. For reasons outside their control, the team didn't have a
              UI/UX designer for a while before I joined Manulife, so I had
              plenty of work lined up for me right from the start. As the sole
              designer for my team, it was up to me to explore the problem,
              brainstorm flows, create wireframes, and ensure that at every
              stage the user is being put front and center.
            </p>
            <div className="articleWrapper">
              <div className="blurb">
                <h3>Know the problem, don't jump to solutions</h3>
                <p className="body"></p>
              </div>
              <div className="list">
                <h3>Responsibilities</h3>
                <ul>
                  <li className="body"></li>
                  <li className="body">
                    Questions that arose during production were specific and
                    contributed to a better final product.
                  </li>
                  <li className="body">
                    Questions that arose during production were specific and
                    contributed to a better final product.
                  </li>
                </ul>
              </div>
            </div>
          </Article>

          <ArticleImage images={"src"} />
          <Article>
            <h2 id="team" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">
                Making user-centered design matter to my project team
              </span>
            </h2>
            <p className="body">
              All too often, once the requirements are figured out, designers
              open up their design tool, put their heads down, and look up once
              they have a finished design to pass along to developers.
            </p>
            <div className="articleWrapper">
              <div className="blurb">
                <h3>Everyone is a user, so everyone's opinion matters</h3>
                <p className="body">
                  One of the first things I did was estalish a short weekly
                  meeting with all my teammates called a 'Design Check-in.' This
                  was my opportunity to align with the whole team on the design
                  itself, the objectives of the design, and the key performance
                  metrics we would use to measure its success. Through this
                  meeting, I strived to foster an environment where everyone
                  could share their opinion on the experience, and contribute
                  from their own point of view.
                </p>
              </div>
              <div className="list">
                <h3>Outcomes</h3>
                <ul>
                  <li className="body">
                    By highlighting the importance of design, the project team
                    had direct input in my design, bringer us closer to finding
                    a solution that suited the project's needs.
                  </li>
                  <li className="body">
                    Developers became engaged and collaborated on designs
                  </li>
                  <li className="body">
                    Questions that arose during production were specific and
                    contributed to a better final product
                  </li>
                </ul>
              </div>
            </div>
          </Article>

          <ArticleImage image={"SRC"} />
          <Article>
            <h2 id="balance" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">
                Balancing business needs with the user experience
              </span>
            </h2>
            <p className="body">
              Being in a big company gave me access to plenty of resources,
              people, and tools to make the best design possible. However, it
              also came with plenty of constraints and requirements from other
              teams. One of these teams was responsible for collecting and
              processing user feedback, and one of their go-to tools was Net
              Promoter Score (NPS). Our team had been mandated to include a way
              to collect NPS in the app, but as a UX designer I had to ask,
              "Why?"
            </p>
            <div className="articleWrapper">
              <div className="blurb">
                <h3>Know the problem, don't jump to solutions</h3>
                <p className="body">
                  Manulife Mobile is currently more informative than
                  interactive. There's no way to implement NPS without
                  compromising the user experience. I'm a business student, so I
                  could speak to business too. Team Made it clear that NPS
                  wasn't applicable to our situation!!! we reached a consensus
                  that nps blows ass
                </p>
              </div>
              <div className="list">
                <h3>Outcomes</h3>
                <ul>
                  <li className="body">
                    Developers became engaged and collaborated on designs
                  </li>
                  <li className="body">
                    Questions that arose during production were specific and
                    contributed to a better final product.
                  </li>
                  <li className="body">
                    Questions that arose during production were specific and
                    contributed to a better final product.
                  </li>
                </ul>
              </div>
            </div>
          </Article>

          <WorkLinks type={"projects"} label={"Manulife Mobile"} />
        </div>
        <style jsx>{`
          .anchor {
            position: relative;
            top: -100px;
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
          .tableOfContents {
            text-decoration: underline;
          }
        `}</style>
      </div>
    </Main>
  );
};

export default Flowr;
