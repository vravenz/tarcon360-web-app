// File: src/pages/AddRosterPage/hooks/useExtendedFields.ts

import { useMemo, useState } from 'react';
import { RoasterFormData } from './formData/useRoasterFormData';

export interface FieldConfig {
  name: keyof RoasterFormData;
  type:
    | 'select'
    | 'text'
    | 'checkbox'
    | 'textarea'
    | 'email'
    | 'password'
    | 'number'
    | 'date'
    | 'radio'
    | 'file';
  label: string;
  required: boolean;
  options?: { label: string; value: string | number }[];
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
}

// Example data models for your Clients & Sites
interface Client {
  client_id: number;
  client_name: string;
}
interface Site {
  site_id: number;
  site_name: string;
  site_payable_rate_guarding?: number;
  site_payable_rate_supervisor?: number;
  site_billable_rate_guarding?: number;
  site_billable_rate_supervisor?: number;
}

interface ExtendedFieldsProps {
  formData: RoasterFormData;
  setFormData: React.Dispatch<React.SetStateAction<RoasterFormData>>;
  clients: Client[];
  sites: Site[];
  selectedSiteDetails: Site | null;
  handleSelectSite: (siteId: number) => void;
  isEditMode?: boolean; // optional if you want to skip certain fields when editing
}

