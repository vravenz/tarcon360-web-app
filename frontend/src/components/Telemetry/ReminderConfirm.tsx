import React from 'react';
import Card from '../Card';
import Button from '../Button';
import { sendReminderConfirmation } from '../../utils/tracking';

type Props = {
  assignmentId: number;
  userId?: number;
};

const ReminderConfirm: React.FC<Props> = ({ assignmentId, userId }) => {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const act = async (type: 'shift_created'|'24h'|'2h', response: 'accept'|'decline') => {
    try {
      setBusy(`${type}:${response}`);
      setMsg(null);
      setErr(null);
      await sendReminderConfirmation(assignmentId, type, response, userId);
      setMsg(`Recorded: ${type} → ${response}`);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to record confirmation.');
    } finally {
      setBusy(null);
    }
  };

  const B = ({
    type, response, label,
  }: {type:'shift_created'|'24h'|'2h'; response:'accept'|'decline'; label:string}) => (
    <Button
      size="small"
      onClick={() => act(type, response)}
      disabled={busy !== null}
      icon={response === 'accept' ? 'accept' : 'cancel'}
    >
      {busy === `${type}:${response}` ? 'Saving…' : label}
    </Button>
  );

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold text-lg">Reminder Confirmations</h3>

      <div className="flex flex-wrap gap-2">
        <B type="shift_created" response="accept"  label="Shift Created: Accept" />
        <B type="shift_created" response="decline" label="Shift Created: Decline" />
        <B type="24h"           response="accept"  label="24h: Accept" />
        <B type="24h"           response="decline" label="24h: Decline" />
        <B type="2h"            response="accept"  label="2h: Accept" />
        <B type="2h"            response="decline" label="2h: Decline" />
      </div>

      {msg && <p className="text-green-600 text-sm">{msg}</p>}
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </Card>
  );
};

export default ReminderConfirm;
