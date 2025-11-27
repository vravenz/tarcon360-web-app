// File: src/pages/AddRosterPage/formData/useRoasterFormData.ts
import { useState } from 'react';

/**
 * Matches top-level fields for creating a new roster record and linking employees/shifts.
 */
export interface RoasterFormData {
  roaster_id?: number;
  company_id: number;
  client_id: number;
  client_name: string;
  site_id: number;
  site_name: string;
  duty_type: string;

  // Rate/billing details
  payable_rate_type: string;
  payable_role: string;
  payable_amount: number;
  payable_expenses: number;
  billable_role: string;
  billable_amount: number;
  billable_expenses: number;
  unpaid_shift?: boolean;
  training_shift?: boolean;
  shift_status: 'confirmed' | 'unconfirmed' | 'unassigned' | null;

  // PO number logic (updated to allow null)
  po_received?: boolean;
  po_number?: string | null;

  // Additional fields
  penalty?: number;
  comments?: string;
  shift_instruction?: string;

  // Fields controlling staff selection
  select_staff?: string; // e.g. "Employee" or "unassigned"
  guard_group?: string;
  employee?: string;
  subcontractor?: string;
  subcontractor_employee?: string;

  // NEW: Shift-specific fields
  shift_date: string;             // e.g. "2025-03-15"
  scheduled_start_time: string;   // e.g. "09:00:00"
  scheduled_end_time: string;     // e.g. "17:00:00"
  break_time: string;             // e.g. "00:30:00" or ""
}

/** 
 * A React hook that initializes and manages roster form data. 
 */
export const useRoasterFormData = () => {
  const [formData, setFormData] = useState<RoasterFormData>({
    roaster_id: undefined,
    company_id: 0,
    client_id: 0,
    client_name: '',
    site_id: 0,
    site_name: '',
    duty_type: 'security',

    payable_rate_type: 'Site rate',
    payable_role: '',
    payable_amount: 0,
    payable_expenses: 0,

    billable_role: '',
    billable_amount: 0,
    billable_expenses: 0,

    unpaid_shift: false,
    training_shift: false,
    shift_status: 'unconfirmed',

    po_received: false,
    po_number: '',  // Can be an empty string or null
    penalty: 0,
    comments: '',
    shift_instruction: '',

    select_staff: '',
    guard_group: '',
    employee: '',
    subcontractor: '',
    subcontractor_employee: '',

    // Initialize new shift-specific fields with default empty values.
    shift_date: '',
    scheduled_start_time: '',
    scheduled_end_time: '',
    break_time: '',
  });

  return { formData, setFormData };
};
