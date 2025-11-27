import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Card from './Card';

const Footer: React.FC = () => {
  const { theme } = useTheme();

  // Theme-based classes similar to Navbar
  const backgroundColorClass = theme === 'dark' ? 'bg-dark-cardBackground' : 'bg-light-cardBackground';
  const textColorClass = theme === 'dark' ? 'text-dark-text' : 'text-light-text';
  const linkHoverClass = theme === 'dark' ? 'hover:text-gray-300' : 'hover:text-gray-700';

  return (
    <Card className={`relative z-45 shadow-md ${backgroundColorClass} ${textColorClass} mt-8`}>
      <div className="container-fluid mx-auto px-4 py-2 flex flex-col lg:flex-row justify-between items-center">
        <p className="text-sm text-center lg:text-left">
          &copy; 2025{' '}
          <a href="https://vravenz.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
            vravenz
          </a>
          . All rights reserved.
        </p>
        <div className="flex space-x-4 mt-2 lg:mt-0">
          <Link to="/privacy-policy" className={`text-sm ${linkHoverClass}`}>
            Privacy Policy
          </Link>
          <Link to="/terms-and-conditions" className={`text-sm ${linkHoverClass}`}>
            Terms and Conditions
          </Link>
          <Link to="/contact-us" className={`text-sm ${linkHoverClass}`}>
            Contact Us
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default Footer;
