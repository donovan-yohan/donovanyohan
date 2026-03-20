import { useState, useEffect } from "react";
import Context from "../components/context";

export default function MyApp({ Component, pageProps }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Define which query we will check
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    // If matches, set data-theme to dark
    if (mediaQuery.matches) {
      document.documentElement.setAttribute("data-theme", "dark");
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    let newTheme = theme;
    newTheme === "dark" ? (newTheme = "light") : (newTheme = "dark");

    let transition = document.createElement("div");
    transition.setAttribute("id", "transition");
    let color = newTheme === "dark" ? "black" : "white";
    transition.style.backgroundColor = color;

    document.getElementsByTagName("body")[0].appendChild(transition);

    window.setTimeout(function () {
      document.documentElement.setAttribute("data-theme", newTheme);
    }, 320);
    window.setTimeout(function () {
      setTheme(newTheme);
    }, 320);

    window.setTimeout(function () {
      document
        .getElementById("transition")
        .parentNode.removeChild(document.getElementById("transition"));
    }, 1000);
  };

  return (
    <Context.Provider
      value={{
        theme: theme,
        toggleTheme: toggleTheme,
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
          backgroundColor: `${theme == "light" ? "white" : "black"}`,
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
