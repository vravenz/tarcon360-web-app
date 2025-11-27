// File: src/pages/EditRosterShiftPage.tsx

import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import InputField from '../../../components/InputField';
import Footer from '../../../components/Footer';
import Button from '../../../components/Button';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';

// Custom hooks for form and data fetching.
import { useRoasterFormData } from './formData/useRoasterFormData';
import { useFetchClients } from './useFetchClients';
import { useFetchSites } from './useFetchSites';
import { useExtendedFields } from './useExtendedFields';
import { useFetchGuardGroups } from './useFetchGuardGroups';
import { useFetchEmployees } from './useFetchEmployees';

// Components for employee selection and shift display.
import EmployeeDropdown from '../../../components/EmployeeDropdown';
import ShiftsComponent from '../../../components/ShiftsComponent';
import { BACKEND_URL } from '../../../config';

// Define interfaces for our entities.
interface Employee {
  applicant_id: number | null;
  // roster_employee_id is from roster_employees table.
  roster_employee_id?: number;
  first_name?: string;
  last_name?: string;
  employee_photo?: string | null;
  is_subcontractor_employee?: boolean;
  subcontractor_company_id?: number | null;
  subcontractor_company_name?: string;
}

interface Roster {
  roster_id: number;
  company_id: number;
  site_id: number;
  po_number?: string | null;
  client_name: string;
  site_name: string;
}

interface RosterShift {
  roster_shift_id: number;
  roster_id: number;
  shift_date: string; // "YYYY-MM-DD"
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  break_time?: string | null;
  shift_status?: 'confirmed' | 'unconfirmed' | 'unassigned';
  penalty?: number | null;
  comments?: string | null;
  shift_instruction?: string | null;
  payable_rate_type?: string | null;
  payable_role?: string | null;
  payable_amount?: number | null;
  billable_role?: string | null;
  billable_amount?: number | null;
  payable_expenses?: number | null;
  billable_expenses?: number | null;
  unpaid_shift?: boolean;
  training_shift?: boolean;
}

interface RosterShiftAssignment {
  roster_shift_assignment_id: number;
  company_id: number;
  roster_shift_id: number;
  roster_employee_id: number;
  assignment_start_time?: string | null;
  assignment_end_time?: string | null;
  actual_worked_hours?: number | null;
  assignment_status?: 'active' | 'removed' | 'completed';
  employee_shift_status?: 'confirmed' | 'unconfirmed';
}

