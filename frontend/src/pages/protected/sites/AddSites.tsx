import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Footer from '../../../components/Footer';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SiteLocationPicker from './SiteLocationPicker';
import { BACKEND_URL } from '../../../config';

interface Client {
    client_id: string;
    client_name: string;
}

interface Group {
  group_id: string;
  site_group_name: string;

  billable_guard_rate?: string | number | null;
  billable_supervisor_rate?: string | number | null;
  payable_guard_rate?: string | number | null;
  payable_supervisor_rate?: string | number | null;
}


interface SiteForm {
    client_id: string;
    group_id: string;
    site_name: string;
    contact_person?: string;
    contact_number?: string;
    site_address: string;   
    post_code: string; 
    weekly_contracted_hours: number;
    trained_guards_required: boolean;
    site_billable_rate_guarding: number;
    site_billable_rate_supervisor: number;
    site_payable_rate_guarding: number;
    site_payable_rate_supervisor: number;
    site_note: string;
    company_id: number;
    is_mobile_allowed: boolean;
    site_latitude?: number;
    site_longitude?: number;
    site_radius?: number;
}

const toNum = (v: unknown, fallback = 0) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
};

const AddSitePage: React.FC = () => {
    const { companyId } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [clients, setClients] = useState<Client[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [formData, setFormData] = useState<SiteForm>({
        client_id: '',
        group_id: '',
        site_name: '',
        contact_person: '',
        contact_number: '',
        site_address: '',   
        post_code: '', 
        weekly_contracted_hours: 0,
        trained_guards_required: false,
        site_billable_rate_guarding: 0,
        site_billable_rate_supervisor: 0,
        site_payable_rate_guarding: 0,
        site_payable_rate_supervisor: 0,
        site_note: '',
        company_id: 0,
        is_mobile_allowed: false,
        site_latitude: 24.8607,
        site_longitude: 67.0011,
        site_radius: 100
    });
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        if (companyId) {
            setFormData(currentFormData => ({ ...currentFormData, company_id: companyId }));

            const fetchClients = async () => {
                try {
                    const { data } = await axios.get(`${BACKEND_URL}/api/clients/company/${companyId}`);
                    setClients(data);
                } catch (error) {
                    console.error('Error fetching clients:', error);
                }
            };
            fetchClients();
        }
    }, [companyId]);

    const handleClientChange = async (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const client_id = (event.target as HTMLSelectElement).value;
        setFormData(prev => ({
            ...prev,
            client_id,
            group_id: '' // Reset group_id when changing clients
        }));
    
        try {
            const { data } = await axios.get(`${BACKEND_URL}/api/clients/${client_id}/groups`);
            setGroups(data);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setGroups([]);
        }
    };

    const handleGroupChange = (
    event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>
    ) => {
    const group_id = (event.target as HTMLSelectElement).value;

    const selected = groups.find(g => String(g.group_id) === String(group_id));

    setFormData(prev => ({
        ...prev,
        group_id,

        // ✅ Copy group rates into site form fields
        site_billable_rate_guarding: selected ? toNum(selected.billable_guard_rate, prev.site_billable_rate_guarding) : prev.site_billable_rate_guarding,
        site_payable_rate_guarding: selected ? toNum(selected.payable_guard_rate, prev.site_payable_rate_guarding) : prev.site_payable_rate_guarding,

        site_billable_rate_supervisor: selected ? toNum(selected.billable_supervisor_rate, prev.site_billable_rate_supervisor) : prev.site_billable_rate_supervisor,
        site_payable_rate_supervisor: selected ? toNum(selected.payable_supervisor_rate, prev.site_payable_rate_supervisor) : prev.site_payable_rate_supervisor,
    }));
    };

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
      ) => {
        const target = event.target as HTMLInputElement;    
        const { name, value, type } = target;
      
        let parsed: string | number | boolean = value;
      
        if (type === 'checkbox') {
          parsed = target.checked;         
        } else if (type === 'number') {
          parsed = Number(value);               
        }
      
        setFormData(prev => ({
          ...prev,
          [name]: parsed,
        }));
      };      

    const handleMobileChange = (
        event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>
      ) => {
        const value = (event.target as HTMLSelectElement).value;
        setFormData((prev) => ({
          ...prev,
          is_mobile_allowed: value === 'yes',
        }));
      };

    // Callback to get location data from SiteLocationPicker
    const handleLocationChange = (latitude: number, longitude: number, radius: number) => {
        setFormData(prev => ({
        ...prev,
        site_latitude: latitude,
        site_longitude: longitude,
        site_radius: radius,
        }));
    };    

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!formData.company_id) {
            setMessage('Company ID is not set. Please re-login or contact support.');
            return;
        }
        try {
            const response = await axios.post(`${BACKEND_URL}/api/sites`, formData);
            if (response.status === 201) {
                setMessage('Site added successfully!');
                navigate('/sites');
            }
        } catch (error) {
            console.error('Failed to add site:', error);
            setMessage('Failed to add site. Please check the input data.');
        }
    };

    return (
        <div className={`${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'} min-h-screen`}>
            <Navbar />
        <TwoColumnLayout
            sidebarContent={<SideNavbar />}
            mainContent={
                <div className={`${theme === 'dark' ? 'text-dark-text' : 'text-light-text'}`}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {/* Card 1: Contains most input fields */}
                            <Card className="md:col-span-2 p-6 space-y-4">
                                <h1 className="text-2xl font-bold mb-4">Add Sites</h1>
                                <InputField type="text" name="site_name" value={formData.site_name} onChange={handleChange} label="Site Name" required />
                                <InputField type="text" name="contact_person" value={formData.contact_person ?? ""} onChange={handleChange} label="Contact Person" />
                                <InputField type="text" name="contact_number" value={formData.contact_number ?? ""} onChange={handleChange} label="Contact Number" />
                                <InputField type="text" name="site_address" value={formData.site_address} onChange={handleChange} label="Site Address" required />
                                <InputField type="text" name="post_code" value={formData.post_code} onChange={handleChange} label="Post Code" required />
                                <InputField type="number" name="weekly_contracted_hours" value={formData.weekly_contracted_hours} onChange={handleChange} label="Weekly Contracted Hours" required />
                                <InputField type="textarea" name="site_note" value={formData.site_note} onChange={handleChange} label="Site Note" />
                                <InputField
                                    type="select"
                                    name="is_mobile_allowed"
                                    value={formData.is_mobile_allowed ? 'yes' : 'no'}
                                    onChange={handleMobileChange}
                                    label="Is Mobile Allowed?"
                                    options={[
                                        { label: 'Yes', value: 'yes' },
                                        { label: 'No', value: 'no' }
                                    ]}
                                    required
                                />
                                <InputField type="checkbox" name="trained_guards_required" value={formData.trained_guards_required} onChange={handleChange} label="Trained Guards Required" />
                            </Card>

                            {/* Right Column: Container for Card 2 and Card 3 and 4 stacked vertically */}
                            <div className="flex flex-col space-y-2">
                                {/* Card 2 */}
                                 <Card className="p-6 space-y-4">
                                 <h1 className="text-lg font-bold mb-4 text-sky-600">Client</h1>
                                 <InputField 
                                    type="select" 
                                    name="client_id" 
                                    value={formData.client_id} 
                                    onChange={handleClientChange} 
                                    label="Select Client" 
                                    options={clients.map(client => ({ label: client.client_name, value: client.client_id }))} 
                                    required 
                                />
                                <InputField 
                                    type="select" 
                                    name="group_id" 
                                    value={formData.group_id} 
                                    onChange={handleGroupChange} 
                                    label="Select Site Group" 
                                    options={groups.map(group => ({ label: group.site_group_name, value: group.group_id }))} 
                                    required 
                                />
                                </Card>
                                {/* Card 3 */}
                                <Card className="p-6 space-y-4">
                                <h1 className="text-lg font-bold mb-4 text-green-600">Guard</h1>
                                    <InputField 
                                        type="number" 
                                        name="site_billable_rate_guarding" 
                                        value={formData.site_billable_rate_guarding} 
                                        onChange={handleChange} 
                                        label="Billable Rate Guarding" 
                                        required 
                                    />
                                    <InputField 
                                        type="number" 
                                        name="site_payable_rate_guarding" 
                                        value={formData.site_payable_rate_guarding} 
                                        onChange={handleChange} 
                                        label="Payable Rate Guarding" 
                                        required 
                                    />
                                </Card>
                                {/* Card 4 */}
                                <Card className="p-6 space-y-4">
                                <h1 className="text-lg font-bold mb-4 text-red-600">Supervisor</h1>
                                    <InputField 
                                        type="number" 
                                        name="site_billable_rate_supervisor" 
                                        value={formData.site_billable_rate_supervisor} 
                                        onChange={handleChange} 
                                        label="Billable Rate Supervisor" 
                                        required 
                                    />
                                    <InputField 
                                        type="number" 
                                        name="site_payable_rate_supervisor" 
                                        value={formData.site_payable_rate_supervisor} 
                                        onChange={handleChange} 
                                        label="Payable Rate Supervisor" 
                                        required 
                                    />
                                </Card>

                                {/* If mobile is allowed, show the site location picker */}
                                <Card className="p-6 mt-4">
                                <h2 className="text-xl font-bold mb-4">Site Location</h2>
                                <SiteLocationPicker onLocationChange={handleLocationChange} />
                                </Card>


                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" color="submit" icon='plus' size='small' marginRight='4px'>Save</Button>
                        </div>
                    </form>
                    {message && <p className="text-red-500">{message}</p>}
                </div>
            }
        />
        <Footer />
    </div>
    );
};

export default AddSitePage;
