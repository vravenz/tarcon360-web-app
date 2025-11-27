import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaBars, FaTimes } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import Card from './Card';
import Avatar from '../assets/images/avatar.jpg';

interface NavItemProps {
    label: string;
    path: string;
    icon?: JSX.Element;
    subItems?: NavItemProps[];
}

const navItems: NavItemProps[] = [
    { label: 'Dashboard', path: '/staff-dashboard' },
    { label: 'Jobs', path: '/staff/jobs' },
];

const StaffNavbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { theme } = useTheme();
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);
    const toggleProfileDropdown = () => setIsProfileOpen(!isProfileOpen);

    // Local logout implementation
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/', { replace: true });
    };

    // Theme-based classes
    const backgroundColorClass = theme === 'dark' ? 'bg-dark-cardBackground' : 'bg-light-cardBackground';
    const textColorClass = theme === 'dark' ? 'text-dark-text' : 'text-light-text';
    const hoverBackgroundClass = theme === 'dark' ? 'hover:bg-dark-hover' : 'hover:bg-light-hover';
    const borderColorClass = theme === 'dark' ? 'border-dark-border' : 'border-light-border';

    return (
        <Card className={`sticky top-0 shadow-md z-50 relative ${backgroundColorClass} ${textColorClass}`}>
            <div className="container-fluid mx-auto px-4 flex justify-between items-center">
                <Link to="/staff-dashboard" className="text-lg font-bold">
                    KFMG
                </Link>
                <button onClick={toggleMenu} className="lg:hidden text-xl">
                    {isOpen ? <FaTimes /> : <FaBars />}
                </button>
                <div
                    className={`${
                        isOpen ? 'block' : 'hidden'
                    } absolute top-full right-0 w-full ${backgroundColorClass} lg:bg-transparent lg:block lg:static lg:flex lg:flex-row justify-end items-center`}
                >
                    {navItems.map((item, index) => (
                        <div
                            key={index}
                            className={`px-2 py-1 ${hoverBackgroundClass} transition-colors duration-300 ease-in-out lg:hover:bg-transparent relative`}
                        >
                            <Link to={item.path} className="flex items-center space-x-2">
                                <span>{item.label}</span>
                            </Link>
                        </div>
                    ))}
                    <div className={`border-r h-6 mx-2 ${borderColorClass}`}></div>
                    <ThemeToggle />
                    <div className="relative">
                        <button
                            onClick={toggleProfileDropdown}
                            className={`rounded-full w-10 h-10 ${hoverBackgroundClass} flex items-center justify-center`}
                        >
                            <img
                                src={Avatar}
                                alt="Profile"
                                className="rounded-full w-full h-full object-cover"
                            />
                        </button>
                        {isProfileOpen && (
                            <Card className="absolute right-0 w-48 mt-2">
                                <ul className="text-sm">
                                    <li>
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsProfileOpen(false)}
                                            className={hoverBackgroundClass}
                                        >
                                            Profile
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/settings"
                                            onClick={() => setIsProfileOpen(false)}
                                            className={hoverBackgroundClass}
                                        >
                                            Settings
                                        </Link>
                                    </li>
                                    <li>
                                        <button
                                            onClick={logout}
                                            className={`block px-4 py-2 text-sm ${hoverBackgroundClass}`}
                                        >
                                            Logout
                                        </button>
                                    </li>
                                </ul>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default StaffNavbar;
