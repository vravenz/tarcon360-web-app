import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../../components/StaffNavbar';
import MobileAppShell from '../../../components/layout/MobileAppShell';
import StaffBottomNav from '../../../components/StaffBottomNav';
import OneColumnLayout from '../../../components/OneColumnLayout';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import { useAuth } from '../../../hooks/useAuth';
import { isStaff } from '../../../utils/checkRole';
import { BACKEND_URL } from '../../../config';
import Text from '../../../components/Text';
import axios from 'axios';

type KPI = {
  assigned: number;
  attendanceRate: number;   // %
  onTimeRate: number;       // %
  bookOffRate: number;      // %
  avgEtaMin: number | null;
  today: { active: number; completed: number; pending: number };
  hoursWorked: number;      // hours
  checkpointCompliance: { done: number; total: number; rate: number };
  checkCallCompliance: { done: number; total: number; rate: number };
};

type Telemetry = {
  location_lat: number;
  location_long: number;
  accuracy_m?: number | null;
  recorded_at?: string;
} | null;

type RecentShift = {
  id: number;
  site_name: string;
  shift_date: string;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  assignment_status: 'active' | 'removed' | 'completed';
  employee_shift_status: 'confirmed' | 'unconfirmed';
};

type APIResp = {
  ok: boolean;
  range: { from: string; to: string };
  kpis: KPI;
  latestTelemetry: Telemetry;
  topSites: { site_id: number; site_name: string; cnt: number }[];
  recentShifts: RecentShift[];
};

