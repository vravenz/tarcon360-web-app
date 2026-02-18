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

   book_on_at?: string | null;
  book_off_at?: string | null;
  book_on_photo?: string | null;
  book_off_photo?: string | null;
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

interface MovementLog {
  movement_log_id: number
  company_id: number
  roster_shift_assignment_id: number
  location_lat: number
  location_long: number
  accuracy_m: number | null
  speed_mps: number | null
  heading_deg: number | null
  altitude_m: number | null
  provider: string | null
  battery_pct: number | null
  is_mock: boolean
  recorded_at: string
}

const toNum = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

const normalizeMovementLog = (row: any): MovementLog | null => {
  if (!row) return null

  return {
    movement_log_id: Number(row.movement_log_id),
    company_id: Number(row.company_id),
    roster_shift_assignment_id: Number(row.roster_shift_assignment_id),

    // ✅ numeric -> number
    location_lat: toNum(row.location_lat) ?? 0,
    location_long: toNum(row.location_long) ?? 0,
    accuracy_m: toNum(row.accuracy_m),
    speed_mps: toNum(row.speed_mps),
    heading_deg: toNum(row.heading_deg),
    altitude_m: toNum(row.altitude_m),
    battery_pct: toNum(row.battery_pct),

    provider: row.provider ?? null,
    is_mock: !!row.is_mock,
    recorded_at: String(row.recorded_at),
  }
}

const normalizeTrail = (rows: any[]): MovementLog[] => {
  return (Array.isArray(rows) ? rows : [])
    .map(normalizeMovementLog)
    .filter((x): x is MovementLog => !!x)
}


type TelemetryLatestMap = Record<number, MovementLog | null>
type TelemetryTrailMap = Record<number, MovementLog[]>
type TelemetryOpenMap = Record<number, boolean>

const mapsLink = (lat?: number, lng?: number) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined
  return `https://www.google.com/maps?q=${lat},${lng}`
}

