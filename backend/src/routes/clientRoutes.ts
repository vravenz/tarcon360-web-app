// src/routes/clients.ts (or wherever this router is)
import express from "express"
import {
  addClient,
  fetchClientsByCompanyId,
  getClientDetails,
  addClientSiteGroup,
  fetchClientSiteGroups,
  editClient,
  editClientSiteGroup,
  removeClientSiteGroup,

  // Client Contacts
  fetchClientContacts,
  addClientContact,
  editClientContact,
  removeClientContact,

  // Guards (NEW)
  listClientGuards,
  setClientGuardBlock, // ✅ correct export
} from "../controllers/clients/clientsController"

const router = express.Router()

// Clients
router.post("/clients", addClient)
router.get("/clients/company/:companyId", fetchClientsByCompanyId)
router.get("/clients/company/:companyId/details/:clientId", getClientDetails)
router.put("/clients/:clientId", editClient)

// Client Site Groups
router.post("/clients/:clientId/groups", addClientSiteGroup)
router.get("/clients/:clientId/groups", fetchClientSiteGroups)
router.put("/clients/:clientId/groups/:groupId", editClientSiteGroup)
router.delete("/clients/:clientId/groups/:groupId", removeClientSiteGroup)

// Client Contacts
router.get("/clients/:clientId/contacts", fetchClientContacts)
router.post("/clients/:clientId/contacts", addClientContact)
router.put("/clients/:clientId/contacts/:contactId", editClientContact)
router.delete("/clients/:clientId/contacts/:contactId", removeClientContact)

// ✅ Company applicants list for this client
router.get("/clients/:clientId/guards", listClientGuards)

// ✅ Block/Unblock applicant for this client only
// Body: { blocked: true|false }
router.patch("/clients/:clientId/guards/:applicantId/block", setClientGuardBlock)

export default router
