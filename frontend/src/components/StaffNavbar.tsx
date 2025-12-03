// components/StaffNavbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import Avatar from '../assets/images/avatar.jpg';

const StaffNavbar: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const backgroundColorClass =
    theme === 'dark' ? 'bg-dark-cardBackground' : 'bg-light-cardBackground';
  const textColorClass = theme === 'dark' ? 'text-dark-text' : 'text-light-text';
  const borderColorClass = theme === 'dark' ? 'border-dark-border' : 'border-light-border';

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/staff-dashboard');
  };

  return (
    <div
      className={[
        'sticky top-0 z-50 shadow-md border-b',
        backgroundColorClass,
        textColorClass,
        borderColorClass,
        'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]', // top & bottom safe area
      ].join(' ')}
    >
      <div className="mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link
          to="/staff-dashboard"
          onClick={goHome}
          className="text-lg font-bold tracking-wide"
          aria-label="KFMG Dashboard"
        >
          KFMG
        </Link>

        {/* Right side: Theme + Profile */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/profile"
            aria-label="Profile"
            className="block rounded-full overflow-hidden w-9 h-9 ring-1 ring-transparent hover:ring-blue-400 transition-shadow"
          >
            <img
              src={Avatar}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffNavbar;
