import React from 'react';
import Card from '../Card';
import Button from '../Button';
import { fetchLatest, fetchTrail } from '../../utils/telemetry';

type Latest = {
  lat: number;
  lng: number;
  accuracy_m?: number | null;
  recorded_at?: string;
};

type Props = {
  assignmentId: number;
  token?: string;
};

const Trail: React.FC<Props> = ({ assignmentId, token }) => {
  const [latest, setLatest] = React.useState<Latest | null>(null);
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setErr(null);

      const [l, t] = await Promise.all([
        fetchLatest(assignmentId, token),             // { ok:true, data:null|{...} }
        fetchTrail(assignmentId, undefined, 100, token), // { ok:true, data:[...] }
      ]);

      const lrow = l?.data;
      if (lrow) {
        setLatest({
          lat: Number(lrow.location_lat),
          lng: Number(lrow.location_long),
          accuracy_m: lrow.accuracy_m ?? null,
          recorded_at: lrow.recorded_at,
        });
      } else {
        setLatest(null);
      }

      setRows(Array.isArray(t?.data) ? t.data : []);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load trail.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, token]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Latest & Trail</h2>
        <Button onClick={refresh} size="small" icon="undo">
          Refresh
        </Button>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latest */}
        <div className="border rounded p-3">
          <h3 className="font-medium mb-2">Latest</h3>
          {!latest ? (
            <p className="text-sm text-gray-500">No telemetry yet.</p>
          ) : (
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Lat:</span> {latest.lat.toFixed(6)}</p>
              <p><span className="font-medium">Lng:</span> {latest.lng.toFixed(6)}</p>
              {latest.accuracy_m != null && (
                <p><span className="font-medium">Accuracy:</span> {latest.accuracy_m} m</p>
              )}
              {latest.recorded_at && (
                <p><span className="font-medium">Time:</span> {new Date(latest.recorded_at).toLocaleString()}</p>
              )}
              <a
                className="text-blue-600 underline"
                href={`https://maps.google.com/?q=${latest.lat},${latest.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
          )}
        </div>

        {/* Trail table */}
        <div className="border rounded p-3 overflow-auto">
          <h3 className="font-medium mb-2">Recent Trail (max 100)</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">No points.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1 pr-2">#</th>
                  <th className="py-1 pr-2">Time</th>
                  <th className="py-1 pr-2">Lat</th>
                  <th className="py-1 pr-2">Lng</th>
                  <th className="py-1 pr-2">Acc (m)</th>
                  <th className="py-1 pr-2">Speed (m/s)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.movement_log_id ?? i} className="border-b last:border-0">
                    <td className="py-1 pr-2">{i + 1}</td>
                    <td className="py-1 pr-2">
                      {r.recorded_at ? new Date(r.recorded_at).toLocaleString() : '-'}
                    </td>
                    <td className="py-1 pr-2">{Number(r.location_lat).toFixed(6)}</td>
                    <td className="py-1 pr-2">{Number(r.location_long).toFixed(6)}</td>
                    <td className="py-1 pr-2">{r.accuracy_m ?? '-'}</td>
                    <td className="py-1 pr-2">{r.speed_mps ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Trail;
