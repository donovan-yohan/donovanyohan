import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import Context from "../components/context";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (mediaQuery.matches) {
      document.documentElement.setAttribute("data-theme", "dark");
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";

    const transition = document.createElement("div");
    transition.setAttribute("id", "transition");
    transition.style.backgroundColor = newTheme === "dark" ? "black" : "white";
    document.body.appendChild(transition);

    window.setTimeout(() => {
      document.documentElement.setAttribute("data-theme", newTheme);
    }, 320);
    window.setTimeout(() => {
      setTheme(newTheme);
    }, 320);
    window.setTimeout(() => {
      document.getElementById("transition")?.remove();
    }, 1000);
  };

  return (
    <Context.Provider value={{ theme, toggleTheme }}>
      <div
        className="fouc"
        style={{
          position: "fixed",
          width: "100%",
          height: "100%",
          top: "0",
          left: "0",
          backgroundColor: theme == "light" ? "white" : "black",
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
