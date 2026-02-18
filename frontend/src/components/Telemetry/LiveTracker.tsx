import React from 'react';
import Button from '../Button';
import Card from '../Card';
import { TelemetryClient } from '../../utils/telemetry';

type Props = {
  companyId: number;
  assignmentId: number;
  token?: string;
};

const LiveTracker: React.FC<Props> = ({ companyId, assignmentId, token }) => {
  const clientRef = React.useRef<TelemetryClient | null>(null);
  const [running, setRunning] = React.useState(false);
  const [status, setStatus] = React.useState('Idle');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => clientRef.current?.stop();
  }, []);

  const start = () => {
    try {
      const client = new TelemetryClient();
      client.start({
        companyId,
        assignmentId,
        token,
        postIntervalMs: 10000,
        highAccuracy: true,
        onStatus: (msg) => setStatus(msg),
        onError: (msg) => setError(msg),
      });
      clientRef.current = client;
      setRunning(true);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to start telemetry.');
    }
  };

  const stop = () => {
    clientRef.current?.stop();
    setRunning(false);
    setStatus('Stopped');
  };

  return (
    <Card className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">Live Telemetry</h2>
      <p className="text-sm text-gray-500">
        Streams browser location every ~10s to the assignment.
      </p>

      <div className="flex items-center gap-3">
        {!running ? (
          <Button onClick={start} color="submit" size="small" icon="accept">Start</Button>
        ) : (
          <Button onClick={stop} color="delete" size="small" icon="cancel">Stop</Button>
        )}
        <span className={`text-sm ${running ? 'text-green-600' : 'text-gray-500'}`}>
          Status: {running ? 'Running' : 'Stopped'}
        </span>
      </div>

      {status && <p className="text-sm text-blue-600">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  );
};

export default LiveTracker;
