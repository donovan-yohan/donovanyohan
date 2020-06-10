import App from "next/app";
import React, { useState, useEffect } from "react";
import Context from "../components/context";

export default class MyApp extends App {
  state = {
    theme: "light",
  };

  componentDidMount = () => {
    // Define which query we will check
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    // If matches, set data-theme to dark
    if (mediaQuery.matches) {
      this.toggleTheme();
    }
  };

  toggleTheme = () => {
    let newTheme = this.state.theme;
    newTheme === "dark" ? (newTheme = "light") : (newTheme = "dark");

    let transition = document.createElement("div");
    transition.setAttribute("id", "transition");
    let color = newTheme === "dark" ? "black" : "white";
    transition.style.backgroundColor = color;

    document.getElementsByTagName("body")[0].appendChild(transition);

    window.setTimeout(function () {
      document.documentElement.setAttribute("data-theme", newTheme);
    }, 320);
    window.setTimeout(
      function () {
        this.setState({ theme: newTheme });
      }.bind(this),
      320
    );

    window.setTimeout(function () {
      document
        .getElementById("transition")
        .parentNode.removeChild(document.getElementById("transition"));
    }, 1000);
  };

  render() {
    const { Component, pageProps } = this.props;

    return (
      <Context.Provider
        value={{
          theme: this.state.theme,
          toggleTheme: this.toggleTheme,
        }}
      >
        <div
          className="fouc"
          style={{
            position: "fixed",
            width: "100%",
            height: "100%",
            top: "0",
            left: "0",
            backgroundColor: `${
              this.state.theme == "light" ? "white" : "black"
            }`,
          }}
        />
        <Component {...pageProps} />
        <style jsx global>
          {`
            .fouc {
              display: none;
            }
          `}
        </style>
      </Context.Provider>
    );
  }

  // Only uncomment this method if you have blocking data requirements for
  // every single page in your application. This disables the ability to
  // perform automatic static optimization, causing every page in your app to
  // be server-side rendered.
  //
}
