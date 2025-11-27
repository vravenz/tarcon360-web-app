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
    phone: string;
    role_offered: string;
    offered_on: string;
    signed_on: string;
    is_active: boolean;
    is_deleted: boolean;
    employee_photo?: string;
}

const DeletedEmployeesPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDeletedEmployees();
    }, [companyId]);

    const fetchDeletedEmployees = async () => {
        if (companyId) {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/${companyId}/deleted-employees`);
                const modifiedData = response.data.map((emp: Employee) => ({
                    ...emp,
                    full_name: `${emp.first_name} ${emp.middle_name ? emp.middle_name + ' ' : ''}${emp.last_name}`.trim(),
                    actions: (
                        <Button color='submit' icon='undo' size='small' onClick={() => restoreEmployee(emp.applicant_id)}></Button>
                    ),
                    isActiveDisplay: (
                        <Text highlight='red' newLine className="text-center">
                            Deleted
                        </Text>
                    ),
                    employeePhoto: emp.employee_photo ? <img src={`${BACKEND_URL}/uploads/employee-photos/${emp.employee_photo}`} alt="Employee" style={{ width: '50px', height: '50px', borderRadius: '50%' }} /> : 'No photo',
                }));
                setEmployees(modifiedData);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch deleted employees:", err);
                setError('Failed to load deleted employees');
                setIsLoading(false);
            }
        }
    };

    const restoreEmployee = async (applicantId: number) => {
        try {
            await axios.patch(`${BACKEND_URL}/api/employees/restore/${applicantId}`);
            fetchDeletedEmployees();  // Refresh the list to reflect the change
        } catch (error) {
            console.error('Failed to restore employee:', error);
            setError('Failed to restore employee');
        }
    };

    const columns = useMemo(() => [
        { header: 'Photo', accessor: 'employeePhoto', isVisible: true },
        { header: 'Name', accessor: 'full_name', isVisible: true },
        { header: 'Email', accessor: 'email', isVisible: true },
        { header: 'Role Offered', accessor: 'role_offered', isVisible: true },
        { header: 'Offered On', accessor: 'offered_on', isVisible: true },
        { header: 'Signed On', accessor: 'signed_on', isVisible: true },
        { header: 'Actions', accessor: 'actions', isVisible: true }
    ], []);

    const mainContent = (
        <Card className="max-w-full w-full p-6 space-y-4">
            <h1 className="text-xl font-bold mb-4">Deleted Employees</h1>
            {isLoading ? <Text>Loading deleted employees...</Text> : error ? <Text>{error}</Text> : (
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

export default DeletedEmployeesPage;