const StaffStats: React.FC = () => {
  const { userId, companyId } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isStaff()) navigate('/');
  }, [navigate]);

  const [data, setData] = React.useState<APIResp | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [range, setRange] = React.useState<'week' | 'month' | '30d'>('30d');

  const computeRange = () => {
    const to = new Date();
    let from = new Date();
    if (range === 'week') {
      from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'month') {
      from = new Date();
      from.setMonth(from.getMonth() - 1);
    } else {
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  };

    const fetchStats = async () => {
    if (!companyId || !userId) return;
    try {
        setLoading(true);
        setErr(null);
        const { from, to } = computeRange();

        const url = `${BACKEND_URL}/api/stats/staff/me?companyId=${companyId}&from=${from}&to=${to}`;
        const resp = await axios.get<APIResp>(url, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'x-user-id': String(userId), // users.id
        },
        });

        setData(resp.data); // ✅ use the response
    } catch (e: any) {
        setErr(e?.response?.data?.error || e?.message || 'Failed to load stats.');
    } finally {
        setLoading(false);
    }
    };

  React.useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, userId, range]);

  const k = data?.kpis;

  const Badge: React.FC<{ label: string; value: string | number; color?: 'green' | 'blue' | 'orange' | 'red' }> = ({ label, value, color='blue' }) => {
    const map: any = {
      green: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
      red: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
    };
    return <span className={`px-2 py-1 rounded text-xs ${map[color]}`}>{label}: <b>{value}</b></span>;
  };

  const RangeChip: React.FC<{ v: 'week'|'month'|'30d'; children: React.ReactNode }> = ({ v, children }) => (
    <button
      onClick={() => setRange(v)}
      className={`px-3 py-1 rounded-full text-sm border ${
        range === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-700'
      }`}
    >
      {children}
    </button>
  );

  const content = (
    <div className="p-4 pb-16 space-y-4">
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">My Stats</h1>
          <div className="flex gap-2">
            <RangeChip v="week">Week</RangeChip>
            <RangeChip v="month">Month</RangeChip>
            <RangeChip v="30d">30d</RangeChip>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Range: {data?.range?.from?.slice(0,10)} → {data?.range?.to?.slice(0,10)}
        </p>
      </Card>

      {/* KPI Tiles */}
      <Card className="p-4 rounded-2xl">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : err ? (
          <p className="text-sm text-red-600">{err}</p>
        ) : k ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-xl p-3">
              <div className="text-xs text-gray-500">Assigned</div>
              <div className="text-2xl font-bold">{k.assigned}</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-xs text-gray-500">Hours</div>
              <div className="text-2xl font-bold">{k.hoursWorked.toFixed(1)}</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-xs text-gray-500">Attendance</div>
              <div className="text-2xl font-bold">{k.attendanceRate}%</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-xs text-gray-500">On-time Book-On</div>
              <div className="text-2xl font-bold">{k.onTimeRate}%</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-xs text-gray-500">Book-OFF</div>
              <div className="text-2xl font-bold">{k.bookOffRate}%</div>
            </div>
            <div className="border rounded-xl p-3">
              <div className="text-xs text-gray-500">Avg ETA (min)</div>
              <div className="text-2xl font-bold">{k.avgEtaMin === null ? '—' : Math.round(k.avgEtaMin)}</div>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Compliance */}
      <Card className="p-4 rounded-2xl">
        <h2 className="text-lg font-semibold mb-2">Compliance</h2>
        {!k ? (
          <p className="text-sm text-gray-500">—</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Badge label="Check-calls" value={`${k.checkCallCompliance.rate}%`} color="blue" />
            <Badge label="Checkpoints" value={`${k.checkpointCompliance.rate}%`} color="green" />
            <Badge label="Today Active" value={k.today.active} color="orange" />
            <Badge label="Today Completed" value={k.today.completed} color="green" />
            <Badge label="Today Pending" value={k.today.pending} color="red" />
          </div>
        )}
      </Card>

      {/* Latest Telemetry + Top sites */}
      <Card className="p-4 rounded-2xl">
        <h2 className="text-lg font-semibold mb-2">Location & Sites</h2>
        <div className="grid grid-cols-1 gap-3">
          <div className="border rounded-xl p-3">
            <div className="text-sm font-medium mb-1">Latest Telemetry</div>
            {!data?.latestTelemetry ? (
              <p className="text-sm text-gray-500">No recent location.</p>
            ) : (
              <div className="text-sm space-y-1">
                <p>Lat: {Number(data.latestTelemetry.location_lat).toFixed(6)}</p>
                <p>Lng: {Number(data.latestTelemetry.location_long).toFixed(6)}</p>
                {data.latestTelemetry.accuracy_m != null && <p>Accuracy: {data.latestTelemetry.accuracy_m} m</p>}
                {data.latestTelemetry.recorded_at && (
                  <p>Time: {new Date(data.latestTelemetry.recorded_at).toLocaleString()}</p>
                )}
                <a
                  className="text-blue-600 underline"
                  href={`https://maps.google.com/?q=${data.latestTelemetry.location_lat},${data.latestTelemetry.location_long}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>

          <div className="border rounded-xl p-3">
            <div className="text-sm font-medium mb-1">Top Sites (range)</div>
            {!data?.topSites?.length ? (
              <p className="text-sm text-gray-500">—</p>
            ) : (
              <ul className="text-sm list-disc ml-5">
                {data.topSites.map((s) => (
                  <li key={s.site_id}>
                    {s.site_name} <span className="text-gray-500">({s.cnt})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      {/* Recent shifts */}
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Shifts</h2>
          <Link to="/staff/jobs" className="text-sm underline text-blue-600">See all</Link>
        </div>
        {!data?.recentShifts?.length ? (
          <p className="text-sm text-gray-500 mt-2">Nothing to show.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {data.recentShifts.map((r) => (
              <div key={r.id} className="border rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.site_name}</div>
                    <div className="text-xs text-gray-500">
                      {r.shift_date ? new Date(r.shift_date).toLocaleDateString() : '—'} • {r.scheduled_start_time?.slice(0,5) ?? '—'}–{r.scheduled_end_time?.slice(0,5) ?? '—'}
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <Text size="sm" highlight={r.assignment_status === 'active' ? 'green' : r.assignment_status === 'completed' ? 'blue' : 'red'} className="capitalize">
                      {r.assignment_status}
                    </Text>
                    <Text size="sm" highlight={r.employee_shift_status === 'confirmed' ? 'yellow' : 'orange'} className="capitalize block">
                      {r.employee_shift_status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </Text>
                  </div>
                </div>
                <div className="mt-2">
                  <Link to={`/staff/telemetry/${r.id}`}>
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
      <OneColumnLayout content={content} padding={6} />
      <StaffBottomNav />
    </MobileAppShell>
  );
};

export default StaffStats;
