// src/pages/sites/CheckCalls.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../../config';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import InputField from '../../../components/InputField';
import ViewAsTable from '../../../components/ViewAsTable';

interface CheckCall {
  schedule_id?: number;
  scheduled_time: string; // 'HH:MM:SS'
}

interface Props {
  siteId: number;
}

const CheckCalls: React.FC<Props> = ({ siteId }) => {
  const [calls, setCalls] = useState<CheckCall[]>([]);
  const [time, setTime] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  /* ─ fetch list on mount ─────────────────────────────── */
  useEffect(() => {
    (async () => {
      const { data } = await axios.get<CheckCall[]>(
        `${BACKEND_URL}/api/sites/${siteId}/check-calls`
      );
      setCalls(data);
    })();
  }, [siteId]);

  /* ─ submit new time ─────────────────────────────────── */
  const addCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) return;

    setBusy(true);
    try {
      await axios.post(`${BACKEND_URL}/api/sites/${siteId}/check-calls`, {
        scheduled_time: time, // HH:MM
      });
      const { data } = await axios.get<CheckCall[]>(
        `${BACKEND_URL}/api/sites/${siteId}/check-calls`
      );
      setCalls(data);
      setTime('');
      setMsg('Added ✔');
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Could not add');
    } finally {
      setBusy(false);
    }
  };

  /* ─ table prep ──────────────────────────────────────── */
  const tableColumns = [
    { label: 'S.No', accessor: 'serial' },
    { label: 'Check Call Time', accessor: 'time' },
  ];
  const tableData = calls.map((c, idx) => ({
    serial: idx + 1,
    time: c.scheduled_time.slice(0, 5),
  }));

  /* ─ UI ──────────────────────────────────────────────── */
  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-xl font-bold">Check Calls</h2>

      {/* add form */}
      <form onSubmit={addCall} className="flex items-center gap-4 flex-wrap">
        <div className="w-40">
          <InputField
            type="time"
            name="checkTime"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={busy}
          size="small"
          color="submit"
          icon="plus"
        >
          Add
        </Button>

        {msg && <span className="text-sm text-emerald-600">{msg}</span>}
      </form>

      {/* list */}
      {tableData.length === 0 ? (
        <p className="text-gray-500">– no calls yet –</p>
      ) : (
        <ViewAsTable data={tableData} columns={tableColumns} />
      )}
    </Card>
  );
};

export default CheckCalls;
