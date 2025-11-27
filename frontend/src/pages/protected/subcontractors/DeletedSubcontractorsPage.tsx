import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import Footer from '../../../components/Footer';
import Table from '../../../components/Table';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { BACKEND_URL } from '../../../config';

interface Subcontractor {
    subcontractor_id: number;
    company_name: string;
    contact_person: string;
    contact_number: string;
    email_address: string;
    invoice_terms: string;
    pay_rate: number;
}

const DeletedSubcontractorsPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth(); // Using useAuth to get the companyId
    const [deletedSubcontractors, setDeletedSubcontractors] = useState<Subcontractor[]>([]);

    useEffect(() => {
        if (!companyId) {
            return;
        }
        const fetchDeletedSubcontractors = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/subcontractors/deleted/${companyId}`);
                setDeletedSubcontractors(response.data);
            } catch (error) {
                console.error('Failed to fetch deleted subcontractors:', error);
       
            }
        };

        fetchDeletedSubcontractors();
    }, [companyId]);

    const columns = [
        { header: 'Company Name', accessor: 'company_name', isVisible: true },
        { header: 'Contact Person', accessor: 'contact_person', isVisible: true },
        { header: 'Contact Number', accessor: 'contact_number', isVisible: true },
        { header: 'Email Address', accessor: 'email_address', isVisible: true },
        { header: 'Invoice Terms', accessor: 'invoice_terms', isVisible: true },
        { header: 'Pay Rate', accessor: 'pay_rate', isVisible: true },
        // You can add more columns as needed
    ];

    return (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
            <Navbar />
            <div className='flex-grow'>
                <TwoColumnLayout
                    sidebarContent={<SideNavbar />}
                    mainContent={
                        <Card className="max-w-full w-full p-6 space-y-4">
                            <h1 className="text-2xl font-bold">Deleted Subcontractors</h1>
                            <Table data={deletedSubcontractors} columns={columns} />
                        </Card>
                    }
                />
            </div>
            <Footer />
        </div>
    );
};

export default DeletedSubcontractorsPage;
