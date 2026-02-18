// src/components/SubcontractorDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MdArrowDropDown } from 'react-icons/md';

interface Subcontractor {
  company_id: number;
  company_name: string;
  // Add more fields if needed
}

interface SubcontractorDropdownProps {
  label: string;
  subcontractors: Subcontractor[];
  value?: number;
  onChange: (value: number) => void;
}

const SubcontractorDropdown: React.FC<SubcontractorDropdownProps> = ({ label, subcontractors, value, onChange }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuClass = theme === 'dark' ? 'bg-dark-background text-white' : 'bg-white text-gray-900';
  const borderClass = theme === 'dark' ? 'border-dark-border' : 'border-light-border';

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block mb-1">{label}</label>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between p-2 border ${borderClass} rounded`}
      >
        <span>
          {value 
            ? subcontractors.find(sub => sub.company_id === value)?.company_name || 'Select Subcontractor'
            : 'Select Subcontractor'
          }
        </span>
        <MdArrowDropDown />
      </button>
      {isOpen && (
        <div className={`absolute left-0 z-50 mt-1 w-full ${menuClass} shadow-md rounded max-h-60 overflow-y-auto`}>
          {subcontractors.length === 0 ? (
            <div className="px-2 py-1">No subcontractors available</div>
          ) : (
            subcontractors.map(sub => (
              <button
                key={sub.company_id}
                type="button"
                className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => {
                  onChange(sub.company_id);
                  setIsOpen(false);
                }}
              >
                {sub.company_name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SubcontractorDropdown;
