import React, { useState, useEffect } from 'react'
import Icon from '../components/icon'


const Card = props => (
  <div className="root">
    <div className='container'>
      <div className="imageWrapper">
        <div className="mobileButton">
          <span>Learn More</span>
          <Icon src="../img/icons/chevron.svg" size="small" />
        </div>
      </div>
      <div className="textWrapper">
        <div className="title">
          {props.title}
        </div>
        <div className="content">
          {props.content ? props.content : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac turpis neque. Nam vehicula porta nulla sed tristique. Aliquam vitae ex a libero molestie tristique. "}
        </div>
        <div className="subheader">
          {props.caption}
        </div>
        <span className="details">
        </span>
      </div>
    </div>
    <style jsx>{`
      .container {
        width: 100%;
        margin-bottom: 32px;
        font-size: 16px;
        line-height: 24px;
      }
      .imageWrapper {
        display: flex;
        border-radius: 25px;
        height: 250px;
        transition: 0.2s;
        background: gray;
      }
      .mobileButton {
        align-self: flex-end;
        display: flex;
        width: 100%;
        padding: 4px 12px 4px 16px;
        justify-content: space-between;
        align-items: center;
        background: #FFF500;
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
        font-size: 20px;
        line-height: 1.2;
        margin: 8px 0;
        opacity: 0.54;
        position: relative;
        transition: 0.5s;
        z-index: 2;
      }
      .content {
        padding-bottom: 4px;
        line-height: 1.4;
      }
      .subheader {
        text-transform: uppercase;
        opacity: 0.54;
      }


      @media only screen and (min-width: 1024px) {
        .container:hover .imageWrapper {
          box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
          background: #FFF500;
        }
        .container:hover .title {
          opacity: 1;
        }
        .title::before {
          bottom: 0;
          content: "";
          transition: .25s ease-out;
          z-index: -1;
          position: absolute;
          width: 0%;
          height: 75%
        }
        .container:hover .title::before {
          width:100%;
          background-color: #FFF500
        }
        .mobileButton {
          display: none;
        }
      }



      // mobile scaling 

      @media only screen and (max-width: 1023px) {
        .container {
          max-width: 425px;
          width: 100vw;
          height: auto;
          margin-bottom: 16px;
        }
        .imageWrapper {
          max-height: 133vw;
          min-height: 56.25vw;
          border-radius: 0;
        }

        .title {
          font-size: 16px;
          opacity: 1;
        }

        .subheader {
          font-size: 14px;
        }
      }
    `}</style>
  </div>
);

export default Card;
