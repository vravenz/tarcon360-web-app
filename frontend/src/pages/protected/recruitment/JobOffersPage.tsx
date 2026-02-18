import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import SideNavbar from '../../../components/SideNavbar';
import Card from '../../../components/Card';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Button from '../../../components/Button';
import InputField from '../../../components/InputField';
import { BACKEND_URL } from '../../../config';

interface Applicant {
    application_id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface JobOfferDetails {
    hourlyPayRate: string;
    paymentPeriod: string;
    fixedPay: string;
    travelExpense: string;
    roleOffered: string;
    branchId: string;
}

const defaultOfferDetails: JobOfferDetails = {
    hourlyPayRate: '',
    paymentPeriod: 'Monthly',
    fixedPay: '',
    travelExpense: '',
    roleOffered: 'Staff',
    branchId: '',
};

interface Branch {
    branch_id: number;
    branch_name: string;
}

const JobOffersPage: React.FC = () => {
    const { theme } = useTheme();
    const { companyId } = useAuth();
    const [passedApplicants, setPassedApplicants] = useState<Applicant[]>([]);
    const [offerDetails, setOfferDetails] = useState<{ [key: number]: JobOfferDetails }>({});
    const [branches, setBranches] = useState<Branch[]>([]);

    useEffect(() => {
        const fetchBranches = async () => {
            const response = await fetch(`${BACKEND_URL}/api/branches`);
            const data = await response.json();
            setBranches(data);
        };

        fetchBranches();

        const fetchPassedApplicants = async () => {
            if (companyId) {
                const response = await fetch(`${BACKEND_URL}/api/applicants/passed/${companyId}`);
                if (response.ok) {
                    const data = await response.json();
                    setPassedApplicants(data);
                    const initialOffers = data.reduce((acc: { [key: number]: JobOfferDetails }, applicant: Applicant) => {
                        acc[applicant.application_id] = { ...defaultOfferDetails };
                        return acc;
                    }, {});
                    setOfferDetails(initialOffers);
                } else {
                    console.error('Failed to fetch passed applicants');
                }
            }
        };

        fetchPassedApplicants();
    }, [companyId]);

    const handleSendOffer = async (applicant: Applicant) => {
        const details = offerDetails[applicant.application_id];
        const response = await fetch(`${BACKEND_URL}/api/applicants/send-offer/${applicant.application_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...details,
                hourlyPayRate: parseFloat(details.hourlyPayRate),
                fixedPay: parseFloat(details.fixedPay),
                travelExpense: parseFloat(details.travelExpense),
                branchId: details.branchId,
            }),
        });
        if (response.ok) {
            alert(`Job offer sent to ${applicant.first_name} ${applicant.last_name}`);
            setPassedApplicants(passedApplicants.filter((a) => a.application_id !== applicant.application_id));
        } else {
            console.error('Failed to send job offer');
        }
    };

    const updateOfferDetails = (applicationId: number, key: keyof JobOfferDetails, value: string) => {
        setOfferDetails({
            ...offerDetails,
            [applicationId]: { ...offerDetails[applicationId], [key]: value }
        });
    };

    const mainContent = (
        <Card className="max-w-full w-full p-6 space-y-6">
            <h1 className="text-xl font-extrabold mb-2">Job Offers</h1>
            {passedApplicants.length > 0 ? (
                <div className="space-y-8">
                    {passedApplicants.map((applicant) => (
                        <Card key={applicant.application_id} className="p-6 shadow-md rounded-lg space-y-4">
                            <div>
                                <div className='text-xs text-center opacity-50'>Send Offer to</div>
                                <h2 className="text-3xl font-bold text-center"> 
                                    {`${applicant.first_name} ${applicant.last_name}`}
                                </h2>
                                <p className="text-center opacity-50 mt-1">{`${applicant.email}`}</p>
                            </div>
                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputField
                                        type="number"
                                        name="hourlyPayRate"
                                        value={offerDetails[applicant.application_id]?.hourlyPayRate || ''}
                                        onChange={(e) => updateOfferDetails(applicant.application_id, 'hourlyPayRate', e.target.value)}
                                        label="Hourly Pay Rate"
                                    />
                                    <InputField
                                        type="number"
                                        name="fixedPay"
                                        value={offerDetails[applicant.application_id]?.fixedPay || ''}
                                        onChange={(e) => updateOfferDetails(applicant.application_id, 'fixedPay', e.target.value)}
                                        label="Fixed Pay"
                                    />
                                    <InputField
                                        type="number"
                                        name="travelExpense"
                                        value={offerDetails[applicant.application_id]?.travelExpense || ''}
                                        onChange={(e) => updateOfferDetails(applicant.application_id, 'travelExpense', e.target.value)}
                                        label="Travel Expense"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputField
                                        type="select"
                                        name="paymentPeriod"
                                        value={offerDetails[applicant.application_id]?.paymentPeriod || ''}
                                        onChange={(e) => updateOfferDetails(applicant.application_id, 'paymentPeriod', e.target.value)}
                                        label="Payment Period"
                                        options={[
                                            { label: "Weekly", value: "Weekly" },
                                            { label: "Bi-Weekly", value: "Bi-Weekly" },
                                            { label: "Monthly", value: "Monthly" }
                                        ]}
                                    />
                                    <InputField
                                        type="select"
                                        name="roleOffered"
                                        value={offerDetails[applicant.application_id]?.roleOffered || ''}
                                        onChange={(e) => updateOfferDetails(applicant.application_id, 'roleOffered', e.target.value)}
                                        label="Role Offered"
                                        options={[
                                            { label: "Super Admin", value: "Super Admin" },
                                            { label: "Admin", value: "Admin" },
                                            { label: "Staff", value: "Staff" }
                                        ]}
                                    />
                                    <InputField
                                        type="select"
                                        name="branchId"
                                        value={offerDetails[applicant.application_id]?.branchId || ''}
                                        onChange={(e) => updateOfferDetails(applicant.application_id, 'branchId', e.target.value)}
                                        label="Branch"
                                        options={branches.map((branch) => ({
                                            label: branch.branch_name,
                                            value: branch.branch_id.toString()
                                        }))}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => handleSendOffer(applicant)} color='edit' size='small' icon='send' marginRight='5px'>
                                    Send Offer
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-center text-lg">No applicants available for job offers</p>
            )}
        </Card>
    );

    return (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background text-dark-text' : 'bg-light-background text-light-text'}`}>
            <Navbar />
            <div className='flex-grow'>
                <TwoColumnLayout
                    sidebarContent={<SideNavbar />}
                    mainContent={mainContent}
                />
            </div>
            <Footer />
        </div>
    );
};

export default JobOffersPage;
