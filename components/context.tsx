import { createContext } from "react";

export interface ThemeContextValue {
  theme: string;
  toggleTheme: () => void;
}

const Context = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

export default Context;
