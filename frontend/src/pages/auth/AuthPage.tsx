import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../../components/AuthForm';
import Card from '../../components/Card';
import Text from '../../components/Text';
import ThemeToggle from '../../components/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

const AuthPage: React.FC = () => {
  const [currentForm, setCurrentForm] = useState<'login' | 'register' | 'subcontractor'>('login');
  const { theme } = useTheme();
  const navigate = useNavigate();

  const getButtonClass = (isActive: boolean) => {
    return `flex-1 p-4 text-center cursor-pointer font-semibold ${
      isActive ? `border-b-4 text-${theme === 'dark' ? 'blue-300' : 'blue-500'} border-${theme === 'dark' ? 'blue-300' : 'blue-500'}` : `text-${theme === 'dark' ? 'gray-400' : 'gray-500'}`
    }`;
  };

  const handleNavigation = (formType: 'login' | 'register' | 'subcontractor') => {
    setCurrentForm(formType);
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${
      theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'} relative`}>
      <Card className="w-full max-w-xl mx-auto">
        <div className="flex border-b mb-2">
          <button
            className={getButtonClass(currentForm === 'login')}
            onClick={() => handleNavigation('login')}
          >
            <Text color={currentForm === 'login' ? 'primary' : 'secondary'}>Login</Text>
          </button>
          <button
            className={getButtonClass(currentForm === 'register')}
            onClick={() => handleNavigation('register')}
          >
            <Text color={currentForm === 'register' ? 'primary' : 'secondary'}>Register</Text>
          </button>
          <button
            className={getButtonClass(currentForm === 'subcontractor')}
            onClick={() => handleNavigation('subcontractor')}
          >
            <Text color={currentForm === 'subcontractor' ? 'primary' : 'secondary'}>Subcontractor</Text>
          </button>
        </div>
        {currentForm === 'login' ? <AuthForm type="login" /> :
         currentForm === 'register' ? <AuthForm type="register" /> :
         currentForm === 'subcontractor' ? <AuthForm type="subcontractor" /> :
         <AuthForm type="login" />}
      </Card>
      <button
        onClick={() => navigate('/companies')}
        className="text-sm text-gray-500 hover:text-gray-400 mt-4 cursor-pointer">
        Apply for Jobs
      </button>
      <div className="absolute bottom-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default AuthPage;
