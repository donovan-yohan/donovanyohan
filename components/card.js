import React, { useState, useEffect } from "react";
import Icon from "../components/icon";
import Link from "next/link";

const Card = props => {
  const content = (
    <div className="root">
      <div className="container">
        <div className="cardWrapper">
          <div className="imageWrapper">
            <img src={props.src} />
          </div>
          <Link href={props.href}>
            <a className="mobileButton">
              <span>Learn More</span>
              <Icon src="../img/icons/chevron.svg" size="small" />
            </a>
          </Link>
        </div>
        <div className="textWrapper">
          <div className="title">{props.title}</div>
          <div className="subheader">{props.caption}</div>
          <div className="content">
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
          border-color: rgba(0, 0, 0, 0.25);
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
        }
        img {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          object-fit: cover;
          overflow: hidden;
          filter: grayscale(100%);
          transition: 0.35s ease;
        }
        .mobileButton {
          display: flex;
          align-self: flex-end;
          width: 100%;
          padding: 4px 12px 4px 16px;
          justify-content: space-between;
          align-items: center;
          background: #fff500;
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
          font-size: 18px;
        }
        .subheader {
          opacity: 0.54;
          padding-bottom: 8px;
        }

        @media only screen and (min-width: 1025px) {
          .container:hover {
            border-color: rgba(0, 0, 0, 0.87);
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
            background-color: #fff500;
          }
          .container:hover img {
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
          img {
            filter: none;
          }
          .container {
            border-radius: 8px;
            border-color: rgba(0, 0, 0, 0.4);
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
          .content {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );

  return (
    <div>
      {props.isMobile ? (
        content
      ) : (
        <Link href={props.href}>
          <a>{content}</a>
        </Link>
      )}
      <style jsx>{`
        a {
          text-decoration: none;
          color: unset;
        }
      `}</style>
    </div>
  );
};

export default Card;
