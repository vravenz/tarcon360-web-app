import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Footer from '../../../components/Footer';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import Table from '../../../components/Table';
import Button from '../../../components/Button';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { BACKEND_URL } from '../../../config';

// Define the structure for each contract request
interface ContractRequest {
    contract_id: number;
    main_company_id: number;
    company_name: string;
    contract_status: string;
}

const ViewContractRequestsPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const [contractRequests, setContractRequests] = useState<ContractRequest[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchContractRequests = async () => {
            if (companyId) {
                try {
                    const response = await axios.get(`${BACKEND_URL}/api/subcontractors/requests/${companyId}`);
                    setContractRequests(response.data);
                } catch (error) {
                    console.error('Failed to fetch contract requests:', error);
                }
            }
        };

        fetchContractRequests();
    }, [companyId]);

    const columns = [
        { header: 'Subcontractor', accessor: 'company_name', isVisible: true },
        { header: 'Total Employees Requested', accessor: 'total_employee_count', isVisible: true },
        { header: 'Contract Status', accessor: 'contract_status', isVisible: true },
        { header: 'Actions', accessor: 'actions', isVisible: true }
    ];

    const extendedContractRequests = contractRequests.map((request: ContractRequest) => ({
        ...request,
        actions: (
            <Button onClick={() => navigate(`/contract-detail/${request.contract_id}`)} color="view" size="small" icon='view'></Button>
        )
    }));

    return (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
            <Navbar />
            <div className='flex-grow'>
            <TwoColumnLayout
                sidebarContent={<SideNavbar />}
                mainContent={
                    <Card className="max-w-full w-full p-6 space-y-4">
                        <h1 className="text-xl font-bold mb-4">View Contract Requests</h1>
                        <Table data={extendedContractRequests} columns={columns} />
                    </Card>
                }
            />
            </div>
            <Footer />
        </div>
    );
};

export default ViewContractRequestsPage;
