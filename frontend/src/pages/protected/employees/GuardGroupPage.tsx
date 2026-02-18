import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import { useTheme } from '../../../context/ThemeContext';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Footer from '../../../components/Footer';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import InputField from '../../../components/InputField';
import { useAuth } from '../../../hooks/useAuth';
import Table from '../../../components/Table';
import { BACKEND_URL } from '../../../config';

interface Branch {
    branch_id: number;
    branch_name: string;
}

interface GuardGroup {
    group_id: number;
    group_name: string;
    branch_name: string;
    created_by: string;
    created_at: string;
}

const GuardGroupPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId, userId } = useAuth();
    const navigate = useNavigate(); // Initialize useNavigate
    const [branches, setBranches] = useState<Branch[]>([]);
    const [groupName, setGroupName] = useState('');
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [guardGroups, setGuardGroups] = useState<GuardGroup[]>([]);

    // Fetch branches on component load
    useEffect(() => {
        fetchBranches();
        fetchGuardGroups();
    }, [companyId]);

    const fetchBranches = async () => {
        if (companyId) {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/branches`);
                setBranches(response.data);
            } catch (error) {
                console.error('Failed to fetch branches:', error);
                setErrorMessage('Failed to load branches.');
            }
        }
    };

    const fetchGuardGroups = async () => {
        if (companyId) {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/guard-groups/${companyId}`);
                setGuardGroups(response.data);
            } catch (error) {
                console.error('Failed to fetch guard groups:', error);
                setErrorMessage('Failed to load guard groups.');
            }
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName || !selectedBranch || !userId) {
            setErrorMessage('Please provide a group name, select a branch, and ensure you are logged in.');
            return;
        }

        setIsLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            await axios.post(`${BACKEND_URL}/api/guard-groups`, {
                group_name: groupName,
                branch_id: selectedBranch,
                company_id: companyId,
                created_by: userId,
            });
            setSuccessMessage('Guard group created successfully!');
            setGroupName('');
            setSelectedBranch(null);
            fetchGuardGroups(); // Reload guard groups after creation
        } catch (error) {
            console.error('Failed to create guard group:', error);
            setErrorMessage('Failed to create guard group.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddGuard = (groupId: number) => {
        navigate(`/guard-groups/${groupId}/add-guards`); // Redirect to the Add Guard page
    };

    const tableActions = (group: GuardGroup) => (
        <Button onClick={() => handleAddGuard(group.group_id)} color="submit" icon='employee' size="small">
        </Button>
    );

    const columns = useMemo(() => [
        { header: 'Group Name', accessor: 'group_name', isVisible: true },
        { header: 'Branch Name', accessor: 'branch_name', isVisible: true },
        { header: 'Created By', accessor: 'created_by', isVisible: true },
        { header: 'Created At', accessor: 'created_at', isVisible: true },
        { header: 'Actions', accessor: 'actions', isVisible: true },
    ], []);
    
    const extendedGuardGroups = guardGroups.map((group) => ({
        ...group,
        actions: tableActions(group),
    }));

    const mainContent = (
        <Card className="max-w-full w-full p-6 space-y-4">
            <h1 className="text-xl font-bold mb-4">Guard Groups</h1>
            {errorMessage && <Text highlight="red">{errorMessage}</Text>}
            {successMessage && <Text highlight="green">{successMessage}</Text>}
            <div className="space-y-4">
                <InputField
                    type="text"
                    name="groupName"
                    label="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    required
                />
                <InputField
                    type="select"
                    name="branch"
                    label="Branch"
                    value={selectedBranch ?? ''}
                    onChange={(e) => setSelectedBranch(Number(e.target.value))}
                    options={[
                        { value: '', label: 'Select a branch' },
                        ...branches.map((branch) => ({
                            value: branch.branch_id,
                            label: branch.branch_name,
                        })),
                    ]}
                    placeholder="Select a branch"
                    required
                />
                <Button onClick={handleCreateGroup} disabled={isLoading} color="submit" size="small">
                    {isLoading ? 'Creating...' : 'Create Group'}
                </Button>
            </div>
            <Table data={extendedGuardGroups} columns={columns} />
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

export default GuardGroupPage;
