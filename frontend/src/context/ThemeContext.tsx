// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
}

const defaultContextValue: ThemeContextType = {
  theme: 'light', // Default theme
  setTheme: () => {}, // Placeholder function, will be overridden by the provider
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    updateBodyClass(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Updates the body class for theme appropriately
  const updateBodyClass = (theme: string) => {
    const classList = document.body.classList;
    classList.remove('dark', 'light');
    classList.add(theme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  return context;
}