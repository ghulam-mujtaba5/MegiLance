'use client';
// @AI-HINT: This ThemeContext provides light/dark mode switching for all components. No global CSS is used; theme is passed via context or props and handled in .light.css/.dark.css files only.
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light");

  // Detect device theme on first mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      if (mql.matches) {
        setTheme((prev) => (prev === "light" ? "dark" : prev));
      }
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