// Google Maps directions url with waypoints (polyline-ish via waypoints)
const routeLinkFromTrail = (trail: MovementLog[]) => {
  const pts = (Array.isArray(trail) ? trail : [])
    .map((p) => ({
      lat: Number(p.location_lat),
      lng: Number(p.location_long),
      t: new Date(p.recorded_at).getTime(),
      acc: p.accuracy_m ?? null,
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    // sort by time (just in case)
    .sort((a, b) => a.t - b.t)
    // remove noisy points (optional)
    .filter((p) => p.acc == null || p.acc <= 50)

  if (pts.length < 2) return undefined

  // Reduce points so Google Maps URL doesn't get too long.
  // Keep start/end + up to 20 intermediate waypoints.
  const MAX_WAYPOINTS = 20
  const start = pts[0]
  const end = pts[pts.length - 1]

  const middle = pts.slice(1, -1)
  const step = Math.max(1, Math.floor(middle.length / MAX_WAYPOINTS))
  const sampled = middle.filter((_, i) => i % step === 0).slice(0, MAX_WAYPOINTS)

  const origin = `${start.lat},${start.lng}`
  const destination = `${end.lat},${end.lng}`
  const waypoints =
    sampled.length > 0
      ? sampled.map((p) => `${p.lat},${p.lng}`).join("|")
      : ""

  const base = `https://www.google.com/maps/dir/?api=1&travelmode=walking`
  const url =
    waypoints.length > 0
      ? `${base}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
          destination
        )}&waypoints=${encodeURIComponent(waypoints)}`
      : `${base}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`

  return url
}

// ----- Helper Functions -----
const getEmployeePhotoUrl = (photo?: string): string | undefined => {
  if (!photo) return undefined;
  return photo.startsWith('http')
    ? photo
    : `${BACKEND_URL}/uploads/employee-photos/${photo}`;
};

const getBookPhotoUrl = (file?: string | null): string | undefined => {
  if (!file) return undefined;
  return `${BACKEND_URL}/uploads/book_photos/${file}`;
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

  const [telemetryLatest, setTelemetryLatest] = useState<TelemetryLatestMap>({})
  const [telemetryTrail, setTelemetryTrail] = useState<TelemetryTrailMap>({})
  const [trailOpen, setTrailOpen] = useState<TelemetryOpenMap>({})
  const [telemetryLoading, setTelemetryLoading] = useState<Record<number, boolean>>({})

const fetchLatestForAssignment = async (assignmentId: number) => {
  try {
    setTelemetryLoading((p) => ({ ...p, [assignmentId]: true }))
    const resp = await axios.get(`${BACKEND_URL}/api/tracking/latest/${assignmentId}`)
    const rowRaw = resp?.data?.data ?? null
    const row = normalizeMovementLog(rowRaw)
    setTelemetryLatest((p) => ({ ...p, [assignmentId]: row }))
  } catch (e) {
    console.error("fetchLatest telemetry failed:", e)
    setTelemetryLatest((p) => ({ ...p, [assignmentId]: null }))
  } finally {
    setTelemetryLoading((p) => ({ ...p, [assignmentId]: false }))
  }
}

const fetchTrailForAssignment = async (assignmentId: number) => {
  try {
    const resp = await axios.get(`${BACKEND_URL}/api/tracking/trail/${assignmentId}`, {
      params: { limit: 200 },
    })
    const rowsRaw = Array.isArray(resp?.data?.data) ? resp.data.data : []
    const rows = normalizeTrail(rowsRaw)
    setTelemetryTrail((p) => ({ ...p, [assignmentId]: rows }))

  } catch (e) {
    console.error("fetchTrail telemetry failed:", e)
    setTelemetryTrail((p) => ({ ...p, [assignmentId]: [] }))
  }
}

useEffect(() => {
  if (!data) return

  const activeAssignmentIds = data.shifts
    .flatMap((s) => s.activeAssignments)
    .map((a) => a.roster_shift_assignment_id)
    .filter((id) => Number.isFinite(id) && id > 0)

  if (!activeAssignmentIds.length) return

  let cancelled = false

  const tick = async () => {
    if (cancelled) return
    await Promise.all(activeAssignmentIds.map((id) => fetchLatestForAssignment(id)))
  }

  tick()
  const t = setInterval(tick, 10_000)

  return () => {
    cancelled = true
    clearInterval(t)
  }
}, [data])

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
                        const bookOnUrl = getBookPhotoUrl(assignment.book_on_photo);
                        const bookOffUrl = getBookPhotoUrl(assignment.book_off_photo);
                        const latest = telemetryLatest[assignment.roster_shift_assignment_id] ?? null
                        const isTeleLoading = telemetryLoading[assignment.roster_shift_assignment_id] ?? false
                        const open = trailOpen[assignment.roster_shift_assignment_id] ?? false
                        const trail = telemetryTrail[assignment.roster_shift_assignment_id] ?? []
                        const gmaps = mapsLink(latest?.location_lat, latest?.location_long)

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
                                 {/* Book On/Off timestamps */}
                              {assignment.book_on_at && (
                                <p className="text-xs mt-1">
                                  <strong>Book On:</strong> {new Date(assignment.book_on_at).toLocaleString()}
                                </p>
                              )}
                              {assignment.book_off_at && (
                                <p className="text-xs mt-1">
                                  <strong>Book Off:</strong> {new Date(assignment.book_off_at).toLocaleString()}
                                </p>
                              )}

                              {/* Book On/Off photos */}
                              {bookOnUrl && (
                                <a
                                  href={bookOnUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs underline mt-1"
                                >
                                  View Book On Photo
                                </a>
                              )}
                              {bookOffUrl && (
                                <a
                                  href={bookOffUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs underline mt-1"
                                >
                                  View Book Off Photo
                                </a>
                              )}

                                                    <div className="mt-2 w-full text-xs opacity-95">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Telemetry</span>

                          <div className="flex items-center gap-2">
                            <button
                              className="underline"
                              onClick={async () => {
                                const id = assignment.roster_shift_assignment_id
                                const next = !(trailOpen[id] ?? false)
                                setTrailOpen((p) => ({ ...p, [id]: next }))
                                if (next) await fetchTrailForAssignment(id)
                              }}
                              type="button"
                            >
                              {open ? "Hide Trail" : "View Trail"}
                            </button>

                            <button
                              className="underline"
                              onClick={() => fetchLatestForAssignment(assignment.roster_shift_assignment_id)}
                              type="button"
                            >
                              Refresh
                            </button>
                          </div>
                        </div>

                        {isTeleLoading ? (
                          <div className="mt-1">Loading location...</div>
                        ) : latest ? (
                          <div className="mt-1 space-y-1">
                            <div>
                              <strong>Last Ping:</strong> {new Date(latest.recorded_at).toLocaleString()}
                            </div>
                            <div>
                             <strong>Lat/Lng:</strong>{" "}
                              {Number.isFinite(latest.location_lat) ? latest.location_lat.toFixed(6) : "-"},{" "}
                              {Number.isFinite(latest.location_long) ? latest.location_long.toFixed(6) : "-"}

                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              <span><strong>Accuracy:</strong> {latest.accuracy_m ?? "-"} m</span>
                              <span><strong>Speed:</strong> {latest.speed_mps ?? "-"} m/s</span>
                              <span><strong>Provider:</strong> {latest.provider ?? "-"}</span>
                              <span><strong>Mock:</strong> {latest.is_mock ? "Yes" : "No"}</span>
                            </div>

                            {gmaps && (
                              <a href={gmaps} target="_blank" rel="noreferrer" className="underline">
                                Open in Google Maps
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1">No telemetry received yet.</div>
                        )}

                        {/* Trail (simple table-like list) */}
 {open ? (
  <div className="mt-2 rounded-md bg-black/20 p-2 max-h-[260px] overflow-auto">
    {/* ✅ Route button */}
    {trail.length >= 2 && (
      <div className="mb-2 flex items-center justify-between">
        <span className="opacity-90">Trail points: {trail.length}</span>

        {routeLinkFromTrail(trail) && (
          <a
            href={routeLinkFromTrail(trail)}
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            Open Route in Google Maps
          </a>
        )}
      </div>
    )}

    {trail.length === 0 ? (
      <div>No trail data.</div>
    ) : (
      <div className="space-y-1">
        {trail.slice(0, 50).map((r) => (
          <div key={r.movement_log_id} className="flex flex-col border-b border-white/10 pb-1">
            <div className="flex justify-between">
              <span>{new Date(r.recorded_at).toLocaleTimeString()}</span>
              <span className="opacity-80">{r.accuracy_m ?? "-"}m</span>
            </div>
            <div className="opacity-90">
              {Number.isFinite(r.location_lat) ? r.location_lat.toFixed(6) : "-"},{" "}
              {Number.isFinite(r.location_long) ? r.location_long.toFixed(6) : "-"}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
) : null}

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
                          const bookOnUrl = getBookPhotoUrl(assignment.book_on_photo);
                          const bookOffUrl = getBookPhotoUrl(assignment.book_off_photo);

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
