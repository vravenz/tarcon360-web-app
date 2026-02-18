import { Request, Response } from "express"
import {
  insertClient,
  getClientsByCompanyId,
  getClientById,
  insertClientSiteGroup,
  getClientSiteGroups,
  updateClient,
  updateClientSiteGroup,
  deleteClientSiteGroup,
  Client,
  ClientSiteGroup,

  // NEW
  getCompanyApplicantsForClient,
  setApplicantBlockedForClient,
} from "../../models/clients/clients"

import {
  listClientContacts,
  createClientContact,
  updateClientContact,
  softDeleteClientContact,
} from "../../models/clients/clientContacts"

const normalizeNullableString = (v: any): string | null => {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s.length ? s : null
}

const normalizeNullableDate = (v: any): Date | null => {
  const s = normalizeNullableString(v)
  if (!s) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d
}

const normalizeNumber = (v: any): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : NaN
}

// Add Client
export const addClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body ?? {}

    const charge_guard = normalizeNumber(b.charge_rate_guarding)
    const charge_supervisor = normalizeNumber(b.charge_rate_supervisor)

    if (!b.company_id) {
      res.status(400).send("company_id is required")
      return
    }

    if (
      !b.client_name ||
      !b.contact_person ||
      !b.contact_number ||
      !b.client_email ||
      !b.address ||
      !b.client_invoice_terms
    ) {
      res.status(400).send("Missing required client fields")
      return
    }

    if (!Number.isFinite(charge_guard) || !Number.isFinite(charge_supervisor)) {
      res.status(400).send("Charge rates must be valid numbers")
      return
    }

    const payload: Client = {
      client_name: String(b.client_name).trim(),
      address: String(b.address).trim(),
      contact_person: String(b.contact_person).trim(),
      contact_number: String(b.contact_number).trim(),
      client_email: String(b.client_email).trim(),

      client_fax: normalizeNullableString(b.client_fax),
      client_contract_start: normalizeNullableDate(b.client_contract_start),
      client_contract_end: normalizeNullableDate(b.client_contract_end),
      client_terms: normalizeNullableString(b.client_terms),

      client_invoice_terms: String(b.client_invoice_terms).trim(),

      charge_rate_guarding: charge_guard,
      charge_rate_supervisor: charge_supervisor,

      vat: !!b.vat,
      vat_registration_number: b.vat ? normalizeNullableString(b.vat_registration_number) : null,

      company_id: parseInt(String(b.company_id), 10),
      is_deleted: false,
    }

    const newClient = await insertClient(payload)
    res.status(201).json(newClient)
  } catch (error) {
    console.error("Error adding new client:", error)
    res.status(500).send("Server error")
  }
}

// Fetch list of clients
export const fetchClientsByCompanyId = async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.params
  if (!companyId) {
    res.status(400).send("Company ID is required")
    return
  }
  try {
    const clients = await getClientsByCompanyId(parseInt(companyId, 10))
    res.json(clients)
  } catch (error) {
    console.error("Error fetching clients by company ID:", error)
    res.status(500).send("Server error")
  }
}

// Get client details
export const getClientDetails = async (req: Request, res: Response): Promise<void> => {
  const { companyId, clientId } = req.params
  if (!companyId || !clientId) {
    res.status(400).send("Company ID and Client ID are required")
    return
  }
  try {
    const client = await getClientById(parseInt(companyId, 10), parseInt(clientId, 10))
    if (client) res.json(client)
    else res.status(404).send("Client not found")
  } catch (error) {
    console.error("Error fetching client details:", error)
    res.status(500).send("Server error")
  }
}

// Insert Client Groups
export const addClientSiteGroup = async (req: Request, res: Response): Promise<void> => {
  const groupData: ClientSiteGroup = req.body

  if (!req.params.clientId) {
    res.status(400).send("Client ID is required")
    return
  }

  groupData.client_id = parseInt(req.params.clientId, 10)

  try {
    const newGroup = await insertClientSiteGroup(groupData)
    res.status(201).json(newGroup)
  } catch (error: any) {
    console.error("Error adding new client group:", error)
    res.status(500).send(error.message)
  }
}

