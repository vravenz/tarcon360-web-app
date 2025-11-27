import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import OneColumnLayout from '../../../components/OneColumnLayout';
import { useTheme } from '../../../context/ThemeContext';
import { BACKEND_URL } from '../../../config';

const ApplicationDetailsPage: React.FC = () => {
    const { applicationId } = useParams();
    const { theme } = useTheme();
    const [application, setApplication] = useState<any>(null);

    useEffect(() => {
        const fetchApplicationDetails = async () => {
            const response = await fetch(`${BACKEND_URL}/api/applicants/details/${applicationId}`);
            if (response.ok) {
                const data = await response.json();
                setApplication(data);
            } else {
                console.log('Failed to fetch application details');
            }
        };

        if (applicationId) {
            fetchApplicationDetails();
        }
    }, [applicationId]);

    const containerClasses = `
        max-w-4xl mx-auto shadow-lg rounded-lg p-6
        ${theme === 'dark' ? 'bg-dark-cardBackground text-dark-text' : 'bg-light-cardBackground text-light-text'}
    `;

    const sectionHeader = "text-xl font-semibold border-b pb-1 mb-4";

    const applicationContent = (
        <div className={containerClasses}>
            {application ? (
                <div className="space-y-8">
                    {/* Profile Photo and Header */}
                    {application.employee_photo && (
                        <div className="flex justify-center">
                            <img
                                src={`${BACKEND_URL}/uploads/employee-photos/${application.employee_photo}`}
                                alt="Employee Photo"
                                className="w-36 h-36 object-cover rounded-full border-4 border-primary mb-4"
                            />
                        </div>
                    )}
                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold mb-1">
                            {application.first_name} {application.last_name}
                        </h1>
                        <h2 className="text-xl font-semibold text-primary mb-4">
                            {application.job_title}
                        </h2>
                        {application.description && (
                            <p className="italic text-lg max-w-2xl mx-auto">{application.description}</p>
                        )}
                    </div>

                    {/* Grid of Applicant Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* Section: Application Information */}
                        <section>
                            <h3 className={sectionHeader}>Application Information</h3>
                            <dl className="space-y-2">
                                <div>
                                    <span className="font-semibold">Applied On:</span> {new Date(application.applied_on).toLocaleDateString()}
                                </div>
                                <div>
                                    <span className="font-semibold">Status:</span> {application.application_status}
                                </div>
                            </dl>
                        </section>

                        {/* Section: Contact Information */}
                        <section>
                            <h3 className={sectionHeader}>Contact Information</h3>
                            <dl className="space-y-2">
                                <div>
                                    <span className="font-semibold">Email:</span> {application.email}
                                </div>
                                <div>
                                    <span className="font-semibold">Phone:</span> {application.phone || 'No phone provided'}
                                </div>
                                <div>
                                    <span className="font-semibold">Second Phone:</span> {application.second_phone || 'N/A'}
                                </div>
                            </dl>
                        </section>

                        {/* Section: Personal Information */}
                        <section>
                            <h3 className={sectionHeader}>Personal Information</h3>
                            <dl className="space-y-2">
                                <div>
                                    <span className="font-semibold">Nationality:</span> {application.nationality || 'N/A'}
                                </div>
                                <div>
                                    <span className="font-semibold">Gender:</span> {application.gender || 'N/A'}
                                </div>
                                <div>
                                    <span className="font-semibold">Date of Birth:</span> {application.date_of_birth ? new Date(application.date_of_birth).toLocaleDateString() : 'N/A'}
                                </div>
                            </dl>
                        </section>

                        {/* Section: License Information */}
                        <section>
                            <h3 className={sectionHeader}>License Information</h3>
                            <dl className="space-y-2">
                                <div>
                                    <span className="font-semibold">SIA Licence:</span> {application.sia_licence || 'N/A'}
                                </div>
                                <div>
                                    <span className="font-semibold">Licence Type:</span> {application.licence_type || 'N/A'}
                                </div>
                                <div>
                                    <span className="font-semibold">Licence Expiry:</span> {application.licence_expiry ? new Date(application.licence_expiry).toLocaleDateString() : 'N/A'}
                                </div>
                            </dl>
                        </section>

                        {/* Section: Additional Information */}
                        <section className="sm:col-span-2">
                            <h3 className={sectionHeader}>Additional Information</h3>
                            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <div>
                                    <span className="font-semibold">PWVA Trained:</span> {application.pwva_trained ? 'Yes' : 'No'}
                                </div>
                                <div>
                                    <span className="font-semibold">Leisure:</span> {application.leisure_interests ? 'Yes' : 'No'}
                                </div>
                                <div>
                                    <span className="font-semibold">Leisure Interests:</span> {application.leisure_interests || 'N/A'}
                                </div>
                                <div>
                                    <span className="font-semibold">Criminal Record:</span> {application.criminal_record ? 'Yes' : 'No'}
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="font-semibold">Criminal Record Detail:</span> {application.criminal_record_details || 'N/A'}
                                </div>
                            </dl>
                        </section>
                    </div>
                </div>
            ) : (
                <p className="text-center">Loading application details...</p>
            )}
        </div>
    );

    return <OneColumnLayout content={applicationContent} />;
};

export default ApplicationDetailsPage;
