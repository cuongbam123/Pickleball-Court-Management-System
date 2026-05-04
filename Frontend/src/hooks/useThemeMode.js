import { useEffect, useState } from "react";

const THEME_KEY = "pb-theme-mode";

const getInitialTheme = () => {
  if (typeof window === "undefined") return false;
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "dark") return true;
  if (saved === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const useThemeMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDarkMode);
    window.localStorage.setItem(THEME_KEY, isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return { isDarkMode, toggleTheme };
};
