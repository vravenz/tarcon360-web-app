// LoginPage.tsx
import React from 'react';
import AuthForm from '../../components/AuthForm';

const LoginPage: React.FC = () => {
  return (
    <div>
      <AuthForm type="login" />
    </div>
  );
};

export default LoginPage;