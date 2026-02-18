// src/pages/employees/EmployeeProfilePage.tsx
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import Text from '../../../components/Text';
import Table from '../../../components/Table';
import Button from '../../../components/Button';
import Footer from '../../../components/Footer';
import { useTheme } from '../../../context/ThemeContext';

interface PerfMatrix {
  label: string;
  value: string | number;
  highlight?: 'green' | 'red' | 'yellow';
}

interface RecentShiftRow {
  date: string;
  site: string;
  status: string;
  workedHours: number;
}

interface UpcomingShift {
  date: string;
  site: string;
  startTime: string;
  endTime: string;
}

interface TableColumn {
  header: string;
  accessor: string;
  isVisible: boolean;
}

/* Dummy data – replace with real API calls later */
const dummyEmpInfo = {
  fullName: 'John Doe',
  role: 'Security Guard',
  email: 'john.doe@example.com',
  phone: '+92 300 1234567',
  joinedOn: '2023-04-12',
  photoUrl: 'https://via.placeholder.com/80'
};

const dummyAttendanceRate = 92; // %

const dummyMatrices: PerfMatrix[] = [
  { label: 'Total Shifts',       value: 120 },
  { label: 'Completed Shifts',   value: 115, highlight: 'green' },
  { label: 'Missed Shifts',      value: 5,   highlight: 'red' },
  { label: 'On-Time %',          value: '96%', highlight: 'green' },
  { label: 'Avg. Hours / Shift', value: 8.2 },
  { label: 'Check-Calls Made',   value: 321 }
];

const dummyRecent: RecentShiftRow[] = [
  { date: '2025-06-25', site: 'Alpha Mall',  status: 'Completed', workedHours: 8 },
  { date: '2025-06-24', site: 'Beta Plaza',  status: 'Missed CC',  workedHours: 7.5 },
  { date: '2025-06-23', site: 'Gamma Depot', status: 'Completed', workedHours: 9 }
];

const dummyUpcoming: UpcomingShift[] = [
  { date: '2025-06-26', site: 'Delta Park',    startTime: '08:00', endTime: '16:00' },
  { date: '2025-06-27', site: 'Epsilon Tower', startTime: '07:00', endTime: '15:00' }
];

const EmployeeProfilePage: React.FC = () => {
  const { theme } = useTheme();
  const { applicantId } = useParams<{ applicantId: string }>();
  const navigate = useNavigate();

  // Columns must include `isVisible`
  const recentColumns: TableColumn[] = useMemo(
    () => [
      { header: 'Date',   accessor: 'date',        isVisible: true },
      { header: 'Site',   accessor: 'site',        isVisible: true },
      { header: 'Status', accessor: 'status',      isVisible: true },
      { header: 'Hours',  accessor: 'workedHours', isVisible: true }
    ],
    []
  );

  const upcomingColumns: TableColumn[] = useMemo(
    () => [
      { header: 'Date',      accessor: 'date',      isVisible: true },
      { header: 'Site',      accessor: 'site',      isVisible: true },
      { header: 'Start Time',accessor: 'startTime', isVisible: true },
      { header: 'End Time',  accessor: 'endTime',   isVisible: true }
    ],
    []
  );

  return (
    <div className={`flex flex-col min-h-screen ${
        theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'
      }`}>
      <Navbar />

      <TwoColumnLayout
        sidebarContent={<SideNavbar />}
        mainContent={
          <div className="space-y-6 p-6">
            {/* ─── HEADER ───────────────────────────── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={dummyEmpInfo.photoUrl}
                  alt="Employee"
                  className="w-20 h-20 rounded-full"
                />
                <div>
                  <h1 className="text-2xl font-bold">{dummyEmpInfo.fullName}</h1>
                  <Text className="text-gray-500">{dummyEmpInfo.role}</Text>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => navigate(-1)} size="small">
                  Back
                </Button>
                <Button color="submit" size="small">
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* ─── CONTACT & ATTENDANCE ────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <Text highlight="yellow" className="font-semibold mb-2">
                  Contact Info
                </Text>
                <Text>Email: {dummyEmpInfo.email}</Text>
                <Text>Phone: {dummyEmpInfo.phone}</Text>
                <Text>Joined: {dummyEmpInfo.joinedOn}</Text>
              </Card>
              <Card className="p-4 flex flex-col justify-center">
                <Text highlight="yellow" className="font-semibold mb-2">
                  Attendance Rate
                </Text>
                <div className="w-full bg-gray-200 h-3 rounded">
                  <div
                    className="h-3 rounded bg-green-500"
                    style={{ width: `${dummyAttendanceRate}%` }}
                  />
                </div>
                <Text className="mt-2">{dummyAttendanceRate}%</Text>
              </Card>
              <Card className="p-4 flex flex-col justify-center">
                <Text highlight="yellow" className="font-semibold mb-2">
                  Current Month Hours
                </Text>
                <Text className="text-3xl font-semibold">160 hrs</Text>
              </Card>
            </div>

            {/* ─── PERFORMANCE METRICS ────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dummyMatrices.map((m, i) => (
                <Card key={i} className="p-4 flex flex-col items-center">
                  <Text className="text-sm text-gray-500">{m.label}</Text>
                  <Text
                    className="text-3xl font-semibold"
                    highlight={m.highlight}
                  >
                    {m.value}
                  </Text>
                </Card>
              ))}
            </div>

            {/* ─── RECENT SHIFTS ───────────────────── */}
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Recent Shifts</h2>
              <Table data={dummyRecent} columns={recentColumns} />
            </Card>

            {/* ─── UPCOMING SHIFTS ──────────────────── */}
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Upcoming Shifts</h2>
              <Table data={dummyUpcoming} columns={upcomingColumns} />
            </Card>
          </div>
        }
      />

      <Footer />
    </div>
  );
};

export default EmployeeProfilePage;
