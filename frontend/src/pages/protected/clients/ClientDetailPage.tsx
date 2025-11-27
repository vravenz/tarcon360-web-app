import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import ViewAsTable from '../../../components/ViewAsTable';
import Footer from '../../../components/Footer';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { BACKEND_URL } from '../../../config';

interface Client {
    client_id: number;
    client_name: string;
    address: string;
    client_email: string;
    client_fax: string;
    client_invoice_terms: string;
    client_contract_start: Date;
    client_contract_end: Date;
    client_terms: string;
    charge_rate_guarding: number;
    charge_rate_supervisor: number;
    vat: boolean;
    vat_registration_number: string;
    contact_person: string;
    contact_number: string;
}

interface ClientGroupForm {
    site_group_name: string;
    billable_guard_rate: string;
    billable_supervisor_rate: string;
    payable_guard_rate: string;
    payable_supervisor_rate: string;
}

interface ClientGroup {
    group_id: number;
    site_group_name: string;
    billable_guard_rate: number;
    billable_supervisor_rate: number;
    payable_guard_rate: number;
    payable_supervisor_rate: number;
}

const ClientDetailPage: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [groupData, setGroupData] = useState<ClientGroupForm>({ site_group_name: '', billable_guard_rate: '', billable_supervisor_rate: '', payable_guard_rate: '', payable_supervisor_rate: '' });
    const [siteGroups, setSiteGroups] = useState<ClientGroup[]>([]);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            if (!companyId) return;
            try {
                const clientResponse = await axios.get(`${BACKEND_URL}/api/clients/company/${companyId}/details/${clientId}`);
                setClient(clientResponse.data);
                const groupsResponse = await axios.get(`${BACKEND_URL}/api/clients/${clientId}/groups`);
                setSiteGroups(groupsResponse.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                setError('Failed to load data');
            }
        };

        fetchData();
    }, [clientId, companyId]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = event.target;
        const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
        const name = target.name;
    
        setGroupData(prev => ({
            ...prev,
            [name]: value
        }));
    };    

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const response = await axios.post(`${BACKEND_URL}/api/clients/${clientId}/groups`, groupData);
            console.log('Group added:', response.data);
            // Optionally reset form or give feedback
        } catch (error) {
            console.error('Error adding client group:', error);
            setError('Failed to add client group');
        }
    };

    return (
        <div className={`${theme === 'dark' ? 'bg-dark-background text-white' : 'bg-light-background text-gray-900'} min-h-screen`}>
            <Navbar />
            <TwoColumnLayout
                sidebarContent={<SideNavbar />}
                mainContent={
                    <div className="md:grid md:grid-cols-4 md:gap-2">
                        <Card className="md:col-span-3 p-6 shadow rounded-lg">
                            <h1 className="text-2xl font-bold">Client Details</h1>
                            {error ? <p>{error}</p> : (
                                <ViewAsTable
                                    data={client ? [
                                        { field: 'Client ID', value: client.client_id },
                                        { field: 'Client Name', value: client.client_name },
                                        { field: 'Email', value: client.client_email },
                                        { field: 'Address', value: client.address },
                                        { field: 'VAT Reg #', value: client.vat_registration_number || 'N/A' },
                                        { field: 'Fax', value: client.client_fax },
                                        { field: 'Contract Start Date', value: client.client_contract_start },
                                        { field: 'Contract End Date', value: client.client_contract_end },
                                        { field: 'Contact Person', value: client.contact_person },
                                        { field: 'Contact Number', value: client.contact_number },
                                    ] : []}
                                    columns={[
                                        { label: 'Field', accessor: 'field' },
                                        { label: 'Value', accessor: 'value' },
                                    ]}
                                />
                            )}
                        </Card>
                        <Card className="md:col-span-1 p-6 shadow rounded-lg flex flex-col justify-center items-center">
                            <form onSubmit={handleSubmit} className="w-full">
                                <h2 className="text-lg font-bold mb-4">Add Group</h2>
                                <InputField type="text" name="site_group_name" value={groupData.site_group_name} onChange={handleInputChange} label="Group Name" required />
                                <InputField type="number" name="billable_guard_rate" value={groupData.billable_guard_rate} onChange={handleInputChange} label="Site Group Rate (Guarding)" required />
                                <InputField type="number" name="billable_supervisor_rate" value={groupData.billable_supervisor_rate} onChange={handleInputChange} label="Site Group Rate (Supervisor)" required />
                                <InputField type="number" name="payable_guard_rate" value={groupData.payable_guard_rate} onChange={handleInputChange} label="Site Payable Rate (Guarding)" required />
                                <InputField type="number" name="payable_supervisor_rate" value={groupData.payable_supervisor_rate} onChange={handleInputChange} label="Site Payable Rate (Supervisor)" required />
                                <Button type="submit" size='small' icon='plus' color="submit" marginRight='5px' position='right'>Add Group</Button>
                            </form>
                        </Card>

                        <Card className="md:col-span-4 p-6 shadow rounded-lg">
                            <h2 className="text-lg font-bold mb-4">Site Groups</h2>
                            {siteGroups.length > 0 ? (
                                <ViewAsTable
                                    data={siteGroups.map(group => ({
                                        'Site Group Name': group.site_group_name,
                                        'Billable Guard Rate': group.billable_guard_rate,
                                        'Billable Supervisor Rate': group.billable_supervisor_rate,
                                        'Payable Guard Rate': group.payable_guard_rate,
                                        'Payable Supervisor Rate': group.payable_supervisor_rate,
                                    }))}
                                    columns={[
                                        { label: 'Site Group Name', accessor: 'Site Group Name' },
                                        { label: 'Billable Guard Rate', accessor: 'Billable Guard Rate' },
                                        { label: 'Billable Supervisor Rate', accessor: 'Billable Supervisor Rate' },
                                        { label: 'Payable Guard Rate', accessor: 'Payable Guard Rate' },
                                        { label: 'Payable Supervisor Rate', accessor: 'Payable Supervisor Rate' },
                                    ]}
                                />
                            ) : <p>No site groups available.</p>}
                        </Card>
                    
                    </div>
                }
            />
            <Footer />
        </div>
    );
};

export default ClientDetailPage;
