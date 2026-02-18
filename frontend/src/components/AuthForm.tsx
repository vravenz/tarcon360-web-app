import React, { ChangeEvent, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import InputField from './InputField';
import Button from './Button';
import { BACKEND_URL } from '../config';

interface Props {
  type: 'login' | 'register' | 'subcontractor';
}

const API_URL = `${BACKEND_URL}/api/auth/`;

const AuthForm: React.FC<Props> = ({ type }) => {
  const navigate = useNavigate();
  const isSubcontractor = type === 'subcontractor';
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    companyAddress: '',
    contactPerson: '',
    contactNumber: '',
    contactDepartment: '',
    email: '',
    password: '',
    isSubcontractor: type === 'subcontractor'
  });

  // Ensure checkbox is correctly checked for subcontractors upon initialization
  useEffect(() => {
    if (type === 'subcontractor') {
      setFormData(prev => ({ ...prev, isSubcontractor: true }));
    }
  }, [type]);

  const [error, setError] = useState('');
  const [userPin, setUserPin] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    if (type === 'checkbox') {
      const isChecked = (event.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: isChecked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUserPin(null);

    const { email, password, ...companyData } = formData;
    try {
      let response;
      switch (type) {
        case 'login':
          response = await axios.post(API_URL + 'login', { identifier: email, password });
          break;
        case 'register':
          response = await axios.post(API_URL + 'register', { company: companyData, email, password });
          setUserPin(response.data.user_pin);
          break;
        case 'subcontractor':
          response = await axios.post(API_URL + 'register', { company: companyData, email, password });
          setUserPin(response.data.user_pin);
          break;
      }

      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
        const role = response.data.user.role;
        switch (role) {
          case 'Super Admin':
            navigate('/super-admin-dashboard');
            break;
          case 'Admin':
            navigate('/admin-dashboard');
            break;
          case 'Staff':
            navigate('/staff-dashboard');
            break;
          case 'Subcontractor':
            navigate('/subcontractor-dashboard');
            break;
          default:
            navigate('/');
            break;
        }
      }
   } catch (err: any) {
  const data = err?.response?.data;

  const msg =
    typeof data?.error === "string"
      ? data.error
      : typeof data?.message === "string"
      ? data.message
      : typeof data?.error?.message === "string"
      ? data.error.message
      : typeof err?.message === "string"
      ? err.message
      : "Something went wrong";

  setError(msg);
}

  };

  return (
    <form onSubmit={handleSubmit}>
      {(type === 'register' || type === 'subcontractor') && (
        <>
          {/* Form fields for registration */}
          <InputField type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" required />
          <InputField type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" required />
          <InputField type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company Name" required />
          <InputField type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} placeholder="Company Address" required />
          <InputField type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="Contact Person" required />
          <InputField type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Contact Number" required />
          <InputField type="text" name="contactDepartment" value={formData.contactDepartment} onChange={handleChange} placeholder="Contact Department" required />
          {type === 'subcontractor' && (
            <div className="flex items-center mb-4">
              <input type="checkbox" name="isSubcontractor" checked={formData.isSubcontractor} onChange={handleChange} disabled={true} className="mr-2"/>
              <label htmlFor="isSubcontractor">Register as Subcontractor</label>
            </div>
          )}
        </>
      )}
      <InputField
        type={type === 'register' || type === 'subcontractor' ? 'email' : 'text'}
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder={type === 'register' || type === 'subcontractor' ? 'Email' : 'Email or PIN'}
        required
      />
      <InputField type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
      <Button type="submit" color={type === 'register' ? 'submit' : 'edit'} className="w-full">
        {type === 'register' || type === 'subcontractor' ? 'Register' : 'Login'}
      </Button>
      {error && <p className="text-red-500">{error}</p>}
      {userPin && <p className="text-green-500">Your account was created successfully! Your PIN: <strong>{userPin}</strong></p>}
    </form>
  );
};

export default AuthForm;
