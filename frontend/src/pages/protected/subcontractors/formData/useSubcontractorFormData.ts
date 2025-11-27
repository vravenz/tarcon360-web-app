import { useState, useMemo } from 'react';

interface SubcontractorFormData {
    firstName: string;
    lastName: string;
    company_name: string;
    company_address: string;
    contact_person: string;
    contact_number: string;
    contact_department: string;
    email_address: string;
    invoice_terms: string;
    payment_terms: string;
    vat_registered: boolean;
    vat_registration_number: string;
    pay_rate: string;
    password: string; // Add password here
}

interface FieldConfig {
    name: keyof SubcontractorFormData;
    type: 'text' | 'textarea' | 'email' | 'select' | 'checkbox' | 'date' | 'file' | 'number' | 'password';
    label: string;
    required: boolean;
    options?: { label: string; value: string }[];
}

export const useSubcontractorFormData = () => {
    const [formData, setFormData] = useState<SubcontractorFormData>({
        firstName: '',
        lastName: '',
        company_name: '',
        company_address: '',
        contact_person: '',
        contact_number: '',
        contact_department: '',
        email_address: '',
        invoice_terms: '',
        payment_terms: '',
        vat_registered: false,
        vat_registration_number: '',
        pay_rate: '',
        password: '' // Initialize password field
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = event.target as HTMLInputElement; // Casting to handle checkbox
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const fields = useMemo(() => {
        const baseFields: FieldConfig[] = [
            { name: 'company_name', type: 'text', label: 'Company Name', required: true },
            { name: 'company_address', type: 'text', label: 'Company Address', required: true },
            { name: 'contact_person', type: 'text', label: 'Contact Person', required: true },
            { name: 'contact_number', type: 'text', label: 'Contact Number', required: true },
            { name: 'contact_department', type: 'text', label: 'Contact Department', required: true },
            { name: 'email_address', type: 'email', label: 'Email Address', required: true },
            { name: 'pay_rate', type: 'text', label: 'Pay Rate', required: true },
            { name: 'password', type: 'password', label: 'Password', required: true }, // Add password field configuration
            {
                name: 'invoice_terms',
                type: 'select',
                label: 'Invoice Terms',
                required: true,
                options: [
                    { label: 'Fortnightly Invoice', value: 'Fortnightly' },
                    { label: 'Monthly Invoice', value: 'Monthly' },
                    { label: 'Weekly Invoice', value: 'Weekly' },
                ]
            },
            { name: 'payment_terms', type: 'textarea', label: 'Payment Terms', required: true },
            { name: 'vat_registered', type: 'checkbox', label: 'VAT Registered ?', required: false },
        ];

        if (formData.vat_registered) {
            baseFields.push({
                name: 'vat_registration_number',
                type: 'text',
                label: 'VAT Registration Number',
                required: true
            });
        }

        return baseFields;
    }, [formData.vat_registered, formData]);

    return { formData, handleChange, fields };
};
