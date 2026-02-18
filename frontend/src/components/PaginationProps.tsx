import React from 'react';
import { useTheme } from '../context/ThemeContext';  // Adjust the import path as necessary

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const { theme } = useTheme();  // Use theme context to determine the current theme

    // Determine button and text styles based on theme
    const buttonClass = theme === 'dark' ? 'bg-dark-button text-white hover:bg-dark-hover' : 'bg-light-button text-black hover:bg-light-hover';
    const disabledButtonClass = theme === 'dark' ? 'bg-dark-disabled' : 'bg-light-disabled';
    const textColor = theme === 'dark' ? 'text-white' : 'text-black';

    return (
        <div className="flex justify-end items-center my-4 space-x-2">
            <button
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className={`${buttonClass} px-2 py-1 text-sm rounded disabled:${disabledButtonClass}`}
            >
                Previous
            </button>
            <span className={`${textColor} text-sm`}>Page {currentPage} of {totalPages}</span>
            <button
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className={`${buttonClass} px-2 py-1 text-sm rounded disabled:${disabledButtonClass}`}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;
