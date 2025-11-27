// src/pages/JobOfferResponsePage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../../../config';

interface JobOfferDetails {
    offer_id: number;
    application_id: number;
    offer_details: string;
    offered_on: string;
    status: string;
    signed_on: string | null;
    hourly_pay_rate: number;
    payment_period: string;
    fixed_pay: number;
    travel_expense: number;
    role_offered: string;
}

const JobOfferResponsePage: React.FC = () => {
    const { offerId } = useParams<{ offerId: string }>();
    const query = new URLSearchParams(useLocation().search);
    const token = query.get('token');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [jobOfferDetails, setJobOfferDetails] = useState<JobOfferDetails | null>(null);

    useEffect(() => {
        const fetchJobOfferDetails = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/applicants/offers/${offerId}`);
                if (response.ok) {
                    const data = await response.json();
                    setJobOfferDetails(data);
                } else {
                    setError("Failed to load job offer details.");
                }
            } catch (err) {
                console.error("Error fetching job offer details:", err);
                setError("An error occurred while loading job offer details.");
            }
        };
        fetchJobOfferDetails();
    }, [offerId]);

    const handleResponse = async (status: 'Accepted' | 'Rejected') => {
        if (!token) {
            setError("Invalid token. Access denied.");
            return;
        }
    
        try {
            const response = await fetch(`${BACKEND_URL}/api/applicants/offer-response/${offerId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, status })
            });
    
            if (response.ok) {
                setStatusMessage(`Job offer ${status.toLowerCase()} successfully.`);
            } else if (response.headers.get("content-type")?.includes("application/json")) {
                const errorData = await response.json();
                setError(errorData.error || "Failed to respond to job offer.");
            } else {
                setError("Unexpected response from server.");
            }
        } catch (err) {
            console.error("Error handling response:", err);
            setError("An error occurred. Please try again later.");
        }
    };    

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="p-6 max-w-md w-full bg-white rounded shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Job Offer</h1>
                {error && <p className="text-red-600 mb-4">{error}</p>}
                {statusMessage ? (
                    <p className="text-green-600">{statusMessage}</p>
                ) : jobOfferDetails ? (
                    <>
                        <p className="mb-6">Please review and respond to your job offer below:</p>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">Offer Details:</h2>
                            <p><strong>Details:</strong> {jobOfferDetails.offer_details}</p>
                            <p><strong>Offered On:</strong> {new Date(jobOfferDetails.offered_on).toLocaleDateString()}</p>
                            <p><strong>Hourly Pay Rate:</strong> ${jobOfferDetails.hourly_pay_rate}</p>
                            <p><strong>Payment Period:</strong> {jobOfferDetails.payment_period}</p>
                            <p><strong>Fixed Pay:</strong> ${jobOfferDetails.fixed_pay}</p>
                            <p><strong>Travel Expense:</strong> ${jobOfferDetails.travel_expense}</p>
                            <p><strong>Role Offered:</strong> {jobOfferDetails.role_offered}</p>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => handleResponse('Accepted')}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleResponse('Rejected')}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Reject
                            </button>
                        </div>
                    </>
                ) : (
                    <p>Loading job offer details...</p>
                )}
            </div>
        </div>
    );
};

export default JobOfferResponsePage;
