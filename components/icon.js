import React from 'react'

const Icon = props => (
  <div className={props.link ? 'link' : ''} style={{ opacity: props.black ? '0.54' : '1' }}>
    <img className={props.size} src={props.src} />

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
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: 0.2s;
    }

    .link:hover {
      opacity: 1 !important;
    }

    @media only screen and (min-width: 1024px) {
      .link::before {
        content: "";
        transition: .3s ease-out;
        z-index: -1;
        position: absolute;
        width: 0%;
        height: 100%
      }
      .link:hover::before {
        width:100%;
        background-color: #FFF500
      }
    }

    `}</style>
  </div>
);

export default Icon;
