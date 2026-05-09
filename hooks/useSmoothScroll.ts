import { useEffect } from "react";

export default function useSmoothScroll(): void {
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    const html = document.querySelector("html")!;
    html.style.scrollBehavior = "smooth";
    return () => {
      html.style.scrollBehavior = "";
    };
  }, []);
}
