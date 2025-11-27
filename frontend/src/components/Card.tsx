// src/components/Card.tsx
import React, { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: string;
  shadow?: boolean;
  border?: boolean;
  /** Width class for borders, e.g. "border", "border-2", "border-4" */
  borderWidth?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'p-4',
  shadow = true,
  border = false,
  borderWidth = 'border-2', // Default border thickness
}) => {
  const { theme } = useTheme();
  const shadowClass = shadow ? 'shadow-md' : '';

  // Background & text colors from theme
  const backgroundColorClass = theme === 'dark'
    ? 'bg-dark-cardBackground'
    : 'bg-light-cardBackground';
  const textColorClass = theme === 'dark'
    ? 'text-dark-text'
    : 'text-light-text';

  // Border color from theme
  const borderClass = border
    ? `${borderWidth} border-light-border dark:border-dark-border`
    : '';

  return (
    <div
      className={`
        rounded-lg
        ${padding}
        ${shadowClass}
        ${backgroundColorClass}
        ${textColorClass}
        ${borderClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
