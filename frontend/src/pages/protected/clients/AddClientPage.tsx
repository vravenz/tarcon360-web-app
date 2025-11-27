import React, { useState, ChangeEvent } from 'react';
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
import { BACKEND_URL } from '../../../config';

interface ClientForm {
  client_name: string;
  address: string;
  contact_person: string;
  contact_number: string;
  client_email: string;
  client_fax: string;
  client_invoice_terms: string;
  client_contract_start: string;
  client_contract_end: string;
  charge_rate_guarding: string;
  charge_rate_supervisor: string;
  vat: boolean;
  vat_registration_number: string;
  company_id: string;
}

type InputFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'email' 
  | 'password' 
  | 'select' 
  | 'checkbox' 
  | 'date' 
  | 'file' 
  | 'radio';

const AddClientPage: React.FC = () => {
  const { theme } = useTheme();
  const { companyId } = useAuth();
  const navigate = useNavigate();

  // Define field configurations for each card
  const fieldsCard1 = [
    { name: 'client_name', label: 'Client Name', type: 'text' as InputFieldType },
    { name: 'contact_person', label: 'Contact Person', type: 'text' as InputFieldType },
    { name: 'contact_number', label: 'Contact Number', type: 'text' as InputFieldType },
    { name: 'client_email', label: 'Client Email', type: 'email' as InputFieldType },
    { name: 'client_fax', label: 'Client Fax', type: 'text' as InputFieldType },
    { name: 'address', label: 'Address', type: 'textarea' as InputFieldType },
    { name: 'vat', label: 'VAT Applicable', type: 'checkbox' as InputFieldType }
  ];

  const fieldsCard2 = [
    { name: 'charge_rate_guarding', label: 'Charge Rate Guarding', type: 'number' as InputFieldType },
    { name: 'charge_rate_supervisor', label: 'Charge Rate Supervisor', type: 'number' as InputFieldType }
  ];

  const fieldsCard3 = [
    { name: 'client_contract_start', label: 'Contract Start Date', type: 'date' as InputFieldType },
    { name: 'client_contract_end', label: 'Contract End Date', type: 'date' as InputFieldType }
  ];

  const fieldsCard4 = [
      { name: 'client_invoice_terms', label: 'Invoice Terms', type: 'text' as InputFieldType },
      { name: 'client_terms', label: 'Client Terms', type: 'textarea' as InputFieldType }
    ];

  const [formData, setFormData] = useState<ClientForm>({
    client_name: '',
    address: '',
    contact_person: '',
    contact_number: '',
    client_email: '',
    client_fax: '',
    client_invoice_terms: '',
    client_contract_start: '',
    client_contract_end: '',
    charge_rate_guarding: '',
    charge_rate_supervisor: '',
    vat: false,
    vat_registration_number: '',
    company_id: companyId ? companyId.toString() : ''
  });

  const [message, setMessage] = useState<string>('');

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    const name = target.name;

    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId) {
      setMessage("Invalid company ID. Please login again.");
      return;
    }
    try {
      const response = await axios.post(`${BACKEND_URL}/api/clients`, { ...formData, company_id: companyId });
      if (response.status === 201) {
        setMessage('Client added successfully!');
        navigate('/clients');
      }
    } catch (error) {
      console.error('Failed to add client:', error);
      setMessage('Failed to add client. Please check the input data.');
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'} min-h-screen`}>
      <Navbar />
      <TwoColumnLayout
        sidebarContent={<SideNavbar />}
        mainContent={
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1 */}
                <Card className="md:col-span-2 p-6 space-y-4">
                  <h1 className="text-xl font-bold">Add New Client</h1>
                  {fieldsCard1.map(field => (
                    <InputField
                      key={field.name}
                      type={field.type}
                      name={field.name}
                      value={formData[field.name as keyof ClientForm] as string | boolean}
                      onChange={handleChange}
                      label={field.label}
                      required
                    />
                  ))}
                  {formData.vat && (
                    <InputField
                      type="text"
                      name="vat_registration_number"
                      value={formData.vat_registration_number}
                      onChange={handleChange}
                      label="VAT Registration Number"
                      required
                    />
                  )}
                </Card>

                {/* Right Column: Cards 2 and 3 stacked vertically */}
                <div className="flex flex-col space-y-4">
                  {/* Card 2 */}
                  <Card className="p-6 space-y-4">
                    {fieldsCard2.map(field => (
                      <InputField
                        key={field.name}
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof ClientForm]}
                        onChange={handleChange}
                        label={field.label}
                        required
                      />
                    ))}
                  </Card>

                  {/* Card 3 */}
                  <Card className="p-6 space-y-4">
                    {fieldsCard3.map(field => (
                      <InputField
                        key={field.name}
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof ClientForm]}
                        onChange={handleChange}
                        label={field.label}
                        required
                      />
                    ))}
                  </Card>

                  {/* Card 4 */}
                  <Card className="p-6 space-y-4">
                    {fieldsCard4.map(field => (
                      <InputField
                        key={field.name}
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof ClientForm]}
                        onChange={handleChange}
                        label={field.label}
                        required
                      />
                    ))}
                  </Card>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" color="submit" icon="plus" marginRight='5px' size="small">Submit</Button>
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

export default AddClientPage;
