/**
 * Shared next/font initializers. Hoisted here so subset/weight requests
 * happen once at build time and every page imports the same instance.
 */
import { Geist_Mono, Crimson_Pro, Caveat } from "next/font/google";

export const gm500 = Geist_Mono({ subsets: ["latin"], weight: "500", style: "normal" });
export const gm800 = Geist_Mono({ subsets: ["latin"], weight: "800", style: "normal" });
export const cp400 = Crimson_Pro({ subsets: ["latin"], weight: "400", style: "normal" });
export const cp400i = Crimson_Pro({ subsets: ["latin"], weight: "400", style: "italic" });
export const cv700 = Caveat({ subsets: ["latin"], weight: "700", style: "normal" });
