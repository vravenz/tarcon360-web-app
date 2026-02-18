import React, { useState } from 'react';
import InputField from './InputField'; // Reuse your existing InputField component

interface RadioOption {
  label: string;
  value: string;
  additionalFields?: AdditionalField[]; // Define additional fields to show
}

interface AdditionalField {
  type: 'text' | 'textarea' | 'file' | 'radio' | 'select';
  label: string;
  name: string;
  placeholder?: string;
  options?: { label: string; value: string }[]; // for select or radio options
  required?: boolean;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  onChange: (selectedValue: string) => void;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ name, options, onChange }) => {
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [dynamicFields, setDynamicFields] = useState<{ [key: string]: string }>({}); // To hold values of dynamic fields

  const handleRadioChange = (value: string) => {
    setSelectedValue(value);
    onChange(value);
  };

  const handleDynamicFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDynamicFields((prevFields) => ({ ...prevFields, [name]: value }));
  };  

  return (
    <div>
      {/* Render radio buttons */}
      {options.map((option) => (
        <div key={option.value} className="mb-2">
          <label className="flex items-center">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={() => handleRadioChange(option.value)}
              className="mr-2"
            />
            {option.label}
          </label>

          {/* Render additional fields conditionally if the option is selected */}
          {selectedValue === option.value && option.additionalFields && (
            <div className="ml-6 mt-2">
              {option.additionalFields.map((field) => (
                <InputField
                  key={field.name}
                  type={field.type}
                  name={field.name}
                  label={field.label}
                  value={dynamicFields[field.name] || ''}
                  onChange={handleDynamicFieldChange}
                  placeholder={field.placeholder}
                  options={field.options}
                  required={field.required}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RadioGroup;
