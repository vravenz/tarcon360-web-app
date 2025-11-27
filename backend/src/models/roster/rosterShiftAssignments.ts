import pool from '../../config/database';
import { RosterShiftHistory } from './rosterShiftHistory';

/* ===============================
   Roster Shift Assignment Interface
   =============================== */
export interface RosterShiftAssignment {
  roster_shift_assignment_id?: number;
  company_id: number;
  roster_shift_id: number;
  roster_employee_id: number;
  assignment_start_time?: string | null; // e.g. "HH:mm:ss"
  assignment_end_time?: string | null;   // e.g. "HH:mm:ss"
  actual_worked_hours?: number | null;
  assignment_status?: 'active' | 'removed' | 'completed';
  employee_shift_status?: 'confirmed' | 'unconfirmed';
  created_at?: Date;
  updated_at?: Date;
}

/* ===============================
   Bulk Insert Assignments
   =============================== */
export const insertRosterShiftAssignments = async (
  assignments: RosterShiftAssignment[]
): Promise<RosterShiftAssignment[]> => {
  if (!assignments || assignments.length === 0) return [];

  const insertQuery = `
    INSERT INTO public.roster_shift_assignments (
      company_id,
      roster_shift_id,
      roster_employee_id,
      assignment_start_time,
      assignment_end_time,
      actual_worked_hours,
      assignment_status,
      employee_shift_status
    )
    VALUES
  `;
  const valuesClause: string[] = [];
  const params: any[] = [];
  let i = 1;

  for (const a of assignments) {
    valuesClause.push(`(
      $${i++}, $${i++}, $${i++}, $${i++}, $${i++},
      $${i++}, $${i++}, $${i++}
    )`);
    params.push(
      a.company_id,
      a.roster_shift_id,
      a.roster_employee_id,
      a.assignment_start_time ?? null,
      a.assignment_end_time ?? null,
      a.actual_worked_hours ?? null,
      a.assignment_status ?? 'active',
      a.employee_shift_status ?? 'unconfirmed'
    );
  }

  const finalQuery = insertQuery + valuesClause.join(', ') + ' RETURNING *;';
  try {
    const { rows } = await pool.query(finalQuery, params);
    return rows;
  } catch (error) {
    console.error('Error inserting shift assignments:', error);
    throw error;
  }
};

/**
 * Insert a *single* shift assignment record.
 * (We already have a bulk insert, but let's make one specifically for a single assignment.)
 */
export const insertSingleRosterShiftAssignment = async (
  assignment: RosterShiftAssignment
): Promise<RosterShiftAssignment> => {
  const query = `
    INSERT INTO public.roster_shift_assignments (
      company_id,
      roster_shift_id,
      roster_employee_id,
      assignment_start_time,
      assignment_end_time,
      actual_worked_hours,
      assignment_status,
      employee_shift_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const values = [
    assignment.company_id,
    assignment.roster_shift_id,
    assignment.roster_employee_id,
    assignment.assignment_start_time ?? null,
    assignment.assignment_end_time ?? null,
    assignment.actual_worked_hours ?? null,
    assignment.assignment_status ?? 'active',
    assignment.employee_shift_status ?? 'unconfirmed'
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting single shift assignment:', error);
    throw error;
  }
};

/* ===============================
   SHIFT ASSIGNMENT HISTORY
   For logging changes to assignments
=============================== */
export interface RosterShiftAssignmentHistory {
  roster_shift_assignment_history_id?: number;
  company_id: number;
  roster_shift_assignment_id: number;
  assignment_status?: string;
  actual_worked_hours?: number | null;
  comments?: string | null;
  updated_by: number;   // user id
  change_reason?: string | null;
  changed_at?: Date;
}

/**
 * Insert a record into roster_shift_assignment_history
 * whenever we create or update an assignment for auditing.
 */
export const insertRosterShiftAssignmentHistory = async (
  data: RosterShiftAssignmentHistory
): Promise<RosterShiftAssignmentHistory> => {
  const query = `
    INSERT INTO public.roster_shift_assignment_history (
      company_id,
      roster_shift_assignment_id,
      assignment_status,
      actual_worked_hours,
      comments,
      updated_by,
      change_reason
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [
    data.company_id,
    data.roster_shift_assignment_id,
    data.assignment_status || null,
    data.actual_worked_hours || null,
    data.comments || null,
    data.updated_by,
    data.change_reason || null
  ];

  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error inserting roster shift assignment history:', error);
    throw error;
  }
};


