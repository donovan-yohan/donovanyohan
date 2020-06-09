import React from "react";

const Icon = (props) => (
  <div className={"icon"}>
    <span
      className={`${props.gray ? "gray" : ""} ${props.link ? "link" : ""} ${
        props.size
      } `}
      src={props.src}
      onClick={props.onClick}
    >
      {props.icon}
    </span>

    <style jsx>{`
      .small {
        font-size: 28px;
      }
      .medium {
        font-size: 32px;
      }
      .large {
        font-size: 36px;
      }
      div {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: 0.2s;
      }
      span {
        font-family: "icomoon";
        color: var(--main);
        font-weight: normal;
      }

      .gray {
        color: var(--gray);
      }

      .icon {
        color: var(--main);
      }

      .link {
        transition: 0.35s cubic-bezier(0.51, 0.07, 0.09, 0.95);
      }
      @media only screen and (min-width: 1025px) {
        .link:hover {
          color: var(--highlight);
        }
      }
    `}</style>
  </div>
);

export default Icon;
