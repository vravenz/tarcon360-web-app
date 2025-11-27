import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTheme } from '../context/ThemeContext'; // Adjust import path as needed

interface DateInputComponentProps {
  date: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}

const DateInputComponent: React.FC<DateInputComponentProps> = ({ date, onChange, disabled = false }) => {
  const { theme } = useTheme();
  const themeStyles =
    theme === 'dark'
      ? 'bg-dark-background text-dark-text border-dark-border p-2 w-full'
      : 'bg-light-background text-light-text border-light-border p-2 w-full';
  return (
    <DatePicker
      selected={date}
      onChange={onChange}
      dateFormat="MMMM d, yyyy"
      placeholderText="Select a date"
      className={`form-control ${themeStyles}`}
      wrapperClassName="date-picker w-full"
      disabled={disabled}
    />
  );
};

export default DateInputComponent;