/* ===============================
   Fetch Assignments by Shift ID
   =============================== */
export const getAssignmentsByShiftId = async (
  roster_shift_id: number
): Promise<RosterShiftAssignment[]> => {
  const query = `
    SELECT *
    FROM public.roster_shift_assignments
    WHERE roster_shift_id = $1
    ORDER BY roster_shift_assignment_id;
  `;
  try {
    const { rows } = await pool.query(query, [roster_shift_id]);
    return rows;
  } catch (error) {
    console.error('Error fetching shift assignments by shift_id:', error);
    throw error;
  }
};

/* ===============================
   Fetch Assignments by Roster ID (via join)
   =============================== */
export const getAssignmentsByRosterId = async (
  roster_id: number
): Promise<RosterShiftAssignment[]> => {
  const query = `
    SELECT rsa.*
    FROM public.roster_shift_assignments AS rsa
    JOIN public.roster_shifts AS rs ON rs.roster_shift_id = rsa.roster_shift_id
    WHERE rs.roster_id = $1
    ORDER BY rsa.roster_shift_assignment_id;
  `;
  try {
    const { rows } = await pool.query(query, [roster_id]);
    return rows;
  } catch (error) {
    console.error('Error fetching shift assignments by roster_id:', error);
    throw error;
  }
};

/* ===============================
   Update an Assignment
   =============================== */
export const updateRosterShiftAssignment = async (
  roster_shift_assignment_id: number,
  data: Partial<RosterShiftAssignment>
): Promise<RosterShiftAssignment> => {
  const {
    assignment_start_time,
    assignment_end_time,
    actual_worked_hours,
    assignment_status,
    employee_shift_status,
  } = data;

  const query = `
    UPDATE public.roster_shift_assignments
    SET
      assignment_start_time   = COALESCE($1, assignment_start_time),
      assignment_end_time     = COALESCE($2, assignment_end_time),
      actual_worked_hours     = COALESCE($3, actual_worked_hours),
      assignment_status       = COALESCE($4, assignment_status),
      employee_shift_status   = COALESCE($5, employee_shift_status),
      updated_at = CURRENT_TIMESTAMP
    WHERE roster_shift_assignment_id = $6
    RETURNING *;
  `;
  const values = [
    assignment_start_time ?? null,
    assignment_end_time ?? null,
    actual_worked_hours ?? null,
    assignment_status ?? null,
    employee_shift_status ?? null,
    roster_shift_assignment_id,
  ];

  try {
    const { rows } = await pool.query(query, values);
    if (!rows.length) {
      throw new Error(`No roster_shift_assignment found with ID ${roster_shift_assignment_id}`);
    }
    return rows[0];
  } catch (error) {
    console.error('Error updating roster_shift_assignment:', error);
    throw error;
  }
};

/* ===============================
   Delete All Assignments by Roster ID
   =============================== */
export const deleteAssignmentsByRosterId = async (roster_id: number): Promise<void> => {
  const query = `
    DELETE FROM public.roster_shift_assignments AS rsa
    USING public.roster_shifts AS rs
    WHERE rs.roster_shift_id = rsa.roster_shift_id
    AND rs.roster_id = $1
  `;
  try {
    await pool.query(query, [roster_id]);
  } catch (error) {
    console.error('Error deleting shift assignments by roster_id:', error);
    throw error;
  }
};

/* ===============================
   Delete a Single Assignment by ID
   (This may be used when you really want to delete the row.)
   =============================== */
export const deleteRosterShiftAssignment = async (
  roster_shift_assignment_id: number
): Promise<void> => {
  const query = `DELETE FROM public.roster_shift_assignments WHERE roster_shift_assignment_id = $1`;
  try {
    await pool.query(query, [roster_shift_assignment_id]);
  } catch (error) {
    console.error('Error deleting roster_shift_assignment:', error);
    throw error;
  }
};

/* ===============================
   Roster Shift Assignment Removal Interface
   (This is for logging removals)
   =============================== */
