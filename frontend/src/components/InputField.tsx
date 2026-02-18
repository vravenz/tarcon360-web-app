import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface InputFieldProps {
  type:
    | 'text'
    | 'textarea'
    | 'email'
    | 'password'
    | 'select'
    | 'checkbox'
    | 'date'
    | 'file'
    | 'radio'
    | 'number'
    | 'time';
  name: string;
  value: string | number | boolean | undefined;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  placeholder?: string;
  label?: string;
  options?: { label: string; value: string | number }[]; // for select and radio types
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  type,
  name,
  value,
  onChange,
  placeholder,
  label,
  options,
  required,
  error,
  disabled,
}) => {
  const { theme } = useTheme();
  const inputCommonClasses =
    'p-2 border mb-1 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-300';
  const themeStyles =
    theme === 'dark'
      ? 'bg-dark-background text-dark-text border-dark-border focus:ring-dark-buttonBackground'
      : 'bg-light-background text-light-text border-light-border focus:ring-light-buttonBackground';
  const labelClass = theme === 'dark' ? 'text-dark-text' : 'text-light-text';
  const errorClass = 'text-error'; // Assuming `text-error` is configured in your Tailwind theme.

  // State for drag-and-drop behavior and preview/file name
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string>(''); // Store base64 DataURL for images

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);

    const file = event.target.files?.[0];
    if (!file) {
      setFileName('');
      setPreviewSrc('');
      return;
    }

    setFileName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewSrc(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewSrc('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileList = e.dataTransfer.files;
      const fakeEvent = {
        target: { name, files: fileList },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onFileChange(fakeEvent);
    }
  };

  const renderLabel = () => (
    <label htmlFor={name} className={`block text-sm font-medium ${labelClass}`}>
      {label}
    </label>
  );

  const renderInput = () => {
    if (type === 'file') {
      return (
        <div>
          <label
            htmlFor={name}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-36 h-36 text-center border-2 border-dashed rounded-md cursor-pointer ${
              dragActive
                ? theme === 'dark'
                  ? 'border-dark-hover'
                  : 'border-light-hover'
                : 'border-light-border dark:border-dark-border'
            } ${themeStyles}`}
          >
            <input
              id={name}
              type="file"
              name={name}
              onChange={onFileChange}
              required={required}
              disabled={disabled}
              className="hidden"
            />
            {previewSrc ? (
              <img
                src={previewSrc}
                alt="preview"
                className="h-full w-full object-cover rounded-md"
              />
            ) : fileName ? (
              <p className={`text-sm ${labelClass} overflow-hidden break-words px-2`}>
                {fileName}
              </p>
            ) : dragActive ? (
              <p className={`text-sm ${labelClass}`}>Drop the files here ...</p>
            ) : (
              <p className={`text-sm ${labelClass}`}>
                Drag &amp; drop or click to upload
              </p>
            )}
          </label>
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          id={name}
          name={name}
          value={value as string}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${inputCommonClasses} ${themeStyles} resize-none w-full`}
        />
      );
    } else if (type === 'select' && options) {
      return (
        <select
          id={name}
          name={name}
          value={value as string | number}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${inputCommonClasses} ${themeStyles} w-full`}
        >
          {value ? null : <option value="">{placeholder || 'Select...'}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    } else if (type === 'checkbox') {
      return (
        <div className="flex items-center space-x-2">
        <input
          id={name}
          type="checkbox"
          name={name}
          checked={Boolean(value)}
          onChange={onChange}
          disabled={disabled}
          className={`w-5 h-5 rounded`}
          style={{
            accentColor: theme === 'dark' ? '#a6a6a6' : '#4299e1',
            backgroundColor: theme === 'dark' ? '#121212' : '#fff',
            border: theme === 'dark' ? '1px solid #363636' : '1px solid #cbd5e0',
          }}
        />
        <label htmlFor={name} className={`text-sm font-medium ${labelClass}`}>
          {label}
        </label>
      </div>
      );
    } else if (type === 'radio' && options) {
      return (
        <div className="flex items-center space-x-4">
          {options.map((option) => (
            <label key={option.value} className={`block mb-1 ${labelClass}`}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={onChange}
                disabled={disabled}
                className={`mr-2 ${themeStyles}`}
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    } else {
      return (
        <input
          id={name}
          type={type}
          name={name}
          value={value as string}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${inputCommonClasses} ${themeStyles} w-full`}
        />
      );
    }
  };

  return (
    <div className="mb-1">
{type !== 'checkbox' && label && renderLabel()}
      {renderInput()}
      {error && <p className={`mt-1 text-sm ${errorClass}`}>{error}</p>}
    </div>
  );
};

export default InputField;
