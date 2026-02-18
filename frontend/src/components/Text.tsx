import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface TextProps {
    children: React.ReactNode;
    className?: string;
    color?: 'primary' | 'secondary' | 'danger'; // Text color options
    highlight?: 'yellow' | 'green' | 'blue' | 'red' | 'orange' | 'purple'; // Background highlight options
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'xl2'; // Text size options
    isHeading?: boolean; // To render as a heading
    underline?: boolean; // Underline text
    paddingLeft?: string; // Padding left
    paddingRight?: string; // Padding right
    newLine?: boolean;
}

const Text: React.FC<TextProps> = ({
    children,
    className = '',
    color,
    highlight,
    size = 'md',
    isHeading = false,
    underline = false,
    paddingLeft = 'px-0',
    paddingRight = 'px-0',
    newLine = false // Default to false for inline text
}) => {
    const { theme } = useTheme();

    const textSizeClass = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        xl2: 'text-2xl'
    };

    const textColorClass = theme === 'dark' ? {
        primary: 'text-[#E0E0E0]', // Soft light gray for primary text
        secondary: 'text-[#B0B0B0]', // Muted gray for secondary text
        danger: 'text-[#FF6B6B]' // Vibrant soft red for danger
    } : {
        primary: 'text-[#2E2E2E]', // Dark charcoal for primary text
        secondary: 'text-[#4A4A4A]', // Mid-gray for secondary text
        danger: 'text-[#D32F2F]' // Refined deep red for danger
    };

    const highlightClass = {
        yellow: 'px-2 text-sm py-1 bg-[#FFF59D] dark:bg-[#FFD54F] rounded text-black dark:text-gray-900', // Soft yellow highlight
        green: 'px-2 text-sm py-1 bg-[#A5D6A7] dark:bg-[#66BB6A] rounded text-black dark:text-gray-900', // Muted green highlight
        blue: 'px-2 text-sm py-1 bg-[#90CAF9] dark:bg-[#42A5F5] rounded text-black dark:text-gray-900', // Vibrant blue highlight
        red: 'px-2 text-sm py-1 bg-[#EF9A9A] dark:bg-[#E57373] rounded text-black dark:text-gray-900', // Soft red highlight
        orange: 'px-2 text-sm py-1 bg-[#FFCC80] dark:bg-[#FFA726] rounded text-black dark:text-gray-900', // Warm orange highlight
        purple: 'px-2 text-sm py-1 bg-[#CE93D8] dark:bg-[#AB47BC] rounded text-black dark:text-gray-900' // Refined purple highlight
    };

    const headingClass = isHeading ? 'font-bold text-2xl' : '';
    const underlineClass = underline ? 'underline' : '';

    const textClasses = `${textSizeClass[size]} ${color ? textColorClass[color] : ''} ${highlight ? highlightClass[highlight] : ''} ${headingClass} ${underlineClass} ${paddingLeft} ${paddingRight} ${className}`;

    // Render as <span> or <div> based on `newLine` prop
    const Tag = newLine ? 'div' : 'span';

    return (
        <Tag className={textClasses}>
            {children}
        </Tag>
    );
};

export default Text;
