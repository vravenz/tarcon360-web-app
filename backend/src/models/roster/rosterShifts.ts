// File: models/rosterShifts.ts

import pool from '../../config/database';

export interface RosterShift {
  roster_shift_id?: number;
  company_id: number;
  roster_id: number;          // The parent roster
  shift_date: string;         // "YYYY-MM-DD"
  scheduled_start_time?: string | null; // "HH:mm:ss"
  scheduled_end_time?: string | null;   // "HH:mm:ss"
  break_time?: string | null;           // e.g. "00:30:00" for 30 min break
  shift_status?: 'confirmed' | 'unconfirmed' | 'unassigned';
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
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Bulk insert multiple roster shifts
 */
export const insertRosterShifts = async (shifts: RosterShift[]): Promise<RosterShift[]> => {
  if (!shifts || shifts.length === 0) return [];

  const insertQuery = `
    INSERT INTO public.roster_shifts (
      company_id,
      roster_id,
      shift_date,
      scheduled_start_time,
      scheduled_end_time,
      break_time,
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
      training_shift
    )
    VALUES
  `;

  const valuesClause: string[] = [];
  const params: any[] = [];
  let i = 1;

  for (const s of shifts) {
    valuesClause.push(
      `($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++},
        $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++},
        $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`
    );
    params.push(
      s.company_id,
      s.roster_id,
      s.shift_date,
      s.scheduled_start_time ?? null,
      s.scheduled_end_time ?? null,
      s.break_time ?? null,
      s.shift_status ?? 'unassigned',
      s.penalty ?? null,
      s.comments ?? null,
      s.shift_instruction ?? null,
      s.payable_rate_type ?? 'Site rate',
      s.payable_role ?? null,
      s.payable_amount ?? null,
      s.billable_role ?? null,
      s.billable_amount ?? null,
      s.payable_expenses ?? null,
      s.billable_expenses ?? null,
      s.unpaid_shift ?? false,
      s.training_shift ?? false
    );
  }

  const finalQuery = insertQuery + valuesClause.join(', ') + ' RETURNING *;';
  try {
    const { rows } = await pool.query(finalQuery, params);
    return rows;
  } catch (error) {
    console.error('Error inserting roster shifts:', error);
    throw error;
  }
};

/**
 * Fetch a single shift by its roster_shift_id
 */
export const getRosterShiftById = async (roster_shift_id: number): Promise<RosterShift | null> => {
  const query = `
    SELECT *
    FROM public.roster_shifts
    WHERE roster_shift_id = $1
    LIMIT 1;
  `;
  try {
    const { rows } = await pool.query(query, [roster_shift_id]);
    if (rows.length === 0) return null;
    return rows[0];
  } catch (error) {
    console.error('Error fetching shift by ID:', error);
    throw error;
  }
};

/**
 * Fetch all shifts for a given roster
 */
export const getRosterShiftsByRosterId = async (roster_id: number): Promise<RosterShift[]> => {
  const query = `
    SELECT *
    FROM public.roster_shifts
    WHERE roster_id = $1
    ORDER BY shift_date, scheduled_start_time;
  `;
  try {
    const { rows } = await pool.query(query, [roster_id]);
    return rows;
  } catch (error) {
    console.error('Error fetching shifts by roster_id:', error);
    throw error;
  }
};

/**
 * Update a single roster_shift
 */
export const updateRosterShift = async (
  roster_shift_id: number,
  data: Partial<RosterShift>
): Promise<RosterShift> => {
  const {
    // Exclude these from update:
    // shift_date,
    // scheduled_start_time,
    // scheduled_end_time,
    // break_time,
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
    training_shift
  } = data;

  const query = `
    UPDATE public.roster_shifts
    SET
      shift_status       = COALESCE($1, shift_status),
      penalty            = COALESCE($2, penalty),
      comments           = COALESCE($3, comments),
      shift_instruction  = COALESCE($4, shift_instruction),
      payable_rate_type  = COALESCE($5, payable_rate_type),
      payable_role       = COALESCE($6, payable_role),
      payable_amount     = COALESCE($7, payable_amount),
      billable_role      = COALESCE($8, billable_role),
      billable_amount    = COALESCE($9, billable_amount),
      payable_expenses   = COALESCE($10, payable_expenses),
      billable_expenses  = COALESCE($11, billable_expenses),
      unpaid_shift       = COALESCE($12, unpaid_shift),
      training_shift     = COALESCE($13, training_shift),
      updated_at         = CURRENT_TIMESTAMP
    WHERE roster_shift_id = $14
    RETURNING *;
  `;
  const values = [
    shift_status ?? null,
    penalty ?? null,
    comments ?? null,
    shift_instruction ?? null,
    payable_rate_type ?? null,
    payable_role ?? null,
    payable_amount ?? null,
    billable_role ?? null,
    billable_amount ?? null,
    payable_expenses ?? null,
    billable_expenses ?? null,
    unpaid_shift ?? false,
    training_shift ?? false,
    roster_shift_id
  ];

  try {
    const { rows } = await pool.query(query, values);
    if (!rows.length) throw new Error(`No shift found with ID ${roster_shift_id}`);
    return rows[0];
  } catch (error) {
    console.error('Error updating roster shift:', error);
    throw error;
  }
};

/**
 * Delete all shifts for a given roster
 */
export const deleteRosterShiftsByRosterId = async (roster_id: number): Promise<void> => {
  const query = `
    DELETE FROM public.roster_shifts
    WHERE roster_id = $1
  `;
  try {
    await pool.query(query, [roster_id]);
  } catch (error) {
    console.error('Error deleting roster shifts:', error);
    throw error;
  }
};

/**
 * Delete a single roster shift by its ID
 */
export const deleteRosterShift = async (roster_shift_id: number): Promise<void> => {
  const query = `DELETE FROM public.roster_shifts WHERE roster_shift_id = $1`;
  try {
    await pool.query(query, [roster_shift_id]);
  } catch (error) {
    console.error('Error deleting roster shift:', error);
    throw error;
  }
};

