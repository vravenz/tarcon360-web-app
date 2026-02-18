import { getPool } from "../../config/database"
const pool = getPool()

export interface ClientContactRow {
  contact_id: number
  client_id: number
  name: string
  phone: string | null
  email: string | null
  role: string | null
  is_primary: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface ClientContactCreate {
  name: string
  phone: string | null
  email: string | null
  role: string | null
  is_primary: boolean
}

export interface ClientContactPatch {
  name?: string
  phone?: string | null
  email?: string | null
  role?: string | null
  is_primary?: boolean
}

export const listClientContacts = async (client_id: number): Promise<ClientContactRow[]> => {
  const q = `
    SELECT *
    FROM client_contacts
    WHERE client_id = $1 AND is_deleted = false
    ORDER BY is_primary DESC, contact_id DESC;
  `
  const r = await pool.query(q, [client_id])
  return r.rows
}

export const createClientContact = async (
  client_id: number,
  payload: ClientContactCreate
): Promise<ClientContactRow> => {
  // If making primary: unset existing primary
  if (payload.is_primary) {
    await pool.query(
      `UPDATE client_contacts SET is_primary = false, updated_at = CURRENT_TIMESTAMP
       WHERE client_id = $1 AND is_deleted = false;`,
      [client_id]
    )
  }

  const q = `
    INSERT INTO client_contacts (client_id, name, phone, email, role, is_primary)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
  `
  const r = await pool.query(q, [
    client_id,
    payload.name,
    payload.phone,
    payload.email,
    payload.role,
    payload.is_primary,
  ])
  return r.rows[0]
}

export const updateClientContact = async (
  client_id: number,
  contact_id: number,
  patch: ClientContactPatch
): Promise<ClientContactRow | null> => {
  if (patch.is_primary === true) {
    await pool.query(
      `UPDATE client_contacts SET is_primary = false, updated_at = CURRENT_TIMESTAMP
       WHERE client_id = $1 AND is_deleted = false;`,
      [client_id]
    )
  }

  const q = `
    UPDATE client_contacts
    SET
      name = COALESCE($3, name),
      phone = COALESCE($4, phone),
      email = COALESCE($5, email),
      role = COALESCE($6, role),
      is_primary = COALESCE($7, is_primary),
      updated_at = CURRENT_TIMESTAMP
    WHERE client_id = $1 AND contact_id = $2 AND is_deleted = false
    RETURNING *;
  `
  const r = await pool.query(q, [
    client_id,
    contact_id,
    patch.name ?? null,
    patch.phone === undefined ? null : patch.phone,
    patch.email === undefined ? null : patch.email,
    patch.role === undefined ? null : patch.role,
    patch.is_primary ?? null,
  ])

  return r.rows.length ? r.rows[0] : null
}

export const softDeleteClientContact = async (client_id: number, contact_id: number): Promise<void> => {
  await pool.query(
    `UPDATE client_contacts
     SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
     WHERE client_id = $1 AND contact_id = $2;`,
    [client_id, contact_id]
  )
}
