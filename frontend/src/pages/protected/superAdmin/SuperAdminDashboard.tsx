import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/Card';
import { useTheme } from '../../../context/ThemeContext';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import { useAuth } from '../../../hooks/useAuth';
import { isSuperAdmin } from '../../../utils/checkRole';

const SuperAdminDashboard: React.FC = () => {
    const { userId, email, companyId, role, userPin, isActive, isDormant, branchId } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!isSuperAdmin()) {
            navigate('/'); // Redirect to login if not a Super Admin
        }
    }, [navigate]);

    const dashboardContent = (
        <Card className="max-w-full w-full p-6 space-y-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p>Your user ID: {userId}</p>
            <p>Your company ID: {companyId}</p>
            <p>Your email is: {email}</p>
            <p>Your pin is: {userPin}</p>
            <p>Your role is: {role}</p>
            <p>Your branch ID is: {branchId}</p> 
        </Card>
    );

    return (
        <div className={`${theme === 'dark' ? 'bg-dark-background text-white' : 'bg-light-background text-gray-900'} min-h-screen`}>
            <Navbar />
            <TwoColumnLayout
                sidebarContent={<SideNavbar />}
                mainContent={dashboardContent}
            />
        </div>
    );
};

export default SuperAdminDashboard;
