// frontend/src/pages/protected/staff/TelemetryPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../components/StaffNavbar';
import MobileAppShell from '../../../components/layout/MobileAppShell';
import OneColumnLayout from '../../../components/OneColumnLayout';
import StaffBottomNav from '../../../components/StaffBottomNav';
import { useAuth } from '../../../hooks/useAuth';
import Card from '../../../components/Card';

import LiveTracker from '../../../components/Telemetry/LiveTracker';
import Trail from '../../../components/Telemetry/Trail';
import ETASetter from '../../../components/Telemetry/ETASetter';
import ReminderConfirm from '../../../components/Telemetry/ReminderConfirm';
import BookOnOff from '../../../components/Telemetry/BookOnOff';

const TelemetryPage: React.FC = () => {
  const { companyId, token, userId } = useAuth() as any;
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!assignmentId) navigate('/staff/jobs');
  }, [assignmentId, navigate]);

  const aid = assignmentId ? Number(assignmentId) : NaN;
  const invalidContext = !Number.isFinite(aid) || !companyId;

  // --- Mobile-first, single-column content (same structure as StaffJobs) ---
  const content = (
    <div className="pb-16 space-y-3">
      {/* Header card */}
      <Card className="p-4 space-y-1 rounded-2xl">
        <h1 className="text-xl font-bold">Guard Telemetry</h1>
        <p className="text-sm text-gray-500">
          Assignment ID: {assignmentId} {Number.isNaN(aid) && '(invalid)'}
        </p>
      </Card>

      {invalidContext ? (
        <Card className="p-4 rounded-2xl">
          <p className="text-red-600 text-sm">
            Invalid assignment or company. Please open from a valid job/roster context.
          </p>
        </Card>
      ) : (
        <>
          {/* ETA input */}
          <ETASetter assignmentId={aid} userId={userId} />

          {/* Book On / Off with front camera */}
          <BookOnOff assignmentId={aid} token={token} userId={userId} />

          {/* Live telemetry stream */}
          <LiveTracker companyId={companyId} assignmentId={aid} token={token} />

          {/* Trail history */}
          <Trail assignmentId={aid} token={token} />

          {/* Reminder confirmations */}
          <ReminderConfirm assignmentId={aid} userId={userId} />
        </>
      )}
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

export default TelemetryPage;
