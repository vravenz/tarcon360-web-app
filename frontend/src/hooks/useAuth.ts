import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Use the navigate function from react-router-dom to redirect users

interface AuthInfo {
  userId: number | null;
  companyId: number | null;
  role: string | null;
  email: string | null;
  userPin: string | null;
  isActive: boolean | null;
  isDormant: boolean | null;
  branchId: number | null;
}

export const useAuth = () => {
  const [authInfo, setAuthInfo] = useState<AuthInfo>({
    userId: null,
    companyId: null,
    role: null,
    email: null,
    userPin: null,
    isActive: null,
    isDormant: null,
    branchId: null,
  });
  const navigate = useNavigate(); // This hook is used to navigate between routes
  const previousRole = useRef<string | null>(null); // useRef to store the previous role for comparison

  const resetAuthInfo = () => {
    setAuthInfo({
      userId: null,
      companyId: null,
      role: null,
      email: null,
      userPin: null,
      isActive: null,
      isDormant: null,
      branchId: null,
    });
  };

  useEffect(() => {
    const updateAuthState = (userData: any) => {
      if (userData && userData.token && userData.user) {
        if (previousRole.current && userData.user.role !== previousRole.current) {
          // If there is a role change, reset auth info and navigate to the login page or appropriate dashboard
          resetAuthInfo();
          navigate('/'); // Redirect to login or the default route if roles are mismatched
          return;
        }
        // Update the current role in useRef
        previousRole.current = userData.user.role;
        setAuthInfo({
          userId: userData.user.id,
          companyId: userData.user.company_id,
          role: userData.user.role,
          email: userData.user.email,
          userPin: userData.user.user_pin,
          isActive: userData.user.is_active,
          isDormant: userData.user.is_dormant,
          branchId: userData.user.branch_id,
        });
      } else {
        resetAuthInfo();
      }
    };

    const storedData = localStorage.getItem('user');
    if (storedData) {
      updateAuthState(JSON.parse(storedData));
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user') {
        if (event.newValue) {
          updateAuthState(JSON.parse(event.newValue));
        } else {
          resetAuthInfo();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  return authInfo;
};
