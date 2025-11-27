import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Card from '../../../components/Card';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Footer from '../../../components/Footer';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import Table from '../../../components/Table';
import InputField from '../../../components/InputField';
import { FaCheckCircle } from 'react-icons/fa';
import { BACKEND_URL } from '../../../config';

interface ApplicationData {
    application_id: number;
    first_name: string;
    last_name: string;
    job_title: string;
    email: string;
    applied_on: string;
    isScheduled: boolean;  // Indicates if the interview is scheduled
    application_status?: string; // Added to handle status revert
}

interface TableColumn {
    header: string;
    accessor: keyof ApplicationData | 'actions'; // Extended to include actions
    isVisible: boolean;
}

const ShortlistedPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const [shortlistedApplications, setShortlistedApplications] = useState<ApplicationData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
    const [interviewDetails, setInterviewDetails] = useState({
        interview_date: '',
        interviewer: '',
        notes: '',
        outcome: 'Pending'
    });

    useEffect(() => {
        const fetchShortlistedApplications = async () => {
            if (companyId) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/applicants/shortlisted/${companyId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setShortlistedApplications(data);
                    } else {
                        console.error('Failed to fetch shortlisted applications:', response.status);
                    }
                } catch (error) {
                    console.error('Error fetching shortlisted applications:', error);
                }
            }
        };

        fetchShortlistedApplications();
    }, [companyId]);

    const openModal = (applicationId: number) => {
        setSelectedApplicationId(applicationId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedApplicationId(null);
    };

    // Updated to include HTMLSelectElement
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setInterviewDetails({
            ...interviewDetails,
            [event.target.name]: event.target.value
        });
    };

    const handleScheduleInterview = async () => {
        if (selectedApplicationId) {
            try {
                const response = await fetch(`${BACKEND_URL}/api/applicants/interviews/${selectedApplicationId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(interviewDetails)
                });

                if (response.ok) {
                    alert('Interview scheduled successfully');
                    closeModal();
                    setShortlistedApplications(shortlistedApplications.map(app =>
                        app.application_id === selectedApplicationId ? { ...app, isScheduled: true } : app
                    ));
                } else {
                    alert('Failed to schedule interview');
                }
            } catch (error) {
                console.error('Error scheduling interview:', error);
                alert('An error occurred while scheduling the interview.');
            }
        }
    };

    const revertStatus = async (applicationId: number) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/applicants/revert-status/${applicationId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        
            if (response.ok) {
                const updatedApplication = await response.json();
                setShortlistedApplications(shortlistedApplications.map(app => 
                    app.application_id === applicationId ? { ...app, application_status: 'Submit' } : app
                ));
                alert('Status reverted to Submit.');
            } else {
                console.error('Failed to revert application status');
                alert('Failed to revert application status.');
            }
        } catch (error) {
            console.error('Error reverting application status:', error);
            alert('An error occurred while reverting the application status.');
        }
    };

    const tableActions = (application: ApplicationData) => (
        <div className="flex gap-2">
            {application.isScheduled ? (
                <FaCheckCircle color="green" size={20} />
            ) : (
                <>
                    <Button onClick={() => openModal(application.application_id)} icon='schedule' color="edit" size="small" />
                    <Button onClick={() => revertStatus(application.application_id)} icon='undo' color="edit" size="small" />
                </>
            )}
        </div>
    );

    const columns: TableColumn[] = useMemo(() => [
        { header: 'Applicant Name', accessor: 'first_name', isVisible: true },
        { header: 'Job Title', accessor: 'job_title', isVisible: true },
        { header: 'Email', accessor: 'email', isVisible: true },
        { header: 'Applied On', accessor: 'applied_on', isVisible: true },
        { header: 'Actions', accessor: 'actions', isVisible: true }
    ], []);

    const formattedData = shortlistedApplications.map(application => ({
        ...application,
        applied_on: new Date(application.applied_on).toLocaleDateString(),
        actions: tableActions(application)
    }));

    const mainContent = (
        <Card className={`max-w-full w-full p-6 space-y-8 ${theme === 'dark' ? 'bg-dark-cardBackground text-dark-text' : 'bg-light-cardBackground text-light-text'}`}>
            <div className="flex flex-col lg:flex-row justify-between items-center">
                <h1 className="text-xl font-extrabold">Shortlisted Candidates</h1>
                <h2 className="text-lg font-semibold">Manage Interviews</h2>
            </div>
            {shortlistedApplications.length > 0 ? (
                <Table
                    data={formattedData}
                    columns={columns}
                />
            ) : (
                <p className="text-center text-sm">No shortlisted candidates available.</p>
            )}
        </Card>
    );

    return (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'}`}>
            <Navbar />
            <div className='flex-grow '>
                <TwoColumnLayout sidebarContent={<SideNavbar />} mainContent={mainContent} />
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} size="medium">
                <div className="space-y-4 p-6 rounded-lg">
                    <h2 className="text-lg font-bold">Schedule Interview</h2>
                    <InputField
                        type="date"
                        name="interview_date"
                        label="Interview Date"
                        value={interviewDetails.interview_date}
                        onChange={handleInputChange}
                        required
                    />
                    <InputField
                        type="text"
                        name="interviewer"
                        label="Interviewer Name"
                        placeholder="Interviewer Name"
                        value={interviewDetails.interviewer}
                        onChange={handleInputChange}
                        required
                    />
                    <InputField
                        type="textarea"
                        name="notes"
                        label="Interview Notes"
                        placeholder="Interview Notes"
                        value={interviewDetails.notes}
                        onChange={handleInputChange}
                    />
                    <Button onClick={handleScheduleInterview} color='edit' size='small'>
                        Submit
                    </Button>
                </div>
            </Modal>
            <Footer />
        </div>
    );
};

export default ShortlistedPage;
