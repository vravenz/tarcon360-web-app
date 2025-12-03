// frontend/src/pages/protected/staff/StaffDashboard.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Navbar from '../../../components/StaffNavbar';
import MobileAppShell from '../../../components/layout/MobileAppShell';
import StaffBottomNav from '../../../components/StaffBottomNav';
import OneColumnLayout from '../../../components/OneColumnLayout';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { isStaff } from '../../../utils/checkRole';
import { BACKEND_URL } from '../../../config';
import Avatar from '../../../assets/images/avatar.jpg';
import Text from '../../../components/Text';
import axios from 'axios';

type AssignmentRow = {
  roster_shift_assignment_id: number;
  site_name: string;
  shift_date: string; // ISO yyyy-mm-dd or date string
  scheduled_start_time: string | null; // "HH:mm:ss" or null
  scheduled_end_time: string | null;
  assignment_status: 'active' | 'removed' | 'completed';
  employee_shift_status: 'confirmed' | 'unconfirmed';
};

const StaffDashboard: React.FC = () => {
  const { userId, email, companyId } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isStaff()) navigate('/');
  }, [navigate]);

  const [rows, setRows] = React.useState<AssignmentRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const fetchAssignments = async () => {
    if (!companyId || !userId) return;
    try {
      setLoading(true);
      setErr(null);
      const url = `${BACKEND_URL}/api/roster/assignments?companyId=${companyId}&userId=${userId}`;
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
  const combineDateTime = (d: string, t: string | null) => {
    if (!d) return null;
    if (!t) return new Date(d);
    // best-effort: d "yyyy-mm-dd", t "HH:mm[:ss]"
    return new Date(`${d}T${t.slice(0,5)}:00`);
  };

  // --- Derivations ---
  const now = new Date();
  const todayStr = new Date().toISOString().slice(0, 10);

  const todays = rows.filter(r => String(r.shift_date).startsWith(todayStr));
  const statActive = todays.filter(r => r.assignment_status === 'active').length;
  const statCompleted = todays.filter(r => r.assignment_status === 'completed').length;
  const statPending = todays.filter(r => r.employee_shift_status === 'unconfirmed' && r.assignment_status === 'active').length;

  // Next upcoming active assignment (>= now)
  const upcoming = [...rows]
    .filter(r => r.assignment_status === 'active')
    .map(r => ({
      row: r,
      dt: combineDateTime(r.shift_date, r.scheduled_start_time) ?? new Date(r.shift_date),
    }))
    .filter(x => x.dt.getTime() >= now.getTime() - 5 * 60 * 1000) // small grace
    .sort((a,b) => a.dt.getTime() - b.dt.getTime())[0]?.row || null;

  // Recent (limit 5) by date desc
  const recent = [...rows]
    .sort((a,b) => {
      const ad = combineDateTime(a.shift_date, a.scheduled_start_time)?.getTime() || 0;
      const bd = combineDateTime(b.shift_date, b.scheduled_start_time)?.getTime() || 0;
      return bd - ad;
    })
    .slice(0, 5);

  // Theme surfaces (if you keep custom tokens)
  const subtle = theme === 'dark' ? 'text-dark-muted' : 'text-light-muted';
  const border = theme === 'dark' ? 'border-gray-800' : 'border-gray-200';

  const AssignmentBadge: React.FC<{ value: AssignmentRow['assignment_status'] }> = ({ value }) => {
    if (value === 'active') return <Text size="sm" highlight="green" className="capitalize">Active</Text>;
    if (value === 'completed') return <Text size="sm" highlight="blue" className="capitalize">Completed</Text>;
    return <Text size="sm" highlight="red" className="capitalize">Removed</Text>;
  };
  const EmployeeBadge: React.FC<{ value: AssignmentRow['employee_shift_status'] }> = ({ value }) => {
    if (value === 'confirmed') return <Text size="sm" highlight="yellow" className="capitalize block">Confirmed</Text>;
    return <Text size="sm" highlight="orange" className="capitalize block">Pending</Text>;
  };

  // --- Page Content (mobile-first, like StaffJobs) ---
  const content = (
    <div className="p-4 pb-16 space-y-4">
      {/* Welcome / Profile strip */}
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <img
            src={Avatar}
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">Welcome</h1>
            <p className={`text-sm truncate ${subtle}`}>{email || '—'}</p>
          </div>
          <div className="ml-auto">
            <Link to="/profile">
              <Button size="small" icon="view">Profile</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Next Shift */}
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Next Shift</h2>
          <Button size="small" icon="undo" onClick={fetchAssignments}>Refresh</Button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 mt-2">Loading…</p>
        ) : err ? (
          <p className="text-sm text-red-600 mt-2">{err}</p>
        ) : !upcoming ? (
          <p className="text-sm text-gray-500 mt-2">No upcoming shifts.</p>
        ) : (
          <div className="mt-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{upcoming.site_name}</div>
                <div className="text-xs text-gray-500">
                  {upcoming.shift_date ? new Date(upcoming.shift_date).toLocaleDateString() : '—'} • {fmtTime(upcoming.scheduled_start_time)}–{fmtTime(upcoming.scheduled_end_time)}
                </div>
                <div className="mt-2 flex gap-2 items-center">
                  <AssignmentBadge value={upcoming.assignment_status} />
                  <EmployeeBadge value={upcoming.employee_shift_status} />
                </div>
              </div>
              <div className="shrink-0 flex flex-col gap-2">
                <Link to={`/staff/telemetry/${upcoming.roster_shift_assignment_id}`}>
                  <Button size="small" icon="view">View Shift</Button>
                </Link>
                <Link to={`/staff/telemetry/${upcoming.roster_shift_assignment_id}`}>
                  <Button size="small" variant="outline" icon="send">Send ETA</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-4 rounded-2xl">
        <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          <Link to="/staff/jobs">
            <Button className="w-full" size="small" icon="view">My Shifts</Button>
          </Link>
          {upcoming ? (
            <Link to={`/staff/telemetry/${upcoming.roster_shift_assignment_id}`}>
              <Button className="w-full" size="small" icon="accept">Book ON</Button>
            </Link>
          ) : (
            <Button className="w-full" size="small" icon="accept" disabled>Book ON</Button>
          )}
          {upcoming ? (
            <Link to={`/staff/telemetry/${upcoming.roster_shift_assignment_id}`}>
              <Button className="w-full" size="small" icon="cancel">Book OFF</Button>
            </Link>
          ) : (
            <Button className="w-full" size="small" icon="cancel" disabled>Book OFF</Button>
          )}
        </div>
      </Card>

      {/* Today at a glance */}
      <Card className="p-4 rounded-2xl">
        <h2 className="text-lg font-semibold mb-3">Today</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className={`border ${border} rounded-xl p-3 text-center`}>
            <div className="text-xs text-gray-500">Active</div>
            <div className="text-2xl font-bold">{statActive}</div>
          </div>
          <div className={`border ${border} rounded-xl p-3 text-center`}>
            <div className="text-xs text-gray-500">Completed</div>
            <div className="text-2xl font-bold">{statCompleted}</div>
          </div>
          <div className={`border ${border} rounded-xl p-3 text-center`}>
            <div className="text-xs text-gray-500">Pending</div>
            <div className="text-2xl font-bold">{statPending}</div>
          </div>
        </div>
      </Card>

      {/* Recent Shifts */}
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Shifts</h2>
          <Link to="/staff/jobs" className="text-sm underline text-blue-600">See all</Link>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500 mt-2">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">Nothing to show.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {recent.map((r) => (
              <div key={r.roster_shift_assignment_id} className={`border ${border} rounded-xl p-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.site_name}</div>
                    <div className="text-xs text-gray-500">
                      {r.shift_date ? new Date(r.shift_date).toLocaleDateString() : '—'}
                      {' • '}
                      {fmtTime(r.scheduled_start_time)}–{fmtTime(r.scheduled_end_time)}
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <AssignmentBadge value={r.assignment_status} />
                    <EmployeeBadge value={r.employee_shift_status} />
                  </div>
                </div>
                <div className="mt-2">
                  <Link to={`/staff/telemetry/${r.roster_shift_assignment_id}`}>
                    <Button size="small" icon="view">View</Button>
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
      <OneColumnLayout content={content} />
      <StaffBottomNav />
    </MobileAppShell>
  );
};

export default StaffDashboard;
