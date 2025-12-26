import { Request, Response } from "express"
import {
  insertClient,
  getClientsByCompanyId,
  getClientById,
  insertClientSiteGroup,
  getClientSiteGroups,
  Client,
  ClientSiteGroup,
} from "../../models/clients/clients"

const normalizeNullableString = (v: any): string | null => {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s.length ? s : null
}

const normalizeNullableDate = (v: any): Date | null => {
  const s = normalizeNullableString(v)
  if (!s) return null
  const d = new Date(s) // expecting YYYY-MM-DD from HTML date input
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

    // required fields (keep minimal)
    if (!b.client_name || !b.contact_person || !b.contact_number || !b.client_email || !b.address || !b.client_invoice_terms) {
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

      // OPTIONALS
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
