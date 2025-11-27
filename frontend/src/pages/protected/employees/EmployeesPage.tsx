import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useTheme } from '../../../context/ThemeContext';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Footer from '../../../components/Footer';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import { useAuth } from '../../../hooks/useAuth';
import Text from '../../../components/Text';
import Table from '../../../components/Table';
import Card from '../../../components/Card';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import { BACKEND_URL } from '../../../config';

interface Employee {
    id: number;
    email: string;
    applicant_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name?: string;
    full_name_display?: React.ReactNode;
    phone: string;
    role_offered: string;
    offered_on: string;
    signed_on: string;
    is_active: boolean;
    is_deleted: boolean;
    is_dormant: boolean;
    is_subcontractor_employee?: boolean;
    employee_photo?: string;
}

const EmployeesPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEmployees();
    }, [companyId]);

    const fetchEmployees = async () => {
        if (companyId) {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/${companyId}/employees`);
                const modifiedData = response.data.map((emp: Employee) => ({
                    ...emp,
                    // Render full name with subcontractor note if applicable
                    full_name_display: (
                        <div>
                            <div>
                                {`${emp.first_name} ${emp.middle_name ? emp.middle_name + ' ' : ''}${emp.last_name}`.trim()}
                            </div>
                            {emp.is_subcontractor_employee && (
                                <div style={{ fontSize: '0.75rem', color: 'gray' }}>
                                    Subcontractor Employee
                                </div>
                            )}
                        </div>
                    ),
                    actions: (
                        <div className="flex space-x-2">
                            <Button onClick={() => navigate(`/employees/details/${emp.applicant_id}`)} icon='edit' color='submit' size='small'></Button>
                            <Button onClick={() => deleteEmployee(emp.applicant_id)} color='delete' icon='trash' size='small'></Button>
                            <Button onClick={() => makeDormant(emp.applicant_id)} color='dormant' icon='dormant' size='small'></Button>
                        </div>
                    ),
                    isActiveDisplay: (
                        <Text
                            highlight={emp.is_active ? 'green' : 'red'}
                            newLine
                            className="text-center"
                        >
                            {emp.is_active ? 'Active' : 'Dormant'}
                        </Text>
                    ),
                    employeePhoto: emp.employee_photo ? (
                        <img 
                            src={`${BACKEND_URL}/uploads/employee-photos/${emp.employee_photo}`} 
                            alt="Employee" 
                            style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
                        />
                    ) : 'No photo',
                }));
                setEmployees(modifiedData);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch employees:", err);
                setError('Failed to load employees');
                setIsLoading(false);
            }
        }
    };    

    const deleteEmployee = async (applicantId: number) => {
        try {
            await axios.delete(`${BACKEND_URL}/api/employees/details/${applicantId}`);
            fetchEmployees();  // Refresh the list after deletion
        } catch (error) {
            console.error('Failed to delete employee:', error);
            setError('Failed to delete employee');
        }
    };

    const makeDormant = async (applicantId: number) => {
        try {
            await axios.patch(`${BACKEND_URL}/api/employees/${applicantId}/dormant`, { dormant: true });
            fetchEmployees();  // Refresh the list to reflect the change
        } catch (error) {
            console.error('Failed to make employee dormant:', error);
            setError('Failed to update employee status');
        }
    };

    const columns = useMemo(() => [
        { header: 'Photo', accessor: 'employeePhoto', isVisible: true },
        { header: 'Name', accessor: 'full_name_display', isVisible: true },
        { header: 'Email', accessor: 'email', isVisible: true },
        { header: 'Role', accessor: 'role_offered', isVisible: true },
        { header: 'Join Date', accessor: 'signed_on', isVisible: true },
        { header: 'Status', accessor: 'isActiveDisplay', isVisible: true },
        { header: 'Actions', accessor: 'actions', isVisible: true }
    ], []);

    const mainContent = (
        <Card className="max-w-full w-full p-6 space-y-4">
            <h1 className="text-xl font-bold mb-4">Active Employees</h1>
            {isLoading ? <Text>Loading employees...</Text> : error ? <Text>{error}</Text> : (
                <Table data={employees} columns={columns} />
            )}
        </Card>
    );

    return (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
            <Navbar />
            <div className='flex-grow'>
                <TwoColumnLayout
                    sidebarContent={<SideNavbar />}
                    mainContent={mainContent}
                />
            </div>
            <Footer />
        </div>
    );
};

export default EmployeesPage;
