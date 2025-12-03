// components/StaffBottomNav.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBriefcase, FaMapMarkerAlt, FaUser, FaChartBar } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const tabBase =
  'flex flex-col items-center justify-center gap-1 text-xs flex-1 py-2 transition-colors duration-200';

const StaffBottomNav: React.FC = () => {
  const { pathname } = useLocation();
  const { theme } = useTheme();

  const tabs = [
    { to: '/staff-dashboard', icon: <FaHome size={18} />,      label: 'Home' },
    { to: '/staff/jobs',      icon: <FaBriefcase size={18} />,  label: 'Shifts' },
    { to: '/staff/stats',     icon: <FaChartBar size={18} />,   label: 'Stats' }, // <-- NEW
    { to: '/staff/profile',   icon: <FaUser size={18} />,       label: 'Profile' },
  ];

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + '/');

  const backgroundColorClass = theme === 'dark' ? 'bg-dark-cardBackground' : 'bg-light-cardBackground';
  const textColorClass       = theme === 'dark' ? 'text-dark-text'          : 'text-light-text';
  const hoverBackgroundClass = theme === 'dark' ? 'hover:bg-dark-hover'     : 'hover:bg-light-hover';
  const borderColorClass     = theme === 'dark' ? 'border-dark-border'       : 'border-light-border';
  const activeTextClass      = theme === 'dark' ? 'text-blue-400'            : 'text-blue-600';

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 border-t ${borderColorClass} ${backgroundColorClass} shadow-inner z-20`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Staff bottom navigation"
    >
      <div className="mx-auto max-w-sm flex">
        {tabs.map(({ to, icon, label }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={[
                tabBase,
                textColorClass,
                hoverBackgroundClass,
                active ? `${activeTextClass}` : 'opacity-80',
              ].join(' ')}
            >
              {icon}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default StaffBottomNav;
