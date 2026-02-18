import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import ViewAsTable from '../../components/ViewAsTable';
import Modal from '../../components/Modal';
import { BACKEND_URL } from '../../config';

interface ContractDetails {
    contract_id: number;
    main_company_name: string;
    contract_description: string;
    status: string;
    created_at: string;
}

interface EmployeeRequest {
    request_id: number;
    employee_request_count: number;
    request_date: string;
    start_date: string;
    end_date: string | null;
    is_ongoing: boolean;
    location: string;
    pay_rate: number;
    approval_status: string;
    form_submitted_count?: number;
}

interface Application {
    applicationId: number;
    status: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    phone?: string;
    created_at: Date;
}

const ContractInfoPage: React.FC = () => {
    const { contractId } = useParams<{ contractId: string }>();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [contractDetails, setContractDetails] = useState<ContractDetails | null>(null);
    const [employeeRequests, setEmployeeRequests] = useState<EmployeeRequest[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
    const [currentAction, setCurrentAction] = useState<'Approve' | 'Decline' | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedRequestApplications, setSelectedRequestApplications] = useState<Application[]>([]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [contractRes, employeeRes] = await Promise.all([
                    fetch(`${BACKEND_URL}/api/subcontractor-company/contract/${contractId}`),
                    fetch(`${BACKEND_URL}/api/subcontractor-company/employee-requests/${contractId}`)
                ]);

                if (contractRes.ok && employeeRes.ok) {
                    const contractData = await contractRes.json();
                    const employeeData = await employeeRes.json();
                    setContractDetails(contractData);
                    setEmployeeRequests(employeeData);
                } else {
                    throw new Error("Failed to fetch details");
                }
            } catch (error) {
                console.error("Failed to fetch details:", error);
                navigate('/');
            }
        };

        fetchDetails();
    }, [contractId, navigate]);

    const handleUpdateRequestStatus = async (requestId: number, newStatus: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/subcontractor-company/employee-request/update-status/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ new_approval_status: newStatus })
            });
    
            if (response.ok) {
                const updatedRequest = await response.json();
                setEmployeeRequests(current =>
                    current.map(req => req.request_id === requestId ? { ...req, approval_status: updatedRequest.approval_status } : req)
                );
                setModalOpen(false);
            } else {
                throw new Error('Failed to update request status');
            }
        } catch (error) {
            console.error('Error updating employee request status:', error);
            alert('Error updating request status');
        }
    };

    // Function to fetch applications for a specific request ID
    const fetchApplicationsForRequest = async (requestId: number): Promise<Application[]> => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/subcontractor-company/applications/request/${requestId}`);
            if (response.ok) {
                
                return response.json();
            } else {
                throw new Error('Failed to fetch applications');
            }
        } catch (error) {
            console.error('Failed to fetch applications:', error);
            return []; // Return an empty array on error
        }
    }; 

    const redirectToSubcontractorApplication = (requestId: number) => {
        navigate(`/subcontractor-application/${requestId}`);
    };

    const handleRequestAction = (requestId: number, action: 'Approve' | 'Decline') => {
        setCurrentRequestId(requestId);
        setCurrentAction(action);
        setModalOpen(true);
    };

    const confirmAction = () => {
        if (currentRequestId && currentAction) {
            const newStatus = currentAction === 'Approve' ? 'Approved' : 'Declined';
            handleUpdateRequestStatus(currentRequestId, newStatus);
        }
    };

    const employeeColumns = [
        { label: 'Requested Employees', accessor: 'initial_employee_requests' },
        { label: 'Request Date', accessor: 'request_date' },
        { label: 'Start Date', accessor: 'start_date' },
        { label: 'End Date', accessor: 'end_date' },
        { label: 'Is Ongoing?', accessor: 'is_ongoing' },
        { label: 'Location', accessor: 'location' },
        { label: 'Pay Rate', accessor: 'pay_rate' },
        { label: 'Approval Status', accessor: 'approval_status' },
        { label: 'Sent Count', accessor: 'form_submitted_count' },
        { label: 'Actions', accessor: 'actions' }
    ];

    const contractColumns = [
        { label: 'Field', accessor: 'field' },
        { label: 'Value', accessor: 'value' }
    ];

    const tableData = contractDetails ? [
        { field: 'Contract Id', value: contractDetails.contract_id },
        { field: 'Subcontractor', value: contractDetails.main_company_name },
        { field: 'Description', value: contractDetails.contract_description },
        { field: 'Status', value: contractDetails.status },
        { field: 'Created At', value: new Date(contractDetails.created_at).toLocaleDateString() }
    ] : [];
    
    const handleViewClick = async (requestId: number): Promise<void> => {
        const applications = await fetchApplicationsForRequest(requestId);
        setSelectedRequestApplications(applications);
        setViewModalOpen(true);
    };      

    const employeeTableData = employeeRequests.map(request => ({
        initial_employee_requests: `${request.employee_request_count} Employees`,
        request_date: new Date(request.request_date).toLocaleDateString(),
        start_date: new Date(request.start_date).toLocaleDateString(),
        end_date: request.end_date ? new Date(request.end_date).toLocaleDateString() : 'Ongoing',
        is_ongoing: request.is_ongoing ? 'Yes' : 'No',
        location: request.location,
        pay_rate: `${request.pay_rate} GBP`,
        approval_status: request.approval_status,
        form_submitted_count: request.form_submitted_count,
        actions: (
            <div className="flex space-x-2">
               <Button onClick={() => handleRequestAction(request.request_id, 'Approve')} color="submit" size="small" disabled={request.approval_status !== 'pending'}>Approve</Button>
                <Button onClick={() => handleRequestAction(request.request_id, 'Decline')} color="delete" size="small" disabled={request.approval_status !== 'pending'}>Decline</Button>
                <Button onClick={() => redirectToSubcontractorApplication(request.request_id)} color="edit" size="small" disabled={request.approval_status !== 'Approved'}>Send</Button>
                <Button onClick={() => handleViewClick(request.request_id)} color="edit" size="small" disabled={request.approval_status !== 'Approved'}>View</Button>
            </div>
        )     
    }));

    return (
        <div className={`${theme === 'dark' ? 'bg-dark-background text-white' : 'bg-light-background text-gray-900'} min-h-screen`}>
           
           <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="medium">
                <div>
                    <h2 className="text-md">Confirm Action</h2>
                    <p className="text-sm">Are you sure? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button size="small" color="delete" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button size="small" color="submit" onClick={confirmAction}>{currentAction}</Button>
                    </div>
                </div>
            </Modal>

            <Card className="max-w-full w-full p-6 space-y-4">
                <h1 className="text-2xl font-bold mb-4">Contract Details</h1>
                {contractDetails ? (
                    <ViewAsTable data={tableData} columns={contractColumns} />
                ) : (
                    <p>Loading contract details...</p>
                )}
            </Card>
            {employeeRequests.length > 0 && (
                <Card className="max-w-full w-full p-6 mt-4 space-y-4">
                    <h1 className="text-2xl font-bold mb-4">Employee Requests</h1>
                    <ViewAsTable data={employeeTableData} columns={employeeColumns} />
                </Card>
            )}

            <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} size="xl">
                <div>
                    <h2>Applications for Request {currentRequestId}</h2>
                    {selectedRequestApplications.length > 0 ? (
                        <ViewAsTable
                            data={selectedRequestApplications.map(app => ({
                                fullName: `${app.first_name} ${app.middle_name ? app.middle_name : ''} ${app.last_name}`.replace(/\s+/g, ' ').trim(), // Combines the names, handling absent middle names gracefully
                                email: app.email,
                                phone: app.phone,
                                created_at: new Date(app.created_at).toLocaleDateString(),
                                status: app.status,
                            }))}
                            columns={[
                                { label: 'Full Name', accessor: 'fullName' },
                                { label: 'Email', accessor: 'email' },
                                { label: 'Phone', accessor: 'phone' },
                                { label: 'Sent Date', accessor: 'created_at' },
                                { label: 'Status', accessor: 'status' },
                            ]}
                        />
                    ) : (
                        <p>No data found.</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ContractInfoPage;