export const useExtendedFields = ({
  formData,
  setFormData,
  clients,
  sites,
  selectedSiteDetails,
  handleSelectSite,
  isEditMode = false,
}: ExtendedFieldsProps) => {
  const [previousPayableAmount, setPreviousPayableAmount] = useState<number>(0);
  const [previousBillableAmount, setPreviousBillableAmount] = useState<number>(0);
  const [poReceived, setPoReceived] = useState<boolean>(false);

  /**
   * The “base” fields for client, site, duty_type, etc.
   * We skip “client_id” / “site_id” in edit mode if you prefer to lock them.
   */
  const baseFields = useMemo<FieldConfig[]>(() => {
    const fields: FieldConfig[] = [
      {
        name: 'client_id',
        type: 'select',
        label: 'Select Client',
        required: true,
        options: clients.map((client) => ({
          label: client.client_name,
          value: client.client_id,
        })),
        onChange: (e) => {
          const val = parseInt(e.target.value, 10);
          const selectedClient = clients.find((c) => c.client_id === val);
          setFormData((prev) => ({
            ...prev,
            client_id: val,
            client_name: selectedClient ? selectedClient.client_name : '',
            site_id: 0,
            site_name: '',
          }));
        },
      },
      {
        name: 'site_id',
        type: 'select',
        label: 'Select Site',
        required: true,
        options: sites.map((site) => ({
          label: site.site_name,
          value: site.site_id,
        })),
        onChange: (e) => {
          const val = parseInt(e.target.value, 10);
          const selectedSite = sites.find((s) => s.site_id === val);
          setFormData((prev) => ({
            ...prev,
            site_id: val,
            site_name: selectedSite ? selectedSite.site_name : '',
          }));
          handleSelectSite(val);
        },
      },
      {
        name: 'duty_type',
        type: 'select',
        label: 'Duty Type',
        required: true,
        options: [{ label: 'Security', value: 'security' }],
        onChange: (e) => {
          setFormData((prev) => ({ ...prev, duty_type: e.target.value }));
        },
      },
      {
        name: 'select_staff',
        type: 'select',
        label: 'Select Staff',
        required: true,
        options: [
          { label: 'Employee', value: 'Employee' },
          { label: 'Unassigned', value: 'unassigned' },
        ],
        onChange: (e) => {
          setFormData((prev) => ({
            ...prev,
            select_staff: e.target.value,
            guard_group: '',
            employee: '',
          }));
        },
      },
      {
        name: 'payable_rate_type',
        type: 'select',
        label: 'Payable Rate Type',
        required: true,
        options: [{ label: 'Site rate', value: 'Site rate' }],
        onChange: (e) => {
          setFormData((prev) => ({
            ...prev,
            payable_rate_type: e.target.value,
          }));
        },
      },
      {
        name: 'payable_expenses',
        type: 'number',
        label: 'Payable Expenses',
        required: false,
        onChange: (e) => {
          setFormData((prev) => ({
            ...prev,
            payable_expenses: Number(e.target.value),
          }));
        },
      },
      {
        name: 'billable_expenses',
        type: 'number',
        label: 'Billable Expenses',
        required: false,
        onChange: (e) => {
          setFormData((prev) => ({
            ...prev,
            billable_expenses: Number(e.target.value),
          }));
        },
      },
    ];

    // If we’re in edit mode, you might skip client/site changes:
    if (isEditMode) {
      return fields.filter((f) => f.name !== 'client_id' && f.name !== 'site_id');
    }
    return fields;
  }, [clients, sites, handleSelectSite, setFormData, isEditMode]);

  /**
   * Additional fields for pay/bill amounts, checkboxes, penalty, etc.
   */
  const extendedFields = useMemo<FieldConfig[]>(() => {
    return [
      {
        name: 'payable_role',
        type: 'select',
        label: 'Payable Role',
        required: true,
        options: [
          { label: 'Site Guard', value: 'Site Guard' },
          { label: 'Site Supervisor', value: 'Site Supervisor' },
        ],
        onChange: (e) => {
          const role = e.target.value;
          let amount = 0;
          if (selectedSiteDetails) {
            if (role === 'Site Guard') {
              amount = selectedSiteDetails.site_payable_rate_guarding ?? 0;
            } else if (role === 'Site Supervisor') {
              amount = selectedSiteDetails.site_payable_rate_supervisor ?? 0;
            }
          }
          setFormData((prev) => ({
            ...prev,
            payable_role: role,
            payable_amount: amount,
          }));
        },
      },
      {
        name: 'payable_amount',
        type: 'number',
        label: 'Payable Amount',
        required: true,
        onChange: (e) => {
          setFormData((prev) => ({
            ...prev,
            payable_amount: Number(e.target.value),
          }));
        },
      },
      {
        name: 'billable_role',
        type: 'select',
        label: 'Billable Role',
        required: true,
        options: [
          { label: 'Site Guard', value: 'Site Guard' },
          { label: 'Site Supervisor', value: 'Site Supervisor' },
        ],
        onChange: (e) => {
          const role = e.target.value;
          let amount = 0;
          if (selectedSiteDetails) {
            if (role === 'Site Guard') {
              amount = selectedSiteDetails.site_billable_rate_guarding ?? 0;
            } else if (role === 'Site Supervisor') {
              amount = selectedSiteDetails.site_billable_rate_supervisor ?? 0;
            }
          }
          setFormData((prev) => ({
            ...prev,
            billable_role: role,
            billable_amount: amount,
          }));
        },
      },
      {
        name: 'billable_amount',
        type: 'number',
        label: 'Billable Amount',
        required: true,
        onChange: (e) => {
          setFormData((prev) => ({
            ...prev,
            billable_amount: Number(e.target.value),
          }));
        },
      },
      {
        name: 'unpaid_shift',
        type: 'checkbox',
        label: 'Unpaid Shift',
        required: false,
        onChange: (e) => {
          if (e.target instanceof HTMLInputElement) {
            const checked = e.target.checked;
            setFormData((prev) => ({ ...prev, unpaid_shift: checked }));
            if (checked) {
              setPreviousPayableAmount(formData.payable_amount);
              setFormData((prev) => ({ ...prev, payable_amount: 0 }));
            } else {
              setFormData((prev) => ({
                ...prev,
                payable_amount: previousPayableAmount,
              }));
            }
          }
        },
      },
      {
        name: 'training_shift',
        type: 'checkbox',
        label: 'Training Shift',
        required: false,
        onChange: (e) => {
          if (e.target instanceof HTMLInputElement) {
            const checked = e.target.checked;
            setFormData((prev) => ({ ...prev, training_shift: checked }));
            if (checked) {
              setPreviousBillableAmount(formData.billable_amount);
              setFormData((prev) => ({ ...prev, billable_amount: 0 }));
            } else {
              setFormData((prev) => ({
                ...prev,
                billable_amount: previousBillableAmount,
              }));
            }
          }
        },
      },
      {
        name: 'shift_status',
        type: 'radio',
        label: 'Shift Status',
        required: true,
        options: [
          { label: 'Confirm', value: 'confirmed' },
          { label: 'Unconfirm', value: 'unconfirmed' },
        ],
        onChange: (e) => {
          if (e.target instanceof HTMLInputElement) {
            const selectedStatus = e.target.value as 'confirmed' | 'unconfirmed';
            // If “unconfirmed,” maybe set pay/bill to zero? Or do nothing.
            setFormData((prev) => ({ ...prev, shift_status: selectedStatus }));
          }
        },
      },
      {
        name: 'po_received',
        type: 'checkbox',
        label: 'PO Number Received?',
        required: true,
        onChange: (e) => {
          if (e.target instanceof HTMLInputElement) {
            const checked = e.target.checked;
            setPoReceived(checked);
            setFormData((prev) => ({
              ...prev,
              po_received: checked,
              po_number: checked ? prev.po_number : '',
            }));
          }
        },
      },
      // Conditionally add a PO Number field if user says “po_received=true”
      ...(poReceived
        ? [
            {
              name: 'po_number' as keyof RoasterFormData,
              type: 'text',
              label: 'PO Number',
              required: true,
              onChange: (e) => {
                setFormData((prev) => ({
                  ...prev,
                  po_number: e.target.value,
                }));
              },
            } as FieldConfig,
          ]
        : []),
      {
        name: 'penalty',
        type: 'number',
        label: 'Penalty',
        required: false,
        onChange: (e) => {
          setFormData((prev) => ({
            ...prev,
            penalty: Number(e.target.value),
          }));
        },
      },
      {
        name: 'comments',
        type: 'textarea',
        label: 'Comments',
        required: false,
        onChange: (e) => {
          setFormData((prev) => ({ ...prev, comments: e.target.value }));
        },
      },
      {
        name: 'shift_instruction',
        type: 'textarea',
        label: 'Shift Instruction',
        required: false,
        onChange: (e) => {
          setFormData((prev) => ({ ...prev, shift_instruction: e.target.value }));
        },
      },
    ];
  }, [
    formData,
    setFormData,
    selectedSiteDetails,
    previousPayableAmount,
    previousBillableAmount,
    poReceived,
  ]);

  // Merge “base” fields + “extended” fields
  return useMemo(() => {
    return [...baseFields, ...extendedFields];
  }, [baseFields, extendedFields]);
};
