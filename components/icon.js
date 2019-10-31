import React from 'react'

const Icon = props => (
  <div className={props.size}>
    <img src={props.src} className={props.size} />

    <style jsx>{`
    .small {
      width: 24px;
      height: 24px;
    }
    .medium {
      width: 28px;
      height: 28px;
    }
    .large {
      width: 32px;
      height: 32px;
    }
    div {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    `}</style>
  </div>
);

export default Icon;