export interface RosterShiftAssignmentRemoval {
  removal_id?: number;
  company_id: number;
  roster_shift_assignment_id: number;
  removed_by: number;
  removal_reason?: string;
  removed_at?: Date;
}

/* ===============================
   Insert a Removal Record
   =============================== */
export const insertRosterShiftAssignmentRemoval = async (
  data: RosterShiftAssignmentRemoval
): Promise<RosterShiftAssignmentRemoval> => {
  const query = `
    INSERT INTO public.roster_shift_assignment_removals (
      company_id,
      roster_shift_assignment_id,
      removed_by,
      removal_reason
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [
    data.company_id,
    data.roster_shift_assignment_id,
    data.removed_by,
    data.removal_reason || null,
  ];
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error inserting roster shift assignment removal:', error);
    throw error;
  }
};

/* ===============================
   Remove an Assignment with Logging
   ===============================
   This function logs the removal by inserting a record into the
   roster_shift_assignment_removals table and then updates the assignment's
   status to 'removed' (instead of deleting the row).
*/
export const removeRosterShiftAssignment = async (
  roster_shift_assignment_id: number,
  removal_reason: string | undefined,
  company_id: number,
  removed_by: number
): Promise<RosterShiftAssignment> => {
  // Insert removal log
  await insertRosterShiftAssignmentRemoval({
    company_id,
    roster_shift_assignment_id,
    removed_by,
    removal_reason,
  });
  // Update assignment status to 'removed'
  const updatedAssignment = await updateRosterShiftAssignment(roster_shift_assignment_id, {
    assignment_status: 'removed',
  });
  return updatedAssignment;
};


/**
 * Get active assignments for a given shift.
 */
export const getActiveAssignmentsByShiftId = async (
  roster_shift_id: number
): Promise<any[]> => {
  const query = `
    SELECT rsa.*, a.first_name, a.last_name
    FROM public.roster_shift_assignments rsa
    JOIN public.roster_employees re ON re.roster_employee_id = rsa.roster_employee_id
    JOIN public.applicants a ON a.applicant_id = re.applicant_id
    WHERE rsa.roster_shift_id = $1 
      AND rsa.assignment_status = 'active'
    ORDER BY rsa.created_at;
  `;
  const { rows } = await pool.query(query, [roster_shift_id]);
  return rows;
};

/**
 * Get removed assignments for a given shift.
 */
export const getRemovedAssignmentsByShiftId = async (
  roster_shift_id: number
): Promise<any[]> => {
  const query = `
    SELECT rra.*, a.first_name, a.last_name
    FROM public.roster_shift_assignment_removals rra
    JOIN public.roster_shift_assignments rsa ON rsa.roster_shift_assignment_id = rra.roster_shift_assignment_id
    JOIN public.roster_employees re ON re.roster_employee_id = rsa.roster_employee_id
    JOIN public.applicants a ON a.applicant_id = re.applicant_id
    WHERE rsa.roster_shift_id = $1
    ORDER BY rra.removed_at DESC;
  `;
  const { rows } = await pool.query(query, [roster_shift_id]);
  return rows;
};

/**
 * Get shift history for a given shift.
 */
export const getRosterShiftHistoryByShiftId = async (
  roster_shift_id: number
): Promise<RosterShiftHistory[]> => {
  const query = `
    SELECT *
    FROM public.roster_shift_history
    WHERE roster_shift_id = $1
    ORDER BY changed_at DESC;
  `;
  const { rows } = await pool.query(query, [roster_shift_id]);
  return rows;
};

/**
 * Get assignment history for a given shift.
 */
export const getRosterShiftAssignmentHistoryByShiftId = async (
  roster_shift_id: number
): Promise<any[]> => {
  const query = `
    SELECT rsha.*, a.first_name, a.last_name
    FROM public.roster_shift_assignment_history rsha
    JOIN public.roster_shift_assignments rsa ON rsa.roster_shift_assignment_id = rsha.roster_shift_assignment_id
    JOIN public.roster_employees re ON re.roster_employee_id = rsa.roster_employee_id
    JOIN public.applicants a ON a.applicant_id = re.applicant_id
    WHERE rsa.roster_shift_id = $1
    ORDER BY rsha.changed_at DESC;
  `;
  const { rows } = await pool.query(query, [roster_shift_id]);
  return rows;
};