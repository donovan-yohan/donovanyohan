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
              I really like typing. When I was a kid, I convinced my parents to let me learn how to touch type instead of 
              how to write cursive and, well, I think younger me had pretty crazy foresight but I digress. The point is I've 
              used a lot of different typing practice tools and tests and found myself going back to specific ones for certain 
              things they did, but why didn't one test have all of those certain things? This project was all about identifying 
              the specific needs someone taking a typing test really has, and expanding on those to make the experience even more enjoyable!
            `}
            info={typelineInfo}
          />
          <Article>
            <p className='body'>
              This project presented a lot of difficulties both on the design side and the technical side.
            </p>
            <ul className='body tableOfContents'>
              <li>
                <a href='#problem' className='textLink'>
                  Figure out what problem I'm really solving
                </a>
              </li>
              <li>
                <a href='#layout' className='textLink'>
                  Using a layout to achieve my goal
                </a>
              </li>
              <li>
                <a href='#content' className='textLink'>
                  Using content to play to my strengths
                </a>
              </li>
              <li>
                <a href='#being-wrong' className='textLink'>
                  Being OK with being wrong
                </a>
              </li>
            </ul>
          </Article>
          <ArticleImage image={"/img/photos/work/dy-problem.png"} />
          <Article>
            <h2 id='problem' className='anchor'></h2>
            <h2>
              <span className='highlightStatic'>
                Figure out what problem I'm really solving
              </span>
            </h2>
            <p className='body'>
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
            <div className='articleWrapper'>
              <div className='blurb'>
                <h3>Don't reinvent the wheel, but learn why it works</h3>
                <p className='body'>
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
              <div className='list'>
                <h3>Outcomes</h3>
                <ul>
                  <li className='body'>
                    Problem statement to validate solutions against
                  </li>
                  <li className='body'>
                    Design principles to inform wireframes
                  </li>
                  <li className='body'>
                    User journey to give design strcuture
                  </li>
                </ul>
              </div>
            </div>
          </Article>
          <ArticleImage image={"/img/photos/work/dy-layout.png"} />
          <Article>
            <h2 id='layout' className='anchor'></h2>
            <h2>
              <span className='highlightStatic'>
                Using a layout to achieve my goal
              </span>
            </h2>
            <p className='body'>
              It'd be easy enough to just open up Squarespace, type in
              "Portfolio" and call it a day. While some of them are very well
              made, I was interested in discovering for myself what made these
              templates <i>portfolio</i> templates. Also, now I can put "React
              Developer" on my resume. Before building out the layout, I mapped
              out the core actions the website would need to perform, based on
              my earlier research. This started with 3: Resume, View Work, and
              Contact, but grew to 4 when I wanted to differentiate myself from
              others, with a real About Me section.
            </p>
            <div className='articleWrapper'>
              <div className='blurb'>
                <h3>Make it easy and look good doing it</h3>
                <p className='body'>
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
              <div className='list'>
                <h3>Outcomes</h3>
                <ul>
                  <li className='body'>Simple and clean design system</li>
                  <li className='body'>
                    Always-present global navigation system
                  </li>
                  <li className='body'>Medium-esque content presentation</li>
                </ul>
              </div>
            </div>
          </Article>
          <ArticleImage image={"/img/photos/work/dy-content.png"} />
          <Article>
            <h2 id='content' className='anchor'></h2>
            <h2>
              <span className='highlightStatic'>
                Using content to play to my strengths
              </span>
            </h2>
            <p className='body'>
              One of the biggest challenges I face as a designer is being
              confident in my documentation. Did I present all the information
              needed to justify my decision? Am I putting too much irrelevant
              detail, or too little? I've always felt more confident in sharing
              my designs in person when I can discuss and converse about them,
              but the reality is that any designer's work is only as good as
              their ablity to communicate it, and that includes documentation,
              and even this portfolio. So, as someone who's more confident in
              their presentations than their writing, how can I go about
              building a written portfolio?
            </p>
            <div className='articleWrapper'>
              <div className='blurb'>
                <h3>Keep it human and keep it brief</h3>
                <p className='body'>
                  I came up with a system that allowed me to summarize my
                  learnings in an easy to follow way. You may have noticed all
                  of these points follow a pattern of problem & challenge, how I
                  tackled it, and what happened as a result. On top of that, I
                  try to write in a similar way to how I would talk about these
                  projects. After all, this is my portfolio, who says it needs
                  to be a formal essay!
                </p>
              </div>
              <div className='list'>
                <h3>Outcomes</h3>
                <ul>
                  <li className='body'>
                    Design heuristics for portfolio content
                  </li>
                  <li className='body'>
                    Cohesion across different portfolio entries
                  </li>
                  <li className='body'>
                    Confidence to write in a more 'spoken' way
                  </li>
                </ul>
              </div>
            </div>
          </Article>
          <ArticleImage image={"/img/photos/work/dy-being-wrong.png"} />
          <Article>
            <h2 id='being-wrong' className='anchor'></h2>
            <h2>
              <span className='highlightStatic'>Being OK with being wrong</span>
            </h2>
            <p className='body'>
              One of the toughest concepts for me as a designer and artist is
              "good-enough is good-enough." The truth is, I can't have all the
              answers, and there are so many tools and ways to get feedback once
              you actually present the design to other people. Projects without
              deadlines are paralyzing, and lead to fruitless journey towards
              perfection, and part of what makes good designers so great in my
              opinion is their ability to work within deadlines and constraints.
            </p>
            <div className='articleWrapper'>
              <div className='blurb'>
                <h3>Validate with others and keep moving forward</h3>
                <p className='body'>
                  Crazy that putting this online for others to see doesn't
                  actually mean that I can't just change it in the future! It
                  sounds simple when writing it out, but this was a big mental
                  challenge for me to overcome, and I'm proud of how far my
                  portfolio has come since opening up to friends, mentors, and
                  just general feedback from anyone willing to give it. (That
                  means you too, I'd love to hear what you think!)
                </p>
              </div>
              <div className='list'>
                <h3>Outcomes</h3>
                <ul>
                  <li className='body'>Personal growth as a designer</li>
                  <li className='body'>
                    Iterative design that is continually improved upon
                  </li>
                  <li className='body'>
                    Better designs achieved faster by getting real feedback
                    sooner
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

export default Donovanyohan;
