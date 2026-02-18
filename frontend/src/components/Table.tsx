import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import Pagination from './PaginationProps';
import SearchAndFilter from './SearchFilterProps';
import { FaSort, FaSortUp, FaSortDown, FaCheckSquare, FaSquare } from 'react-icons/fa';

interface TableColumn {
  header: string;
  accessor: string;
  isVisible: boolean;
}

interface TableProps {
  data: Array<any>;
  columns: Array<TableColumn>;
  onClickRow?: (item: any) => void;
}

interface FilterValues {
  [key: string]: string | number;
}

const Table: React.FC<TableProps> = ({ data, columns, onClickRow }) => {
  const { theme } = useTheme();
  // Decide text/background based on the theme:
  const tableClass =
    theme === 'dark'
      ? 'text-dark-text bg-dark-background'
      : 'text-light-text bg-light-background';

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterValues>({});
  const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.accessor]: col.isVisible }), {})
  );

  const onSearchChange = (term: string) => {
    setSearchTerm(term.toLowerCase());
    setCurrentPage(1);
  };

  const onFilterChange = (filterKey: string, value: string | number) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterKey]: value,
    }));
    setCurrentPage(1);
  };

  const handleRowSelection = (item: any) => {
    const newSelection = new Set(selectedRows);
    if (selectedRows.has(item)) {
      newSelection.delete(item);
    } else {
      newSelection.add(item);
    }
    setSelectedRows(newSelection);
  };

  const toggleColumnVisibility = (accessor: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [accessor]: !prev[accessor],
    }));
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Match all filters
      const matchesFilters = Object.keys(filters).every(key =>
        item[key]?.toString().toLowerCase().includes(filters[key].toString().toLowerCase())
      );
      // Match global search
      const matchesSearch = Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(searchTerm)
      );
      return matchesFilters && matchesSearch;
    });
  }, [data, filters, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const { key, direction } = sortConfig;
    return [...filteredData].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return sortedData.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, itemsPerPage, sortedData]);

  const totalRows = sortedData.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage);

  const onSort = (accessor: string) => {
    setSortConfig(prevConfig => ({
      key: accessor,
      direction:
        prevConfig?.key === accessor && prevConfig?.direction === 'ascending'
          ? 'descending'
          : 'ascending',
    }));
  };

  return (
    <div className={`table-container overflow-x-auto ${tableClass}`}>
      {/* Top bar: search + column toggles */}
      <div
        className="
          flex flex-col sm:flex-row justify-between p-2 
          border-t border-l border-r 
          border-light-border dark:border-dark-border
        "
      >
        {/* Search and Filter on the left */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <SearchAndFilter onSearch={onSearchChange} onFilterChange={onFilterChange} filters={[]} />
        </div>
        {/* Column Visibility Toggles on the right */}
        <div className="w-full sm:w-auto mt-2 sm:mt-0 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {columns.map(col => (
              <button
                key={col.accessor}
                onClick={() => toggleColumnVisibility(col.accessor)}
                className="text-xs p-1 whitespace-nowrap"
              >
                {visibleColumns[col.accessor] ? <FaCheckSquare /> : <FaSquare />} {col.header}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <table
        className="
          min-w-full 
          divide-y divide-light-border dark:divide-dark-border
        "
      >
        <thead
          className="
            bg-light-cardBackground dark:bg-dark-cardBackground
            sticky top-0 z-10
          "
        >
          <tr>
            {columns
              .filter(col => visibleColumns[col.accessor])
              .map(col => (
                <th
                  key={col.accessor}
                  className={`
                    px-6 text-sm py-3 text-left
                    border border-light-border dark:border-dark-border
                    whitespace-nowrap
                    ${col.accessor === 'employeePhoto' ? 'w-16' : ''}
                  `}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => onSort(col.accessor)}
                  >
                    {col.header}
                    {sortConfig && sortConfig.key === col.accessor ? (
                      sortConfig.direction === 'ascending' ? (
                        <FaSortUp />
                      ) : (
                        <FaSortDown />
                      )
                    ) : (
                      <FaSort />
                    )}
                  </div>
                </th>
              ))}
          </tr>
        </thead>

        <tbody
          className="
            bg-light-cardBackground dark:bg-dark-cardBackground
            divide-y divide-light-border dark:divide-dark-border
          "
        >
          {currentTableData.map((item, index) => (
            <tr
              key={index}
              onClick={() => onClickRow && onClickRow(item)}
              className="
                cursor-pointer
                hover:bg-light-hover dark:hover:bg-dark-hover
              "
            >
              {columns
                .filter(col => visibleColumns[col.accessor])
                .map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`
                      px-6 text-sm py-3
                      border border-light-border dark:border-dark-border
                      whitespace-nowrap
                      ${col.accessor === 'employeePhoto' ? 'w-16' : ''}
                    `}
                  >
                    {item[col.accessor]}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
};

export default Table;
