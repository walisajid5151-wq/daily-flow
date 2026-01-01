import { useState, useEffect } from "react";

export type ThemeColor = "teal" | "ocean" | "sunset" | "lavender" | "emerald" | "slate" | "rose";

export const THEMES: { id: ThemeColor; name: string; color: string }[] = [
  { id: "teal", name: "Teal", color: "hsl(173, 58%, 45%)" },
  { id: "ocean", name: "Ocean", color: "hsl(200, 80%, 50%)" },
  { id: "sunset", name: "Sunset", color: "hsl(15, 90%, 55%)" },
  { id: "lavender", name: "Lavender", color: "hsl(270, 70%, 60%)" },
  { id: "emerald", name: "Emerald", color: "hsl(160, 84%, 40%)" },
  { id: "slate", name: "Slate", color: "hsl(215, 25%, 55%)" },
  { id: "rose", name: "Rose", color: "hsl(350, 80%, 55%)" },
];

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("planit-dark-mode");
    return stored !== null ? stored === "true" : true; // Default to dark mode
  });

  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    const stored = localStorage.getItem("planit-theme-color");
    return (stored as ThemeColor) || "teal";
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark mode
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("planit-dark-mode", String(isDark));

    // Remove all theme classes first
    THEMES.forEach(t => {
      if (t.id !== "teal") {
        root.classList.remove(`theme-${t.id}`);
      }
    });

    // Apply theme color (teal is default, no class needed)
    if (themeColor !== "teal") {
      root.classList.add(`theme-${themeColor}`);
    }
    localStorage.setItem("planit-theme-color", themeColor);
  }, [isDark, themeColor]);

  const toggleDarkMode = () => setIsDark(prev => !prev);
  const setDarkMode = (value: boolean) => setIsDark(value);
  const setTheme = (color: ThemeColor) => setThemeColor(color);

  return {
    isDark,
    themeColor,
    toggleDarkMode,
    setDarkMode,
    setTheme,
    themes: THEMES,
  };
}