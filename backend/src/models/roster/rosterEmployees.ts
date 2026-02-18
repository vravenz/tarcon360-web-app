// File: models/roster/rosterEmployees.ts

import { getPool } from "../../config/database"
const pool = getPool()

export interface RosterEmployee {
  roster_employee_id?: number;
  company_id: number;
  roster_id: number;
  applicant_id?: number | null; // if "unassigned", store null
  staff?: string | null;
  guard_group?: number | null;
  subcontractor?: number | null;
  first_name?: string;
  last_name?: string;
  employee_photo?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Bulk insert multiple employees for a given roster
 */
export const insertRosterEmployees = async (
  employees: RosterEmployee[]
): Promise<RosterEmployee[]> => {
  if (!employees || employees.length === 0) return [];

  const insertQuery = `
    INSERT INTO public.roster_employees (
      company_id,
      roster_id,
      applicant_id,
      staff,
      guard_group,
      subcontractor
    )
    VALUES
  `;

  const valuesClause: string[] = [];
  const params: any[] = [];
  let idx = 1;

  for (const emp of employees) {
    valuesClause.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    params.push(
      emp.company_id,
      emp.roster_id,
      emp.applicant_id ?? null,
      emp.staff ?? null,
      emp.guard_group ?? null,
      emp.subcontractor ?? null
    );
  }

  const finalQuery = insertQuery + valuesClause.join(', ') + ' RETURNING *;';
  try {
    const result = await pool.query(finalQuery, params);
    return result.rows;
  } catch (error) {
    console.error('Error inserting roster employees:', error);
    throw error;
  }
};

/**
 * Fetch a single roster_employee by its ID.
 */
export const getRosterEmployeeById = async (roster_employee_id: number): Promise<RosterEmployee> => {
  const query = `
    SELECT re.*, a.first_name, a.last_name, a.employee_photo
    FROM public.roster_employees re
    JOIN public.applicants a ON a.applicant_id = re.applicant_id
    WHERE re.roster_employee_id = $1
    LIMIT 1;
  `;
  try {
    const { rows } = await pool.query(query, [roster_employee_id]);
    if (rows.length === 0) {
      throw new Error(`No roster_employee found with ID ${roster_employee_id}`);
    }
    return rows[0];
  } catch (error) {
    console.error('Error fetching roster employee by ID:', error);
    throw error;
  }
};

/**
 * Fetch all roster_employees for a given roster
 */
export const getRosterEmployeesByRosterId = async (roster_id: number): Promise<RosterEmployee[]> => {
  const query = `
    SELECT re.*, a.first_name, a.last_name, a.employee_photo
    FROM public.roster_employees re
    JOIN public.applicants a ON a.applicant_id = re.applicant_id
    WHERE re.roster_id = $1
    ORDER BY re.roster_employee_id;
  `;
  try {
    const { rows } = await pool.query(query, [roster_id]);
    return rows;
  } catch (error) {
    console.error('Error fetching employees by roster_id:', error);
    throw error;
  }
};

/**
 * Update a single roster_employee
 */
export const updateRosterEmployee = async (
  roster_employee_id: number,
  data: Partial<RosterEmployee>
): Promise<RosterEmployee> => {
  const { applicant_id, staff, guard_group, subcontractor } = data;

  const query = `
    UPDATE public.roster_employees
    SET
      applicant_id  = COALESCE($1, applicant_id),
      staff         = COALESCE($2, staff),
      guard_group   = COALESCE($3, guard_group),
      subcontractor = COALESCE($4, subcontractor),
      updated_at    = CURRENT_TIMESTAMP
    WHERE roster_employee_id = $5
    RETURNING *;
  `;
  const values = [
    applicant_id ?? null,
    staff ?? null,
    guard_group ?? null,
    subcontractor ?? null,
    roster_employee_id
  ];

  try {
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      throw new Error(`No roster_employee found with ID ${roster_employee_id}`);
    }
    return rows[0];
  } catch (error) {
    console.error('Error updating roster employee:', error);
    throw error;
  }
};

/**
 * Delete all employees for a roster
 */
export const deleteRosterEmployeesByRosterId = async (roster_id: number): Promise<void> => {
  const query = `DELETE FROM public.roster_employees WHERE roster_id = $1`;
  try {
    await pool.query(query, [roster_id]);
  } catch (error) {
    console.error('Error deleting roster employees:', error);
    throw error;
  }
};

/**
 * Delete a single employee by ID
 */
export const deleteRosterEmployee = async (roster_employee_id: number): Promise<void> => {
  const query = `DELETE FROM public.roster_employees WHERE roster_employee_id = $1`;
  try {
    await pool.query(query, [roster_employee_id]);
  } catch (error) {
    console.error('Error deleting roster employee:', error);
    throw error;
  }
};

/**
 * Insert a single RosterEmployee record.
 */
export const insertSingleRosterEmployee = async (
  employee: RosterEmployee
): Promise<RosterEmployee> => {
  const query = `
    INSERT INTO public.roster_employees (
      company_id,
      roster_id,
      applicant_id,
      staff,
      guard_group,
      subcontractor
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [
    employee.company_id,
    employee.roster_id,
    employee.applicant_id ?? null,
    employee.staff ?? null,
    employee.guard_group ?? null,
    employee.subcontractor ?? null
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting single roster employee:', error);
    throw error;
  }
};