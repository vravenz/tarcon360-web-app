import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import Footer from '../../../components/Footer';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { BACKEND_URL } from '../../../config';
import AddSubcontractorForm from './AddSubcontractorForm';

interface Subcontractor {
    id: number;
    company_name: string;
    email: string;
    contact_person: string;
}

interface EmployeeRequest {
    employee_request_count: number; // Updated field name
    start_date: string;
    end_date: string | null;
    is_ongoing: boolean;
    location: string;
    pay_rate: number;
}

const SubcontractorSearchPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const [email, setEmail] = useState<string>('');
    const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
    const [employeeRequests, setEmployeeRequests] = useState<string>(''); // Updated field name in state
    const [contractDescription, setContractDescription] = useState<string>('');
    const [payRate, setPayRate] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isOngoing, setIsOngoing] = useState<boolean>(false);
    const [location, setLocation] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    const handleSearch = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/subcontractors/search?email=${email}`);
            if (response.data) {
                setSubcontractor({
                    id: response.data.company_id,
                    company_name: response.data.company_name,
                    email: response.data.email,
                    contact_person: response.data.contact_person
                });
                setMessage('');
            } else {
                setMessage('Subcontractor not found');
                setSubcontractor(null);
            }
        } catch (error) {
            console.error('Error searching subcontractor:', error);
            setMessage('Subcontractor not found');
            setSubcontractor(null);
        }
    };

    const handleRequestEmployees = async () => {
        if (!subcontractor || !companyId || !employeeRequests || !payRate || !startDate || (isOngoing ? false : !endDate) || !location) {
            setMessage('Please ensure all fields are filled correctly.');
            return;
        }

        const employeeRequest: EmployeeRequest = {
            employee_request_count: parseInt(employeeRequests, 10), // Updated field name
            start_date: startDate,
            end_date: isOngoing ? null : endDate,
            is_ongoing: isOngoing,
            location: location,
            pay_rate: parseFloat(payRate)
        };

        const dataToSend = {
            main_company_id: companyId,
            subcontractor_company_id: subcontractor.id,
            contract_description: contractDescription,
            employee_requests: [employeeRequest] // Array of request objects
        };

        try {
            const response = await axios.post(`${BACKEND_URL}/api/subcontractors/request`, dataToSend);
            if (response.status === 201) {
                setMessage('Request sent successfully');
            }
        } catch (error) {
            console.error('Error sending request:', error);
            setMessage('Failed to send request. Please check the input data.');
        }
    };

    return (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
            <Navbar />
            <div className='flex-grow'>
            <TwoColumnLayout
                sidebarContent={<SideNavbar />}
                mainContent={
                    <Card className="max-w-full w-full p-6 space-y-4">
                        <h1 className="text-2xl font-bold mb-4">Search for Subcontractor</h1>
                        <InputField
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            label="Subcontractor Email"
                            required
                        />
                        <Button onClick={handleSearch} icon='search' color="submit" size='small'></Button>
                        {subcontractor && (
                            <>
                                <p>{`Subcontractor: ${subcontractor.company_name}`}</p>
                                <InputField
                                    type="number"
                                    name="employeeRequests"
                                    value={employeeRequests}
                                    onChange={(e) => setEmployeeRequests(e.target.value)}
                                    label="Number of Employees Needed"
                                    required
                                />
                                <InputField
                                    type="text"
                                    name="contractDescription"
                                    value={contractDescription}
                                    onChange={(e) => setContractDescription(e.target.value)}
                                    label="Contract Description"
                                    required
                                />
                                <InputField
                                    type="number"
                                    name="payRate"
                                    value={payRate}
                                    onChange={(e) => setPayRate(e.target.value)}
                                    label="Pay Rate"
                                    required
                                />
                                <InputField
                                    type="date"
                                    name="startDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    label="Start Date"
                                    required
                                />
                                {!isOngoing && (
                                    <InputField
                                        type="date"
                                        name="endDate"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        label="End Date"
                                        required={!isOngoing}
                                    />
                                )}
                                <InputField
                                    type="text"
                                    name="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    label="Location"
                                    required
                                />
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isOngoing"
                                        checked={isOngoing}
                                        onChange={() => {
                                            setIsOngoing(!isOngoing);
                                            if (!isOngoing) setEndDate('');
                                        }}
                                    />
                                    <label htmlFor="isOngoing" className="ml-2">Ongoing Contract</label>
                                </div>
                                <Button onClick={handleRequestEmployees} color="submit" size='small' marginRight='5px' icon='send'>Send Request</Button>
                            </>
                        )}
                        {message && <p>{message}</p>}

                          {/* --- CREATE NEW SUBCONTRACTOR --- */}
                        <AddSubcontractorForm />
                    </Card>
                }
            />
            </div>
            <Footer />
        </div>
    );
};

export default SubcontractorSearchPage;
