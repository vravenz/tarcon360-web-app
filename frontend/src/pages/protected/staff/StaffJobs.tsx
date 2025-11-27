// frontend/src/pages/protected/staff/StaffJobs.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import { useTheme } from '../../../context/ThemeContext';
import Navbar from '../../../components/StaffNavbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import { useAuth } from '../../../hooks/useAuth';
import { isStaff } from '../../../utils/checkRole';
import { BACKEND_URL } from '../../../config';

type AssignmentRow = {
  roster_shift_assignment_id: number;
  site_name: string;
  shift_date: string; // ISO date (e.g. "2025-10-30")
  scheduled_start_time: string | null; // "09:00:00"
  scheduled_end_time: string | null;   // "17:00:00"
  assignment_status: 'active' | 'removed' | 'completed';
  employee_shift_status: 'confirmed' | 'unconfirmed';
};

const StaffJobs: React.FC = () => {
  const { userId, companyId } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [rows, setRows] = React.useState<AssignmentRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isStaff()) navigate('/');
  }, [navigate]);

  const fetchAssignments = async () => {
    if (!companyId || !userId) return;
    try {
      setLoading(true);
      setErr(null);
  
      // ✅ Correct backend path and query
      const url = `${BACKEND_URL}/api/roster/assignments?companyId=${companyId}`;
  
      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          // ✅ Your Express middleware picks this up
          'x-user-id': String(userId),
        },
      });
  
      const normalize = (r: any): AssignmentRow => ({
        roster_shift_assignment_id: Number(r.roster_shift_assignment_id ?? r.assignment_id ?? r.id),
        site_name: String(r.site_name ?? r.client_site_name ?? '—'),
        shift_date: String(r.shift_date ?? r.date ?? ''),
        scheduled_start_time: r.scheduled_start_time ?? r.start_time ?? null,
        scheduled_end_time: r.scheduled_end_time ?? r.end_time ?? null,
        assignment_status: (r.assignment_status ?? 'active') as AssignmentRow['assignment_status'],
        employee_shift_status: (r.employee_shift_status ?? 'unconfirmed') as AssignmentRow['employee_shift_status'],
      });
  
      const list: AssignmentRow[] = Array.isArray(data?.data)
        ? data.data.map(normalize)
        : Array.isArray(data) ? data.map(normalize) : [];
  
      setRows(list);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, userId]);

  const fmtTime = (t: string | null) => (t ? t.slice(0, 5) : '—'); // "09:00"

  const jobsContent = (
    <Card className="max-w-full w-full p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff Jobs</h1>
        <Button onClick={fetchAssignments} size="small" icon="undo">
          Refresh
        </Button>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No assignments found.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Site</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">You</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.roster_shift_assignment_id} className="border-b last:border-0">
                  <td className="py-2 pr-3">{r.site_name}</td>
                  <td className="py-2 pr-3">
                    {r.shift_date ? new Date(r.shift_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2 pr-3">
                    {fmtTime(r.scheduled_start_time)}–{fmtTime(r.scheduled_end_time)}
                  </td>
                  <td className="py-2 pr-3 capitalize">{r.assignment_status}</td>
                  <td className="py-2 pr-3 capitalize">{r.employee_shift_status}</td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-2">
                      {/* Track button goes to TelemetryPage */}
                      <Link to={`/staff/telemetry/${r.roster_shift_assignment_id}`}>
                        <Button size="small" icon="view">Track</Button>
                      </Link>
                      {/* Example: view details page (optional) */}
                      {/* <Link to={`/rosters/view/${r.roster_shift_assignment_id}`}>
                        <Button size="small" variant="outline" icon="view">Details</Button>
                      </Link> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  return (
    <div className={`${theme === 'dark' ? 'bg-dark-background text-white' : 'bg-light-background text-gray-900'} min-h-screen`}>
      <Navbar />
      <TwoColumnLayout sidebarContent={<SideNavbar />} mainContent={jobsContent} />
    </div>
  );
};

export default StaffJobs;
