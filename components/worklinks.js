import React from "react";
import Link from "next/link";
import { projects, hobbies } from "../global/global";

const WorkLinks = (props) => {
  let type = projects;
  props.type === "hobbies" ? (type = hobbies) : (type = projects);

  let index = type.findIndex((p) => p.label === props.label);

  return (
    <div className="worklinks">
      <div className="wrapper">
        <div className="highlight">
          <Link href={"/#work"}>
            <a className="highlight">Back to All Work</a>
          </Link>
        </div>
        <div className="buttonWrapper">
          {index > 0 && (
            <Link href={type[index - 1].href}>
              <a className="highlight">&lt; Previous</a>
            </Link>
          )}
          {index < type.length - 1 && !type[index + 1].disabled && (
            <Link href={type[index + 1].href}>
              <a className="highlight">Next &gt;</a>
            </Link>
          )}
        </div>
      </div>

      <style jsx>{`
        .worklinks {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-top: 64px;
        }
        .wrapper {
          display: flex;
          width: 100%;
          justify-content: space-between;
        }
        .buttonWrapper {
          display: flex;
        }
        .buttonWrapper a {
          margin-left: 16px;
        }
      `}</style>
    </div>
  );
};

export default WorkLinks;
