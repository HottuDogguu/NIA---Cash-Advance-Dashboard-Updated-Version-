import { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  // Check local storage for a saved theme, default to 'purple'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app_theme") || "purple";
  });

  // Save to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("app_theme", theme);
    document.body.setAttribute("data-theme", theme);  
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}