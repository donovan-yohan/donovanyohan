import React, { useState, useContext } from "react";
import Hero from "../components/hero";
import Card from "../components/card";
import Lottie from "lottie-react-web";
import Link from "next/link";
import logoAnimation from "../public/img/animations/dy.json";
import { MobileWidth, projects } from "../global/global";
import Main from "../layouts/main";
import useSmoothScroll from "../hooks/useSmoothScroll";
import useWindowWidth from "../hooks/useWindowWidth";
import VisibilitySensor from "react-visibility-sensor";
import Context from "../components/context";

const Index = () => {
  const { theme } = useContext(Context);
  const [heroVisible, setVisible] = useState(true);
  const windowWidth = useWindowWidth();
  useSmoothScroll();

  return (
    <Main>
      <div className="pageRoot">
        <div className="pageContent">
          <Hero
            dark={theme == "dark"}
            image={
              <VisibilitySensor
                partialVisibility={true}
                onChange={(isVisible) => setVisible(isVisible)}
              >
                <div>
                  <Lottie
                    options={{
                      animationData: logoAnimation,
                      loop: false,
                    }}
                    isStopped={!heroVisible}
                  />
                </div>
              </VisibilitySensor>
            }
            text={
              <span>
                <span>Hi, I'm Donovan Yohan! I'm a </span>
                <a href="#work" className="highlight heroHighlight">
                  UI & UX designer
                </a>
                <span> and a </span>
                <br />
                <a
                  href="http://github.com/donovan-yohan"
                  target="_blank"
                  className="highlight heroHighlight"
                >
                  front end developer
                </a>
                .
              </span>
            }
          />
          <h1 className="headerText highlightStatic">
            <Link href="/about">
              <a>Nice to meet you!</a>
            </Link>
          </h1>
          <span className="body heroBlurb">
            <span>
              I'm a designer & developer passionate about creating user-focused,
              robust, and well-researched digital solutions. In addition, I'm an
              experienced{" "}
            </span>
            <a className="textLink" href="/work/graphicdesign">
              graphic designer
            </a>
            <span> and </span>
            <a
              className="textLink"
              href="https://www.youtube.com/donovanyohan"
              target="_blank"
            >
              motion graphics artist
            </a>
            <span>
              . I'm well versed in native mobile design languages for both iOS
              and Android, and I have built numerous responsive websites using
              React, Vue, and Angular. But believe it or not,{" "}
            </span>
            <span>
              <Link href="/about">
                <a className="textLink">I don't just draw and code!</a>
              </Link>
            </span>
          </span>

          <a id="work"> </a>
          <a href="#work" id="workWrapper">
            <h1 name="work" className="headerText highlightStatic">
              Work I've done.
            </h1>
          </a>
          <span className="body heroBlurb">
            <span>
              Here's a high-level look at some of the places I've worked and
              things I've worked on. If you see or read something that you want
              to learn more about, please
              <a className="textLink" href="#footer">
                {" reach out and connect with me! "}
              </a>
              I'd love to share more and answer any questions you may have.
            </span>
          </span>
          <div className="cardWrapper">
            {projects.map(
              ({ key, href, label, date, content, src, darksrc, disabled }) => {
                return (
                  <div key={key}>
                    <Card
                      title={label}
                      caption={date}
                      href={href}
                      isMobile={windowWidth < MobileWidth}
                      content={content}
                      src={darksrc && theme == "dark" ? darksrc : src}
                      disabled={disabled}
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

           {
            /* ADJUST MARGIN-BOTTOM to -250PX WHEN THERE'S AN ODD NUMBER OF CARDS */
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
              // calculated based on ratio of card height to desired spacing
              top: calc(50vw * 9 / 16 / 1.1 * -1);
            }
            .cardWrapper {
              margin-top: calc(50vw * 9 / 16 / 1.1);
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
