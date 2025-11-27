import React from 'react';
import axios from 'axios';
import Card from '../../../components/Card';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import OneColumnLayout from '../../../components/OneColumnLayout';
import { usePersonalFormData } from './formData/personalForms';
import { BACKEND_URL } from '../../../config';

interface ApplicationFormProps {
  jobId?: string;
  companyId: string;
  submittedBySubcontractor?: boolean;
  contractId?: number | null;
  requestId?: string;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId,
  companyId,
  submittedBySubcontractor = false,
  contractId,
  requestId
}) => {
  const { formData, handleChange, fields } = usePersonalFormData();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    // Ensure SIA expiry date is filled if SIA is required
    if (!formData.sia_not_required && (!formData.licence_expiry || formData.licence_expiry.trim() === '')) {
      alert('Please enter the SIA licence expiry date.');
      return;
    }
  
    // Build FormData
    const formDataToSubmit = new FormData();
    Object.keys(formData).forEach((key) => {
      const fieldKey = key as keyof typeof formData;
      const value = formData[fieldKey];
  
      if (fieldKey === 'employee_photo' && value instanceof File) {
        formDataToSubmit.append(fieldKey, value);
      } else if (typeof value === 'string' || typeof value === 'boolean') {
        formDataToSubmit.append(fieldKey, String(value));
      }
    });
  
    formDataToSubmit.append('company_id', companyId || '');
    formDataToSubmit.append('submitted_by_subcontractor', String(submittedBySubcontractor));
  
    if (jobId) formDataToSubmit.append('job_id', jobId);
    if (contractId !== null) formDataToSubmit.append('contract_id', String(contractId));
    if (requestId) formDataToSubmit.append('request_id', requestId);
  
    // If SIA is not required, remove related fields from FormData
    if (formData.sia_not_required) {
      formDataToSubmit.delete('sia_licence');
      formDataToSubmit.delete('licence_type');
      formDataToSubmit.delete('licence_expiry');
      // Also remove additional licence fields if desired
      formDataToSubmit.delete('additional_sia_licence');
      formDataToSubmit.delete('additional_licence_type');
      formDataToSubmit.delete('additional_licence_expiry');
    }
  
    // If additional licence is not required, remove related fields from FormData
    if (!formData.additional_licence_required) {
      formDataToSubmit.delete('additional_sia_licence');
      formDataToSubmit.delete('additional_licence_type');
      formDataToSubmit.delete('additional_licence_expiry');
    }
  
    try {
      await axios.post(`${BACKEND_URL}/api/applicants/submit`, formDataToSubmit, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Application submitted successfully');
    } catch (error) {
      alert('Failed to submit application');
      console.error(error);
    }
  };  

  const personalInfoFields = fields.filter((field) =>
    ['first_name', 'middle_name', 'last_name', 'date_of_birth', 'second_phone', 'phone', 'email', 'gender', 'ni_number', 'ebds_number', 'next_of_kin', 'next_of_kin_contact_no', 'nationality', 'relationship_status', 'pwva_trained'].includes(field.name)
  );

  const siaFields = fields.filter((field) =>
    ['sia_not_required', 'sia_licence', 'licence_type', 'licence_expiry'].includes(field.name)
  );

  const additionalFields = fields.filter((field) =>
    ['additional_licence_required', 'additional_sia_licence', 'additional_licence_type', 'additional_licence_expiry'].includes(field.name)
  );

  // Separate the additional licence required checkbox from the other additional licence fields
  const additionalRequiredField = additionalFields.find(field => field.name === 'additional_licence_required');
  const additionalLicenceFields = additionalFields.filter(field => field.name !== 'additional_licence_required');

  const photoField = fields.find((field) => field.type === 'file' || field.name === 'employee_photo');

  const formUI = (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Section (Photo) */}
          {photoField && (
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  type="file"
                  name={photoField.name}
                  label={photoField.label}
                  value=""
                  onChange={handleChange}
                  required={photoField.required}
                  disabled={false}
                />
              </div>
            </section>
          )}

          {/* Personal Information Section */}
          {personalInfoFields.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalInfoFields.map((field) => (
                  <InputField
                    key={field.name}
                    type={field.type}
                    name={field.name}
                    label={field.label}
                    value={formData[field.name] as string | boolean}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    options={field.type === 'select' ? field.options : undefined}
                    disabled={false}
                  />
                ))}
              </div>
            </section>
          )}

            {/* SIA Details Section */}
            {siaFields.length > 0 && (
            <section>
                <h2 className="text-xl font-semibold mb-4">SIA Details</h2>

                {/* Separate row for SIA Not Required checkbox */}
                <div className="mb-4">
                {siaFields
                    .filter(field => field.name === 'sia_not_required')
                    .map(field => (
                    <InputField
                        key={field.name}
                        type={field.type}
                        name={field.name}
                        label={field.label}
                        value={formData[field.name] as string | boolean}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required={field.required}
                        disabled={false}
                        options={field.type === 'select' ? field.options : undefined}
                    />
                ))}
                </div>

                {/* Grid for remaining SIA fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {siaFields
                    .filter(field => field.name !== 'sia_not_required')
                    .map((field) => {
                    const disableSIAFields =
                        formData.sia_not_required &&
                        ['sia_licence', 'licence_type', 'licence_expiry'].includes(field.name);
                    return (
                        <InputField
                        key={field.name}
                        type={field.type}
                        name={field.name}
                        label={field.label}
                        value={formData[field.name] as string | boolean}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required={field.required}
                        disabled={disableSIAFields}
                        options={field.type === 'select' ? field.options : undefined}
                        />
                    );
                })}
                </div>
            </section>
            )}

          {/* Additional Licence Section */}
          {additionalFields.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Additional Licence</h2>
              
              {/* Render the additional licence required checkbox */}
              {additionalRequiredField && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <InputField
                    type={additionalRequiredField.type}
                    name={additionalRequiredField.name}
                    label={additionalRequiredField.label}
                    value={formData[additionalRequiredField.name] as string | boolean}
                    onChange={handleChange}
                    placeholder={additionalRequiredField.placeholder}
                    required={additionalRequiredField.required}
                    options={additionalRequiredField.type === 'select' ? additionalRequiredField.options : undefined}
                    disabled={formData.sia_not_required}
                  />
                </div>
              )}

              {/* Render other additional licence fields only if the box is checked */}
              {formData.additional_licence_required && additionalLicenceFields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {additionalLicenceFields.map((field) => (
                    <InputField
                      key={field.name}
                      type={field.type}
                      name={field.name}
                      label={field.label}
                      value={formData[field.name] as string | boolean}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      disabled={formData.sia_not_required}
                      options={field.type === 'select' ? field.options : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Leisure Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Leisure Activities</h2>
            <div className="space-y-4">
              <InputField
                type="radio"
                name="leisure"
                label="Leisure?"
                value={formData.leisure}
                onChange={handleChange}
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ]}
              />
              {formData.leisure === 'yes' && (
                <InputField
                  type="textarea"
                  name="leisure_interests"
                  label="Please note your leisure interest and hobbies."
                  value={formData.leisure_interests || ''}
                  onChange={handleChange}
                  placeholder="Write here..."
                  required={true}
                />
              )}
            </div>
          </section>

          {/* Criminal Record Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Criminal Record</h2>
            <div className="space-y-4">
              <InputField
                type="radio"
                name="criminal_record"
                label="Any Criminal Record?"
                value={formData.criminal_record}
                onChange={handleChange}
                options={[
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ]}
              />
              {formData.criminal_record === 'yes' && (
                <InputField
                  type="textarea"
                  name="criminal_record_details"
                  label="Please provide details of the criminal record."
                  value={formData.criminal_record_details || ''}
                  onChange={handleChange}
                  placeholder="Provide details..."
                  required={true}
                />
              )}
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              color="submit"
              size="small"
              icon='send'
              marginRight='5px'
            >
              Submit
            </Button>
          </div>

        </form>
  );

  return <>{formUI}</>;
};

export default ApplicationForm;
