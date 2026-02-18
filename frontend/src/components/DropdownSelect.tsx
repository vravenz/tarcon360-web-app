import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MdArrowDropDown } from 'react-icons/md';

interface Option {
  label: string;
  value: string;
}

interface DropdownSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  className?: string;
}

const DropdownSelect: React.FC<DropdownSelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Define common classes (similar to InputField)
  const commonClasses = 'border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-300';
  const themeStyles = theme === 'dark'
    ? 'bg-dark-background text-dark-text border-dark-border focus:ring-dark-buttonBackground'
    : 'bg-light-background text-light-text border-light-border focus:ring-light-buttonBackground';

  // Dropdown menu shadow
  const menuShadow = 'shadow-md';

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`w-full ${commonClasses} flex items-center justify-between ${themeStyles} ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span>{selectedOption ? selectedOption.label : 'Select Option'}</span>
        <MdArrowDropDown />
      </button>
      {isOpen && (
        <div className={`absolute mt-1 w-full ${themeStyles} ${menuShadow} rounded-md z-50`}>
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${themeStyles} hover:bg-opacity-75`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownSelect;
