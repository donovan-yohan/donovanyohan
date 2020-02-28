import React, { useState, useEffect } from "react";
import { debounce } from "../global/global";

// logic for finding current viewport size
export default function useWindowWidth() {
  const [windowWidth, setWidth] = useState(null);

  useEffect(() => {
    if (!windowWidth) setWidth(document.children[0].clientWidth);

    const debouncedHandleResize = debounce(function handleResize() {
      setWidth(document.children[0].clientWidth);
    }, 250);

    window.addEventListener("resize", debouncedHandleResize);

    return _ => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  });

  return windowWidth;
}
