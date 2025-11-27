// frontend/src/pages/protected/staff/TelemetryPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../components/StaffNavbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import Card from '../../../components/Card';
import LiveTracker from '../../../components/Telemetry/LiveTracker';
import Trail from '../../../components/Telemetry/Trail';
import ETASetter from '../../../components/Telemetry/ETASetter';
import ReminderConfirm from '../../../components/Telemetry/ReminderConfirm';
import BookOnOff from '../../../components/Telemetry/BookOnOff'; // <-- NEW

const TelemetryPage: React.FC = () => {
  const { theme } = useTheme();
  const { companyId, token, role, userId } = useAuth() as any;
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect if no assignment provided
    if (!assignmentId) navigate('/staff/jobs');
  }, [assignmentId, navigate]);

  const aid = assignmentId ? Number(assignmentId) : NaN;

  const main = (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="p-4">
        <h1 className="text-2xl font-bold">Guard Telemetry</h1>
        <p className="text-sm text-gray-500">
          Assignment ID: {assignmentId} {Number.isNaN(aid) && '(invalid)'}
        </p>
      </Card>

      {/* Validation */}
      {!Number.isFinite(aid) || !companyId ? (
        <Card className="p-4">
          <p className="text-red-600 text-sm">
            Invalid assignment or company. Please open from a valid job/roster context.
          </p>
        </Card>
      ) : (
        <>
          {/* ETA input block */}
          <ETASetter assignmentId={aid} userId={userId} />

          {/* Book On / Off with live front camera (web & mobile) */}
          <BookOnOff assignmentId={aid} token={token} userId={userId} />

          {/* Live position tracking */}
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
    <div
      className={`${
        theme === 'dark'
          ? 'bg-dark-background text-white'
          : 'bg-light-background text-gray-900'
      } min-h-screen`}
    >
      <Navbar />
      <TwoColumnLayout sidebarContent={<SideNavbar />} mainContent={main} />
    </div>
  );
};

export default TelemetryPage;
