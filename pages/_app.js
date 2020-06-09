import App from "next/app";
import React, { useState, useEffect } from "react";
import Context from "../components/context";

export default class MyApp extends App {
  state = {
    theme: undefined,
  };

  componentDidMount = () => {
    // Define which query we will check
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    // If matches, set data-theme to dark, else to light
    if (mediaQuery.matches)
      document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.setAttribute("data-theme", "light");
  };

  toggleTheme = () => {
    let newTheme = this.state.theme;
    newTheme === "dark" ? (newTheme = "light") : (newTheme = "dark");

    let transition = document.createElement("div");
    transition.setAttribute("id", "transition");
    let color;
    newTheme === "dark" ? (color = "black") : (color = "white");
    transition.style.backgroundColor = color;

    document.getElementsByTagName("body")[0].appendChild(transition);

    window.setTimeout(function () {
      document.documentElement.setAttribute("data-theme", newTheme);
    }, 500);
    window.setTimeout(
      function () {
        this.setState({ theme: newTheme });
      }.bind(this),
      500
    );

    window.setTimeout(function () {
      document
        .getElementById("transition")
        .parentNode.removeChild(document.getElementById("transition"));
    }, 1500);
  };
  render() {
    const { Component, pageProps } = this.props;

    return (
      <Context.Provider
        value={{ theme: this.state.theme, toggleTheme: this.toggleTheme }}
      >
        <Component {...pageProps} />
      </Context.Provider>
    );
  }

  // Only uncomment this method if you have blocking data requirements for
  // every single page in your application. This disables the ability to
  // perform automatic static optimization, causing every page in your app to
  // be server-side rendered.
  //
  // MyApp.getInitialProps = async (appContext) => {
  //   // calls page's `getInitialProps` and fills `appProps.pageProps`
  //   const appProps = await App.getInitialProps(appContext);
  //
  //   return { ...appProps }
  // }
}
