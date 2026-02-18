import React from 'react';
import Card from '../../../components/Card';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Footer from '../../../components/Footer';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import ApplicationForm from '../recruitment/ApplicationForm'; // Adjust path as necessary

const StaffApplicationPage: React.FC = () => {
  const { theme } = useTheme();
  const { companyId } = useAuth();

  if (!companyId) {
    return (
      <div className={`${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'} min-h-screen`}>
        <Navbar />
        <TwoColumnLayout
          sidebarContent={<SideNavbar />}
          mainContent={
            <Card padding="p-6" shadow={true} border={true}>
              <h1 className="text-lg font-bold mb-4">Staff Application Page</h1>
              <p className='text-sm'>Error: Company ID is not available. Please ensure you are logged in and try again.</p>
            </Card>
          }
        />
      </div>
    );
  }

  const mainContent = (
    <div>
      <Card padding="p-6" shadow={true} border={true}>
        <h1 className="text-lg font-bold">Staff Application Page</h1>
        <p className='text-sm'>Use this page to submit an application directly on behalf of a candidate (no subcontractor, no job ID).</p>
      </Card>
      
      {/* Reuse the ApplicationForm with staff-specific props */}
      <Card padding="p-6" className='mt-2' shadow={true} border={true}>
        <ApplicationForm
          companyId={companyId.toString()}
          submittedBySubcontractor={false}
          contractId={null}
          // No jobId or requestId
        />
      </Card>
    </div>
  );

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
      <Navbar />
      <div className='flex-grow'>
        <TwoColumnLayout
          sidebarContent={<SideNavbar />}
          mainContent={mainContent}
        />
      </div>
      <Footer />
    </div>
  );
};

export default StaffApplicationPage;
