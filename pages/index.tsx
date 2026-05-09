import { useContext } from "react";
import Hero from "../components/hero";
import Card from "../components/card";
import Lottie from "lottie-react";
import logoAnimation from "../public/img/animations/dy.json";
import { MobileWidth, projects } from "../global/global";
import Main from "../layouts/main";
import useSmoothScroll from "../hooks/useSmoothScroll";
import useWindowWidth from "../hooks/useWindowWidth";
import Context from "../components/context";

const Index = () => {
  const { theme } = useContext(Context);
  const windowWidth = useWindowWidth();
  useSmoothScroll();

  return (
    <Main>
      <div className="pageRoot">
        <div className="pageContent">
          <Hero
            dark={theme == "dark"}
            image={
              <div>
                <Lottie animationData={logoAnimation} loop={false} autoplay={true} />
              </div>
            }
            text={
              <span>
                <span>Hi, I&apos;m Donovan Yohan! I&apos;m a </span>
                <a href="#work" className="highlight heroHighlight">
                  UI &amp; UX designer
                </a>
                <span> and a </span>
                <br />
                <a
                  href="http://github.com/donovan-yohan"
                  target="_blank"
                  rel="noreferrer"
                  className="highlight heroHighlight"
                >
                  full stack developer
                </a>
                .
              </span>
            }
          />
          <h1 className="headerText highlightStatic">
            <a href="/about">Nice to meet you!</a>
          </h1>
          <span className="body heroBlurb">
            <span>
              I&apos;m a designer &amp; developer passionate about creating user-focused, robust,
              and well-researched digital solutions. In addition, I&apos;m an experienced{" "}
            </span>
            <a className="textLink" href="/work/graphicdesign">
              graphic designer
            </a>
            <span> and </span>
            <a
              className="textLink"
              href="https://www.youtube.com/donovanyohan"
              target="_blank"
              rel="noreferrer"
            >
              motion graphics artist
            </a>
            <span>
              . I&apos;m well versed in native mobile design languages for both iOS and Android, and
              I have built numerous responsive websites using React, Vue, and Angular. But believe
              it or not,{" "}
            </span>
            <span>
              <a href="/about" className="textLink">
                I don&apos;t just draw and code!
              </a>
            </span>
          </span>

          <a id="work"> </a>
          <a href="#work" id="workWrapper">
            <h1 className="headerText highlightStatic">Work I&apos;ve done.</h1>
          </a>
          <span className="body heroBlurb">
            <span>
              Here&apos;s a high-level look at some of the places I&apos;ve worked and things
              I&apos;ve worked on. If you see or read something that you want to learn more about,
              please
              <a className="textLink" href="#footer">
                {" reach out and connect with me! "}
              </a>
              I&apos;d love to share more and answer any questions you may have.
            </span>
          </span>
          <div className="cardWrapper">
            {projects.map(
              ({
                key,
                href,
                label,
                date,
                content,
                src,
                darksrc,
                disabled,
                isExternal,
                bgColor,
              }) => {
                return (
                  <div key={key}>
                    <Card
                      title={label}
                      caption={date}
                      href={href}
                      isExternal={isExternal}
                      isMobile={windowWidth !== null && windowWidth < MobileWidth}
                      content={content}
                      src={darksrc && theme == "dark" ? darksrc : src}
                      disabled={disabled}
                      bgColor={bgColor}
                    />
                  </div>
                );
              }
            )}
          </div>
        </div>

        <style jsx>{`
          #work {
            position: relative;
            top: -64px;
          }

          #workWrapper {
            align-self: flex-start;
          }

          .cardWrapper {
            width: 100%;
            position: relative;
            margin-top: 250px;
            max-width: 1024px;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin-bottom: -250px;
          }
          .cardWrapper div {
            width: 48%;
          }
          .cardWrapper a {
            text-decoration: none;
            color: black;
          }
          .cardWrapper div:nth-child(odd) {
            position: relative;
            top: -250px;
          }

          @media only screen and (max-width: 1024px) {
            .cardWrapper div {
              width: 49%;
            }
            .cardWrapper div:nth-child(odd) {
              top: calc(50vw * 9 / 16 / 1.1 * -1);
            }
            .cardWrapper {
              margin-top: calc(50vw * 9 / 16 / 1.1);
              margin-bottom: 0;
            }
          }

          @media only screen and (max-width: 425px) {
            .cardWrapper div:nth-child(odd) {
              top: 0;
            }
            .cardWrapper {
              flex-direction: column;
              margin-top: 0;
              margin-bottom: 0;
            }
            .cardWrapper div {
              width: 100%;
            }
          }

          @keyframes highlighterOn {
            0% {
              width: 0%;
            }

            100% {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </Main>
  );
};

export default Index;
