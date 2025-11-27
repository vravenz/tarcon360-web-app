import React from 'react';
import Card from '../../../components/Card';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Footer from '../../../components/Footer';
import { useTheme } from '../../../context/ThemeContext';

const GuardRoasterPage: React.FC = () => {
  const { theme } = useTheme();

  const mainContent = (
    <div>
      <Card padding="p-6" shadow={true} border={true}>
        <h2 className="text-xl font-semibold mb-2">Manage Schedules</h2>
        <p className="text-sm">
          Guards Roster Page
        </p>
      </Card>
    </div>
  );

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'}`}>
      <Navbar />
      <div className="flex-grow">
        <TwoColumnLayout
          sidebarContent={<SideNavbar />}
          mainContent={mainContent}
        />
      </div>
      <Footer />
    </div>
  );
};

export default GuardRoasterPage;
