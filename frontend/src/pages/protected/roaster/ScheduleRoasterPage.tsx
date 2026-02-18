// File: ScheduleRoasterPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '../../../components/Card';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import Footer from '../../../components/Footer';
import { useTheme } from '../../../context/ThemeContext';
import DropdownSelect from '../../../components/DropdownSelect';
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  isWithinInterval,
  parseISO,
  addDays
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaExclamationCircle, FaClock } from 'react-icons/fa';
import { BACKEND_URL } from '../../../config';

// ----------- Types -----------

// Assignment record joining a shift and an employee.
interface RosterShiftAssignment {
  roster_shift_assignment_id: number;
  roster_shift_id: number;
  roster_employee_id: number;
  assignment_start_time?: string | null;
  assignment_end_time?: string | null;
  actual_worked_hours?: number | null;
  assignment_status: 'active' | 'removed' | 'completed';
  employee_shift_status: 'confirmed' | 'unconfirmed';
}

// Shift record from roster_shifts.
interface RosterShift {
  roster_shift_id: number;
  shift_date: string; // YYYY-MM-DD
  scheduled_start_time: string;
  scheduled_end_time: string;
  shift_status: 'confirmed' | 'unconfirmed';
}

// Employee record from roster_employees.
interface RosterEmployee {
  roster_employee_id: number;
  first_name: string;
  last_name: string;
  employee_photo?: string;
}

// The complete roster record coming from the backend.
interface RosterSchedule {
  roster_id: number;
  client_name: string;
  site_name: string;
  po_number?: string;
  employees: RosterEmployee[];
  shifts: RosterShift[];
  assignments: RosterShiftAssignment[];
}

// Shift detail to be displayed.
interface ShiftDetail {
  roster_shift_id: number;
  guard_name: string;
  start_time: string;
  end_time: string;
  shift_status: 'confirmed' | 'unconfirmed';
  employee_photo?: string;
  employee_shift_status?: 'confirmed' | 'unconfirmed';
}

// Updated table row type after grouping by date.
interface TableRowGrouped {
  date: string;
  roster_ids: number[];
  client_names: string;
  site_names: string;
  shifts: ShiftDetail[];
}

// ---------------- Helper Functions ----------------

// Returns the complete URL for an employee photo.
function getEmployeePhotoUrl(photo: string): string {
  return photo.startsWith('http')
    ? photo
    : `${BACKEND_URL}/uploads/employee-photos/${photo}`;
}

// Helper: Format time string (HH:mm:ss to AM/PM)
const formatTime = (timeStr: unknown): string => {
  if (typeof timeStr !== 'string' || !timeStr) return 'N/A';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const [hours, minutes] = parts;
  const hourNum = parseInt(hours, 10);
  const amOrPm = hourNum >= 12 ? 'PM' : 'AM';
  const adjustedHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
  return `${adjustedHour}:${minutes} ${amOrPm}`;
};

