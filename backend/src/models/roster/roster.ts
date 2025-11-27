// File: models/roster/roster.ts
import pool from '../../config/database';

/** ========================
 *  ROSTER TABLE
 *  ======================== */
export interface Roster {
  roster_id?: number;
  company_id: number;
  site_id: number;
  po_number?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Insert a new roster record
 */
export const insertRoster = async (data: Roster): Promise<Roster> => {
  const { company_id, site_id, po_number } = data;
  const query = `
    INSERT INTO public.roster (
      company_id, site_id, po_number
    )
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [company_id, site_id, po_number ?? null];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting roster:', error);
    throw error;
  }
};

/**
 * Fetch a single roster by its ID
 */
export const getRosterById = async (roster_id: number): Promise<Roster | null> => {
  const query = `
    SELECT r.*, s.site_name, c.client_name
    FROM public.roster r
    JOIN public.sites s ON s.site_id = r.site_id
    JOIN public.clients c ON c.client_id = s.client_id
    WHERE r.roster_id = $1
    LIMIT 1;
  `;
  try {
    const { rows } = await pool.query(query, [roster_id]);
    if (rows.length === 0) return null;
    return rows[0];
  } catch (error) {
    console.error('Error fetching roster by ID:', error);
    throw error;
  }
};

/**
 * Fetch all roster records
 */
export const getAllRosters = async (): Promise<any[]> => {
  // This query joins roster with sites and clients (assuming:
  // sites table has a "client_id" and clients table has "client_name")
  const query = `
    SELECT 
      r.*,
      s.site_name,
      c.client_name
    FROM public.roster r
    JOIN public.sites s ON s.site_id = r.site_id
    JOIN public.clients c ON c.client_id = s.client_id
    ORDER BY r.roster_id DESC;
  `;
  try {
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching all rosters:', error);
    throw error;
  }
};

/**
 * Update a roster record by ID
 */
export const updateRoster = async (roster_id: number, data: Partial<Roster>): Promise<Roster> => {
  const { company_id, site_id, po_number } = data;

  const query = `
    UPDATE public.roster
    SET
      company_id = COALESCE($1, company_id),
      site_id    = COALESCE($2, site_id),
      po_number  = COALESCE($3, po_number),
      updated_at = CURRENT_TIMESTAMP
    WHERE roster_id = $4
    RETURNING *;
  `;
  const values = [company_id ?? null, site_id ?? null, po_number ?? null, roster_id];

  try {
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      throw new Error(`No roster found with ID ${roster_id}`);
    }
    return rows[0];
  } catch (error) {
    console.error('Error updating roster:', error);
    throw error;
  }
};

/**
 * Delete a roster record by ID
 */
export const deleteRoster = async (roster_id: number): Promise<void> => {
  const query = `DELETE FROM public.roster WHERE roster_id = $1`;
  try {
    await pool.query(query, [roster_id]);
  } catch (error) {
    console.error('Error deleting roster:', error);
    throw error;
  }
};
