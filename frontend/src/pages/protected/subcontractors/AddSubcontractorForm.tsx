// /AddSubcontractorForm.tsx

import React, { useState } from 'react';
import axios from 'axios';
import Card from '../../../components/Card';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import { useSubcontractorFormData } from './formData/useSubcontractorFormData';
import { BACKEND_URL } from '../../../config';

const AddSubcontractorForm: React.FC = () => {
  const { formData, handleChange } = useSubcontractorFormData();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Check required fields
    if (!formData.company_name || !formData.email_address || !formData.password) {
      setError('Company name, email, and password are required.');
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.company_name,
        companyAddress: formData.company_address,
        contactPerson: formData.contact_person,
        contactNumber: formData.contact_number,
        contactDepartment: formData.contact_department,
        invoiceTerms: formData.invoice_terms,
        paymentTerms: formData.payment_terms,
        vatRegistered: formData.vat_registered,
        vatRegistrationNumber: formData.vat_registration_number,
        email: formData.email_address,
        password: formData.password
      };

      const response = await axios.post(
        `${BACKEND_URL}/api/subcontractors/create`,
        payload
      );

      if (response.data && response.status === 201) {
        setMessage(`Subcontractor created successfully! 
                    Company: ${response.data.company.company_name} 
                    User ID: ${response.data.user.id}`);
      }
    } catch (err: any) {
      console.error('Error creating subcontractor:', err);
      const errorMsg = err?.response?.data?.error || 'Error creating subcontractor';
      setError(errorMsg);
    }
  };

  return (
    <Card className="p-4 my-4">
      <h2 className="text-xl font-bold mb-3">Create a New Subcontractor</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name & Last Name in one row */}
        <div>
          <InputField
            type="text"
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <InputField
            type="text"
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        {/* Company Name & Company Address */}
        <div>
          <InputField
            type="text"
            name="company_name"
            label="Company Name"
            value={formData.company_name}
            onChange={handleChange}
            required
          />
          <InputField
            type="text"
            name="company_address"
            label="Company Address"
            value={formData.company_address}
            onChange={handleChange}
            required
          />
        </div>

        {/* Contact Person, Contact Number, & Contact Department */}
        <div>
          <InputField
            type="text"
            name="contact_person"
            label="Contact Person"
            value={formData.contact_person}
            onChange={handleChange}
            required
          />
          <InputField
            type="text"
            name="contact_number"
            label="Contact Number"
            value={formData.contact_number}
            onChange={handleChange}
            required
          />
          <InputField
            type="text"
            name="contact_department"
            label="Contact Department"
            value={formData.contact_department}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email & Password */}
        <div>
          <InputField
            type="email"
            name="email_address"
            label="Email Address"
            value={formData.email_address}
            onChange={handleChange}
            required
          />
          <InputField
            type="password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Invoice Terms & Payment Terms */}
        <div>
          <InputField
            type="select"
            name="invoice_terms"
            label="Invoice Terms"
            value={formData.invoice_terms}
            onChange={handleChange}
            required
            options={[
              { label: 'Fortnightly Invoice', value: 'Fortnightly' },
              { label: 'Monthly Invoice', value: 'Monthly' },
              { label: 'Weekly Invoice', value: 'Weekly' },
            ]}
          />
          <InputField
            type="textarea"
            name="payment_terms"
            label="Payment Terms"
            value={formData.payment_terms}
            onChange={handleChange}
            required
          />
        </div>

        {/* VAT Registered & VAT Registration Number */}
        <div className="items-center">
          <InputField
            type="checkbox"
            name="vat_registered"
            label="VAT Registered?"
            value={formData.vat_registered ? 'true' : 'false'}
            onChange={handleChange}
          />
          {formData.vat_registered && (
            <InputField
              type="text"
              name="vat_registration_number"
              label="VAT Registration Number"
              value={formData.vat_registration_number}
              onChange={handleChange}
              required
            />
          )}
        </div>

        {/* Pay Rate */}
        <div>
          <InputField
            type="number"
            name="pay_rate"
            label="Pay Rate"
            value={formData.pay_rate}
            onChange={handleChange}
            required
          />
        </div>

        <Button type="submit" color="submit">Create Subcontractor</Button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {message && <p className="text-green-600 mt-2">{message}</p>}
    </Card>
  );
};

export default AddSubcontractorForm;
