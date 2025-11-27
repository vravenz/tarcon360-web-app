import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ViewAsTableProps {
    data: { [key: string]: any }[]; // Array of objects
    columns: { label: string; accessor: string }[]; // Array of objects specifying labels and keys in the data
}

const ViewAsTable: React.FC<ViewAsTableProps> = ({ data, columns }) => {
    const { theme } = useTheme();

    // Table header and row classes based on theme
    const tableClasses = theme === 'dark' ? 'text-dark-text' : 'text-light-text';
    const headerClasses = theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text';
    const rowClasses = theme === 'dark' ? 'bg-dark-cardBackground hover:bg-dark-hover' : 'bg-white hover:bg-light-hover';
    const borderClasses = theme === 'dark' ? 'divide-neutral-700' : 'divide-neutral-200';

    return (
        <div className={`shadow rounded-lg overflow-auto ${tableClasses}`}>
            <table className={`min-w-full divide-y ${borderClasses}`}>
                <thead className={headerClasses}>
                    <tr>
                        {columns.map((column, idx) => (
                            <th
                                key={idx}
                                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className={`divide-y ${borderClasses}`}>
                    {data.map((item, idx) => (
                        <tr key={idx} className={rowClasses}>
                            {columns.map((column, colIdx) => (
                                <td
                                    key={colIdx}
                                    className="px-6 py-2 whitespace-normal"
                                >
                                    {item[column.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ViewAsTable;