export const fetchClientSiteGroups = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params
  if (!clientId) {
    res.status(400).send("Client ID is required")
    return
  }
  try {
    const siteGroups = await getClientSiteGroups(parseInt(clientId, 10))
    res.json(siteGroups)
  } catch (error) {
    console.error("Error fetching site groups:", error)
    res.status(500).send("Server error")
  }
}

// Update Client
export const editClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params
    const b = req.body ?? {}

    if (!clientId) return void res.status(400).send("clientId is required")
    if (!b.company_id) return void res.status(400).send("company_id is required")

    const charge_guard =
      b.charge_rate_guarding !== undefined ? normalizeNumber(b.charge_rate_guarding) : undefined
    const charge_supervisor =
      b.charge_rate_supervisor !== undefined ? normalizeNumber(b.charge_rate_supervisor) : undefined

    if (charge_guard !== undefined && !Number.isFinite(charge_guard)) {
      return void res.status(400).send("charge_rate_guarding must be a valid number")
    }
    if (charge_supervisor !== undefined && !Number.isFinite(charge_supervisor)) {
      return void res.status(400).send("charge_rate_supervisor must be a valid number")
    }

    const payload: Partial<Client> = {
      client_name: b.client_name ? String(b.client_name).trim() : undefined,
      address: b.address ? String(b.address).trim() : undefined,
      contact_person: b.contact_person ? String(b.contact_person).trim() : undefined,
      contact_number: b.contact_number ? String(b.contact_number).trim() : undefined,
      client_email: b.client_email ? String(b.client_email).trim() : undefined,
      client_invoice_terms: b.client_invoice_terms ? String(b.client_invoice_terms).trim() : undefined,

      client_fax: b.client_fax !== undefined ? normalizeNullableString(b.client_fax) : undefined,
      client_contract_start:
        b.client_contract_start !== undefined ? normalizeNullableDate(b.client_contract_start) : undefined,
      client_contract_end:
        b.client_contract_end !== undefined ? normalizeNullableDate(b.client_contract_end) : undefined,
      client_terms: b.client_terms !== undefined ? normalizeNullableString(b.client_terms) : undefined,

      charge_rate_guarding: charge_guard,
      charge_rate_supervisor: charge_supervisor,

      vat: b.vat !== undefined ? !!b.vat : undefined,
      vat_registration_number:
        b.vat !== undefined ? (!!b.vat ? normalizeNullableString(b.vat_registration_number) : null) : undefined,
    }

    const updated = await updateClient(parseInt(String(b.company_id), 10), parseInt(clientId, 10), payload)
    if (!updated) return void res.status(404).send("Client not found")
    res.json(updated)
  } catch (error) {
    console.error("Error updating client:", error)
    res.status(500).send("Server error")
  }
}

// Update Client Site Group
export const editClientSiteGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, groupId } = req.params
    const b = req.body ?? {}

    if (!clientId || !groupId) return void res.status(400).send("clientId and groupId are required")

    const patch: Partial<ClientSiteGroup> = {}

    if (b.site_group_name !== undefined) patch.site_group_name = String(b.site_group_name).trim()

    const n1 = b.billable_guard_rate !== undefined ? normalizeNumber(b.billable_guard_rate) : undefined
    const n2 = b.billable_supervisor_rate !== undefined ? normalizeNumber(b.billable_supervisor_rate) : undefined
    const n3 = b.payable_guard_rate !== undefined ? normalizeNumber(b.payable_guard_rate) : undefined
    const n4 = b.payable_supervisor_rate !== undefined ? normalizeNumber(b.payable_supervisor_rate) : undefined

    if (n1 !== undefined && !Number.isFinite(n1)) return void res.status(400).send("billable_guard_rate invalid")
    if (n2 !== undefined && !Number.isFinite(n2)) return void res.status(400).send("billable_supervisor_rate invalid")
    if (n3 !== undefined && !Number.isFinite(n3)) return void res.status(400).send("payable_guard_rate invalid")
    if (n4 !== undefined && !Number.isFinite(n4)) return void res.status(400).send("payable_supervisor_rate invalid")

    if (n1 !== undefined) patch.billable_guard_rate = n1
    if (n2 !== undefined) patch.billable_supervisor_rate = n2
    if (n3 !== undefined) patch.payable_guard_rate = n3
    if (n4 !== undefined) patch.payable_supervisor_rate = n4

    const updated = await updateClientSiteGroup(parseInt(clientId, 10), parseInt(groupId, 10), patch)
    if (!updated) return void res.status(404).send("Group not found")
    res.json(updated)
  } catch (error) {
    console.error("Error updating client site group:", error)
    res.status(500).send("Server error")
  }
}