// ---------------- Component ----------------
const ScheduleRoasterPage: React.FC = () => {
  const { theme } = useTheme();
  const [rosters, setRosters] = useState<RosterSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  // Manage current week start date (week starts on Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Manage the status filter. "all" will display all shifts.
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Define the dropdown options for status filtering.
  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Unconfirmed', value: 'unconfirmed' },
  ];

  // Fetch rosters on mount
  useEffect(() => {
    const fetchRosters = async () => {
      try {
        const response = await axios.get<RosterSchedule[]>(`${BACKEND_URL}/api/rosters`);
        setRosters(response.data);
      } catch (err) {
        console.error('Error fetching rosters:', err);
        setError('Failed to load rosters.');
      } finally {
        setLoading(false);
      }
    };

    fetchRosters();
  }, []);

  // Navigate to the edit page for a specific shift using its shift id.
  const handleShiftClick = (shiftId: number) => {
    navigate(`/rosters/edit/${shiftId}`);
  };

  // Group and filter roster data
  const tableRowsGrouped: TableRowGrouped[] = useMemo(() => {
    const grouped: {
      [date: string]: {
        rosterIds: Set<number>;
        clients: Set<string>;
        sites: Set<string>;
        shifts: ShiftDetail[];
      };
    } = {};
    const weekInterval = {
      start: currentWeekStart,
      end: addDays(currentWeekStart, 6)
    };

    rosters.forEach((roster) => {
      const { shifts = [], assignments = [], employees = [] } = roster;

      shifts.forEach((shift) => {
        const shiftDate = parseISO(shift.shift_date);
        if (isWithinInterval(shiftDate, weekInterval)) {
          // Apply the status filter. When filter is not "all", only include shifts with matching shift_status.
          if (statusFilter !== 'all' && shift.shift_status !== statusFilter) {
            return;
          }

          const formattedDate = format(shiftDate, 'yyyy-MM-dd');

          // Determine guard details.
          // For confirmed shifts, look for an active assignment.
          // For unconfirmed shifts, show "Unconfirmed" as the guard name.
          let guard_name = shift.shift_status === 'unconfirmed' ? 'Unconfirmed' : 'Unassigned';
          let employee_photo = undefined;
          let employee_shift_status: 'confirmed' | 'unconfirmed' = 'unconfirmed';

          if (shift.shift_status === 'confirmed') {
            const activeAssignment = assignments.find(
              (a) =>
                a.roster_shift_id === shift.roster_shift_id &&
                a.assignment_status !== 'removed'
            );
            if (activeAssignment) {
              const employee = employees.find(
                (e) => e.roster_employee_id === activeAssignment.roster_employee_id
              );
              if (employee) {
                guard_name = `${employee.first_name} ${employee.last_name}`;
                employee_photo = employee.employee_photo
                  ? getEmployeePhotoUrl(employee.employee_photo)
                  : undefined;
                employee_shift_status = activeAssignment.employee_shift_status;
              }
            }
          }

          if (!grouped[formattedDate]) {
            grouped[formattedDate] = {
              rosterIds: new Set<number>(),
              clients: new Set<string>(),
              sites: new Set<string>(),
              shifts: []
            };
          }

          grouped[formattedDate].rosterIds.add(roster.roster_id);
          grouped[formattedDate].clients.add(roster.client_name);
          grouped[formattedDate].sites.add(roster.site_name);

          grouped[formattedDate].shifts.push({
            roster_shift_id: shift.roster_shift_id,
            guard_name,
            start_time: shift.scheduled_start_time,
            end_time: shift.scheduled_end_time,
            shift_status: shift.shift_status,
            employee_photo,
            employee_shift_status
          });
        }
      });
    });

    const rows: TableRowGrouped[] = Object.keys(grouped).map((date) => ({
      date,
      roster_ids: Array.from(grouped[date].rosterIds),
      client_names: Array.from(grouped[date].clients).join(', '),
      site_names: Array.from(grouped[date].sites).join(', '),
      shifts: grouped[date].shifts
    }));

    rows.sort((a, b) => (a.date > b.date ? 1 : -1));
    return rows;
  }, [rosters, currentWeekStart, statusFilter]);

  // Week navigation handlers
  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  const renderTable = () => {
    if (loading) return <p>Loading rosters...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (tableRowsGrouped.length === 0) return <p>No rosters found for this week.</p>;

    return (
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-neutral-700' : 'divide-neutral-200'}`}>
          <thead className={`${theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'}`}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Client(s)</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Site(s)</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Shifts</th>
            </tr>
          </thead>
          <tbody className={`${theme === 'dark' ? 'bg-dark-cardBackground' : 'bg-white'} divide-y ${theme === 'dark' ? 'divide-neutral-700' : 'divide-neutral-200'}`}>
            {tableRowsGrouped.map((row, idx) => (
              <tr
                key={idx}
                className={`hover:bg-gray-100 dark:hover:bg-gray-800 ${row.date === today ? 'bg-neutral-100 dark:bg-neutral-900' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{row.client_names}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{row.site_names}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{format(parseISO(row.date), 'PPP')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-wrap gap-2">
                    {row.shifts.map((shift, sIdx) => {
                      // Set background to green if confirmed, otherwise red if unconfirmed.
                      let backgroundStyle = shift.shift_status === 'confirmed' ? '#16a34a' : '#dc2626';

                      // Determine the status block.
                      let statusBlock = null;
                      if (shift.shift_status === 'confirmed') {
                        if (shift.employee_shift_status === 'confirmed') {
                          statusBlock = (
                            <div className="flex mt-2">
                              <span>Confirmed</span>
                            </div>
                          );
                        } else if (shift.employee_shift_status === 'unconfirmed') {
                          statusBlock = (
                            <div className="flex mt-2 space-x-2">
                              <div className="flex items-center">
                                <span className="mr-1">Guard:</span>
                                <FaExclamationCircle />
                              </div>
                            </div>
                          );
                        }
                      }

                      return (
                        <div
                          key={sIdx}
                          onClick={() => handleShiftClick(shift.roster_shift_id)}
                          className="relative w-[180px] px-4 py-3 rounded-md flex flex-col items-start justify-start min-w-[140px] text-white cursor-pointer"
                          style={{ background: backgroundStyle }}
                          title={`Shift Status: ${shift.shift_status}`}
                          tabIndex={0}
                        >
                          {shift.employee_photo && (
                            <img
                              src={shift.employee_photo}
                              alt={shift.guard_name}
                              className="w-8 h-8 rounded-full object-cover mb-2"
                            />
                          )}
                          <span className="font-semibold text-left">{shift.guard_name}</span>
                          <div className="flex items-center mt-1">
                            <FaClock className="mr-1" />
                            <span className="text-xs">
                              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                            </span>
                          </div>
                          {statusBlock}
                          {/* Red ribbon overlay if guard is unconfirmed on a confirmed shift */}
                          {shift.shift_status === 'confirmed' && shift.employee_shift_status === 'unconfirmed' && (
                            <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[34px] border-l-[34px] border-transparent border-b-red-600"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const mainContent = (
    <div className="space-y-2">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-light-cardBackground dark:bg-dark-cardBackground rounded p-4 shadow">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Schedule Roster</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Manage and review all scheduled rosters for the week.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-3 sm:mt-0">
          {/* Status Filter Dropdown */}
          <DropdownSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="w-48"
          />
          <button onClick={handlePrevWeek} className="p-2 bg-gray-200 dark:bg-neutral-700 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors" aria-label="Previous Week">
            <FaChevronLeft />
          </button>
          <span className="mx-4 text-lg font-medium">
            {format(currentWeekStart, 'MMM dd, yyyy')} - {format(addDays(currentWeekStart, 6), 'MMM dd, yyyy')}
          </span>
          <button onClick={handleNextWeek} className="p-2 bg-gray-200 dark:bg-neutral-700 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors" aria-label="Next Week">
            <FaChevronRight />
          </button>
        </div>
      </header>
      <Card padding="p-4" shadow={true} border={false}>
        {renderTable()}
      </Card>
    </div>
  );

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'}`}>
      <Navbar />
      <div className="flex-grow">
        <TwoColumnLayout sidebarContent={<SideNavbar />} mainContent={mainContent} />
      </div>
      <Footer />
    </div>
  );
};

export default ScheduleRoasterPage;
