import { useEffect } from "react";

export default function useSmoothScroll() {
    useEffect(() => {
        document.documentElement.scrollTop = 0;
        document.querySelector("html").style.scrollBehavior = "smooth";
        return () => (
            document.querySelector("html").style.scrollBehavior = ""
        )
    }, []);
}