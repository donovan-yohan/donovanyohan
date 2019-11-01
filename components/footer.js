import React from "react";
import Link from "next/link";
import links from "../global/global"
import Icon from "../components/icon"

const BottomNav = () => (
  <div className="footer">
    <div>
      <p>Hello, world!</p>
    </div>

    <style jsx>{`
      .footer{

      }
      ul {
        width: 100%;
        font-family: "Roboto";
        font-weight: bold;
        padding: 0;
        margin: 0;
      }
      .navLinks{
        display: flex;
        justify-content: space-around;
      }
      li {
        display: flex;
      }
      a {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: black;
        opacity: 0.54;
        text-decoration: none;
        transition: 0.1s;
        position: relative;
        padding: 0 4px;
      }
      a span {
        line-height: 19px;
        font-size: 12px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding-top: 4px;
        opacity: 1;
      }
      a:active {
        opacity: 1;
      }
      a::before {
        align-self: flex-start;
        content: "";
        transition: .1s ease-out;
        z-index: -1;
        position: absolute;
        width: 0%;
        height: 100%
      }
      a:active::before {
        width:100%;
        background-color: #FFF500
      }
    `}</style>
  </div>
);

export default BottomNav;
