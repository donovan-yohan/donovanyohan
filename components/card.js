import React, { useState, useRef } from "react";
import Icon from "../components/icon";
import Link from "next/link";

import { animated, useSpring } from "react-spring";

const PARALLAX_SPRING_FACTOR = 0.075;
const PARALLAX_TRANSLATION_FACTOR = 0.225;
const PARALLAX_OFFSET = 10;
const PARALLAX_MULTIPLIER = 1.66;
const PERSPECTIVE = 1300;
const SPRING_DAMPENER = 75;
const SCALE = 1.022;

const getParallaxStyle = (x, y, z, i) => {
  let p = PARALLAX_OFFSET + z * i * PARALLAX_MULTIPLIER;
  let xt =
    Math.sin(y * PARALLAX_SPRING_FACTOR) * p * PARALLAX_TRANSLATION_FACTOR;
  let yt =
    Math.sin(-x * PARALLAX_SPRING_FACTOR) * p * PARALLAX_TRANSLATION_FACTOR;
  return `perspective(${PERSPECTIVE}PX) translate3d(${xt}px, ${yt}px, ${p}px)`;
};

const Card = (props) => {
  const content = (transform) => (
    <div className='root'>
      <div className='container'>
        <div className='cardWrapper'>
          <div className='imageWrapper'>
            <div className='imageContainer'>
              {props.src.map((layer, i) => (
                <div
                  className='layerContainer'
                  style={{ zIndex: `${i * 10}` }}
                  key={props.key + layer}
                >
                  <animated.div
                    style={{
                      transform: transform
                        ? transform.xyzs.to((x, y, z, s) => {
                            return getParallaxStyle(x, y, z, i);
                          })
                        : "",
                    }}
                  >
                    {layer && <img className='cardImage' src={layer} />}
                  </animated.div>
                </div>
              ))}
            </div>
          </div>
          {!props.disabled && !props.isExternal && (
            <Link href={props.href}>
              <span className='mobileButton'>
                <span>Learn More</span>
                <Icon icon='' size='small' />
              </span>
            </Link>
          )}
          {!props.disabled && props.isExternal && (
            <a href={props.href} target='_blank' className='mobileButton'>
              <span>Learn More</span>
              <Icon icon='' size='small' />
            </a>
          )}
          {props.disabled && (
            <span className='mobileButton disabledBar'>
              <span>Contact me to learn more</span>
            </span>
          )}
        </div>
        <div className='textWrapper'>
          <div className={!props.disabled ? "title" : "title disabled"}>
            {props.title}
          </div>
          <div className='subheader'>{props.caption}</div>
          <div className='content'>
            <span>{props.content}</span>
          </div>
        </div>
      </div>
      <style jsx>{`
        .container {
          width: 100%;
          margin-bottom: 32px;
          font-size: 16px;
          line-height: 24px;
          border-style: solid;
          border-width: 0.5px;
          border-color: var(--border);
          border-radius: 20px;
          transition: 0.35s;
          overflow: hidden;
        }
        .cardWrapper {
          position: relative;
          display: flex;
          max-height: 320px;
          width: 100%;
          height: calc(50vw * 9 / 16);
          transition: 0.35s;
          overflow: hidden;
        }
        .imageWrapper {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: ${props.bgColor};
          filter: grayscale(100%);
          transition: 0.35s ease;
        }
        .imageContainer {
          position: relative;
        }
        .layerContainer {
          position: absolute;
          top: 0;
          left: 0;
        }
        img {
          width: 100%;
          height: 100%;
          top: 0;
          object-fit: cover;
          overflow: hidden;
          transition: 0.35s ease;
        }
        .mobileButton {
          min-height: 24px;
          display: flex;
          align-self: flex-end;
          width: 100%;
          padding: 4px 12px 4px 16px;
          justify-content: space-between;
          align-items: center;
          background: var(--highlight);
          z-index: 5;
        }
        a {
          color: unset;
          text-decoration: none;
        }
        .mobileButton span {
          font-family: Roboto;
          font-weight: bold;
          font-size: 14px;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .textWrapper {
          padding: 8px 16px;
          display: flex;
          flex-direction: column;
          text-align: left;
          align-items: flex-start;
        }
        .title {
          font-style: normal;
          font-weight: bold;
          font-size: 22px;
          line-height: 1.2;
          margin: 4px 0 4px 0;
          position: relative;
          transition: 0.35s;
          z-index: 2;
        }
        .content {
          line-height: 1.75;
          font-size: 16px;
        }
        .subheader {
          color: var(--gray);
          padding-bottom: 8px;
        }

        .disabled,
        .disabledBar {
          cursor: initial;
        }

        .disabledBar {
          background-color: var(--disabled);
        }
        @media only screen and (min-width: 1025px) {
          .container:hover {
            border-color: var(--main);
          }
          .title::before {
            bottom: 2px;
            content: "";
            transition: 0.35s;
            z-index: -1;
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 60%;
          }
          .container:hover .title::before {
            opacity: 1;
            background-color: var(--highlight);
          }
          .container:hover .disabled::before {
            background-color: var(--disabled);
          }
          .container:hover .imageWrapper {
            filter: grayscale(0%);
          }
          .mobileButton {
            position: relative;
            top: 35px;
            transition: 0.35s;
          }
          .container:hover .mobileButton {
            top: 0;
          }
        }

        // mobile scaling

        @media only screen and (max-width: 1024px) {
          .imageWrapper {
            filter: none;
            z-index: 4;
          }
          .container {
            border-radius: 8px;
            border-color: var(--gray);
          }
          .title {
            font-size: 16px;
            opacity: 1;
            margin-bottom: 4px;
          }
          .subheader {
            padding-bottom: 4px;
            font-size: 14px;
          }
        }

        @media only screen and (max-width: 425px) {
          .cardWrapper {
            height: calc(100vw * 9 / 16);
          }
        }
      `}</style>
    </div>
  );

  if (props.isMobile) {
    return <div>{content()}</div>;
  } else {
    const el = useRef(null);
    const [isHovered, setHovered] = useState(false);

    const [springProps, springApi] = useSpring(() => {
      return {
        // x rotation, y rotation, scale
        xyzs: [0, 0, 0, 1],
        config: { mass: 9, tension: 775, friction: 65, precision: 0.00001 },
      };
    });

    return (
      <animated.div
        ref={el}
        className='cardWrapper'
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          springApi.start({ xyzs: [0, 0, 0, 1] });
          setHovered(false);
        }}
        onMouseMove={({ clientX, clientY }) => {
          // mouse x inside card
          const x = clientX - el.current.getBoundingClientRect().x;

          // mouse y in card accounting for scroll
          const y = clientY - el.current.getBoundingClientRect().y;

          // Update values to animate to
          springApi.start({
            xyzs: [
              -(y - el.current.clientHeight / 3) / SPRING_DAMPENER,
              (x - el.current.clientWidth / 2) / SPRING_DAMPENER,
              25,
              SCALE, // Scale
            ],
          });
        }}
        style={{
          zIndex: isHovered ? 2 : 1,
          transform: springProps.xyzs.to((x, y, z, s) => {
            return `perspective(${PERSPECTIVE}px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`;
          }),
        }}
      >
        {props.disabled ? (
          <span className={"disabled"}>{content(springProps)}</span>
        ) : props.isExternal ? (
          <a
            href={props.href}
            target='_blank'
            className={props.disabled ? "disabled" : "card"}
          >
            {content(springProps)}
          </a>
        ) : (
          <Link href={props.href}>
            <span className={"card"}>{content(springProps)}</span>
          </Link>
        )}
        <style jsx>{`
          .cardWrapper {
            will-change: transform;
          }
          a {
            text-decoration: none;
            color: unset;
          }
          .disabled {
            cursor: initial;
          }
          .card {
            cursor: pointer;
          }
        `}</style>
      </animated.div>
    );
  }
};

export default Card;
