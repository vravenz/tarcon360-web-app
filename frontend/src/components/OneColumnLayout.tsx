// components/OneColumnLayout.tsx
import React, { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';

interface OneColumnLayoutProps {
  content: ReactNode;
  /** 
   * Custom Tailwind padding (e.g. "1", "2", "4", "px-3", "p-10").
   * Defaults to 6 if not provided.
   */
  padding?: string | number;
}

const OneColumnLayout: React.FC<OneColumnLayoutProps> = ({ content, padding = 6 }) => {
  const { theme } = useTheme();

  const backgroundColor =
    theme === 'dark' ? 'bg-dark-background' : 'bg-light-background';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

  // If numeric padding, convert to Tailwind class like "p-6"
  const paddingClass =
    typeof padding === 'number' ? `p-${padding}` : padding.startsWith('p') ? padding : `p-${padding}`;

  return (
    <div className={`min-h-screen w-full ${backgroundColor} ${textColor} flex flex-col ${paddingClass}`}>
      <div className="w-full overflow-auto">{content}</div>
    </div>
  );
};

export default OneColumnLayout;
