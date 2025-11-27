import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import SideNavbar from '../../components/SideNavbar';
import TwoColumnLayout from '../../components/TwoColumnLayout';
import Table from '../../components/Table';
import { useAuth } from '../../hooks/useAuth';
import { BACKEND_URL } from '../../config';

interface ContractRequest {
    contract_id: number;
    main_company_name: string;
    contract_description: string;
    status: string;
    created_at: string;
}

const SubcontractorDashboardPage: React.FC = () => {
    const { companyId } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [contractRequests, setContractRequests] = useState<ContractRequest[]>([]);

    useEffect(() => {
        const fetchContractRequests = async () => {
            if (companyId) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/subcontractor-company/requests/received/${companyId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setContractRequests(data.map((contract: ContractRequest) => ({
                            ...contract,
                            actions: <Button onClick={() => navigate(`/contract-info/${contract.contract_id}`)} color="submit" size="small">View Details</Button>
                        })));
                    } else {
                        console.error("Failed to fetch contract requests, status:", response.status);
                    }
                } catch (error) {
                    console.error("Failed to fetch contract requests:", error);
                }
            }
        };

        fetchContractRequests();
    }, [companyId, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/', { replace: true });
    };

    const columns = [
        { header: 'Company', accessor: 'main_company_name', isVisible: true },
        { header: 'Description', accessor: 'contract_description', isVisible: true },
        { header: 'Status', accessor: 'status', isVisible: true },
        { header: 'Created At', accessor: 'created_at', isVisible: true },
        { header: 'Actions', accessor: 'actions', isVisible: true }
    ];

    return (
        <div className={`${theme === 'dark' ? 'bg-dark-background text-white' : 'bg-light-background text-gray-900'} min-h-screen`}>
            <TwoColumnLayout
                sidebarContent={<SideNavbar />}
                mainContent={
                    <Card className="max-w-full w-full p-6 space-y-4">
                        <h1 className="text-2xl font-bold mb-4">Subcontractor Dashboard</h1>
                        <Button onClick={handleLogout} color="delete" size="small">Logout</Button>
                        {contractRequests.length > 0 ? (
                            <Table data={contractRequests} columns={columns} />
                        ) : (
                            <p>No contract requests found.</p>
                        )}
                    </Card>
                }
            />
        </div>
    );
};

export default SubcontractorDashboardPage;
