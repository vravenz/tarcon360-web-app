// File: src/pages/DetailedRosterViewPage.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Footer from '../../../components/Footer';
import Card from '../../../components/Card';
import ViewAsTable from '../../../components/ViewAsTable';
import { useTheme } from '../../../context/ThemeContext';
import {
  FaUser,
  FaBuilding,
  FaHashtag,
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaCoffee
} from 'react-icons/fa';
import { BACKEND_URL } from '../../../config';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';


// ----- Type Definitions -----
interface Roster {
  roster_id: number;
  company_id: number;
  site_id: number;
  po_number?: string;
  client_name: string;
  site_name: string;
  created_at: string;
  updated_at: string;
}

interface RosterShift {
  roster_shift_id: number;
  roster_id: number;
  shift_date: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  break_time?: any;
  shift_status?: string;
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
  created_at: string;
  updated_at: string;
}

// Add employee_photo so we can fetch/display it
interface Assignment {
  roster_shift_assignment_id: number;
  company_id: number;
  roster_shift_id: number;
  roster_employee_id: number;
  assignment_start_time?: string;
  assignment_end_time?: string;
  actual_worked_hours?: number;
  assignment_status: string;
  employee_shift_status: string;
  first_name: string;
  last_name: string;
  employee_photo?: string; // <--- Add this field
}

interface ShiftHistory {
  roster_shift_history_id: number;
  company_id: number;
  roster_shift_id: number;
  shift_status?: string;
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
  updated_by: number;
  changed_at: string;
}

interface AssignmentHistory {
  roster_shift_assignment_history_id: number;
  company_id: number;
  roster_shift_assignment_id: number;
  assignment_status?: string;
  actual_worked_hours?: number;
  comments?: string;
  updated_by: number;
  change_reason?: string;
  changed_at: string;
  first_name: string;
  last_name: string;
}

interface RemovedAssignment extends Assignment {
  removal_id: number;
  removed_at: string;
  removal_reason?: string;
}

interface DetailedShift {
  shift: RosterShift;
  activeAssignments: Assignment[];
  removedAssignments: RemovedAssignment[];
  shiftHistory: ShiftHistory[];
  assignmentHistory: AssignmentHistory[];
}

interface DetailedRosterView {
  roster: Roster;
  shifts: DetailedShift[];
}

// ----- Helper Functions -----
const getEmployeePhotoUrl = (photo?: string): string | undefined => {
  if (!photo) return undefined;
  return photo.startsWith('http')
    ? photo
    : `${BACKEND_URL}/uploads/employee-photos/${photo}`;
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString([], {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
  return `${formattedDate} ${formattedTime}`;
};

const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return '-';
  // If no 'T', assume it's just HH:MM
  if (!timeString.includes('T')) {
    timeString = `1970-01-01T${timeString}:00`;
  }
  const date = new Date(timeString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true });
};

const formatInterval = (interval: any): string => {
  if (!interval) return '-';
  if (typeof interval === 'object' && interval.minutes !== undefined) {
    return `${interval.minutes} minutes`;
  }
  return String(interval);
};

const formatEmployee = (firstName: string, lastName: string): string =>
  `${firstName} ${lastName}`.trim();

const formatChanges = (obj: any): string => {
  const changes = Object.entries(obj)
    .filter(
      ([key, value]) =>
        value !== null &&
        value !== undefined &&
        key !== 'changed_at' &&
        key !== 'updated_by'
    )
    .map(([key, value]) => `${key}: ${value}`);
  return changes.length ? changes.join(' | ') : '-';
};

