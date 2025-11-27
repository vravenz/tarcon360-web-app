import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Card from '../../../components/Card';
import Text from '../../../components/Text';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import employeeFields from './data/employeeFields';  // Ensure this is the correct path to your employee fields
import { BACKEND_URL } from '../../../config';

interface EmployeeDetail {
    [key: string]: any;  // This allows for flexible indexing
}

const EmployeeDetailPage: React.FC = () => {
    const { theme } = useTheme();
    const { applicantId } = useParams<{ applicantId: string }>();
    const [employeeDetail, setEmployeeDetail] = useState<EmployeeDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployeeDetail = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/employees/details/${applicantId}`);
                setEmployeeDetail(response.data);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch employee detail:", err);
                setError('Failed to load employee detail');
                setIsLoading(false);
            }
        };
        fetchEmployeeDetail();
    }, [applicantId]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (employeeDetail) {
            try {
                const response = await axios.patch(`${BACKEND_URL}/api/employees/details/${applicantId}`, employeeDetail);
                console.log(response.data);
                // navigate('/some-success-page');
            } catch (err) {
                console.error("Failed to update employee detail:", err);
                setError('Failed to update employee detail');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEmployeeDetail(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className={`${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'} min-h-screen`}>
            <Navbar />
            <SideNavbar />
            <Card className="p-6">
                {isLoading ? (
                    <Text>Loading employee details...</Text>
                ) : error ? (
                    <Text>{error}</Text>
                ) : (
                    employeeDetail && (
                        <form onSubmit={handleUpdate}>
                            {employeeFields.map(field => (
                                <InputField 
                                    key={field.name}
                                    type={field.type}
                                    name={field.name}
                                    value={employeeDetail[field.name] || ''}
                                    onChange={handleChange}
                                    label={field.label}
                                    required={field.required}
                                    options={field.options}
                                />
                            ))}
                            <Button type="submit" color='submit' size='small'>Update</Button>
                        </form>
                    )
                )}
            </Card>
        </div>
    );
};

export default EmployeeDetailPage;
