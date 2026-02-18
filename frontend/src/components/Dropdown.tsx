// src/components/Dropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MdMoreVert } from 'react-icons/md';  // Import three-dots vertical icon

interface DropdownProps {
    className?: string;
    menuItems: Array<{
        label: string,
        onClick: () => void;
    }>;
}

const Dropdown: React.FC<DropdownProps> = ({ className, menuItems }) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const menuClass = theme === 'dark' ? 'bg-dark-background text-white' : 'bg-white text-gray-900';
    const shadowClass = 'shadow-md';

    return (
        <div className={className} ref={dropdownRef}>
            <button onClick={toggleDropdown} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <MdMoreVert />
            </button>
            {isOpen && (
                <div className={`absolute mt-2 w-48 ${menuClass} ${shadowClass} rounded-md z-50 origin-top-right`}>
                    {menuItems.map((item, index) => (
                        <button key={index} onClick={item.onClick} className="block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800">
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dropdown;