// ----- DetailedRosterViewPage Component -----
const DetailedRosterViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const [data, setData] = useState<DetailedRosterView | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setError('No roster ID provided');
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/rosters/${id}/detailed`);
        setData(response.data);
      } catch (err) {
        console.error('Error fetching detailed roster view:', err);
        setError('Failed to load roster details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <p>Loading roster details...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data) return <p>No data found.</p>;

  // Prep shift history table columns
  const shiftHistoryColumns = [
    { label: 'Changed Fields', accessor: 'changes' },
    { label: 'Updated By', accessor: 'updated_by' },
    { label: 'Changed At', accessor: 'changed_at' }
  ];

  // Prep assignment history table columns
  const assignmentHistoryColumns = [
    { label: 'Employee', accessor: 'employee' },
    { label: 'Changes', accessor: 'changes' },
    { label: 'Updated By', accessor: 'updated_by' },
    { label: 'Changed At', accessor: 'changed_at' }
  ];

  // Convert shift history data for display
  const processShiftHistory = (history: ShiftHistory[]) =>
    history.map((h) => ({
      changes: formatChanges(h),
      updated_by: h.updated_by,
      changed_at: new Date(h.changed_at).toLocaleString()
    }));

  // Convert assignment history data for display
  const processAssignmentHistory = (history: AssignmentHistory[]) =>
    history.map((h) => ({
      employee: formatEmployee(h.first_name, h.last_name),
      changes: formatChanges(h),
      updated_by: h.updated_by,
      changed_at: new Date(h.changed_at).toLocaleString()
    }));

  return (
    <div
      className={
        theme === 'dark'
          ? 'bg-dark-background text-dark-text'
          : 'bg-light-background text-light-text'
      }
    >
      <Navbar />
      <TwoColumnLayout
        sidebarContent={<SideNavbar />}
        mainContent={
          <div className="space-y-2">
            {/* Roster Information */}
            <Card>
              <h2 className="text-lg font-bold">Roster Information</h2>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div className="space-y-2">
                  <p>
                    <strong>
                      <FaUser className="inline-block mr-1" /> Client:
                    </strong>{' '}
                    {data.roster.client_name}
                  </p>
                  <p>
                    <strong>
                      <FaBuilding className="inline-block mr-1" /> Site:
                    </strong>{' '}
                    {data.roster.site_name}
                  </p>
                  {data.roster.po_number && (
                    <p>
                      <strong>
                        <FaHashtag className="inline-block mr-1" /> PO Number:
                      </strong>{' '}
                      {data.roster.po_number}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p>
                    <strong>
                      <FaCalendarAlt className="inline-block mr-1" /> Created:
                    </strong>{' '}
                    {formatDateTime(data.roster.created_at)}
                  </p>
                  <p>
                    <strong>
                      <FaClock className="inline-block mr-1" /> Updated:
                    </strong>{' '}
                    {formatDateTime(data.roster.updated_at)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Shift Details */}
            {data.shifts.map((detailShift, index) => (
              <div key={detailShift.shift.roster_shift_id} className="space-y-2">
                {/* Shift Overview */}
                <Card>
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-bold">
                      Shift {index + 1} – {formatDateTime(detailShift.shift.shift_date)}
                    </h2>
                    <Button
                      size="small"
                      color="view"
                      icon="view"
                      onClick={() =>
                        navigate(`/roster/${detailShift.shift.roster_shift_id}/qrcodes`)
                      }
                    >
                      QR Codes
                    </Button>
                  </div>

                  <div className="mt-2 space-y-2 text-sm">
                    {detailShift.shift.scheduled_start_time &&
                      detailShift.shift.scheduled_end_time && (
                        <p>
                          <strong>
                            <FaClock className="inline-block mr-1" /> Time:
                          </strong>{' '}
                          {formatTime(detailShift.shift.scheduled_start_time)} –{' '}
                          {formatTime(detailShift.shift.scheduled_end_time)}
                        </p>
                      )}

                  {detailShift.shift.break_time && (
                    <p>
                      <strong>
                        <FaCoffee className="inline-block mr-1" /> Break Time:
                      </strong>{' '}
                      {formatInterval(detailShift.shift.break_time)}
                    </p>
                  )}

                  {detailShift.shift.shift_status && (
                    <p>
                      <strong>
                        <FaInfoCircle className="inline-block mr-1" /> Status:
                      </strong>{' '}
                      {detailShift.shift.shift_status}
                    </p>
                  )}
                </div>
              </Card>


                {/* Active Assignments as Cards (Green background) */}
                <Card padding="p-4" border shadow={false}>
                  <h3 className="text-lg font-bold mb-2">Active Assignments</h3>
                  {detailShift.activeAssignments.length === 0 ? (
                    <p>No active assignments.</p>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {detailShift.activeAssignments.map((assignment) => {
                        const photoUrl = getEmployeePhotoUrl(assignment.employee_photo);
                        return (
                          <div
                            key={assignment.roster_shift_assignment_id}
                            className="relative w-[180px] p-3 rounded-md flex flex-col items-start justify-start text-white cursor-pointer"
                            style={{ background: '#16a34a' }} // Tailwind green-600
                            title={`${formatEmployee(
                              assignment.first_name,
                              assignment.last_name
                            )}`}
                          >
                            {photoUrl && (
                              <img
                                src={photoUrl}
                                alt="Employee"
                                className="w-10 h-10 rounded-full object-cover mb-2"
                              />
                            )}
                            <span className="font-semibold text-left">
                              {formatEmployee(assignment.first_name, assignment.last_name)}
                            </span>
                            <div className="flex items-center mt-1 text-xs">
                              <FaClock className="mr-1" />
                              <span>
                                {formatTime(assignment.assignment_start_time)} -{' '}
                                {formatTime(assignment.assignment_end_time)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Removed Assignments as Cards (Red background) */}
                <Card padding="p-4" border shadow={false}>
                  <h3 className="text-lg font-bold mb-2">Removed Assignments</h3>
                  {detailShift.removedAssignments.length === 0 ? (
                    <p>No removed assignments.</p>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {detailShift.removedAssignments.map((assignment) => {
                        const photoUrl = getEmployeePhotoUrl(assignment.employee_photo);
                        return (
                          <div
                            key={assignment.roster_shift_assignment_id}
                            className="relative w-[180px] p-3 rounded-md flex flex-col items-start justify-start text-white cursor-pointer"
                            style={{ background: '#dc2626' }} // Tailwind red-600
                            title={`${formatEmployee(
                              assignment.first_name,
                              assignment.last_name
                            )}`}
                          >
                            {photoUrl && (
                              <img
                                src={photoUrl}
                                alt="Employee"
                                className="w-10 h-10 rounded-full object-cover mb-2"
                              />
                            )}
                            <span className="font-semibold text-left">
                              {formatEmployee(assignment.first_name, assignment.last_name)}
                            </span>
                            <p className="text-xs mt-1">
                              <strong>Removed At:</strong>{' '}
                              {new Date(assignment.removed_at).toLocaleString()}
                            </p>
                            <p className="text-xs mt-1">
                              <strong>Reason:</strong>{' '}
                              {assignment.removal_reason || '-'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Shift History (still a table) */}
                <Card padding="p-4" border shadow={false}>
                  <h3 className="text-lg font-bold mb-1">Shift History</h3>
                  {detailShift.shiftHistory.length === 0 ? (
                    <p>No history records for shift.</p>
                  ) : (
                    <ViewAsTable
                      data={processShiftHistory(detailShift.shiftHistory)}
                      columns={shiftHistoryColumns}
                    />
                  )}
                </Card>

                {/* Assignment History (still a table) */}
                <Card padding="p-4" border shadow={false}>
                  <h3 className="text-lg font-bold mb-1">Assignment History</h3>
                  {detailShift.assignmentHistory.length === 0 ? (
                    <p>No assignment history records.</p>
                  ) : (
                    <ViewAsTable
                      data={processAssignmentHistory(detailShift.assignmentHistory)}
                      columns={assignmentHistoryColumns}
                    />
                  )}
                </Card>
              </div>
            ))}
          </div>
        }
      />
      <Footer />
    </div>
  );
};

export default DetailedRosterViewPage;
