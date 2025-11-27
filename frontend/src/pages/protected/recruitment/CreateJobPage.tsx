import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Card from '../../../components/Card';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Footer from '../../../components/Footer';
import { isAdmin, isSuperAdmin } from '../../../utils/checkRole';
import { useAuth } from '../../../hooks/useAuth';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { BACKEND_URL } from '../../../config';

type FormData = {
    title: string;
    description: string;
    location: string;
    start_date: Date | null;
    end_date: Date | null;
    is_ongoing: boolean;
    company_id: number;
};

const CreateJobPage: React.FC = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { companyId } = useAuth();

    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        location: '',
        start_date: new Date(),
        end_date: new Date(),
        is_ongoing: false,
        company_id: companyId || 0
    });

    useEffect(() => {
        if (!isSuperAdmin() && !isAdmin()) {
            console.log('Redirecting non-admin and non-super-admin users');
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, company_id: companyId || 0 }));
    }, [companyId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleDateChange = (field: string, date: Date | null) => {
        setFormData({
            ...formData,
            [field]: date
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const response = await fetch(`${BACKEND_URL}/api/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        if (response.ok) {
            const result = await response.json();
            console.log(result);
            navigate('/recruitment');
        } else {
            console.error('Failed to create job');
        }
    };

    const pageContent = (
        <Card className="max-w-full w-full p-6 space-y-4">
            <h1 className="text-xl font-bold mb-4">Create Job</h1>
            <form onSubmit={handleSubmit}>
                <InputField type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" required />
                <InputField type="textarea" name="description" value={formData.description} onChange={handleChange} placeholder="Job Description" required />
                <InputField type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Location" required />

                {/* Date Picker for start date */}
                <DatePicker
                    selected={formData.start_date}
                    onChange={(date: Date | null) => handleDateChange('start_date', date)}
                    dateFormat="MMMM d, yyyy"
                    placeholderText="Start Date"
                    className={`p-2 border mb-1 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-dark-background text-dark-text border-dark-border' : 'bg-light-background text-light-text border-light-border'}`}
                />
                {!formData.is_ongoing && (
                    <DatePicker
                        selected={formData.end_date}
                        onChange={(date: Date | null) => handleDateChange('end_date', date)}
                        dateFormat="MMMM d, yyyy"
                        placeholderText="End Date"
                        className={`p-2 border mb-1 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-dark-background text-dark-text border-dark-border' : 'bg-light-background text-light-text border-light-border'}`}
                    />
                )}

                <div>
                    <input
                        type="checkbox"
                        name="is_ongoing"
                        checked={formData.is_ongoing}
                        onChange={(e) => {
                            setFormData({
                                ...formData,
                                is_ongoing: e.target.checked,
                                end_date: e.target.checked ? null : formData.end_date
                            });
                        }}
                    />
                    <label htmlFor="is_ongoing"> Is Ongoing</label>
                </div>
                <Button className='mt-3' size="small" type="submit" color="submit">Create Job</Button>
            </form>
        </Card>
    );

    return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'}`}>
      <Navbar />
        <div className="flex-grow">
            <TwoColumnLayout sidebarContent={<SideNavbar />} mainContent={pageContent} />
        </div>
      <Footer />
    </div>
    );
};

export default CreateJobPage;
