// src/pages/CompanyListPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OneColumnLayout from '../../../components/OneColumnLayout';
import Button from '../../../components/Button';
import Table from '../../../components/Table';
import { useTheme } from '../../../context/ThemeContext';
import { BACKEND_URL } from '../../../config';

interface Company {
  company_id: number;
  company_name: string;
}

const CompanyListPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();  // Using the useTheme hook to access the current theme

  useEffect(() => {
    const fetchCompaniesWithOpenJobs = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/jobs/companies`);
        setCompanies(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch companies", err);
        setError('Failed to load data');
        setIsLoading(false);
      }
    };

    fetchCompaniesWithOpenJobs();
  }, []);

  const handleApplyClick = (company_id: number) => {
    navigate(`/jobs/${company_id}`);
  };

  const columns = [
    {
      header: 'Company Name',
      accessor: 'company_name', // Accessor is the "key" in the data
      isVisible: true
    },
    {
      header: 'Actions',
      accessor: 'apply',
      isVisible: true
    }
  ];

  const tableData = companies.map(company => ({
    ...company,
    apply: <Button onClick={() => handleApplyClick(company.company_id)} size='small' color="submit">View Jobs</Button>
  }));

  const headingColor = theme === 'dark' ? 'text-white' : 'text-gray-900'; // Choose text color based on theme

  if (isLoading) return <OneColumnLayout content={<p>Loading...</p>} />;
  if (error) return <OneColumnLayout content={<p>Error: {error}</p>} />;

  return (
    <OneColumnLayout content={
      <div>
        <h1 className={`text-3xl font-bold text-center my-4 ${headingColor}`}>Companies with Open Jobs</h1>
        <Table
          data={tableData}
          columns={columns}
        />
      </div>
    } />
  );
};

export default CompanyListPage;
