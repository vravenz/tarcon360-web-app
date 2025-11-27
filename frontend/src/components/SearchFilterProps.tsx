import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface SearchFilterProps {
  onSearch: (searchTerm: string) => void;
  onFilterChange: (filterKey: string, value: string | number) => void;
  filters: {
    label: string;
    key: string;
    options: { label: string; value: string | number }[];
  }[]; // Array of filter configurations
}

const SearchAndFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  onFilterChange,
  filters,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { theme } = useTheme();

  // Styles based on the theme
  const inputClass =
    theme === 'dark'
      ? 'bg-dark-cardBackground text-dark-text'
      : 'bg-light-cardBackground text-light-text';
  const selectClass =
    theme === 'dark'
      ? 'bg-dark-cardBackground text-dark-text'
      : 'bg-light-cardBackground text-light-text';

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    onSearch(event.target.value);
  };

  const handleFilterChange =
    (key: string) => (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      const numericValue = parseFloat(value);
      // Check if the converted number is actually a valid number
      const isNumeric = !isNaN(numericValue) && value.trim() !== '';
      onFilterChange(key, isNumeric ? numericValue : value);
    };

  return (
    <div className="search-filter-container flex space-x-2 mt-2 ml-2">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleSearchChange}
        className={`input search-input focus:outline-none pl-2 py-1 text-sm rounded border border-light-border dark:border-dark-border ${inputClass}`}
      />
      {filters.map((filter) => (
        <select
          key={filter.key}
          onChange={handleFilterChange(filter.key)}
          className={`select filter-select px-2 py-1 text-sm rounded border border-light-border dark:border-dark-border ${selectClass}`}
        >
          {filter.options.map((option) => (
            <option key={option.value.toString()} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
};

export default SearchAndFilter;
