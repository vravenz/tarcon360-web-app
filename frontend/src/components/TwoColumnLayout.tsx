// Example of adding a toggle for the sidebar
import React, { useState, ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';

interface TwoColumnLayoutProps {
    sidebarContent: ReactNode;
    mainContent: ReactNode;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ sidebarContent, mainContent }) => {
    const { theme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const backgroundColor = theme === 'dark' ? 'bg-dark-background' : 'bg-light-background';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

    return (
        <div className={`flex h-full ${backgroundColor} ${textColor} flex-col md:flex-row mt-2 mb-2 mr-2 ml-2`}>
            <div className={`md:w-1/10 ${sidebarOpen ? 'block' : 'hidden'} md:block md:mr-2`}>
                {sidebarContent}
                <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>Toggle Sidebar</button>
            </div>
            <div className="md:w-9/10 w-full flex-auto">
                {mainContent}
            </div>
        </div>
    );
};

export default TwoColumnLayout;
