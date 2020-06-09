import React from "react";
import Link from "next/link";
import links from "../global/global";
import Icon from "../components/icon";
import { useRouter } from "next/router";

const BottomNav = () => {
  const router = useRouter();
  const contactRoute = router.pathname + "#footer";
  return (
    <div className="bottomNav">
      <ul>
        <div className="navLinks">
          <li>
            <a target="_blank" href="/DonovanYohanResume.pdf">
              <Icon icon="" size="small" />
              <span>Resume</span>
            </a>
          </li>
          {links.map(({ key, href, label, icon }) => (
            <li key={key}>
              <Link href={href}>
                <a>
                  <Icon icon={icon} size="small" />
                  <span>{label}</span>
                </a>
              </Link>
            </li>
          ))}
          <li>
            <a href={contactRoute}>
              <Icon icon="" size="small" />
              <span>Contact</span>
            </a>
          </li>
        </div>
      </ul>

      <style jsx>{`
        .bottomNav {
          z-index: 1000;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          background-color: white;
          position: fixed;
          min-height: 56px;
          height: 56px;
          bottom: 0;
        }
        ul {
          width: 100%;
          font-family: "Roboto";
          font-weight: bold;
          padding: 0;
          margin: 0;
        }
        .navLinks {
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
          transition: 0.1s ease-out;
          z-index: -1;
          position: absolute;
          width: 0%;
          height: 100%;
        }
        a:active::before {
          width: 100%;
          background-color: #fff500;
        }
      `}</style>
    </div>
  );
};

export default BottomNav;
