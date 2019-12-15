import React from "react";
import Link from "next/link";
import { socialLinks } from "../global/global"
import Icon from "../components/icon"

const BottomNav = () => (
  <div className="footer">
    <div className="container">
      <h2 id='footer' className="highlightStatic">Contact or connect with me!</h2>
      <div className="wrapper">
        <div className="body message">
          <p>Thanks for checking out my website! If you want to learn more about my work, feel free to check out some of these links.</p>
        </div>
        <div>
          <div className="linkGroup">
            <p className='body'>Contact me:</p>
            <a href="mailto:donovanyohan@gmail.com" className="email">donovanyohan@gmail.com</a>
          </div>
          <div className="linkGroup">
            <p className='body'>Connect with me:</p>
            <ul>
              {socialLinks.map(({ key, href, icon, label }) => (
                <li key={key}>
                  <a href={href} target='_blank'><Icon src={icon} size="large" link={true} black={true} /></a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
      .footer{
        display: flex;
        justify-content: center;
        width: 100%;
        margin: 0 0 64px 0;
      }
      .container {
        margin: 16px;
        max-width: 1024px;
      }
      .wrapper {
        display: flex;
        justify-content: space-between;
      }
      .wrapper div {
        flex-basis: 46.5%;
      }
      .linkGroup {
        margin-bottom: 32px;
      }
      h2 {
        margin: 64px 0;
      }
      p {
        margin: 0 0 8px 0;
      }

      .email {
        color: black;
        text-decoration: none;
        position: relative;
        font-weight: bold;
      }

      .email::before {
        align-self: flex-start;
        content: "";
        z-index: -1;
        transition: 0.3s;
        position: absolute;
        bottom: 2px;
        width: 0%;
        height: 60%
      }
      .email:hover::before {
        width:100%;
        background-color: #FFF500
      }

      ul {
        display: flex;
        padding: 0;
        list-style-type: none;
      }

      li {
        margin-right: 16px;
      }

      @media only screen and (max-width: 1024px) {
        .footer {
          display: flex;
          justify-content: center;
          margin: 64px 0 32px 0;
        }
        .container {
          margin: 0 16px 32px 16px;
        }
        .wrapper {
          flex-direction: column;
        }
        h2 {
          font-size: 18px;
          margin: 0 0 32px 0;
        }
        p {
          margin: 0 0 8px 0;
        }
        .message {
          margin-bottom: 32px;
        }
        .email::before {
          width: 100%;
          background-color: #FFF500
        }
      }
    `}</style>
  </div>
);

export default BottomNav;
