import pool from "../../config/database"

export interface Client {
  client_name: string
  address: string
  contact_person: string
  contact_number: string
  client_email: string

  // OPTIONALS (nullable)
  client_fax?: string | null
  client_contract_start?: Date | null
  client_contract_end?: Date | null
  client_terms?: string | null

  client_invoice_terms: string

  company_id: number
  is_deleted?: boolean

  charge_rate_guarding: number
  charge_rate_supervisor: number

  vat: boolean
  vat_registration_number?: string | null
}

export interface ClientSiteGroup {
  client_id: number
  site_group_name: string
  billable_guard_rate: number
  billable_supervisor_rate: number
  payable_supervisor_rate: number
  payable_guard_rate: number
}

/**
 * Old: assigned-to-client list (kept if you still want it somewhere)
 */
export interface ClientAssignedGuard {
  applicant_id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  user_id: number | null
  is_active: boolean | null
  is_dormant: boolean | null
}

/**
 * NEW: company applicants list for a client + per-client blocked flag
 */
export interface CompanyApplicantRow {
  applicant_id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  user_id: number | null
  user_is_active: boolean | null
  user_is_dormant: boolean | null
  is_blocked_for_client: boolean
}


// Insert Clients
export const insertClient = async (client: Client): Promise<Client> => {
  const {
    client_name,
    address,
    contact_person,
    contact_number,
    client_email,
    client_fax,
    client_invoice_terms,
    client_contract_start,
    client_contract_end,
    client_terms,
    charge_rate_guarding,
    charge_rate_supervisor,
    vat,
    vat_registration_number,
    company_id,
  } = client

  try {
    const query = `
      INSERT INTO clients (
        client_name, address, contact_person, contact_number, client_email, client_fax,
        client_invoice_terms, client_contract_start, client_contract_end, client_terms,
        charge_rate_guarding, charge_rate_supervisor, vat, vat_registration_number, company_id
      )
      VALUES ($1, $2, $3, $4, $5, $6,  $7, $8, $9, $10,  $11, $12, $13, $14, $15)
      RETURNING *;
    `

    const values = [
      client_name,
      address,
      contact_person,
      contact_number,
      client_email,
      client_fax ?? null,
      client_invoice_terms,
      client_contract_start ?? null,
      client_contract_end ?? null,
      client_terms ?? null,
      charge_rate_guarding,
      charge_rate_supervisor,
      vat,
      vat ? (vat_registration_number ?? null) : null,
      company_id,
    ]

    const result = await pool.query(query, values)
    return result.rows[0]
  } catch (error) {
    console.error("Error inserting new client:", error)
    throw error
  }
}

// Fetch List of Clients
export const getClientsByCompanyId = async (company_id: number): Promise<Client[]> => {
  try {
    const query = `
      SELECT * FROM clients WHERE company_id = $1 AND is_deleted = false;
    `
    const result = await pool.query(query, [company_id])
    return result.rows
  } catch (error) {
    console.error("Error fetching clients:", error)
    throw error
  }
}

// Fetch a single client's details
export const getClientById = async (company_id: number, client_id: number): Promise<Client | null> => {
  try {
    const query = `
      SELECT * FROM clients
      WHERE company_id = $1 AND client_id = $2 AND is_deleted = false;
    `
    const result = await pool.query(query, [company_id, client_id])
    return result.rows.length > 0 ? result.rows[0] : null
  } catch (error) {
    console.error("Error fetching client details:", error)
    throw error
  }
}

// Insert a new client group
export const insertClientSiteGroup = async (group: ClientSiteGroup): Promise<ClientSiteGroup> => {
  const {
    client_id,
    site_group_name,
    billable_guard_rate,
    billable_supervisor_rate,
    payable_guard_rate,
    payable_supervisor_rate,
  } = group

  try {
    const query = `
      INSERT INTO clients_site_groups (
        client_id, site_group_name, billable_guard_rate, billable_supervisor_rate, payable_guard_rate, payable_supervisor_rate
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `
    const values = [
      client_id,
      site_group_name,
      billable_guard_rate,
      billable_supervisor_rate,
      payable_guard_rate,
      payable_supervisor_rate,
    ]
    const result = await pool.query(query, values)
    return result.rows[0]
  } catch (error) {
    console.error("Error inserting new client group:", error)
    throw error
  }
}

