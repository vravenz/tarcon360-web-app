import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Custom form logic & data hooks
import { useRoasterFormData } from './formData/useRoasterFormData';
import { useFetchClients } from './useFetchClients';
import { useFetchSites } from './useFetchSites';
import { useExtendedFields } from './useExtendedFields';
import { useFetchGuardGroups } from './useFetchGuardGroups';
import { useFetchEmployees } from './useFetchEmployees';

// Components for selecting employees and shifts
import EmployeeDropdown from '../../../components/EmployeeDropdown';
import ShiftsComponent, { ShiftRecord } from '../../../components/ShiftsComponent';
import { BACKEND_URL } from '../../../config';

/** Minimal structure for the top-level “roster” portion */
interface RosterPayload {
  company_id: number;
  site_id: number;
  po_number?: string;
}

/** Structure for each row in the “roster_employees” table */
interface RosterEmployeePayload {
  applicant_id: number | null;
  staff?: string;
  guard_group?: number | null;
  subcontractor?: number | null;
}

/** Extended shift structure for “roster_shifts” */
export interface RosterShiftPayload extends ShiftRecord {
  shift_status?: 'confirmed' | 'unconfirmed' | 'unassigned';
  penalty?: number;
  comments?: string;
  shift_instruction?: string;

  payable_rate_type?: string;
  payable_role?: string;
  payable_amount?: number;
  billable_role?: string;
  billable_amount?: number;
  payable_expenses?: number;
  billable_expenses?: number;

  unpaid_shift?: boolean;
  training_shift?: boolean;
}

/** Basic info about an employee from the DB */
interface Employee {
  applicant_id: number;
  first_name: string;
  last_name: string;
  employee_photo: string | null;
  is_subcontractor_employee?: boolean;
  subcontractor_company_id?: number | null;
  subcontractor_company_name?: string;
}

