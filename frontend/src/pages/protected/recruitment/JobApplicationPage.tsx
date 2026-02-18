import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import OneColumnLayout from '../../../components/OneColumnLayout';
import ApplicationForm from './ApplicationForm'; // Adjust this path according to your project structure
import Card from '../../../components/Card';
import Footer from '../../../components/Footer';

const JobApplicationPage: React.FC = () => {
    // Extract job ID from the URL parameters
    const { jobId } = useParams<{ jobId: string }>();

    // Extract company ID from the query string
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const companyId = queryParams.get('companyId');

    return (
        <OneColumnLayout
            content={
                <div className="max-w-5xl mx-auto">
                    <Card padding="p-6" className='mt-2' shadow={true} border={true}>
                        <ApplicationForm jobId={jobId} companyId={companyId || ''} />
                    </Card>
                    <Footer />
                </div>
            }
        />
    );
};

export default JobApplicationPage;
