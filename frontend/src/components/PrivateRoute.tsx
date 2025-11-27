import React from 'react';
import { Navigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

interface PrivateRouteProps {
  redirectPath?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ redirectPath = '/' }) => {
  const user = localStorage.getItem('user');

  return user ? <Outlet /> : <Navigate to={redirectPath} replace />;
};

export default PrivateRoute;