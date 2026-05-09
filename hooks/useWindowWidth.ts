import { useState, useEffect } from "react";
import { debounce } from "../global/global";

export default function useWindowWidth(): number | null {
  const [windowWidth, setWidth] = useState<number | null>(null);

  useEffect(() => {
    setWidth(document.children[0].clientWidth);

    const debouncedHandleResize = debounce(() => {
      setWidth(document.children[0].clientWidth);
    }, 250);

    window.addEventListener("resize", debouncedHandleResize);
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  }, []);

  return windowWidth;
}
