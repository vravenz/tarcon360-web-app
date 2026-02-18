import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import Footer from '../../../components/Footer';
import Button from '../../../components/Button';
import { useTheme } from '../../../context/ThemeContext';
import ViewAsTable from '../../../components/ViewAsTable';
import InputField from '../../../components/InputField';
import Modal from '../../../components/Modal';
import { useAuth } from '../../../hooks/useAuth';
import { BACKEND_URL } from '../../../config';

interface ContractDetail {
    contract_id: number;
    company_name: string;
    contract_description: string;
    status: string;
    created_at: string;
    employee_requests?: EmployeeRequest[];
}

interface EmployeeRequest {
    request_id: number;
    employee_request_count: number;
    start_date: string;
    end_date: string | null;
    is_ongoing: boolean;
    location: string;
    pay_rate: number;
    approval_status: string;
}

interface Applicant {
    applicant_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    phone: string;
}

const ContractDetailPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const { contractId } = useParams<{ contractId: string }>();
    const [contractDetail, setContractDetail] = useState<ContractDetail | null>(null);
    const [employeeRequestData, setEmployeeRequestData] = useState({
        employee_request_count: 0,
        start_date: '',
        end_date: '',
        is_ongoing: true,
        location: '',
        pay_rate: 0,
    });
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentApplicants, setCurrentApplicants] = useState<Applicant[]>([]);
    const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchContractDetail = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/subcontractors/contract/${contractId}`);
                
                if (response.data) {
                    setContractDetail(response.data);
                } else {
                    setMessage('Contract not found.');
                    setMessageType('error');
                }
            } catch (error) {
                console.error('Failed to fetch contract details:', error);
                setMessage('Error fetching contract details.');
                setMessageType('error');
            }
        };

        fetchContractDetail();
    }, [contractId]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setEmployeeRequestData((prevData) => ({
            ...prevData,
            [name]: name === 'is_ongoing' ? value === 'true' : value,
        }));
    };

    const handleAddEmployeeRequest = async () => {
        const { employee_request_count, start_date, end_date, is_ongoing, location, pay_rate } = employeeRequestData;

        if (
            !employee_request_count ||
            !start_date ||
            (is_ongoing === false && !end_date) ||
            !location ||
            !pay_rate
        ) {
            setMessage('Please fill in all required fields.');
            setMessageType('error');
            return;
        }

        try {
            const response = await axios.post(`${BACKEND_URL}/api/subcontractors/employee-request`, {
                contractId: contractDetail?.contract_id,
                employee_request_count,
                startDate: start_date,
                endDate: is_ongoing ? null : end_date,
                isOngoing: is_ongoing,
                location,
                payRate: pay_rate,
            });

            if (response.status === 201) {
                setMessage('Employee request sent successfully!');
                setMessageType('success');
                setEmployeeRequestData({
                    employee_request_count: 0,
                    start_date: '',
                    end_date: '',
                    is_ongoing: true,
                    location: '',
                    pay_rate: 0,
                });
            } else {
                setMessage('Failed to send employee request.');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Error submitting employee request:', error);
            setMessage('Failed to send employee request.');
            setMessageType('error');
        }
    };

    const handleViewApplicants = async (requestId: number) => {
        console.log("Requesting applicants for request ID:", requestId);
        setCurrentRequestId(requestId);  // Set the current request ID
        try {
            const response = await axios.get(`${BACKEND_URL}/api/subcontractors/requests/${requestId}/applicants`);
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setCurrentApplicants(response.data as Applicant[]);
                setIsModalOpen(true);
            } else {
                setMessage('No applicants found.');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Failed to fetch applicants:', error);
            setMessage('Error fetching applicants.');
            setMessageType('error');
        }
    };
    
    const handleUpdateApplicantStatus = async (applicantId: number, newStatus: string) => {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/subcontractors/applicant-status-update`, {
                applicantId,
                status: newStatus,
                acceptingCompanyId: companyId
            });
            if (response.data) {
                setMessage('Status updated successfully');
                setMessageType('success');
                // Optionally refresh the applicants list or update locally
            }
        } catch (error) {
            console.error('Failed to update applicant status:', error);
            setMessage('Failed to update status');
            setMessageType('error');
        }
    };
    
    const handleViewDetails = (applicantId: number) => {
        if (applicantId) {
            navigate(`/applicants/details/${applicantId}`);
        } else {
            console.error("Attempted to navigate with undefined Applicant ID");
        }
    };    

    const formatDate = (dateString: string | null) => {
        return dateString ? new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Ongoing';
    };

    return (
<div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'} `}>
    <Navbar />
    <div className='flex-grow'>
    <TwoColumnLayout
        sidebarContent={<SideNavbar />}
        mainContent={
            <div className="md:grid md:grid-cols-4 md:gap-2">
                <Card className="md:col-span-3 p-6 shadow-lg rounded-lg bg-cardBackground">
                    <h1 className="text-xl font-bold mb-4">Contract Details</h1>
                    {contractDetail ? (
                        <ViewAsTable
                            data={[
                                { field: 'Subcontractor', value: contractDetail.company_name },
                                { field: 'Description', value: contractDetail.contract_description },
                                { field: 'Contract Date', value: contractDetail.created_at },
                                { field: 'Status', value: contractDetail.status },
                            ]}
                            columns={[
                                { label: 'Field', accessor: 'field' },
                                { label: 'Value', accessor: 'value' },
                            ]}
                        />
                    ) : (
                        <p>Loading contract details...</p>
                    )}
                </Card>
                <Card className="md:col-span-1 p-6 shadow-lg rounded-lg bg-cardBackground flex flex-col justify-center items-center">
                    <h1 className="text-xl font-bold mb-4">Request Additional Employees</h1>
                    <div className="flex flex-col justify-center space-y-4 flex-grow w-full">
                        <label htmlFor="additionalEmployees" className="block text-center text-sm font-medium">
                            Additional Employees Needed
                        </label>
                        <input
                            type="number"
                            name="employee_request_count"
                            placeholder="0"
                            value={employeeRequestData.employee_request_count || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full bg-transparent text-center border-0 focus:border-indigo-500 text-5xl font-bold focus:outline-none focus:ring-0"
                        />
                        <InputField
                            type="date"
                            name="start_date"
                            label="Start Date"
                            value={employeeRequestData.start_date}
                            onChange={handleInputChange}
                        />
                        {!employeeRequestData.is_ongoing && (
                            <InputField
                                type="date"
                                name="end_date"
                                label="End Date"
                                value={employeeRequestData.end_date || ''}
                                onChange={handleInputChange}
                            />
                        )}
                        <InputField
                            type="select"
                            name="is_ongoing"
                            label="Is Ongoing"
                            value={employeeRequestData.is_ongoing.toString()}
                            onChange={handleInputChange}
                            options={[
                                { label: 'Yes', value: 'true' },
                                { label: 'No', value: 'false' },
                            ]}
                        />
                        <InputField
                            type="text"
                            name="location"
                            label="Location"
                            placeholder="Location"
                            value={employeeRequestData.location}
                            onChange={handleInputChange}
                        />
                        <InputField
                            type="number"
                            name="pay_rate"
                            label="Pay Rate"
                            placeholder="Pay Rate"
                            value={employeeRequestData.pay_rate || ''}
                            onChange={handleInputChange}
                        />
                        <Button onClick={handleAddEmployeeRequest} color="view" size="small">
                            Request
                        </Button>
                        {message && (
                            <div
                                className={`mt-4 w-full text-center py-2 rounded ${
                                    messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                            >
                                {message}
                            </div>
                        )}
                    </div>
                </Card>
                {contractDetail?.employee_requests && contractDetail.employee_requests.length > 0 && (
                    <Card className="md:col-span-4 p-6 shadow-lg rounded-lg bg-cardBackground">
                        <h2 className="text-lg font-semibold mb-4">Employee Requests</h2>
                        <ViewAsTable
                            data={contractDetail.employee_requests.map((request) => ({
                                employee_count: request.employee_request_count,
                                start_date: formatDate(request.start_date),
                                end_date: formatDate(request.end_date) || 'Ongoing',
                                is_ongoing: request.is_ongoing ? 'Yes' : 'No',
                                location: request.location,
                                pay_rate: `${request.pay_rate}`,
                                approval_status: request.approval_status,
                                actions: (
                                    <Button onClick={() => handleViewApplicants(request.request_id)} icon='cv' color="view" size="small">
                                    </Button>
                                ),
                            }))}
                            columns={[
                                { label: 'Employee Count', accessor: 'employee_count' },
                                { label: 'Start Date', accessor: 'start_date' },
                                { label: 'End Date', accessor: 'end_date' },
                                { label: 'Is Ongoing', accessor: 'is_ongoing' },
                                { label: 'Location', accessor: 'location' },
                                { label: 'Pay Rate', accessor: 'pay_rate' },
                                { label: 'Approval Status', accessor: 'approval_status' },
                                { label: 'Actions', accessor: 'actions' },
                            ]}
                        />
                    </Card>
                )}
            </div>
        }
    />
    </div>
    <Footer />
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
        <div className="px-6 py-4">
            <h2 className="text-xl font-bold mb-4">Applicants for Request {currentRequestId}</h2>
            {currentApplicants.length > 0 ? (
                <ViewAsTable
                    data={currentApplicants.map(app => ({
                        fullName: `${app.first_name} ${app.middle_name ? app.middle_name : ''} ${app.last_name}`.replace(/\s+/g, ' ').trim(),
                        phone: app.phone,
                        email: app.email,
                        actions: (
                            <div className="flex justify-start space-x-2">
                                <Button onClick={() => handleUpdateApplicantStatus(app.applicant_id, 'Accepted')} icon='accept' size="small" color="edit">
                                </Button>
                                <Button onClick={() => handleUpdateApplicantStatus(app.applicant_id, 'Rejected')} icon='reject' size="small" color="delete">
                                </Button>
                                <Button onClick={() => handleViewDetails(app.applicant_id)} icon='view' size="small" color="view">
                                </Button>
                            </div>
                        )
                    }))}
                    columns={[
                        { label: 'Full Name', accessor: 'fullName' },
                        { label: 'Phone', accessor: 'phone' },
                        { label: 'Email', accessor: 'email' },
                        { label: 'Actions', accessor: 'actions' }
                    ]}
                />
            ) : (
                <p>No applicants found.</p>
            )}
        </div>
    </Modal>
</div>
    );
};

export default ContractDetailPage;
