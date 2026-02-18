type InputType = 'text' | 'textarea' | 'email' | 'password' | 'select' | 'checkbox' | 'date' | 'file' | 'radio' | 'number';

interface FieldConfig {
  name: string;
  label: string;
  type: InputType;
  required: boolean;
  options?: { label: string; value: string }[];
}

const employeeFields: FieldConfig[] = [
    { name: 'first_name', label: 'First Name', type: 'text', required: true },
    { name: 'middle_name', label: 'Middle Name', type: 'text', required: false },
    { name: 'last_name', label: 'Last Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'text', required: true },
    { name: 'second_phone', label: 'Second Phone', type: 'text', required: false },
    {
        name: 'gender', label: 'Gender', type: 'select', required: false,
        options: [
            { label: 'Male', value: 'Male' },
            { label: 'Female', value: 'Female' },
            { label: 'Other', value: 'Other' },
        ]
    },
    // Add more fields as necessary
];

export default employeeFields;
