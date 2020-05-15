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
        { label: "donovanyohan.com", href: "/work/donovanyohan" },
      ]}
    >
      <div className="pageRoot">
        <div className="pageContent">
          <ArticleHero
            title={"donovanyohan.com"}
            image={"/img/photos/donovanyohanbanner.png"}
            bgColor={"white"}
            customImageStyle={{
              margin: "0px",
            }}
            content={`
              This website exists so that I can hopefully convince you, the reader, that I at least somewhat know what I'm doing when it comes to design and coding.
              Crazy, right? Specifically, I set out to create a platform to showcase my high-level abilities as a developer and a UI/UX designer.
            `}
            info={donovanyohanInfo}
          />
          <Article>
            <p className="body">
              I love talking to people about design, especially in person when I
              can assess the other person's understanding or engagement based on
              body language, facial expression, the questions they ask, and so
              on. I can change my approach, switch up how I want to present the
              design, focus on what I think is most important for that person,
              and tackle the challenge of communicating my design much like how
              I would tackle the challenge of creating a design-- based on the
              context.
            </p>
            <p className="body">
              Unfortunately, I don't have the luxury of talking with every
              single person that comes across this portfolio, but I know where
              my strengths lie, and I know what my goal is. So here's how I went
              about solving the age-old design challenge of the portfolio.
            </p>
            <ul className="body tableOfContents">
              <li>
                <a href="#problem" className="textLink">
                  Figure out what problem I'm really solving
                </a>
              </li>
              <li>
                <a href="#layout" className="textLink">
                  Using a layout to achieve my goal
                </a>
              </li>
              <li>
                <a href="#content" className="textLink">
                  Using content to play to my strengths
                </a>
              </li>
              <li>
                <a href="#beingWrong" className="textLink">
                  Being OK with being wrong
                </a>
              </li>
            </ul>
          </Article>
          <ArticleImage images={"src"} />
          <Article>
            <h2 id="problem" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">
                Figure out what problem I'm really solving
              </span>
            </h2>
            <p className="body">
              There are plenty of hired designers out there today, so how did
              they do it? Like any good problem, this called for a design brief.
              How am I going to validate and see if what I'm doing helps me
              achieve my objective? Who is actually going to be coming to this
              site, and what will they be looking for? Through interviews with
              recruiters, studying of existing platforms like Medium, and
              research into other designers' portfolios, I was able to collect
              enough data to give myself a problem statement, design principles,
              and an idea of my real user.
            </p>
            <div className="articleWrapper">
              <div className="blurb">
                <h3>Don't reinvent the wheel, but learn why it works</h3>
                <p className="body">
                  How might I showcase who I am and the work I am able to do? My
                  user, a recruiting manager, is someone who goes through
                  designers faster than I go through tea (that's really fast,
                  see you're learning about who I am already), so I'll need to
                  be succinct, but emotive. I think personality plays a big role
                  in a successful designer, and so I want to make sure I can
                  share that. Even though I'll be mostly showing work I've
                  already done, what my user really cares about is what I can do
                  for their company, and I'll need to be aware of this when
                  choosing what to share.
                </p>
              </div>
              <div className="list">
                <h3>Outcomes</h3>
                <ul>
                  <li className="body">
                    Problem statement to validate solutions against
                  </li>
                  <li className="body">
                    Design principles to inform wireframes
                  </li>
                  <li className="body">
                    User journey to give design strcuture
                  </li>
                </ul>
              </div>
            </div>
          </Article>
          <ArticleImage images={"src"} />
          <Article>
            <h2 id="layout" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">
                Using a layout to achieve my goal
              </span>
            </h2>
            <p className="body">
              It'd be easy enough to just open up Squarespace, type in
              "Portfolio" and call it a day. While I'm sure some of them are
              very well made, I was interested in discovering for myself what
              made these templates <i>portfolio</i> templates. Also, now I can
              put "React Developer" on my resume. Before building out the
              layout, I mapped out the core actions the website would need to
              perform, based on my earlier research. This started with 3:
              Resume, View Work, and Contact, but grew to 4 when I wanted to
              differentiate myself from others, with a real About Me section.
            </p>
            <div className="articleWrapper">
              <div className="blurb">
                <h3>Make it easy and look good doing it</h3>
                <p className="body">
                  Seeing that my website had a small number of core actions, I
                  wanted to make them accessible from anywhere on the site, at
                  any time. This led to the current global top nav seen on the
                  site, and global bottom nav if you're on mobile. (Yes, this
                  site is fully responsive!) Going back to making things
                  succinct and easy, I decided to keep the design language very
                  simple and clean. While doing my research, I used a
                  highlighter to markup things I liked, and ended up really
                  liking the way it looked, leading to the bright yellow accents
                  here.
                </p>
              </div>
              <div className="list">
                <h3>Outcomes</h3>
                <ul>
                  <li className="body">Simple and clean design system</li>
                  <li className="body">
                    Always-present global navigation system
                  </li>
                  <li className="body">Medium-esque content presentation</li>
                </ul>
              </div>
            </div>
          </Article>
          <ArticleImage images={"src"} />
          <Article>
            <h2 id="content" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">
                Using content to play to my strengths
              </span>
            </h2>
            <p className="body">
              It'd be easy enough to just open up Squarespace, type in
              "Portfolio" and call it a day. While I'm sure some of them are
              very well made, I was interested in discovering for myself what
              makes a portfolio really <i>work</i>. There are plenty of hired
              designers out there today, so how did they do it? Like any good
              problem, this called for a design brief. Through interviews with
              recruiters, studying of existing platforms like Medium, and
              research into other designers' portfolios, I was able to collect
              enough data to give myself a problem statement, design principles,
              and an idea of my real user.
            </p>
            <div className="articleWrapper">
              <div className="blurb">
                <h3>Don't reinvent the wheel, but learn why it works</h3>
                <p className="body">
                  How might I showcase who I am and the work I am able to do? My
                  user, a recruiting manager, is someone who goes through
                  designers faster than I go through tea (that's really fast,
                  see you're learning about who I am already), so I'll need to
                  be succinct, but emotive. I think personality plays a big role
                  in a successful designer, and so I want to make sure I can
                  share that. Even though I'll be mostly showing work I've
                  already done, what my user really cares about is what I can do
                  for their company, and I'll need to be aware of this when
                  choosing what to share.
                </p>
              </div>
              <div className="list">
                <h3>Outcomes</h3>
                <ul>
                  <li className="body">
                    Problem statement to validate solutions against
                  </li>
                  <li className="body">
                    Design principles to inform wireframes
                  </li>
                  <li className="body">
                    User journey to give design strcuture
                  </li>
                </ul>
              </div>
            </div>
          </Article>
          <ArticleImage images={"src"} />
          <Article>
            <h2 id="beingWrong" className="anchor"></h2>
            <h2>
              <span className="highlightStatic">Being OK with being wrong</span>
            </h2>
            <p className="body">
              It'd be easy enough to just open up Squarespace, type in
              "Portfolio" and call it a day. While I'm sure some of them are
              very well made, I was interested in discovering for myself what
              makes a portfolio really <i>work</i>. There are plenty of hired
              designers out there today, so how did they do it? Like any good
              problem, this called for a design brief. Through interviews with
              recruiters, studying of existing platforms like Medium, and
              research into other designers' portfolios, I was able to collect
              enough data to give myself a problem statement, design principles,
              and an idea of my real user.
            </p>
            <div className="articleWrapper">
              <div className="blurb">
                <h3>Don't reinvent the wheel, but learn why it works</h3>
                <p className="body">
                  How might I showcase who I am and the work I am able to do? My
                  user, a recruiting manager, is someone who goes through
                  designers faster than I go through tea (that's really fast,
                  see you're learning about who I am already), so I'll need to
                  be succinct, but emotive. I think personality plays a big role
                  in a successful designer, and so I want to make sure I can
                  share that. Even though I'll be mostly showing work I've
                  already done, what my user really cares about is what I can do
                  for their company, and I'll need to be aware of this when
                  choosing what to share.
                </p>
              </div>
              <div className="list">
                <h3>Outcomes</h3>
                <ul>
                  <li className="body">
                    Problem statement to validate solutions against
                  </li>
                  <li className="body">
                    Design principles to inform wireframes
                  </li>
                  <li className="body">
                    User journey to give design strcuture
                  </li>
                </ul>
              </div>
            </div>
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
        `}</style>
      </div>
    </Main>
  );
};

export default Flowr;
