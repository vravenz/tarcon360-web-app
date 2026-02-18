import React from 'react';
import Card from '../Card';
import Button from '../Button';
import { setETA } from '../../utils/tracking';

type Props = {
  assignmentId: number;
  userId?: number;
};

const ETASetter: React.FC<Props> = ({ assignmentId, userId }) => {
  const [eta, setEta] = React.useState<string>(''); // minutes
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const onSave = async () => {
    try {
      setSaving(true);
      setMsg(null);
      setErr(null);
      const val = eta === '' ? null : Math.max(0, Math.floor(Number(eta)));
      await setETA(assignmentId, val, userId);
      setMsg(val === null ? 'ETA cleared.' : `ETA set to ${val} min.`);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to save ETA.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold text-lg">ETA to Site</h3>
      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Minutes before arrival"
          value={eta}
          onChange={(e) => setEta(e.target.value)}
          className="border rounded px-3 py-2 w-56 bg-transparent"
        />
        <Button size="small" onClick={onSave} disabled={saving} icon="send">
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="small" onClick={() => setEta('')} variant="outline" icon="undo">
          Clear
        </Button>
      </div>
      {msg && <p className="text-green-600 text-sm">{msg}</p>}
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </Card>
  );
};

export default ETASetter;