// Fetch all site groups for a specific client
export const getClientSiteGroups = async (client_id: number): Promise<ClientSiteGroup[]> => {
  try {
    const query = `
      SELECT * FROM clients_site_groups
      WHERE client_id = $1;
    `
    const result = await pool.query(query, [client_id])
    return result.rows
  } catch (error) {
    console.error("Error fetching client site groups:", error)
    throw error
  }
}

export const updateClient = async (
  company_id: number,
  client_id: number,
  client: Partial<Client>
): Promise<Client | null> => {
  const {
    client_name,
    address,
    contact_person,
    contact_number,
    client_email,
    client_fax,
    client_invoice_terms,
    client_contract_start,
    client_contract_end,
    client_terms,
    charge_rate_guarding,
    charge_rate_supervisor,
    vat,
    vat_registration_number,
  } = client

  try {
    const query = `
      UPDATE clients
      SET
        client_name = COALESCE($3, client_name),
        address = COALESCE($4, address),
        contact_person = COALESCE($5, contact_person),
        contact_number = COALESCE($6, contact_number),
        client_email = COALESCE($7, client_email),

        client_fax = COALESCE($8, client_fax),
        client_invoice_terms = COALESCE($9, client_invoice_terms),
        client_contract_start = COALESCE($10, client_contract_start),
        client_contract_end = COALESCE($11, client_contract_end),
        client_terms = COALESCE($12, client_terms),

        charge_rate_guarding = COALESCE($13, charge_rate_guarding),
        charge_rate_supervisor = COALESCE($14, charge_rate_supervisor),

        vat = COALESCE($15, vat),
        vat_registration_number = COALESCE($16, vat_registration_number)

      WHERE company_id = $1 AND client_id = $2 AND is_deleted = false
      RETURNING *;
    `

    const computedVatReg =
      vat === undefined
        ? (vat_registration_number === undefined ? undefined : (vat_registration_number ?? null))
        : (vat ? (vat_registration_number ?? null) : null)

    const values = [
      company_id,
      client_id,

      client_name ?? null,
      address ?? null,
      contact_person ?? null,
      contact_number ?? null,
      client_email ?? null,

      client_fax ?? null,
      client_invoice_terms ?? null,
      client_contract_start ?? null,
      client_contract_end ?? null,
      client_terms ?? null,

      charge_rate_guarding ?? null,
      charge_rate_supervisor ?? null,

      vat ?? null,
      computedVatReg ?? null,
    ]

    const result = await pool.query(query, values)
    return result.rows.length ? result.rows[0] : null
  } catch (error) {
    console.error("Error updating client:", error)
    throw error
  }
}

export const updateClientSiteGroup = async (
  client_id: number,
  group_id: number,
  patch: Partial<ClientSiteGroup>
): Promise<ClientSiteGroup | null> => {
  try {
    const query = `
      UPDATE clients_site_groups
      SET
        site_group_name = COALESCE($3, site_group_name),
        billable_guard_rate = COALESCE($4, billable_guard_rate),
        billable_supervisor_rate = COALESCE($5, billable_supervisor_rate),
        payable_guard_rate = COALESCE($6, payable_guard_rate),
        payable_supervisor_rate = COALESCE($7, payable_supervisor_rate),
        updated_at = CURRENT_TIMESTAMP
      WHERE client_id = $1 AND group_id = $2
      RETURNING *;
    `
    const values = [
      client_id,
      group_id,
      patch.site_group_name ?? null,
      patch.billable_guard_rate ?? null,
      patch.billable_supervisor_rate ?? null,
      patch.payable_guard_rate ?? null,
      patch.payable_supervisor_rate ?? null,
    ]
    const result = await pool.query(query, values)
    return result.rows.length ? result.rows[0] : null
  } catch (error) {
    console.error("Error updating client site group:", error)
    throw error
  }
}

export const deleteClientSiteGroup = async (
  client_id: number,
  group_id: number
): Promise<{ ok: true }> => {
  try {
    const query = `DELETE FROM clients_site_groups WHERE client_id = $1 AND group_id = $2;`
    await pool.query(query, [client_id, group_id])
    return { ok: true }
  } catch (error) {
    console.error("Error deleting client site group:", error)
    throw error
  }
}

/**
 * OLD (kept): guards assigned through rosters/sites
 */
