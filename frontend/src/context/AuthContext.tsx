import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface AuthInfo {
  userId: number | null;
  companyId: number | null;
  role: string | null;
  email: string | null;
  isActive: boolean | null;
  isDormant: boolean | null;
  branchId: number | null;
}

const AuthContext = createContext<AuthInfo | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authInfo, setAuthInfo] = useState<AuthInfo>({
    userId: null,
    companyId: null,
    role: null,
    email: null,
    isActive: null,
    isDormant: null,
    branchId: null,
  });

  useEffect(() => {
    const storedData = localStorage.getItem('user');
    console.log('storedData =', storedData);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setAuthInfo({
        userId: parsedData.user?.id,
        companyId: parsedData.user?.company_id,
        role: parsedData.user?.role,
        email: parsedData.user?.email,
        isActive: parsedData.user?.is_active,
        isDormant: parsedData.user?.is_dormant,
        branchId: parsedData.user?.branch_id,
      });
    } else {
      // Clear context if no user data is stored which implies user is not logged in or session is not valid
      setAuthInfo({
        userId: null,
        companyId: null,
        role: null,
        email: null,
        isActive: null,
        isDormant: null,
        branchId: null,
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
