import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import ViewAsTable from '../../../components/ViewAsTable';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../../components/Button';
import Footer from '../../../components/Footer';
import { BACKEND_URL } from '../../../config';
import { useTheme } from '../../../context/ThemeContext';

interface Site {
    site_id: number;
    site_name: string;
    weekly_contracted_hours: number;
    site_billable_rate_guarding: number;
    site_billable_rate_supervisor: number;
    site_payable_rate_guarding: number;
    site_payable_rate_supervisor: number;
    is_mobile_allowed: boolean;
}

const SitesPage: React.FC = () => {
    const { companyId } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [sites, setSites] = useState<Site[]>([]);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchSites = async () => {
            if (!companyId) return;
            try {
                // If your API supports filtering by company, you could use:
                // const response = await axios.get(`http://localhost:4000/api/sites/company/${companyId}`);
                const response = await axios.get(`${BACKEND_URL}/api/sites`);
                setSites(response.data);
            } catch (error) {
                console.error('Failed to fetch sites:', error);
                setError('Failed to load sites');
            }
        };

        fetchSites();
    }, [companyId]);

    const handleView = (siteId: number) => {
        navigate(`/sites/${siteId}`);
    };

    return (
        <div className={`${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'} min-h-screen`}>
            <Navbar />
            <TwoColumnLayout
                sidebarContent={<SideNavbar />}
                mainContent={
                    <div className={`${theme === 'dark' ? 'text-dark-text' : 'text-light-text'} md:grid md:grid-cols-1 md:gap-4`}>
                        <Card className="p-6">
                            <h1 className="text-2xl font-bold mb-4">Sites</h1>
                            {error ? <p>{error}</p> : (
                                <ViewAsTable
                                    data={sites.map(site => ({
                                        'Site ID': site.site_id,
                                        'Site Name': site.site_name,
                                        'Contracted Hours': site.weekly_contracted_hours,
                                        'Billable Rate Guarding': site.site_billable_rate_guarding,
                                        'Billable Rate Supervisor': site.site_billable_rate_supervisor,
                                        'Payable Rate Guarding': site.site_payable_rate_guarding,
                                        'Payable Rate Supervisor': site.site_payable_rate_supervisor,
                                        'Mobile Allowed': site.is_mobile_allowed ? 'Yes' : 'No',
                                        'Actions': (
                                            <div className="flex flex-row items-center gap-2">
                                            <Button onClick={() => handleView(site.site_id)} size="small" color="edit">
                                                View
                                            </Button>
                                            <Button color="delete" size="small">
                                                Delete
                                            </Button>
                                        </div>
                                        )
                                    }))}
                                    columns={[
                                        { label: 'Site ID', accessor: 'Site ID' },
                                        { label: 'Site Name', accessor: 'Site Name' },
                                        { label: 'Contracted Hours', accessor: 'Contracted Hours' },
                                        { label: 'Billable Rate Guarding', accessor: 'Billable Rate Guarding' },
                                        { label: 'Billable Rate Supervisor', accessor: 'Billable Rate Supervisor' },
                                        { label: 'Payable Rate Guarding', accessor: 'Payable Rate Guarding' },
                                        { label: 'Payable Rate Supervisor', accessor: 'Payable Rate Supervisor' },
                                        { label: 'Mobile Allowed', accessor: 'Mobile Allowed' },
                                        { label: 'Actions', accessor: 'Actions' }
                                    ]}
                                />
                            )}
                        </Card>
                    </div>
                }
            />
            <Footer />
        </div>
    );
};

export default SitesPage;
