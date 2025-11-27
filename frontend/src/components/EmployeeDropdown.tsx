// src/components/EmployeeDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MdArrowDropDown } from 'react-icons/md';
import { BACKEND_URL } from '../config';

interface Employee {
  applicant_id: number;
  first_name: string;
  last_name: string;
  employee_photo: string | null;
  is_subcontractor_employee?: boolean;
  subcontractor_company_name?: string;  // Updated interface
}

interface EmployeeDropdownProps {
  label: string;
  employees: Employee[];
  value?: number;
  onChange: (value: number) => void;
}

const EmployeeDropdown: React.FC<EmployeeDropdownProps> = ({ label, employees, value, onChange }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const employee = employees.find(emp => emp.applicant_id === value) || null;
      setSelectedEmployee(employee);
    } else {
      setSelectedEmployee(null);
    }
  }, [value, employees]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(prev => !prev);

  const menuClass = theme === 'dark' ? 'bg-dark-background text-white' : 'bg-white text-gray-900';
  const borderClass = theme === 'dark' ? 'border-dark-border' : 'border-light-border';

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block mb-1">{label}</label>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between p-2 border ${borderClass} rounded`}
      >
        {selectedEmployee ? (
          <div className="flex items-center space-x-2">
            {selectedEmployee.employee_photo && (
              <img
                src={`${BACKEND_URL}/uploads/employee-photos/${selectedEmployee.employee_photo}`}
                alt={selectedEmployee.first_name}
                className="h-6 w-6 rounded-full object-cover"
              />
            )}
            <span>
              {selectedEmployee.first_name} {selectedEmployee.last_name}
            </span>
          </div>
        ) : (
          <span>Select Employee</span>
        )}
        <MdArrowDropDown />
      </button>
      {isOpen && (
        <div className={`absolute left-0 z-50 mt-1 w-full ${menuClass} shadow-md rounded max-h-60 overflow-y-auto`}>
          {employees.length === 0 ? (
            <div className="px-2 py-1">No employees available</div>
          ) : (
            employees.map(emp => (
              <button
                key={emp.applicant_id}
                type="button"
                className="w-full text-left px-2 py-1 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => {
                  onChange(emp.applicant_id);
                  setIsOpen(false);
                }}
              >
                {emp.employee_photo && (
                  <img
                    src={`${BACKEND_URL}/uploads/employee-photos/${emp.employee_photo}`}
                    alt={emp.first_name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col flex-grow">
                  <span className="font-medium">
                    {emp.first_name} {emp.last_name}
                  </span>
                  {emp.is_subcontractor_employee && (
                    <span className="text-xs text-gray-500">
                      {emp.subcontractor_company_name 
                        ? `Subcontractor Employee - ${emp.subcontractor_company_name}`
                        : 'Subcontractor Employee'}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeDropdown;
