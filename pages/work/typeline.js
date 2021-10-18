import React, { useContext } from "react";
import ArticleHero from "../../components/articlehero";
import ArticleImage from "../../components/articleimage";
import Article from "../../components/article";
import WorkLinks from "../../components/worklinks";
import Main from "../../layouts/main";
import { typelineInfo } from "../../global/content";
import Context from "../../components/context";

const Donovanyohan = () => {
  const { theme } = useContext(Context);
  return (
    <Main
      breadcrumbs={[
        { label: "Work", href: "/#work" },
        { label: "typeline", href: "/work/typeline" },
      ]}
    >
      <div className='pageRoot'>
        <div className='pageContent'>
          <ArticleHero
            title={"typeline"}
            image={"/img/photos/typelinebanner.png"}
            bgColor={"#1967FF"}
            customImageStyle={{
              margin: "0px",
            }}
            content={`
              I really like typing and I've used a lot of different typing
              practice tools and tests and found myself going back to specific
              ones for certain things they did, but why didn't one test have
              all of those certain things? This project was all about
              making the typing experience as enjoyable and rewarding as possible,
              and using visual feedback to encourage consistency and flow.
            `}
            info={typelineInfo}
          />
          <Article>
            <p className='body'>
              Typeline was a great application of interaction design,
              gamification, motion design, and working with a highly dynamic
              React front-end.
            </p>
            <ul className='body tableOfContents'>
              <li>
                <a href='#improving' className='textLink'>
                  Improving on a long-standing status-quo
                </a>
              </li>
              <li>
                <a href='#building' className='textLink'>
                  Building a typing engine with React
                </a>
              </li>
              <li>
                <a href='#next-steps' className='textLink'>
                  Gamification and next steps
                </a>
              </li>
            </ul>
          </Article>
          <ArticleImage
            image={"/img/photos/work/typeline-1.png"}
            alt={"design iterations of typeline UI"}
          />
          <Article>
            <h2 id='improving' className='anchor'></h2>
            <h2>
              <span className='highlightStatic'>
                Improving on a long-standing status-quo
              </span>
            </h2>
            <p className='body problem'>
              There are a lot of typing tests, educational typing tools, and
              other online resources that already exist, and even some really
              creative typing games. However, I found myself bouncing between
              different ones for different things they excelled at, whether it
              was just easiest to get started typing, nicest looking, most
              customization, or ease of sharing with others. This led to me to
              wonder, can I get everything I enjoy about these in one place? A
              big part of what makes typing enjoyable to me and other typists I
              spoke with is the 'flow state' that they're able to enter, typing
              at their fastest speed consistently and accurately. Interestingly
              enough, despite this being my own and other skilled typists'
              favourite feeling from typing, very few if any of the tools we
              used inherently encouraged getting into this state.
            </p>
            <div className='articleWrapper'>
              <div className='blurb solution'>
                <h3>Encourage consistency and flow by design</h3>
                <p className='body'>
                  The main guiding design principles for typeline are all about
                  trying to encourage flow. This in addition to focusing on all
                  the good that came from typing tests before laid the
                  groundwork for my focus on using motion design to give instant
                  feedback based on the user's performance, and visually reward
                  the desired behaviour. I went on to study animation patterns
                  from arcade games to see how they would positively reinforce
                  player success through score increases and other visual
                  feedback.
                </p>
              </div>
              <div className='list'>
                <h3>Outcomes</h3>
                <ul>
                  <li className='body'>
                    Design principles to validate design decisions
                  </li>
                  <li className='body'>Emphasis on motion design</li>
                  <li className='body'>
                    Brought in further ideas of gamification
                  </li>
                </ul>
              </div>
            </div>
          </Article>
          <ArticleImage
            image={"/img/photos/work/typeline-2.png"}
            alt={"simple typing engine architecture diagram visualization"}
          />
          <Article>
            <h2 id='building' className='anchor'></h2>
            <h2>
              <span className='highlightStatic'>
                Building a typing engine with React
              </span>
            </h2>
            <p className='body'>
              Partly as a challenge to myself and partly because nothing
              available fit my needs, the engine powering typeline is entirely
              custom built. Having identified the most important parts of
              typeline's experience in the design phase, now I could more
              logistically identify all the specific pieces I needed in order to
              achieve the more generic user goals. Armed with just enough of a
              UI wireframe and my own architecture blueprint, I was able to
              quickly validate interactions by developing the essential building
              blocks and using them to prototype and test interactions and
              designs.
            </p>
            <div className='articleWrapper'>
              <div className='blurb'>
                <h3>Develop for the design, and design to develop</h3>
                <p className='body'>
                  I scaffolded out a component structure and compared it against
                  my user stories and design principles to make sure I had all
                  the technical pieces covered. This allowed me to develop an
                  MVP with room to scale for future additional features. It also
                  let me think of new ways to approach solving my original
                  problems after having all the data explicitly mapped out. One
                  example of this was being able to identify the number of
                  corrections and give feedback that encourages users not to
                  just leave errors unchecked, a calculation required for one of
                  my user goals but not usually shown in other typing tests.
                </p>
              </div>
              <div className='list'>
                <h3>Outcomes</h3>
                <ul>
                  <li className='body'>
                    Robust reusable and scalable component library
                  </li>
                  <li className='body'>
                    Quick validation of design in production
                  </li>
                  <li className='body'>
                    Further UX improvement opportunities from testing in
                    development
                  </li>
                </ul>
              </div>
            </div>
          </Article>
          <ArticleImage
            image={"/img/photos/work/typeline-3.png"}
            alt={"typeline typing test logo banner"}
          />
          <Article>
            <h2 id='next-steps' className='anchor'></h2>
            <h2>
              <span className='highlightStatic'>
                Gamification and next steps
              </span>
            </h2>
            <p className='body'>
              Typeline is a very ambitious project, and what is currently
              available is just a part of what I am hoping typeline can become.
              Currently the groundwork is laid for more gamification and sharing
              features with friends, through the seeded rng that allows users to
              share the exact test they took with friends to compare results.
              The next steps for this are to make that information more readily
              available, creating leaderboards for specific tests, and
              ultimately a way for users to race against each other in
              real-time.
            </p>
            <div className='articleWrapper'>
              <div className='blurb'>
                <h3>Practice makes perfect, but it can also be fun</h3>
                <p className='body'>
                  By borrowing the elements and techniques of arcade games that
                  encourage competition and replayability like leaderboards,
                  positive reinforcement through visual feedback, and simple
                  rules, typeline aims to achieve all the same of typing tests
                  before it, but reach a wider audience that can enjoy it as a
                  game.
                </p>
              </div>
              <div className='list'>
                <h3>Outcomes</h3>
                <ul>
                  <li className='body'>Roadmap for future updates</li>
                  <li className='body'>A typing test mixed with a game</li>
                  <li className='body'>
                    Natural building of engagement through competition
                  </li>
                </ul>
              </div>
            </div>
          </Article>
          <WorkLinks type={"projects"} label={"typeline Typing Test"} />
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

export default Donovanyohan;
