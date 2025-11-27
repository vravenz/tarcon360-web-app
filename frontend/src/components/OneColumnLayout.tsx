// OneColumnLayout Component
import React, { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';

interface OneColumnLayoutProps {
    content: ReactNode;
}

const OneColumnLayout: React.FC<OneColumnLayoutProps> = ({ content }) => {
    const { theme } = useTheme();
    const backgroundColor = theme === 'dark' ? 'bg-dark-background' : 'bg-light-background';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

    return (
        <div className={`min-h-screen w-full ${backgroundColor} ${textColor} flex flex-col p-6`}>
            <div className="w-full overflow-auto">
                {content}
            </div>
        </div>
    );
};

export default OneColumnLayout;
