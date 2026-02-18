import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/Card';
import OneColumnLayout from '../../components/OneColumnLayout';
import ApplicationForm from '../protected/recruitment/ApplicationForm';
import { useAuth } from '../../hooks/useAuth';
import { BACKEND_URL } from '../../config';

const SubcontractorApplicationPage: React.FC = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const { companyId } = useAuth();
    const [applicationDetails, setApplicationDetails] = useState({
        employee_request_count: 0,
        contract_id: null
    });

    useEffect(() => {
        const fetchEmployeeRequest = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/subcontractor-company/employee-request/${requestId}`);
                setApplicationDetails({
                    employee_request_count: response.data.employee_request_count,
                    contract_id: response.data.contract_id
                });
            } catch (error) {
                console.error('Failed to fetch employee request:', error);
                alert('Failed to fetch employee request');
            }
        };

        if (requestId) {
            fetchEmployeeRequest();
        }
    }, [requestId]);

    if (!companyId) {
        return (
            <OneColumnLayout content={
                <Card padding="p-6" shadow={true} border={true}>
                    <h1 className="text-lg font-bold mb-4">Subcontractor Application Page</h1>
                    <p>Error: Company ID is not available. Please ensure you are logged in and try again.</p>
                </Card>
            } />
        );
    }

    return (
        <OneColumnLayout content={
            <div className="max-w-5xl mx-auto">
                <Card padding="p-6" shadow={true} border={true}>
                    <h1 className="text-lg font-bold mb-4">Welcome to the Subcontractor Application Page</h1>
                    <p>Your company ID is: {companyId}</p>
                    <p>Submitting application for request ID: {requestId}</p>
                    <p>Requested Employee Count: {applicationDetails.employee_request_count}</p>
                </Card>
                <Card padding="p-6" className='mt-2' shadow={true} border={true}>
                <ApplicationForm 
                    companyId={companyId.toString()} 
                    submittedBySubcontractor={true}
                    contractId={applicationDetails.contract_id}
                    requestId={requestId}  // Now passing requestId
                />
                </Card>
            </div>
        } />
    );
};

export default SubcontractorApplicationPage;
