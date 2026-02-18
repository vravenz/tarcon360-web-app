import { useState } from 'react';

interface FormData {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    gender: string;
    date_of_birth: string;
    phone: string;
    second_phone?: string;
    ni_number: string;
    ebds_number?: string; 
    next_of_kin?: string;
    next_of_kin_contact_no?: string;
    nationality: string;
    relationship_status: string;
    sia_licence?: string;
    licence_type?: string;
    licence_expiry?: string;
    sia_not_required?: boolean; 
    additional_sia_licence?: string;
    additional_licence_type?: string;
    additional_licence_expiry?: string;
    additional_licence_required?: boolean;
    pwva_trained?: boolean;
    employee_photo?: File;
    leisure: string;
    leisure_interests?: string;
    criminal_record: string;
    criminal_record_details?: string;
}

interface FieldConfig {
    name: keyof FormData;
    type: 'text' | 'textarea' | 'email' | 'password' | 'select' | 'checkbox' | 'date' | 'file' | 'radio';
    placeholder?: string;
    label: string;
    required: boolean;
    options?: { label: string; value: string }[];
}

export const fields: FieldConfig[] = [
    { name: 'employee_photo', type: 'file', label: 'Employee Photo', required: false },
    { name: 'first_name', type: 'text', label: 'First Name', required: true },
    { name: 'middle_name', type: 'text', label: 'Middle Name', required: false },
    { name: 'last_name', type: 'text', label: 'Last Name', required: true },
    { name: 'email', type: 'email', label: 'Email', required: true },
    {
        name: 'gender',
        type: 'select',
        placeholder: 'Select',
        label: 'Gender', 
        required: false,
        options: [
            { label: 'Male', value: 'Male' },
            { label: 'Female', value: 'Female' },
            { label: 'Other', value: 'Other' },
        ]
    },
    { name: 'date_of_birth', type: 'date', label: 'Date of Birth', required: true }, 
    { name: 'phone', type: 'text', label: 'Phone Number', required: false },
    { name: 'second_phone', type: 'text', label: 'Second Number', required: false },
    { name: 'ni_number', type: 'text', label: 'N.I Number', required: false },
    { name: 'ebds_number', type: 'text', label: 'EBDS Number', required: false },
    { name: 'next_of_kin', type: 'text', label: 'Next of Kin', required: false },
    { name: 'next_of_kin_contact_no', type: 'text', label: 'Next of Kin Contact No', required: false },
    {
        name: 'nationality',
        type: 'select',
        placeholder: 'Select',
        label: 'Nationality', 
        required: false,
        options: [
            { label: 'Pakistani', value: 'Pakistani' },
            { label: 'British', value: 'British' },
            { label: 'Indian', value: 'Indian' },
        ]
    },
    { name: 'relationship_status', type: 'text', label: 'Relationship Status', required: false },
    {
        name: 'sia_not_required',
        type: 'checkbox',
        label: 'SIA not required', 
        required: false,
    },
    {
        name: 'sia_licence',
        type: 'text',
        label: 'S.I.A Licence Number',
        required: false,
    },
    {
        name: 'licence_type',
        type: 'select',
        placeholder: 'Select',
        label: 'Licence Type', 
        required: false,
        options: [
            { label: 'CCTV', value: 'CCTV' },
            { label: 'Type 2', value: 'Type 2' },
            { label: 'Type 3', value: 'Type 3' },
        ]
    },
    {
        name: 'licence_expiry',
        type: 'date',
        placeholder: 'Select',
        label: 'Licence Expiry Date', 
        required: false,
    },
    {
        name: 'additional_licence_required',
        type: 'checkbox',
        label: 'Additional Licence Required',
        required: false,
    },
    {
        name: 'additional_sia_licence',
        type: 'text',
        label: 'S.I.A Licence Number',
        required: false,
    },
    {
        name: 'additional_licence_type',
        type: 'select',
        placeholder: 'Select',
        label: 'Licence Type', 
        required: false,
        options: [
            { label: 'Type A', value: 'Type A' },
            { label: 'Type B', value: 'Type B' },
            { label: 'Type C', value: 'Type C' },
        ]
    },
    {
        name: 'additional_licence_expiry',
        type: 'date',
        label: 'Licence Expiry Date',
        required: false,
    },
    {
        name: 'pwva_trained',
        type: 'checkbox',
        label: 'PWVA Trained officer?',
        required: false,
    },
];

export const usePersonalFormData = () => {
    const [formData, setFormData] = useState<FormData>({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        gender: '',
        date_of_birth: '',
        phone: '',
        second_phone: '',
        ni_number: '',
        ebds_number: '',
        next_of_kin: '',
        next_of_kin_contact_no: '',
        nationality: '',
        relationship_status: '',
        sia_licence: '',
        licence_type: '',
        licence_expiry: '',
        sia_not_required: false,
        additional_sia_licence: '',
        additional_licence_type: '',
        additional_licence_expiry: '',
        additional_licence_required: false,
        pwva_trained: false,
        leisure: 'no',
        leisure_interests: '',
        criminal_record: 'no',
        criminal_record_details: '',
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = event.target as typeof event.target & {
            name: keyof FormData;
            value: string;
            files?: FileList;
            checked?: boolean;
        };

        const value = target.type === 'file' && target.files ? target.files[0] :
                      target.type === 'checkbox' ? target.checked :
                      target.value;

        setFormData(prev => ({
            ...prev,
            [target.name]: value,
        }));

        // Check if the SIA not required checkbox was changed
        if (target.name === 'sia_not_required' && target.checked) {
            // Reset all related SIA fields
            return setFormData(prev => ({
                ...prev,
                sia_licence: '',
                licence_type: '',
                licence_expiry: '',
                additional_sia_licence: '',
                additional_licence_type: '',
                additional_licence_expiry: '',
                additional_licence_required: false
            }));
        }
    };

    return {
        formData,
        handleChange,
        fields
    };
};