// Delete Client Site Group
export const removeClientSiteGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, groupId } = req.params
    if (!clientId || !groupId) return void res.status(400).send("clientId and groupId are required")

    await deleteClientSiteGroup(parseInt(clientId, 10), parseInt(groupId, 10))
    res.json({ ok: true })
  } catch (error) {
    console.error("Error deleting client site group:", error)
    res.status(500).send("Server error")
  }
}

// Client Contacts
export const fetchClientContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params
    if (!clientId) return void res.status(400).send("clientId is required")

    const rows = await listClientContacts(parseInt(clientId, 10))
    res.json(rows)
  } catch (e) {
    console.error("Error fetching client contacts:", e)
    res.status(500).send("Server error")
  }
}

export const addClientContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params
    const b = req.body ?? {}
    if (!clientId) return void res.status(400).send("clientId is required")

    if (!b.name || !String(b.name).trim()) return void res.status(400).send("name is required")

    const created = await createClientContact(parseInt(clientId, 10), {
      name: String(b.name).trim(),
      phone: normalizeNullableString(b.phone),
      email: normalizeNullableString(b.email),
      role: normalizeNullableString(b.role),
      is_primary: b.is_primary !== undefined ? !!b.is_primary : false,
    })

    res.status(201).json(created)
  } catch (e) {
    console.error("Error creating client contact:", e)
    res.status(500).send("Server error")
  }
}

export const editClientContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, contactId } = req.params
    const b = req.body ?? {}
    if (!clientId || !contactId) return void res.status(400).send("clientId/contactId required")

    const updated = await updateClientContact(parseInt(clientId, 10), parseInt(contactId, 10), {
      name: b.name !== undefined ? String(b.name).trim() : undefined,
      phone: b.phone !== undefined ? normalizeNullableString(b.phone) : undefined,
      email: b.email !== undefined ? normalizeNullableString(b.email) : undefined,
      role: b.role !== undefined ? normalizeNullableString(b.role) : undefined,
      is_primary: b.is_primary !== undefined ? !!b.is_primary : undefined,
    })

    if (!updated) return void res.status(404).send("Contact not found")
    res.json(updated)
  } catch (e) {
    console.error("Error updating client contact:", e)
    res.status(500).send("Server error")
  }
}

export const removeClientContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, contactId } = req.params
    if (!clientId || !contactId) return void res.status(400).send("clientId/contactId required")

    await softDeleteClientContact(parseInt(clientId, 10), parseInt(contactId, 10))
    res.json({ ok: true })
  } catch (e) {
    console.error("Error deleting client contact:", e)
    res.status(500).send("Server error")
  }
}

/**
 * NEW:
 * List ALL applicants/employees for the client's company
 * and show is_blocked_for_client.
 */
export const listClientGuards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params
    if (!clientId) return void res.status(400).send("clientId is required")

    const rows = await getCompanyApplicantsForClient(parseInt(clientId, 10))
    res.json(rows)
  } catch (error) {
    console.error("Error listing client guards (company applicants):", error)
    res.status(500).send("Server error")
  }
}

/**
 * NEW:
 * Block / Unblock applicant for THIS client only
 * Body: { blocked: true|false }
 */
export const setClientGuardBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, applicantId } = req.params
    const b = req.body ?? {}

    if (!clientId || !applicantId) {
      return void res.status(400).send("clientId and applicantId are required")
    }

    const blocked = b.blocked === undefined ? true : !!b.blocked

    const out = await setApplicantBlockedForClient(
      parseInt(clientId, 10),
      parseInt(applicantId, 10),
      blocked
    )

    res.json({ ok: true, ...out })
  } catch (error) {
    console.error("Error blocking/unblocking applicant for client:", error)
    res.status(500).send("Server error")
  }
}