export const getClientAssignedGuards = async (client_id: number): Promise<ClientAssignedGuard[]> => {
  try {
    const query = `
      SELECT DISTINCT
        a.applicant_id,
        a.first_name,
        a.last_name,
        a.email,
        a.phone,
        u.id as user_id,
        u.is_active,
        u.is_dormant
      FROM sites s
      INNER JOIN roster r ON r.site_id = s.site_id
      INNER JOIN roster_employees re ON re.roster_id = r.roster_id
      INNER JOIN applicants a ON a.applicant_id = re.applicant_id
      LEFT JOIN users u ON u.applicant_id = a.applicant_id AND u.is_deleted = false
      WHERE s.client_id = $1
      ORDER BY a.first_name ASC, a.last_name ASC;
    `
    const result = await pool.query(query, [client_id])
    return result.rows
  } catch (error) {
    console.error("Error fetching client assigned guards:", error)
    throw error
  }
}

/**
 * NEW: list ALL applicants for the client's company + is_blocked_for_client flag
 * - No need to pass company_id from frontend.
 * - We derive company via clients table.
 */
export const getCompanyApplicantsForClient = async (client_id: number): Promise<CompanyApplicantRow[]> => {
  const q = `
    SELECT
      a.applicant_id,
      a.first_name,
      a.last_name,
      a.email,
      a.phone,

      u.id AS user_id,
      u.is_active AS user_is_active,
      u.is_dormant AS user_is_dormant,

      CASE WHEN cb.block_id IS NULL THEN false ELSE true END AS is_blocked_for_client

    FROM clients c
    INNER JOIN applicants a
      ON a.company_id = c.company_id

    LEFT JOIN users u
      ON u.applicant_id = a.applicant_id
     AND u.is_deleted = false

    LEFT JOIN client_applicant_blocks cb
      ON cb.client_id = c.client_id
     AND cb.applicant_id = a.applicant_id
     AND cb.is_active = true

    WHERE c.client_id = $1
    ORDER BY a.first_name ASC, a.last_name ASC;
  `

  const r = await pool.query(q, [client_id])
  return r.rows
}


/**
 * NEW: block/unblock applicant for THIS client only
 * blocked=true  -> upsert row with is_blocked=true
 * blocked=false -> delete the row OR set is_blocked=false (we'll delete for cleanliness)
 */
export const setApplicantBlockedForClient = async (
  client_id: number,
  applicant_id: number,
  blocked: boolean
): Promise<{ client_id: number; applicant_id: number; is_blocked_for_client: boolean }> => {
  const q = `
    WITH client_company AS (
      SELECT company_id
      FROM clients
      WHERE client_id = $1
      LIMIT 1
    ),
    upsert AS (
      INSERT INTO client_applicant_blocks (
        company_id,
        client_id,
        applicant_id,
        is_active,
        blocked_at
      )
      SELECT
        cc.company_id,
        $1 AS client_id,
        $2 AS applicant_id,
        $3::boolean AS is_active,
        CASE WHEN $3::boolean = true THEN now() ELSE NULL END AS blocked_at
      FROM client_company cc
      ON CONFLICT (client_id, applicant_id)
      DO UPDATE SET
        is_active = EXCLUDED.is_active,
        blocked_at = CASE
          WHEN EXCLUDED.is_active = true THEN now()
          ELSE client_applicant_blocks.blocked_at
        END
      RETURNING client_id, applicant_id, is_active
    )
    SELECT
      client_id,
      applicant_id,
      is_active AS is_blocked_for_client
    FROM upsert;
  `

  const r = await pool.query(q, [client_id, applicant_id, blocked])
  if (!r.rows?.length) throw new Error("Unable to update block status (client not found?)")
  return r.rows[0]
}


/**
 * NOTE: Keeping this (global enable/disable) in case you still need it elsewhere.
 * This is NOT per-client.
 */
export const setApplicantUserActiveStatus = async (
  applicant_id: number,
  is_active: boolean
): Promise<{ is_active: boolean; is_dormant: boolean } | null> => {
  try {
    const query = `
      UPDATE users
      SET
        is_active = $2,
        is_dormant = CASE WHEN $2 = false THEN true ELSE is_dormant END,
        updated_at = CURRENT_TIMESTAMP
      WHERE applicant_id = $1 AND is_deleted = false
      RETURNING is_active, is_dormant;
    `
    const result = await pool.query(query, [applicant_id, is_active])
    return result.rows.length ? result.rows[0] : null
  } catch (error) {
    console.error("Error updating user active status:", error)
    throw error
  }
}
