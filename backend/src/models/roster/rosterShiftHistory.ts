import pool from '../../config/database';

export interface RosterShiftHistory {
  roster_shift_history_id?: number;
  company_id: number;
  roster_shift_id: number;
  shift_status?: string;
  penalty?: number | null;
  comments?: string | null;
  shift_instruction?: string | null;
  payable_rate_type?: string | null;
  payable_role?: string | null;
  payable_amount?: number | null;
  billable_role?: string | null;
  billable_amount?: number | null;
  payable_expenses?: number | null;
  billable_expenses?: number | null;
  unpaid_shift?: boolean;
  training_shift?: boolean;
  updated_by: number;
  changed_at?: Date;
}

export const insertRosterShiftHistory = async (
  data: RosterShiftHistory
): Promise<RosterShiftHistory> => {
  const query = `
    INSERT INTO public.roster_shift_history (
      company_id,
      roster_shift_id,
      shift_status,
      penalty,
      comments,
      shift_instruction,
      payable_rate_type,
      payable_role,
      payable_amount,
      billable_role,
      billable_amount,
      payable_expenses,
      billable_expenses,
      unpaid_shift,
      training_shift,
      updated_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *;
  `;
  const values = [
    data.company_id,
    data.roster_shift_id,
    data.shift_status || null,
    data.penalty || null,
    data.comments || null,
    data.shift_instruction || null,
    data.payable_rate_type || null,
    data.payable_role || null,
    data.payable_amount || null,
    data.billable_role || null,
    data.billable_amount || null,
    data.payable_expenses || null,
    data.billable_expenses || null,
    data.unpaid_shift ?? false,
    data.training_shift ?? false,
    data.updated_by
  ];
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error inserting roster shift history:', error);
    throw error;
  }
};
