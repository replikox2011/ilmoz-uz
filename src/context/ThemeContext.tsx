import * as React from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "ilmoz-theme";

function applyTheme(t: Theme) {
  const html = document.documentElement;
  if (t === "light") {
    html.setAttribute("data-theme", "light");
    html.classList.remove("dark");
    html.classList.add("light");
  } else {
    html.setAttribute("data-theme", "dark");
    html.classList.remove("light");
    html.classList.add("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferred = stored ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    return preferred;
  });

  // Apply on mount and whenever theme changes
  React.useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState(prev => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
