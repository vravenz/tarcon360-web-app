import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Footer from '../../../components/Footer';
import Card from '../../../components/Card';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../../components/Button';
import Table from '../../../components/Table';
import Text from '../../../components/Text';
import InputField from '../../../components/InputField';
import Modal from '../../../components/Modal';
import { BACKEND_URL } from '../../../config';

interface Interview {
    interview_id: number;
    application_id: number;
    interview_date: string;
    interviewer: string;
    notes: string;
    outcome: string;
    first_name: string;
    last_name: string;
    job_title: string;
}

interface TableColumn {
    header: string;
    accessor: keyof Interview | 'actions'; // Extended to include actions
    isVisible: boolean;
}

const InterviewPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInterviewId, setSelectedInterviewId] = useState<number | null>(null);
    const [newOutcome, setNewOutcome] = useState<string>('Pending');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInterviews = async () => {
            if (companyId) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/applicants/interviews/${companyId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setInterviews(data);
                    } else {
                        console.error('Failed to fetch interviews:', response.status);
                    }
                } catch (error) {
                    console.error('Error fetching interviews:', error);
                }
            }
        };
        fetchInterviews();
    }, [companyId]);

    const handleNavigate = (applicationId: number) => {
        navigate(`/recruitment/applications/${applicationId}`);
    };

    const openModal = (interviewId: number) => {
        setSelectedInterviewId(interviewId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedInterviewId(null);
    };

    const updateInterviewOutcome = async () => {
        if (selectedInterviewId) {
            const response = await fetch(`${BACKEND_URL}/api/applicants/interviews/outcome/${selectedInterviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ outcome: newOutcome })
            });
            if (response.ok) {
                alert('Interview outcome updated');
                closeModal();
                const updatedInterviews = await fetch(`${BACKEND_URL}/api/applicants/interviews/${companyId}`).then(res => res.json());
                setInterviews(updatedInterviews);
            } else {
                console.error('Failed to update interview outcome');
            }
        }
    };

    const handleDeleteInterview = async (interviewId: number) => {
        if (window.confirm('Are you sure you want to delete this interview?')) {
            const response = await fetch(`${BACKEND_URL}/api/applicants/interviews/${interviewId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setInterviews(interviews.filter(interview => interview.interview_id !== interviewId));
                alert('Interview deleted successfully.');
            } else {
                console.error('Failed to delete the interview');
            }
        }
    };

    const getStatusElement = (outcome: string): JSX.Element => {
        switch (outcome) {
            case 'Passed':
                return <Text highlight="green">{outcome}</Text>;
            case 'Failed':
                return <Text highlight="red">{outcome}</Text>;
            case 'Pending':
                return <Text highlight="orange">{outcome}</Text>;
            default:
                return <Text>{outcome}</Text>;
        }
    };

    const tableActions = (interview: Interview) => (
        <div className="flex gap-2">
            <Button onClick={() => handleNavigate(interview.application_id)} icon='view' color="edit" size="small">
            </Button>
            <Button onClick={() => openModal(interview.interview_id)} icon='result' color="submit" size="small" disabled={interview.outcome === 'Passed' || interview.outcome === 'Failed'}>
            </Button>
            <Button onClick={() => handleDeleteInterview(interview.interview_id)} icon='trash' color="delete" size="small">
            </Button>
        </div>
    );

    const columns: TableColumn[] = useMemo(() => [
        { header: 'ID', accessor: 'interview_id', isVisible: true },
        { header: 'Applicant Name', accessor: 'first_name', isVisible: true },
        { header: 'Job Title', accessor: 'job_title', isVisible: true },
        { header: 'Interview Date', accessor: 'interview_date', isVisible: true },
        { header: 'Interviewer', accessor: 'interviewer', isVisible: true },
        { header: 'Outcome', accessor: 'outcome', isVisible: true },
        { header: 'Actions', accessor: 'actions', isVisible: true }
    ], []);

    const extendedInterviews = interviews.map(interview => ({
        ...interview,
        outcome: getStatusElement(interview.outcome),
        actions: tableActions(interview)
    }));

    const mainContent = (
        <Card className="max-w-full w-full p-6 space-y-4">
            <h1 className="text-xl font-bold mb-4">Scheduled Interviews</h1>
            <Table
                data={extendedInterviews}
                columns={columns}
            />
        </Card>
    );

    return (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'}`}>
        <Navbar />
        <div className='flex-grow'>
            <TwoColumnLayout sidebarContent={<SideNavbar />} mainContent={mainContent} />
        </div>
        <Modal isOpen={isModalOpen} onClose={closeModal} size="medium">
            <div className="space-y-4">
                <h2 className="text-lg font-bold">Update Interview Outcome</h2>
                <InputField
                    type="select"
                    name="outcome"
                    label="Outcome"
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    options={[
                        { label: "Pending", value: "Pending" },
                        { label: "Passed", value: "Passed" },
                        { label: "Failed", value: "Failed" }
                    ]}
                    required
                />
                <Button onClick={updateInterviewOutcome} color='edit' size='small'>
                    Submit
                </Button>
            </div>
        </Modal>
        <Footer />
    </div>
    );
};

export default InterviewPage;
