// src/components/ThemeToggle.tsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { MdWbSunny } from 'react-icons/md';  // Day icon
import { FaMoon } from 'react-icons/fa';    // Night icon

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Decide icon color based on theme
  const iconColor = theme === 'dark' ? 'text-white' : 'text-gray-700';

  return (
    <button onClick={toggleTheme} className={`flex items-center justify-center p-2 ${iconColor}`}>
      {theme === 'light' ? <FaMoon className="text-xl" /> : <MdWbSunny className="text-xl" />}
    </button>
  );
};

export default ThemeToggle;
