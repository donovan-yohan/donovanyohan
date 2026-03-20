import { projects, hobbies } from "../global/global";

const WorkLinks = (props) => {
  let type = projects;
  props.type === "hobbies" ? (type = hobbies) : (type = projects);

  let index = type.findIndex((p) => p.label === props.label);

  let nextIndex = -1;
  let prevIndex = -1;

  let i = index + 1;
  while (i < type.length) {
    if (!type[i].disabled && !type[i].isExternal) {
      nextIndex = i;
      i = type.length;
    }
    i++;
  }

  i = index - 1;
  while (i >= 0) {
    if (!type[i].disabled && !type[i].isExternal) {
      prevIndex = i;
      i = -1;
    }
    i--;
  }

  return (
    <div className='worklinks'>
      <div className='wrapper'>
        <div className='highlight'>
          <a href={"/#work"} className='highlight'>Back to All Work</a>
        </div>
        <div className='buttonWrapper'>
          {prevIndex >= 0 && (
            <a href={type[prevIndex].href} className='highlight'>&lt; Previous</a>
          )}
          {nextIndex >= 0 && (
            <a href={type[nextIndex].href} className='highlight'>Next &gt;</a>
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
