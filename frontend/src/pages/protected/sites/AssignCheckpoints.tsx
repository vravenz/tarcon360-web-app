// src/pages/sites/AssignCheckpoints.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Text from '../../../components/Text';
import InputField from '../../../components/InputField';
import { BACKEND_URL } from '../../../config';
import { useTheme } from '../../../context/ThemeContext';

/* ---------- types -------------------------------------------------- */
interface SiteCheckpoint {
  checkpoint_id?: number;
  checkpoint_number: number;
  checkpoint_name?: string;
  scheduled_check_time?: string | null; // HH:mm:ss from API
  qr_token: string;                     // always present
}
interface Props {
  siteId: number;
}

/* =================================================================== */
const AssignCheckpoints: React.FC<Props> = ({ siteId }) => {
  const { theme } = useTheme();

  /* --------------- state ----------------------------------------- */
  const [list, setList] = useState<SiteCheckpoint[]>([]);
  const [num, setNum] = useState(1);
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  /* --------------- fetch checkpoints ----------------------------- */
  useEffect(() => {
    (async () => {
      const { data } = await axios.get<SiteCheckpoint[]>(
        `${BACKEND_URL}/api/sites/${siteId}/checkpoints`
      );
      setList(data);
      setNum(Math.max(0, ...data.map((c) => c.checkpoint_number)) + 1);
    })();
  }, [siteId]);

  /* --------------- create checkpoint ----------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!time) {
      setMsg('Select a time.');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${BACKEND_URL}/api/sites/${siteId}/checkpoints`, {
        checkpoint_number: num,
        checkpoint_name: name || null,
        scheduled_check_time: time || null,
      });
      setMsg('Checkpoint saved ✔');
      setName('');
      setTime('');

      const { data } = await axios.get<SiteCheckpoint[]>(
        `${BACKEND_URL}/api/sites/${siteId}/checkpoints`
      );
      setList(data);
      setNum(Math.max(0, ...data.map((c) => c.checkpoint_number)) + 1);
    } catch (err: any) {
      setMsg(
        err.response?.data?.error ??
        err.response?.data?.message ??
        'Could not save checkpoint'
      );
    } finally {
      setSaving(false);
    }
  };

  /* --------------- download helper ------------------------------- */
  const downloadPng = (token: string, label: string) => {
    const canvas = document.getElementById(`qr-${token}`) as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `${label}.png`;
    a.click();
  };

  /* --------------- UI -------------------------------------------- */
  return (
    <div className="space-y-4">
      <Text isHeading size="xl">Assign Checkpoints</Text>

      {/* ---------- new checkpoint form ---------- */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          type="number"
          name="checkpointNumber"
          label="Number"
          value={num}
          onChange={(e) => setNum(+e.target.value)}
          required
        />

        <InputField
          type="text"
          name="checkpointName"
          label="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <InputField
          type="time"
          name="scheduledTime"
          label="Scheduled Time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />

        <div className="md:col-span-2 flex justify-end">
          <Button
            type="submit"
            size="medium"
            color="submit"
            icon="schedule"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>

      {msg && <p className="text-sm text-emerald-600">{msg}</p>}

      {/* ---------- existing checkpoints w/ QR ---------- */}
      <Text isHeading size="lg">Existing Checkpoints</Text>
      {list.length === 0 ? (
        <p className="text-gray-500">– none yet –</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const label =
              c.checkpoint_name?.trim()
                ? `${c.checkpoint_number}. ${c.checkpoint_name}`
                : `Checkpoint ${c.checkpoint_number}`;

            return (
              <Card
                key={c.checkpoint_id}
                className="flex flex-col items-center space-y-3"
                padding="p-5"
              >
                <Text isHeading size="lg" newLine className="text-center">
                  {label}
                </Text>

                <QRCodeCanvas
                  id={`qr-${c.qr_token}`}
                  value={c.qr_token}
                  size={160}
                  level="M"
                  bgColor={theme === 'dark' ? '#1F2937' : '#FFFFFF'}
                  fgColor={theme === 'dark' ? '#F9FAFB' : '#000000'}
                />

                {c.scheduled_check_time && (
                  <span className="text-xs text-gray-500">
                    {c.scheduled_check_time}
                  </span>
                )}

                <Button
                  icon="download"
                  size="small"
                  color="view"
                  onClick={() =>
                    downloadPng(c.qr_token, label.replace(/\s+/g, '_'))
                  }
                >
                  Download
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignCheckpoints;
