import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Footer from '../../../components/Footer';
import Card from '../../../components/Card';
import Table from '../../../components/Table';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { BACKEND_URL } from '../../../config';

interface Employee {
    applicant_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    phone: string;
    is_subcontractor_employee?: boolean;
    employee_photo?: string;
}

interface Params extends Record<string, string | undefined> {
    groupId: string;
}

const AddGuardsToGroupPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const { groupId } = useParams<Params>();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [groupGuards, setGroupGuards] = useState<Employee[]>([]);
    const [selectedGuards, setSelectedGuards] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (companyId && groupId) {
            fetchEmployees();
            fetchGroupGuards();
        }
    }, [companyId, groupId]);

    const fetchEmployees = async () => {
        try {
            const allEmployeesResponse = await axios.get(`${BACKEND_URL}/api/${companyId}/employees`);
            const groupGuardsResponse = await axios.get(`${BACKEND_URL}/api/guard-groups/${groupId}/guards`);
            
            const allEmployees = allEmployeesResponse.data;
            const groupGuardIds = groupGuardsResponse.data.map((guard: { applicant_id: number }) => guard.applicant_id);

            // Filter out employees already in the group
            const filteredEmployees = allEmployees.filter((employee: Employee) => !groupGuardIds.includes(employee.applicant_id));

            setEmployees(filteredEmployees);
        } catch (error) {
            console.error('Failed to fetch employees or guards in group:', error);
        }
    };

    const fetchGroupGuards = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/guard-groups/${groupId}/guards`);
            setGroupGuards(response.data);
        } catch (error) {
            console.error('Failed to fetch guards in group:', error);
        }
    };

    const handleSelectGuard = (applicantId: number) => {
        setSelectedGuards((prev) =>
            prev.includes(applicantId)
                ? prev.filter((id) => id !== applicantId)
                : [...prev, applicantId]
        );
    };

    const handleAddGuards = async () => {
        if (selectedGuards.length === 0) {
            setMessage('Please select at least one guard to add.');
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            await axios.post(`${BACKEND_URL}/api/guard-groups/add-guards`, {
                group_id: Number(groupId),
                applicant_ids: selectedGuards,
            });
            setMessage('Guards added successfully!');
            setSelectedGuards([]);
            fetchEmployees(); // Refresh available employees
            fetchGroupGuards(); // Refresh group guards
            setIsModalOpen(false); // Close modal after success
        } catch (error) {
            console.error('Failed to add guards:', error);
            setMessage('Failed to add guards to the group.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveGuard = async (applicantId: number) => {
        try {
            await axios.delete(`${BACKEND_URL}/api/guard-groups/remove-guard`, {
                data: { group_id: Number(groupId), applicant_id: applicantId },
            });
            setMessage('Guard removed successfully!');
            fetchGroupGuards(); // Refresh group guards after removal
            fetchEmployees(); // Refresh available employees
        } catch (error) {
            console.error('Failed to remove guard:', error);
            setMessage('Failed to remove guard from the group.');
        }
    };

    const tableActions = (employee: Employee) => (
        <input
            type="checkbox"
            checked={selectedGuards.includes(employee.applicant_id)}
            onChange={() => handleSelectGuard(employee.applicant_id)}
        />
    );

    const groupGuardActions = (guard: Employee) => (
        <Button onClick={() => handleRemoveGuard(guard.applicant_id)} color="delete" size="small">
            Remove
        </Button>
    );

    const openModal = () => {
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
    };

    const columns = useMemo(() => [
        { header: 'Photo', accessor: 'employeePhoto', isVisible: true },
        { header: 'Name', accessor: 'name', isVisible: true },
        { header: 'Email', accessor: 'email', isVisible: true },
        { header: 'Phone', accessor: 'phone', isVisible: true },
        { header: 'Select', accessor: 'select', isVisible: true },
    ], []);

    const groupGuardsColumns = useMemo(() => [
        { header: 'Photo', accessor: 'employeePhoto', isVisible: true },
        { header: 'Name', accessor: 'name', isVisible: true },
        { header: 'Email', accessor: 'email', isVisible: true },
        { header: 'Phone', accessor: 'phone', isVisible: true },
        {
            header: 'Actions',
            accessor: 'actions',
            isVisible: true,
            render: groupGuardActions,
        },
    ], []);

    const extendedEmployees = useMemo(() => {
        return employees.map((employee) => ({
            ...employee,
            employeePhoto: employee.employee_photo ? (
                <img 
                    src={`${BACKEND_URL}/uploads/employee-photos/${employee.employee_photo}`} 
                    alt="Employee" 
                    style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
                />
            ) : 'No photo',
            name: (
                <div>
                    {`${employee.first_name} ${employee.middle_name ? employee.middle_name + ' ' : ''}${employee.last_name}`.trim()}
                    {employee.is_subcontractor_employee && (
                        <div style={{ fontSize: '0.75rem', color: 'gray' }}>
                            Subcontractor Employee
                        </div>
                    )}
                </div>
            ),
            select: tableActions(employee),
        }));
    }, [employees, selectedGuards]);

    const extendedGroupGuards = useMemo(() => {
        return groupGuards.map((guard: Employee) => ({
            ...guard,
            employeePhoto: guard.employee_photo ? (
                <img 
                    src={`${BACKEND_URL}/uploads/employee-photos/${guard.employee_photo}`} 
                    alt="Employee" 
                    style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
                />
            ) : 'No photo',
            name: (
                <div>
                    {`${guard.first_name} ${guard.middle_name ? guard.middle_name + ' ' : ''}${guard.last_name}`.trim()}
                    {guard.is_subcontractor_employee && (
                        <div style={{ fontSize: '0.75rem', color: 'gray' }}>
                            Subcontractor Employee
                        </div>
                    )}
                </div>
            ),
            actions: groupGuardActions(guard),
        }));
    }, [groupGuards]);

    const mainContent = (
        <Card className="max-w-full w-full p-6 space-y-4">
            <h1 className="text-xl font-bold mb-4">Guard Group Management</h1>
            <Table data={extendedGroupGuards} columns={groupGuardsColumns} />
            <Button onClick={openModal} icon='plus' color="submit" size="small">
            </Button>
        </Card>
    );

    const modalContent = (
        <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">Select Guards to Add</h2>
            <Table data={extendedEmployees} columns={columns} />
            <Button onClick={handleAddGuards} disabled={isLoading} color="submit" size="small">
                {isLoading ? 'Adding...' : 'Add'}
            </Button>
        </div>
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
            <Modal isOpen={isModalOpen} onClose={closeModal} size="xl">
                {modalContent}
            </Modal>
            <Footer />
        </div>
    );
};

export default AddGuardsToGroupPage;