const EditRosterShiftPage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Retrieve company and user IDs from auth context.
  const { companyId, userId } = useAuth();

  // Local state for loading, messages, and fetched data.
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [rosterData, setRosterData] = useState<Roster | null>(null);
  const [shiftData, setShiftData] = useState<RosterShift | null>(null);
  const [assignmentData, setAssignmentData] = useState<RosterShiftAssignment | null>(null);

  // States for handling removal of the currently assigned employee.
  const [showRemovalReason, setShowRemovalReason] = useState<boolean>(false);
  const [removalReason, setRemovalReason] = useState<string>('');

  // Main form state from custom hook.
  const { formData, setFormData } = useRoasterFormData();

  // Data fetching hooks for clients, sites, guard groups, and employees.
  const { clients, fetchClients } = useFetchClients();
  const { sites, fetchSites, selectedSiteDetails, handleSelectSite } = useFetchSites();
  const { guardGroups, fetchGuardGroups } = useFetchGuardGroups(companyId);
  const guardGroupId = Number(formData.guard_group) || 0;
  const { employees, fetchEmployees } = useFetchEmployees(companyId, guardGroupId);

  // State for the currently selected employee.
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Generate extended fields for the form and exclude 'select_staff' to avoid duplication.
  const extendedFields = useExtendedFields({
    formData,
    setFormData,
    sites,
    selectedSiteDetails,
    clients,
    handleSelectSite,
    isEditMode: true,
  });

  // Group form fields for display in different cards.
  const card2Names = ['payable_rate_type', 'payable_role', 'payable_amount', 'payable_expenses', 'unpaid_shift'];
  const card3Names = ['billable_role', 'billable_amount', 'billable_expenses', 'training_shift'];
  const card4Names = ['penalty', 'comments', 'shift_instruction'];
  const allCard2_3_4 = [...card2Names, ...card3Names, ...card4Names];

  // Fields to display in the first card (excluding select_staff).
  const card1Fields = extendedFields.filter(
    (field) => !allCard2_3_4.includes(field.name) && field.name !== 'select_staff'
  );
  const card2Fields = extendedFields.filter((field) => card2Names.includes(field.name));
  const card3Fields = extendedFields.filter((field) => card3Names.includes(field.name));
  const card4Fields = extendedFields.filter((field) => card4Names.includes(field.name));

  // -------------------- INITIAL LOAD & DATA FETCHING --------------------
  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    // Set the company ID in form data and load clients and guard groups.
    setFormData((prev) => ({ ...prev, company_id: companyId }));
    fetchClients(companyId);
    fetchGuardGroups();
  }, [companyId, setFormData, fetchClients, fetchGuardGroups]);

  useEffect(() => {
    // When client_id changes, fetch the sites.
    if (formData.client_id) {
      fetchSites(formData.client_id);
    }
  }, [formData.client_id, fetchSites]);

  useEffect(() => {
    // When company and guard group are available, fetch employees.
    if (companyId && guardGroupId) {
      fetchEmployees();
    }
  }, [companyId, guardGroupId, fetchEmployees]);

  // Fetch shift, roster, and assignment details.
  useEffect(() => {
    if (!id) {
      setMessage('No valid shift ID provided.');
      setLoading(false);
      return;
    }
    const fetchShiftData = async () => {
      try {
        // 1. Fetch the shift details.
        const shiftRes = await axios.get(`${BACKEND_URL}/api/rostershifts/${id}`);
        const shift = shiftRes.data;
        setShiftData(shift);
        // Update the form data with the shift details.
        setFormData((prev) => ({
          ...prev,
          payable_rate_type: shift.payable_rate_type,
          payable_role: shift.payable_role,
          payable_amount: shift.payable_amount,
          payable_expenses: shift.payable_expenses,
          billable_role: shift.billable_role,
          billable_amount: shift.billable_amount,
          billable_expenses: shift.billable_expenses,
          unpaid_shift: shift.unpaid_shift,
          training_shift: shift.training_shift,
          shift_status: shift.shift_status,
          penalty: shift.penalty,
          comments: shift.comments,
          shift_instruction: shift.shift_instruction,
          shift_date: shift.shift_date,
          scheduled_start_time: shift.scheduled_start_time,
          scheduled_end_time: shift.scheduled_end_time,
          break_time: shift.break_time || '',
        }));

        // 2. Fetch the parent roster details.
        const rosterRes = await axios.get(`${BACKEND_URL}/api/rosters/${shift.roster_id}`);
        const roster = rosterRes.data.roster;
        setRosterData(roster);
        setFormData((prev) => ({
          ...prev,
          client_name: roster.client_name,
          site_name: roster.site_name,
          po_number: roster.po_number,
          site_id: roster.site_id,
        }));

        // 3. Fetch assignment records for this shift and ignore those marked as 'removed'.
        const assignRes = await axios.get(`${BACKEND_URL}/api/rostershiftassignments/shift/${id}`);
        const assignments = assignRes.data;
        if (assignments && assignments.length > 0) {
          const validAssignment = assignments.find(
            (assignment: RosterShiftAssignment) => assignment.assignment_status !== 'removed'
          );
          if (validAssignment) {
            setAssignmentData(validAssignment);
          } else {
            setSelectedEmployee(null);
            setFormData((prev) => ({ ...prev, select_staff: 'unassigned' }));
          }
        } else {
          setSelectedEmployee(null);
          setFormData((prev) => ({ ...prev, select_staff: 'unassigned' }));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shift details:', error);
        setMessage('Failed to fetch shift details. Please try again.');
        setLoading(false);
      }
    };

    fetchShiftData();
  }, [id, companyId, setFormData]);

  // If an assignment exists, fetch the detailed employee record.
  useEffect(() => {
    if (assignmentData && assignmentData.roster_employee_id) {
      axios
        .get(`${BACKEND_URL}/api/rosteremployees/${assignmentData.roster_employee_id}`)
        .then((response) => {
          setSelectedEmployee(response.data);
          setFormData((prev) => ({ ...prev, select_staff: 'Employee' }));
        })
        .catch((error) => {
          console.error('Error fetching assigned employee details:', error);
        });
    }
  }, [assignmentData, setFormData]);

  // -------------------- HELPER FUNCTIONS --------------------

  // Trigger removal modal for the current assignment.
  const handleRequestRemoveEmployee = () => {
    setShowRemovalReason(true);
    setRemovalReason('');
  };

  // Confirm removal of the assigned employee.
  const handleConfirmRemoveEmployee = async () => {
    if (!assignmentData) {
      setSelectedEmployee(null);
      setFormData((prev) => ({ ...prev, select_staff: 'unassigned' }));
      setShowRemovalReason(false);
      return;
    }
    try {
      await axios.delete(
        `${BACKEND_URL}/api/rostershiftassignments/${assignmentData.roster_shift_assignment_id}`,
        {
          data: { 
            company_id: companyId, 
            removal_reason: removalReason 
          },
          headers: { 'x-user-id': userId ?? '' }
        }
      );
  
      setAssignmentData(null);
      setSelectedEmployee(null);
      setFormData((prev) => ({ ...prev, select_staff: 'unassigned' }));
      setMessage('Employee removed from shift successfully!');
    } catch (error) {
      console.error('Error removing employee from shift:', error);
      setMessage('Failed to remove employee from shift.');
    } finally {
      setShowRemovalReason(false);
      setRemovalReason('');
    }
  };

  // Cancel removal process.
  const handleCancelRemove = () => {
    setShowRemovalReason(false);
    setRemovalReason('');
  };

  // -------------------- FORM SUBMISSION HANDLER --------------------
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!companyId || !userId) {
      setMessage('User or Company ID is missing. Please re-login.');
      return;
    }
    if (!shiftData) {
      setMessage('No shift data found.');
      return;
    }

    try {
      // 1. Update the shift record.
      const shiftPayload = {
        company_id: companyId,
        roster_id: shiftData.roster_id,
        shift_date: shiftData.shift_date,
        scheduled_start_time: formData.scheduled_start_time,
        scheduled_end_time: formData.scheduled_end_time,
        break_time: formData.break_time,
        shift_status: formData.shift_status,
        penalty: formData.penalty,
        comments: formData.comments,
        shift_instruction: formData.shift_instruction,
        payable_rate_type: formData.payable_rate_type,
        payable_role: formData.payable_role,
        payable_amount: formData.payable_amount,
        billable_role: formData.billable_role,
        billable_amount: formData.billable_amount,
        billable_expenses: formData.billable_expenses,
        payable_expenses: formData.payable_expenses,
        unpaid_shift: formData.unpaid_shift,
        training_shift: formData.training_shift,
      };

      await axios.put(
        `${BACKEND_URL}/api/rostershifts/${shiftData.roster_shift_id}`,
        shiftPayload,
        { headers: { 'x-user-id': userId } }
      );

      // 2. If a new employee is selected and there is no active assignment, create a new assignment.
      if (selectedEmployee && !assignmentData) {
        let rosterEmployeeId = selectedEmployee.roster_employee_id;
        if (!rosterEmployeeId) {
          // For subcontractor employees, determine the subcontractor value:
          let subcontractorValue = null;
          if (selectedEmployee.is_subcontractor_employee) {
            // Use the value entered in the form if available; otherwise use the existing value.
            if (formData.subcontractor && formData.subcontractor.trim() !== "") {
              subcontractorValue = parseInt(formData.subcontractor);
            } else if (selectedEmployee.subcontractor_company_id) {
              subcontractorValue = selectedEmployee.subcontractor_company_id;
            }
          }
          console.log('Creating RosterEmployee with data:', {
            company_id: companyId,
            roster_id: shiftData.roster_id,
            applicant_id: selectedEmployee.applicant_id,
            staff: `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim(),
            guard_group: formData.guard_group ? parseInt(formData.guard_group) : null,
            subcontractor: subcontractorValue,
          });
          const newRosterEmployeeResponse = await axios.post(
            `${BACKEND_URL}/api/rosteremployees`,
            {
              company_id: companyId,
              roster_id: shiftData.roster_id,
              applicant_id: selectedEmployee.applicant_id,
              staff: `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim(),
              guard_group: formData.guard_group ? parseInt(formData.guard_group) : null,
              subcontractor: subcontractorValue,
            },
            { headers: { 'x-user-id': userId } }
          );
          rosterEmployeeId = newRosterEmployeeResponse.data.roster_employee_id;
          setSelectedEmployee({ ...selectedEmployee, roster_employee_id: rosterEmployeeId });
        }
        const newAssignmentPayload = {
          company_id: companyId,
          roster_shift_id: shiftData.roster_shift_id,
          roster_employee_id: rosterEmployeeId,
          assignment_start_time: null,
          assignment_end_time: null,
          actual_worked_hours: null,
          assignment_status: 'active',
          employee_shift_status: 'unconfirmed',
          comments: 'New employee assigned after removal',
          change_reason: 'Reassignment after employee removal'
        };
        await axios.post(
          `${BACKEND_URL}/api/rostershiftassignments`,
          newAssignmentPayload,
          { headers: { 'x-user-id': userId } }
        );
      }

      setMessage('Shift updated successfully!');
      navigate('/rosters/schedule');
    } catch (error) {
      console.error('Error updating shift:', error);
      setMessage('Failed to update shift. Please check your input and try again.');
    }
  };

  // Memoize shift timing data for the ShiftsComponent.
  const memoizedShifts = useMemo(() => [{
    shift_date: formData.shift_date,
    scheduled_start_time: formData.scheduled_start_time,
    scheduled_end_time: formData.scheduled_end_time,
    break_time: formData.break_time || '',
  }], [
    formData.shift_date,
    formData.scheduled_start_time,
    formData.scheduled_end_time,
    formData.break_time
  ]);

  // -------------------- RENDERING THE COMPONENT --------------------
  const mainContent = (
    <div className={`${theme === 'dark' ? 'text-dark-text' : 'text-light-text'}`}>
      {loading ? (
        <p>Loading shift data...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* LEFT/MIDDLE Column: Shift & Roster Details */}
            <Card className="md:col-span-2 p-6 space-y-4">
              <h1 className="text-xl font-bold mb-4">Edit Shift</h1>
              {message && <p className="text-red-500">{message}</p>}

              {/* Display read-only roster details */}
              <InputField
                type="text"
                name="client_name"
                value={formData.client_name || ''}
                label="Client Name"
                disabled
                onChange={() => {}}
              />
              <InputField
                type="text"
                name="site_name"
                value={formData.site_name || ''}
                label="Site Name"
                disabled
                onChange={() => {}}
              />
              <InputField
                type="text"
                name="po_number"
                value={formData.po_number || ''}
                label="PO Number"
                disabled
                onChange={() => {}}
              />

              {/* Render additional form fields from extendedFields */}
              {card1Fields.map((field) => (
                <InputField
                  key={field.name}
                  type={field.type}
                  name={field.name}
                  value={(formData as any)[field.name] || ''}
                  onChange={field.onChange}
                  label={field.label}
                  required={field.required}
                  options={field.options}
                />
              ))}

              {/* Render Select Staff dropdown */}
              <InputField
                type="select"
                name="select_staff"
                label="Select Staff"
                required
                options={[
                  { label: 'Employee', value: 'Employee' },
                  { label: 'Unassigned', value: 'unassigned' },
                ]}
                value={formData.select_staff || 'unassigned'}
                disabled={!!selectedEmployee}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, select_staff: e.target.value }))
                }
              />

              {/* If Employee is selected and no employee is assigned, show dropdowns for Guard Group and Employee */}
              {formData.select_staff === 'Employee' && !selectedEmployee && (
                <div className="space-y-4">
                  <InputField
                    type="select"
                    name="guard_group"
                    label="Select Guard Group"
                    required
                    options={guardGroups.map((g) => ({ label: g.group_name, value: g.group_id }))}
                    value={formData.guard_group || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, guard_group: e.target.value }))
                    }
                  />
                  {formData.guard_group && (
                    <EmployeeDropdown
                      label="Select Employee"
                      employees={employees}
                      value={undefined}
                      onChange={(selectedId) => {
                        // Find the employee record using the selected ID.
                        const emp = employees.find((e) => e.applicant_id === selectedId);
                        if (emp) {
                          setSelectedEmployee(emp);
                        }
                      }}
                    />
                  )}
                </div>
              )}

              {/* If an employee is already assigned, display their information with a remove button */}
              {selectedEmployee && (
                <div className="mt-4 p-4 border-2 dark:border-zinc-700 border-dotted rounded">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center p-2 rounded shadow-sm bg-stone-100 dark:bg-stone-950 text-center">
                      {selectedEmployee.employee_photo ? (
                        <img
                          src={`${BACKEND_URL}/uploads/employee-photos/${selectedEmployee.employee_photo}`}
                          alt={`${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-gray-300 flex items-center justify-center">
                          N/A
                        </div>
                      )}
                      <span className="text-sm font-medium mt-1">
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </span>
                      {selectedEmployee.is_subcontractor_employee && (
                        <span className="text-xs font-semibold mt-1 text-gray-600 bg-yellow-200 rounded-full px-2 py-1">
                          Sub-Employee
                          {selectedEmployee.subcontractor_company_name
                            ? ` - ${selectedEmployee.subcontractor_company_name}`
                            : ''}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestRemoveEmployee}
                      className="text-red-500 text-xl font-bold"
                      title="Remove Employee"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Display shift timing details */}
              <ShiftsComponent
                shifts={memoizedShifts}
                onShiftsChange={(newShifts) => {
                  if (newShifts && newShifts.length > 0) {
                    setFormData((prev) => ({ ...prev, ...newShifts[0] }));
                  }
                }}
                disableDateEditing={true}
                disableShiftAddition={true}
                readOnly={true}
              />
            </Card>

            {/* RIGHT Column: Additional fields grouped by category */}
            <div className="flex flex-col space-y-2">
              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-bold mb-2 text-blue-600">Payable</h2>
                {card2Fields.map((field) => (
                  <InputField
                    key={field.name}
                    type={field.type}
                    name={field.name}
                    value={(formData as any)[field.name] || ''}
                    onChange={field.onChange}
                    label={field.label}
                    required={field.required}
                    options={field.options}
                  />
                ))}
              </Card>
              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-bold mb-2 text-green-600">Billable</h2>
                {card3Fields.map((field) => (
                  <InputField
                    key={field.name}
                    type={field.type}
                    name={field.name}
                    value={(formData as any)[field.name] || ''}
                    onChange={field.onChange}
                    label={field.label}
                    required={field.required}
                    options={field.options}
                  />
                ))}
              </Card>
              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-bold mb-2 text-red-600">Additional</h2>
                {card4Fields.map((field) => (
                  <InputField
                    key={field.name}
                    type={field.type}
                    name={field.name}
                    value={(formData as any)[field.name] || ''}
                    onChange={field.onChange}
                    label={field.label}
                    required={field.required}
                    options={field.options}
                  />
                ))}
              </Card>
            </div>
          </div>

          {/* Submit button to update shift */}
          <div className="flex justify-end">
            <Button type="submit" color="submit" icon="plus" marginRight="5px" size="small">
              Update Shift
            </Button>
          </div>
        </form>
      )}

      {/* Modal for removal reason when removing an assigned employee */}
      {showRemovalReason && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-stone-900 p-4 rounded shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Removal Reason</h3>
            <textarea
              className="w-full p-2 border border-gray-300 rounded dark:bg-stone-800 dark:text-white"
              rows={3}
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
            />
            <div className="flex justify-end mt-3 space-x-2">
              <Button type="button" color="delete" onClick={handleConfirmRemoveEmployee} size="small">
                Remove
              </Button>
              <Button type="button" color="edit" onClick={handleCancelRemove} size="small">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`flex flex-col min-h-screen ${
        theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'
      }`}
    >
      <Navbar />
      <div className="flex-grow">
        <TwoColumnLayout sidebarContent={<SideNavbar />} mainContent={mainContent} />
      </div>
      <Footer />
    </div>
  );
};

export default EditRosterShiftPage;
