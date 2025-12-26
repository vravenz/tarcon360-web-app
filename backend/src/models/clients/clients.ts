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
      client_fax ?? null,               // optional
      client_invoice_terms,
      client_contract_start ?? null,    // optional
      client_contract_end ?? null,      // optional
      client_terms ?? null,             // optional
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