const AddRosterPage: React.FC = () => {
  const { companyId } = useAuth();         // Example: user’s company
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  // Our main form data
  const { formData, setFormData } = useRoasterFormData();

  // Data fetching hooks
  const { clients, fetchClients } = useFetchClients();
  const { sites, fetchSites, selectedSiteDetails, handleSelectSite } = useFetchSites();
  const { guardGroups, fetchGuardGroups } = useFetchGuardGroups(companyId);
  const { employees, fetchEmployees } = useFetchEmployees(companyId, Number(formData.guard_group) || 0);

  // Local state for the SHIFT data
  const [shifts, setShifts] = useState<RosterShiftPayload[]>([]);

  /** 1) On mount: fetch clients, guard groups, set formData.company_id. */
  useEffect(() => {
    if (companyId) {
      setFormData((prev) => ({ ...prev, company_id: companyId }));
      fetchClients(companyId);
      fetchGuardGroups();
    }
  }, [companyId, fetchClients, fetchGuardGroups, setFormData]);

  /** 2) When client_id changes, fetch that client’s sites */
  useEffect(() => {
    if (formData.client_id) {
      fetchSites(formData.client_id);
    }
  }, [formData.client_id, fetchSites]);

  /** 3) When guard_group changes, fetch employees in that group */
  useEffect(() => {
    if (companyId && formData.guard_group) {
      fetchEmployees();
    }
  }, [companyId, formData.guard_group, fetchEmployees]);

  /** 4) If staff type or guard group changes, reset our selected employees. */
  useEffect(() => {
    setSelectedEmployees([]);
  }, [formData.select_staff, formData.guard_group]);

  /** Use our “extended fields” hook to define which input fields to render */
  const extendedFields = useExtendedFields({
    formData,
    setFormData,
    clients,
    sites,
    selectedSiteDetails,
    handleSelectSite,
  });

  // For layout convenience, group some fields
  const card2Names = ['payable_rate_type', 'payable_role', 'payable_amount', 'payable_expenses', 'unpaid_shift'];
  const card3Names = ['billable_role', 'billable_amount', 'billable_expenses', 'training_shift'];
  const card4Names = ['penalty', 'comments', 'shift_instruction'];
  const allCard2_3_4 = [...card2Names, ...card3Names, ...card4Names];

  const card1Fields = extendedFields.filter((field) => !allCard2_3_4.includes(field.name));
  const card2Fields = extendedFields.filter((field) => card2Names.includes(field.name));
  const card3Fields = extendedFields.filter((field) => card3Names.includes(field.name));
  const card4Fields = extendedFields.filter((field) => card4Names.includes(field.name));

  /**
   * Final form submission that calls:
   *    POST /api/rosters
   * with a payload containing:
   *    - top-level “roster” data
   *    - selectedEmployees[] → roster_employees
   *    - selectedShifts[] → roster_shifts
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');

    // Basic validations
    if (!formData.company_id) {
      setMessage('Company ID is missing; please re-check your login or config.');
      return;
    }
    if (!formData.site_id) {
      setMessage('Please select a site before submitting.');
      return;
    }

    try {
      // 1) Build the top-level roster object
      const rosterPayload: RosterPayload = {
        company_id: formData.company_id,
        site_id: formData.site_id,
        po_number: formData.po_number || undefined,
      };

      // 2) Build the “roster_employees” array
      let selectedEmployeesPayload: RosterEmployeePayload[];
      if (formData.select_staff === 'unassigned') {
        // If user wants “unassigned,” we create just one row with applicant_id=null
        selectedEmployeesPayload = [
          {
            applicant_id: null,
            staff: 'unassigned',
            guard_group: null,
            subcontractor: null,
          },
        ];
      } else {
        // Otherwise, transform each selected employee into a roster_employees object
        selectedEmployeesPayload = selectedEmployees.map((emp) => ({
          applicant_id: emp.applicant_id,
          staff: formData.select_staff,
          guard_group: formData.guard_group ? Number(formData.guard_group) : null,
          subcontractor: emp.is_subcontractor_employee ? emp.subcontractor_company_id ?? null : null,
        }));
      }

      // 3) Build the “roster_shifts” array
      // Merge in top-level fields like penalty, comments, instructions, etc.
      const selectedShiftsPayload: RosterShiftPayload[] = shifts.map((shift) => ({
        ...shift,
        penalty: formData.penalty,
        comments: formData.comments,
        shift_instruction: formData.shift_instruction,
        shift_status: formData.shift_status as 'confirmed' | 'unconfirmed' | 'unassigned',

        payable_rate_type: formData.payable_rate_type,
        payable_role: formData.payable_role,
        payable_amount: formData.payable_amount,
        payable_expenses: formData.payable_expenses,

        billable_role: formData.billable_role,
        billable_amount: formData.billable_amount,
        billable_expenses: formData.billable_expenses,

        unpaid_shift: formData.unpaid_shift,
        training_shift: formData.training_shift,
      }));

      // 4) Combine everything into the final payload matching your backend’s `createRoster` endpoint
      const payload = {
        ...rosterPayload,
        employees: selectedEmployeesPayload,
        shifts: selectedShiftsPayload,
      };

      // 5) POST to your server
      const response = await axios.post(`${BACKEND_URL}/api/rosters`, payload);
      if (response.status === 201) {
        setMessage('Roster created successfully!');
        // Example: redirect to some “Roster Schedule” or list page
        navigate('/rosters/schedule');
      }
    } catch (error) {
      console.error('Failed to create roster:', error);
      setMessage('Failed to create roster. Please check your data and try again.');
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
      <Navbar />

      <div className="flex-grow">
        <TwoColumnLayout
          sidebarContent={<SideNavbar />}
          mainContent={
            <div className={`${theme === 'dark' ? 'text-dark-text' : 'text-light-text'}`}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* LEFT + CENTER: Roster-level fields & Shift patterns */}
                  <Card className="md:col-span-2 p-6 space-y-4">
                    <h1 className="text-xl font-bold mb-4">Add New Roster</h1>

                    {/* Card 1 fields */}
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

                    {/* If "Employee" is selected, show guard group + employee selection */}
                    {formData.select_staff === 'Employee' && (
                      <>
                        <InputField
                          type="select"
                          name="guard_group"
                          label="Select Guard Group"
                          required
                          options={guardGroups.map((g) => ({
                            label: g.group_name,
                            value: g.group_id,
                          }))}
                          value={formData.guard_group || ''}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              guard_group: e.target.value,
                              employee: '',
                            }));
                            setSelectedEmployees([]);
                          }}
                        />

                        {formData.guard_group && (
                          <>
                            <EmployeeDropdown
                              label="Select Employee"
                              employees={employees}
                              value={formData.employee ? Number(formData.employee) : undefined}
                              onChange={(selectedId) => {
                                const emp = employees.find((e) => e.applicant_id === selectedId);
                                if (emp) {
                                  setSelectedEmployees((prev) => {
                                    const alreadySelected = prev.some((x) => x.applicant_id === emp.applicant_id);
                                    return alreadySelected ? prev : [...prev, emp];
                                  });
                                }
                                setFormData((prev) => ({
                                  ...prev,
                                  employee: String(selectedId),
                                }));
                              }}
                            />
                            <div className="mt-4 p-4 border-2 border-dotted rounded dark:border-zinc-700">
                              {selectedEmployees.length === 0 ? (
                                <p className="text-gray-500">No employees selected</p>
                              ) : (
                                <div className="flex flex-wrap gap-4">
                                  {selectedEmployees.map((emp) => (
                                    <div
                                      key={emp.applicant_id}
                                      className="flex flex-col items-center p-2 rounded shadow-sm bg-stone-100 dark:bg-stone-950 text-center"
                                    >
                                      {emp.employee_photo ? (
                                        <img
                                          src={`${BACKEND_URL}/uploads/employee-photos/${emp.employee_photo}`}
                                          alt={`${emp.first_name} ${emp.last_name}`}
                                          className="h-14 w-14 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="h-14 w-14 rounded-full bg-gray-300 flex items-center justify-center">
                                          N/A
                                        </div>
                                      )}
                                      <span className="text-sm font-medium mt-1">
                                        {emp.first_name} {emp.last_name}
                                      </span>
                                      {emp.is_subcontractor_employee && (
                                        <span className="text-xs font-semibold mt-1 text-gray-600 bg-yellow-200 rounded-full px-2 py-1">
                                          Sub-Employee
                                          {emp.subcontractor_company_name
                                            ? ` - ${emp.subcontractor_company_name}`
                                            : ''}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* The Shifts component: “Same multiple shifts” or “Different multiple shifts” */}
                    <ShiftsComponent onShiftsChange={(newShifts) => setShifts(newShifts)} />
                  </Card>

                  {/* RIGHT column: Additional pay/bill info, penalty, comments, etc. */}
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

                {/* Submit button */}
                <div className="flex justify-end">
                  <Button type="submit" color="submit" icon="plus" marginRight="5px" size="small">
                    Add Roster
                  </Button>
                </div>
              </form>

              {/* Display any error/success messages */}
              {message && <p className="text-red-500 mt-2">{message}</p>}
            </div>
          }
        />
      </div>

      <Footer />
    </div>
  );
};

export default AddRosterPage;