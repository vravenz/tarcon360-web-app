import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../../../context/ThemeContext';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Card from '../../../components/Card';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Text from '../../../components/Text';
import Modal from '../../../components/Modal';
import InputField from '../../../components/InputField';
import Footer from '../../../components/Footer';
import Button from '../../../components/Button';
import { useAuth } from '../../../hooks/useAuth';
import { FaMapMarkerAlt, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import {BsFillCheckCircleFill} from 'react-icons/bs'
import { BACKEND_URL } from '../../../config';

interface Job {
    job_id: number;
    title: string;
    description: string;
    location: string;
    start_date: string | null;
    end_date: string | null;
    is_ongoing: boolean;
    status: string;
}

const RecruitmentPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

    useEffect(() => {
        if (companyId) {
            axios.get(`${BACKEND_URL}/api/jobs/${companyId}`)
                .then((response) => {
                    setJobs(response.data);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error('Error fetching jobs', error);
                    setError('Failed to fetch jobs');
                    setIsLoading(false);
                });
        }
    }, [companyId]);

    const handleStatusChange = (jobId: number, newStatus: string) => {
        axios
            .post(`${BACKEND_URL}/api/jobs/update/${jobId}`, { status: newStatus })
            .then((response) => {
                const updatedJob = response.data;
                setJobs(jobs.map((job) => (job.job_id === jobId ? updatedJob : job)));
            })
            .catch((error) => {
                console.error('Error updating job status', error);
                alert('Failed to update job status');
            });
    };

    const confirmDeleteJob = (jobId: number) => {
        setSelectedJobId(jobId);
        setIsModalOpen(true);
    };

    const deleteJob = () => {
        if (selectedJobId == null) return;

        axios
            .delete(`${BACKEND_URL}/api/jobs/delete/${selectedJobId}`)
            .then(() => {
                setJobs(jobs.filter((job) => job.job_id !== selectedJobId));
                setIsModalOpen(false);
                setSelectedJobId(null);
            })
            .catch((error) => {
                console.error('Error deleting job', error);
                alert('Failed to delete job');
            });
    };

    const formatDateString = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const jobsContent = (
        <Card className="p-6 space-y-4">
            <h1 className="text-xl font-bold mb-6">Open Jobs</h1>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <Card key={job.job_id} shadow={true} border={true} className="flex flex-col justify-between p-4 h-full">
                            <div>
                                <Text isHeading={true} size="xl" className="mb-4 font-semibold">
                                    {job.title}
                                </Text>
                                <div className="space-y-2">
                                    <Text newLine={true}>
                                        <FaInfoCircle className="inline mr-2" />
                                        <strong className='text-sm'>Description:</strong> {job.description}
                                    </Text>
                                    <Text newLine={true}>
                                        <FaMapMarkerAlt className="inline mr-2" />
                                        <strong className='text-sm'>Location:</strong> {job.location}
                                    </Text>
                                    <Text newLine={true}>
                                        <FaCalendarAlt className="inline mr-2" />
                                        <strong className='text-sm'>Start:</strong> {formatDateString(job.start_date)}
                                    </Text>
                                    {job.is_ongoing ? (
                                        <Text newLine={true}>
                                             <BsFillCheckCircleFill className="inline mr-2 text-green-500" /> 
                                             <strong className='text-sm'>Ongoing:</strong> Yes
                                        </Text>
                                    ) : (
                                        <Text newLine={true}>
                                            <FaCalendarAlt className="inline mr-2" />
                                            <strong className='text-sm'>End:</strong> {formatDateString(job.end_date)}
                                        </Text>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <InputField
                                    type="select"
                                    name={`status-${job.job_id}`}
                                    value={job.status}
                                    onChange={(e) => handleStatusChange(job.job_id, e.target.value)}
                                    options={[
                                        { label: 'Open', value: 'Open' },
                                        { label: 'Closed', value: 'Closed' },
                                    ]}
                                />
                                <Button
                                    onClick={() => confirmDeleteJob(job.job_id)}
                                    color="delete"
                                    icon="trash"
                                    size="small"
                                    marginRight='5px'
                                >
                                    Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            {error && <p>{error}</p>}
        </Card>
    );

    return (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'} `}>
            <Navbar />
            <div className="flex-grow">
                <TwoColumnLayout
                    sidebarContent={<SideNavbar />}
                    mainContent={jobs.length > 0 ? jobsContent : <p>No jobs available</p>}
                />
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="small">
                <div className="p-4">
                    <h2 className="text-lg font-bold mb-2">Confirm Deletion</h2>
                    <p>Are you sure you want to delete this job? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button color="delete" onClick={deleteJob} size="small" marginRight='5px' icon="trash">Delete</Button>
                        <Button onClick={() => setIsModalOpen(false)} size="small" marginRight='5px'  icon="cancel">Cancel</Button>
                    </div>
                </div>
            </Modal>
            <Footer />
        </div>
    );
};

export default RecruitmentPage;
