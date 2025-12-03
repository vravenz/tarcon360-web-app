// frontend/src/pages/protected/staff/Profile.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/StaffNavbar';
import MobileAppShell from '../../../components/layout/MobileAppShell';
import StaffBottomNav from '../../../components/StaffBottomNav';
import OneColumnLayout from '../../../components/OneColumnLayout';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import Avatar from '../../../assets/images/avatar.jpg';
import { isStaff } from '../../../utils/checkRole';

const Profile: React.FC = () => {
  const { theme } = useTheme();
  const { userId, email, companyId, userPin, role, branchId } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isStaff()) navigate('/');
  }, [navigate]);

  const backgroundColor = theme === 'dark' ? 'bg-dark-background' : 'bg-light-background';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtleText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const content = (
    <div className="space-y-6">
      {/* Profile header */}
      <Card className="p-6 rounded-2xl text-center">
        <div className="flex flex-col items-center gap-3">
          <img
            src={Avatar}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover ring-2 ring-blue-500"
            loading="lazy"
            decoding="async"
          />
          <h1 className="text-2xl font-bold mt-1">My Profile</h1>
          <p className={`text-sm ${subtleText}`}>{email}</p>
        </div>
      </Card>

      {/* Info Section */}
      <Card className="p-6 rounded-2xl space-y-3">
        <h2 className="text-lg font-semibold mb-2">Account Information</h2>

        <div className={`border-b ${borderColor} pb-2`}>
          <p className="text-sm font-medium">User ID</p>
          <p className={`text-base ${subtleText}`}>{userId}</p>
        </div>

        <div className={`border-b ${borderColor} pb-2`}>
          <p className="text-sm font-medium">Company ID</p>
          <p className={`text-base ${subtleText}`}>{companyId}</p>
        </div>

        <div className={`border-b ${borderColor} pb-2`}>
          <p className="text-sm font-medium">Branch ID</p>
          <p className={`text-base ${subtleText}`}>{branchId}</p>
        </div>

        <div className={`border-b ${borderColor} pb-2`}>
          <p className="text-sm font-medium">PIN</p>
          <p className={`text-base ${subtleText}`}>{userPin}</p>
        </div>

        <div>
          <p className="text-sm font-medium">Role</p>
          <p className={`text-base capitalize ${subtleText}`}>{role}</p>
        </div>
      </Card>

      {/* Action Buttons */}
      <Card className="p-6 rounded-2xl flex flex-col gap-3">
        <Button icon="edit" size="medium" onClick={() => alert('Edit feature coming soon')}>
          Edit Profile
        </Button>
        <Button icon="lock" size="medium" variant="outline" onClick={() => alert('Change PIN feature coming soon')}>
          Change PIN
        </Button>
        <Button icon="cancel" size="medium" color="delete" onClick={handleLogout}>
          Logout
        </Button>
      </Card>
    </div>
  );

  return (
    <MobileAppShell>
      <Navbar />
      <OneColumnLayout content={content} padding={6} />
      <StaffBottomNav />
    </MobileAppShell>
  );
};

export default Profile;
