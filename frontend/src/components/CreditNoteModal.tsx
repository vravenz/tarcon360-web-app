import React, { useState } from 'react';
import Card from './Card';
import InputField from './InputField';
import Button from './Button';
import axios from 'axios';
import { BACKEND_URL } from '../config';

type Line = {
  description: string;
  role?: string;
  qty_hours: string;
  unit_rate: string;
  site_id?: string;
  roster_shift_assignment_id?: string;
};

interface Props {
  invoiceGroupId: number;
  linkInvoiceId?: number;
  onClose: () => void;
  onCreated: () => void;
}

const CreditNoteModal: React.FC<Props> = ({ invoiceGroupId, linkInvoiceId, onClose, onCreated }) => {
  const [vatRate, setVatRate] = useState('20');
  const [reason, setReason] = useState('');
  const [lines, setLines] = useState<Line[]>([
    { description: '', role: 'guard', qty_hours: '0', unit_rate: '0' }
  ]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const addLine = () => setLines((p) => [...p, { description: '', role: 'guard', qty_hours: '0', unit_rate: '0' }]);
  const update = (idx: number, key: keyof Line, value: string) => {
    setLines((p) => p.map((l, i) => i === idx ? { ...l, [key]: value } : l));
  };
  const remove = (idx: number) => setLines((p) => p.filter((_, i) => i !== idx));

  const submit = async () => {
    setMsg(null);
    if (lines.length === 0) { setMsg('Add at least one line.'); return; }
    try {
      setBusy(true);
      await axios.post(`${BACKEND_URL}/api/credit-notes`, {
        invoice_group_id: invoiceGroupId,
        link_invoice_id: linkInvoiceId ?? null,
        reason: reason || null,
        vat_rate_pct: Number(vatRate),
        lines: lines.map(l => ({
          description: l.description,
          role: l.role || null,
          qty_hours: Number(l.qty_hours),
          unit_rate: Number(l.unit_rate),
          site_id: l.site_id ? Number(l.site_id) : null,
          roster_shift_assignment_id: l.roster_shift_assignment_id ? Number(l.roster_shift_assignment_id) : null
        }))
      });
      onCreated();
    } catch (e: any) {
      console.error(e);
      setMsg(e?.response?.data?.error || 'Failed to create credit note.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Create Credit Note</h3>
          <button onClick={onClose} className="text-sm underline">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InputField type="number" name="vat" label="VAT %" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
          <InputField type="text" name="reason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div className="space-y-2">
          {lines.map((ln, idx) => (
            <Card key={idx} className="p-3 grid grid-cols-1 md:grid-cols-6 gap-2">
              <InputField type="text" name={`desc_${idx}`} label="Description" value={ln.description} onChange={(e)=>update(idx,'description', e.target.value)} />
              <InputField type="text" name={`role_${idx}`} label="Role" value={ln.role || ''} onChange={(e)=>update(idx,'role', e.target.value)} />
              <InputField type="number" name={`qty_${idx}`} label="Qty Hours" value={ln.qty_hours} onChange={(e)=>update(idx,'qty_hours', e.target.value)} />
              <InputField type="number" name={`rate_${idx}`} label="Unit Rate" value={ln.unit_rate} onChange={(e)=>update(idx,'unit_rate', e.target.value)} />
              <InputField type="number" name={`site_${idx}`} label="Site ID (opt)" value={ln.site_id || ''} onChange={(e)=>update(idx,'site_id', e.target.value)} />
              <div className="flex items-end">
                <Button type="button" onClick={() => remove(idx)} size="small">Remove</Button>
              </div>
            </Card>
          ))}
          <Button type="button" onClick={addLine} size="small" icon="plus">Add Line</Button>
        </div>

        {msg && <div className="text-sm">{msg}</div>}
        <div className="flex justify-end">
          <Button onClick={submit} color="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Credit Note'}</Button>
        </div>
      </Card>
    </div>
  );
};

export default CreditNoteModal;
