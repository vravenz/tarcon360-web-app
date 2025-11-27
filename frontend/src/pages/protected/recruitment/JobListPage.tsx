// src/pages/JobListPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import OneColumnLayout from '../../../components/OneColumnLayout';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import Text from '../../../components/Text';
import { FaMapMarkerAlt, FaCalendarAlt, FaRegClock, FaInfoCircle } from 'react-icons/fa';
import { BsFillCheckCircleFill, BsXCircleFill } from 'react-icons/bs';
import { BACKEND_URL } from '../../../config';

interface Job {
  job_id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  is_ongoing: boolean;
  description: string;
  location: string; 
}

const JobListPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/jobs/${companyId}/open`)
      .then(response => {
        setJobs(response.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch open jobs", err);
        setError('Failed to load data');
        setIsLoading(false);
      });
  }, [companyId]);


  const handleApplyClick = async (job_id: number) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/jobs/status/${job_id}`);
      if (response.data.status === "Open") {
        navigate(`/apply/${job_id}?companyId=${companyId}`);
      } else {
        alert("This job is currently closed and cannot accept applications.");
      }
    } catch (error) {
      console.error('Error checking job status', error);
      alert('Failed to check job status');
    }
  };

  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) return <OneColumnLayout content={<p>Loading...</p>} />;
  if (error) return <OneColumnLayout content={<p>Error: {error}</p>} />;

  return (
    <OneColumnLayout content={
      <div className="space-y-4">
        <Text isHeading={true} size="lg" className="text-center my-4">Open Jobs at {companyId}</Text>
        {jobs.map(job => (
          <Card key={job.job_id} padding="p-6" className="max-w-6xl mx-auto">
            <Text isHeading={true} size="xl2" className="mb-2">{job.title}</Text>
            <Text newLine={true} className="mb-3 mt-2"><FaInfoCircle className="inline mr-2" /><strong>Description:</strong> {job.description}</Text>
            <Text newLine={true} className="mb-3"><FaMapMarkerAlt className="inline mr-2" /><strong>Location:</strong> {job.location}</Text>
            <Text newLine={true} className="mb-3"><FaCalendarAlt className="inline mr-2" /><strong>Start:</strong> {formatDateString(job.start_date)}</Text>
            {!job.is_ongoing && <Text newLine={true} className="mb-3"><FaCalendarAlt className="inline mr-2" /><strong>End:</strong> {formatDateString(job.end_date)}</Text>}
            <Text newLine={true} className="mb-1">
              {job.is_ongoing ? <BsFillCheckCircleFill className="inline mr-2 text-green-500" /> : <BsXCircleFill className="inline mr-2 text-red-500" />}
              <strong>Ongoing:</strong> {job.is_ongoing ? 'Yes' : 'No'}
            </Text>
            <Button onClick={() => handleApplyClick(job.job_id)} color="submit" className="mt-4">Apply</Button>
          </Card>
        ))}
      </div>
    } />
  );
};

export default JobListPage;
