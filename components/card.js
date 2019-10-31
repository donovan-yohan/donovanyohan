import React, { useState, useEffect } from 'react'


const Card = props => (
  <div>
    <div className='container'>
      <div className="imageWrapper">

      </div>
      <div className="textWrapper">
        <div className="title">
          {props.title}
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
        width: 475px;
        margin-bottom: 24px;
        height: 400px;
        font-size: 16px;
        line-height: 24px;
      }
      .imageWrapper {
        border-radius: 250px;
        height: 250px;
        transition: 0.2s;
        background: gray;
      }
      .textWrapper {
        padding: 8px 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .title {
        font-family: Roboto;
        font-style: normal;
        font-weight: bold;
        font-size: 32px;
        line-height: 1.2;
        padding-bottom: 4px;
        opacity: 0.54;
        position: relative;
        transition: 0.2s;
        z-index: 2;
      }
      .subheader {
        text-transform: uppercase;
        opacity: 0.54;
      }



      @media only screen and (min-width: 1024px) {
        .container:hover .imageWrapper {
          box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
          background: #FFF500;
        }
        .container:hover .title {
          opacity: 1;
        }
        .title::before {
          content: "";
          transition: .1s ease-out;
          z-index: -1;
          position: absolute;
          width: 0%;
          height: 100%
        }
        .container:hover .title::before {
          width:100%;
          background-color: #FFF500
        }
      }



      // small desktop scaling

      @media only screen and (max-width: 1035px) and (min-width: 1025px) {
        .container {
          width: 470px;
        }
      }


      // mobile scaling 

      @media only screen and (max-width: 1024px) {
        .container {
          width: 100vw;
          height: auto;
        }
        .imageWrapper {
          height: 100vw;
          border-radius: 0;
        }

        .title {
          font-size: 18px;
          opacity: 1;
        }
        .title::before {
          content: "";
          z-index: -1;
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: #FFF500;
        }
        .subheader {
          font-size: 12px;
        }
      }
    `}</style>
  </div>
);

export default Card;
