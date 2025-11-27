import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Card from '../../../components/Card';
import Footer from '../../../components/Footer';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import { useAuth } from '../../../hooks/useAuth';
import { isAdmin, isSuperAdmin } from '../../../utils/checkRole';
import Button from '../../../components/Button';
import Table from '../../../components/Table';
import Text from '../../../components/Text';
import { BACKEND_URL } from '../../../config';

type ApplicationData = {
    applicationId: number;
    jobTitle: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    status: JSX.Element;
    appliedOn: string;
    employeePhoto?: string;
};

const ViewApplications: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState<ApplicationData[]>([]);

    // Define fetchApplications here
    const fetchApplications = async () => {
        if (companyId) {
            try {
                const response = await fetch(`${BACKEND_URL}/api/applicants/${companyId}`);
                if (response.ok) {
                    const data = await response.json();
                    setApplications(data.map((app: any) => ({
                        applicationId: app.application_id,
                        jobTitle: app.job_title,
                        name: `${app.first_name} ${app.middle_name} ${app.last_name}`,
                        status: getStatusElement(determineStatus(app.application_status, app.offer_status)),
                        appliedOn: new Date(app.applied_on).toLocaleDateString(),
                        employeePhoto: app.employee_photo,
                    })));
                } else {
                    console.error('Failed to fetch applications');
                }
            } catch (error) {
                console.error('Error fetching applications:', error);
            }
        }
    };    

    const determineStatus = (appStatus: string, offerStatus: string | null): string => {
        if (offerStatus && ['Accepted', 'Rejected'].includes(offerStatus)) {
            return offerStatus;
        }
        return appStatus;
    };

    // Dynamically style the status based on its value
    const getStatusElement = (status: string): JSX.Element => {
        switch(status) {
            case 'Shortlisted':
                return <Text highlight="green">{status}</Text>;
            case 'Rejected':
                return <Text highlight="red">{status}</Text>;
            case 'Scheduled':
                return <Text highlight="orange">{status}</Text>; 
            case 'Passed':
                return <Text highlight="green">{status}</Text>;
            case 'Offered':
                return <Text highlight="purple">{status}</Text>;
            case 'Accepted':
                return <Text highlight="blue">{status}</Text>;
            default:
                return <Text>{status}</Text>;
        }
    };

    useEffect(() => {
        fetchApplications();
    }, [companyId]);

    useEffect(() => {
        if (!isSuperAdmin() && !isAdmin()) {
            navigate('/');
        }
    }, [navigate]);

    const columns = useMemo(() => [
        { header: 'Id', accessor: 'applicationId', isVisible: true },
        { header: 'Photo', accessor: 'employeePhoto', isVisible: true },
        { header: 'Name', accessor: 'name', isVisible: true },
        { header: 'Job Title', accessor: 'jobTitle', isVisible: true },
        { header: 'Applied On', accessor: 'appliedOn', isVisible: true },
        { header: 'Status', accessor: 'status', isVisible: true },
    ], []);

    const handleViewDetails = (applicationId: number) => {
        navigate(`/recruitment/applications/${applicationId}`);
    };

    const updateStatus = async (applicationId: number, status: string) => {
        const response = await fetch(`${BACKEND_URL}/api/applicants/update-status/${applicationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            fetchApplications(); // Refresh the list
        } else {
            console.error('Failed to update status');
        }
    };

    const tableActions = (application: ApplicationData) => {
        const statusText = application.status.props.children;
        const isFinalState = statusText === 'Accepted' || statusText === 'Rejected';
    
        return (
            <div style={{ display: 'flex' }} className="space-x-2">
            <Button
              onClick={() => handleViewDetails(application.applicationId)}
              color="view"
              icon="view"
              size="small"
            />
            <Button
              onClick={() => updateStatus(application.applicationId, 'Shortlisted')}
              icon="shortlist"
              color="edit"
              size="small"
              disabled={isFinalState}
            />
            <Button
              onClick={() => updateStatus(application.applicationId, 'Rejected')}
              color="delete"
              icon="reject"
              size="small"
              disabled={isFinalState}
            />
          </div>          
        );
    };    

    const extendedApplications = applications.map(app => ({
        ...app,
        employeePhoto: app.employeePhoto ? (
            <img 
                src={`${BACKEND_URL}/uploads/employee-photos/${app.employeePhoto}`} 
                alt="Employee Photo" 
                className="w-12 h-12 object-cover rounded-full"
            />
        ) : (
            <span>No photo</span>
        ),
        actions: tableActions(app)
    }));    

    const mainContent = (
        <Card className="max-w-full w-full p-6 space-y-4">
            <h1 className="text-xl font-bold mb-4">View Applications</h1>
            <Table
                data={extendedApplications}
                columns={[...columns, { header: 'Actions', accessor: 'actions', isVisible: true }]}
            />
        </Card>
    );

    return (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'}`}>
            <Navbar />
            <div className="flex-grow">
                <TwoColumnLayout sidebarContent={<SideNavbar />} mainContent={mainContent} />
            </div>
            <Footer />
        </div>
    );
};

export default ViewApplications;
