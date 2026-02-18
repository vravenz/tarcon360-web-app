// frontend/src/pages/protected/staff/StaffJobs.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Navbar from '../../../components/StaffNavbar';
import MobileAppShell from '../../../components/layout/MobileAppShell';
import StaffBottomNav from '../../../components/StaffBottomNav';
import OneColumnLayout from '../../../components/OneColumnLayout';
import { useAuth } from '../../../hooks/useAuth';
import { isStaff } from '../../../utils/checkRole';
import { BACKEND_URL } from '../../../config';
import Text from '../../../components/Text';

type AssignmentRow = {
  roster_shift_assignment_id: number;
  site_name: string;
  shift_date: string;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  assignment_status: 'active' | 'removed' | 'completed';
  employee_shift_status: 'confirmed' | 'unconfirmed';
};

const StaffJobs: React.FC = () => {
  const { userId, companyId } = useAuth();
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

      const url = `${BACKEND_URL}/api/roster/assignments?companyId=${companyId}`;
      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
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

  const fmtTime = (t: string | null) => (t ? t.slice(0, 5) : '—');

  // Small highlight badges for each status
  const AssignmentBadge: React.FC<{ value: AssignmentRow['assignment_status'] }> = ({ value }) => {
    if (value === 'active') return <Text size="sm" highlight="green" className="capitalize">Active</Text>;
    if (value === 'completed') return <Text size="sm" highlight="blue" className="capitalize">Completed</Text>;
    return <Text size="sm" highlight="red" className="capitalize">Removed</Text>;
  };

  const EmployeeBadge: React.FC<{ value: AssignmentRow['employee_shift_status'] }> = ({ value }) => {
    if (value === 'confirmed') return <Text size="sm" highlight="yellow" className="capitalize block">Confirmed</Text>;
    return <Text size="sm" highlight="orange" className="capitalize block">Pending</Text>;
  };

  // --- Mobile-first content (one column) ---
  const jobsContent = (
    <div className="pb-16">{/* space for fixed top/bottom bars */}
      <Card className="w-full p-4 space-y-3 rounded-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Staff Jobs</h1>
          <Button onClick={fetchAssignments} size="small" icon="undo">Refresh</Button>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No assignments found.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r.roster_shift_assignment_id}
                className="border rounded-xl p-3 border-gray-200 dark:border-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{r.site_name}</div>
                    <div className="text-xs text-gray-500">
                      {r.shift_date ? new Date(r.shift_date).toLocaleDateString() : '—'} • {fmtTime(r.scheduled_start_time)}–{fmtTime(r.scheduled_end_time)}
                    </div>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <AssignmentBadge value={r.assignment_status} />
                    <EmployeeBadge value={r.employee_shift_status} />
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  <Link to={`/staff/telemetry/${r.roster_shift_assignment_id}`}>
                    <Button size="small" marginRight="4px" icon="view">
                      View Shift
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <MobileAppShell>
      <Navbar />
      <OneColumnLayout content={jobsContent} />
      <StaffBottomNav />
    </MobileAppShell>
  );
};

export default StaffJobs;
