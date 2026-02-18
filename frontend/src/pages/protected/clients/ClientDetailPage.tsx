import React, { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import Navbar from "../../../components/Navbar"
import SideNavbar from "../../../components/SideNavbar"
import TwoColumnLayout from "../../../components/TwoColumnLayout"
import Card from "../../../components/Card"
import InputField from "../../../components/InputField"
import Button from "../../../components/Button"
import ViewAsTable from "../../../components/ViewAsTable"
import Footer from "../../../components/Footer"
import { useTheme } from "../../../context/ThemeContext"
import { useAuth } from "../../../hooks/useAuth"
import { BACKEND_URL } from "../../../config"

interface Client {
  client_id: number
  client_name: string
  address: string
  client_email: string
  client_fax: string | null
  client_invoice_terms: string
  client_contract_start: any
  client_contract_end: any
  client_terms: string | null
  charge_rate_guarding: number
  charge_rate_supervisor: number
  vat: boolean
  vat_registration_number: string | null
  contact_person: string
  contact_number: string
}

interface ClientGroupForm {
  site_group_name: string
  billable_guard_rate: string
  billable_supervisor_rate: string
  payable_guard_rate: string
  payable_supervisor_rate: string
}

interface ClientGroup {
  group_id: number
  site_group_name: string
  billable_guard_rate: number
  billable_supervisor_rate: number
  payable_guard_rate: number
  payable_supervisor_rate: number
}

interface ClientContact {
  contact_id: number
  client_id: number
  name: string
  phone: string | null
  email: string | null
  role: string | null
  is_primary: boolean
  is_deleted: boolean
  created_at?: string
  updated_at?: string
}

interface ContactForm {
  name: string
  phone: string
  email: string
  role: string
  is_primary: boolean
}

/**
 * NEW response row from backend:
 * getCompanyApplicantsForClient(clientId)
 */
interface CompanyApplicantRow {
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

const ClientDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { companyId } = useAuth()

  const [client, setClient] = useState<Client | null>(null)

  // Groups
  const [groupData, setGroupData] = useState<ClientGroupForm>({
    site_group_name: "",
    billable_guard_rate: "",
    billable_supervisor_rate: "",
    payable_guard_rate: "",
    payable_supervisor_rate: "",
  })
  const [siteGroups, setSiteGroups] = useState<ClientGroup[]>([])

  // Contacts
  const [contacts, setContacts] = useState<ClientContact[]>([])
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: "",
    phone: "",
    email: "",
    role: "",
    is_primary: false,
  })
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [editContactForm, setEditContactForm] = useState<ContactForm>({
    name: "",
    phone: "",
    email: "",
    role: "",
    is_primary: false,
  })

  const [error, setError] = useState<string>("")
  const [message, setMessage] = useState<string>("")

  // inline edit group
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editGroupData, setEditGroupData] = useState<ClientGroupForm>({
    site_group_name: "",
    billable_guard_rate: "",
    billable_supervisor_rate: "",
    payable_guard_rate: "",
    payable_supervisor_rate: "",
  })

  // NEW: Company applicants for this client's company (block/unblock per client)
  const [companyApplicants, setCompanyApplicants] = useState<CompanyApplicantRow[]>([])
  const [blockBusyApplicantId, setBlockBusyApplicantId] = useState<number | null>(null)
  const [showOnlyActiveUsers, setShowOnlyActiveUsers] = useState<boolean>(true)

  const normalizeOptionalString = (v: string) => {
    const t = (v ?? "").trim()
    return t.length ? t : null
  }

  const refreshGroups = async () => {
    if (!clientId) return
    const groupsResponse = await axios.get(`${BACKEND_URL}/api/clients/${clientId}/groups`)
    setSiteGroups(groupsResponse.data ?? [])
  }

  const refreshContacts = async () => {
    if (!clientId) return
    const res = await axios.get(`${BACKEND_URL}/api/clients/${clientId}/contacts`)
    setContacts(res.data ?? [])
  }

  const refreshCompanyApplicants = async () => {
    if (!clientId) return
    const resp = await axios.get(`${BACKEND_URL}/api/clients/${clientId}/guards`)
    setCompanyApplicants(resp.data ?? [])
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId || !clientId) return
      try {
        setError("")
        setMessage("")
        const clientResponse = await axios.get(
          `${BACKEND_URL}/api/clients/company/${companyId}/details/${clientId}`
        )
        setClient(clientResponse.data)

        await Promise.all([refreshGroups(), refreshContacts(), refreshCompanyApplicants()])
      } catch (e) {
        console.error("Failed to fetch data:", e)
        setError("Failed to load data")
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, companyId])

  // ----------------------------
  // Groups handlers
  // ----------------------------
  const handleGroupInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.target
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value
    const name = target.name
    setGroupData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddGroup = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!clientId) return

    try {
      setError("")
      setMessage("")
      await axios.post(`${BACKEND_URL}/api/clients/${clientId}/groups`, groupData)

      setMessage("Group added successfully!")
      setGroupData({
        site_group_name: "",
        billable_guard_rate: "",
        billable_supervisor_rate: "",
        payable_guard_rate: "",
        payable_supervisor_rate: "",
      })

      await refreshGroups()
    } catch (e) {
      console.error("Error adding client group:", e)
      setError("Failed to add client group")
    }
  }

  const startEditGroup = (g: ClientGroup) => {
    setEditingGroupId(g.group_id)
    setEditGroupData({
      site_group_name: g.site_group_name ?? "",
      billable_guard_rate: String(g.billable_guard_rate ?? ""),
      billable_supervisor_rate: String(g.billable_supervisor_rate ?? ""),
      payable_guard_rate: String(g.payable_guard_rate ?? ""),
      payable_supervisor_rate: String(g.payable_supervisor_rate ?? ""),
    })
  }

  const cancelEditGroup = () => {
    setEditingGroupId(null)
    setEditGroupData({
      site_group_name: "",
      billable_guard_rate: "",
      billable_supervisor_rate: "",
      payable_guard_rate: "",
      payable_supervisor_rate: "",
    })
  }

  const saveEditGroup = async () => {
    if (!clientId || !editingGroupId) return
    try {
      setError("")
      setMessage("")
      await axios.put(`${BACKEND_URL}/api/clients/${clientId}/groups/${editingGroupId}`, editGroupData)
      setMessage("Group updated successfully!")
      await refreshGroups()
      cancelEditGroup()
    } catch (e) {
      console.error(e)
      setError("Failed to update site group")
    }
  }

  const deleteGroup = async (groupId: number) => {
    if (!clientId) return
    try {
      setError("")
      setMessage("")
      await axios.delete(`${BACKEND_URL}/api/clients/${clientId}/groups/${groupId}`)
      setMessage("Group deleted successfully!")
      await refreshGroups()
    } catch (e) {
      console.error(e)
      setError("Failed to delete site group")
    }
  }

  // ----------------------------
  // Contacts handlers
  // ----------------------------
  const handleContactChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.target
    const name = target.name as keyof ContactForm
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value
    setContactForm((p) => ({ ...p, [name]: value as any }))
  }

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) return

    try {
      setError("")
      setMessage("")
      await axios.post(`${BACKEND_URL}/api/clients/${clientId}/contacts`, {
        name: contactForm.name.trim(),
        phone: normalizeOptionalString(contactForm.phone),
        email: normalizeOptionalString(contactForm.email),
        role: normalizeOptionalString(contactForm.role),
        is_primary: !!contactForm.is_primary,
      })

      setMessage("Contact added successfully!")
      setContactForm({ name: "", phone: "", email: "", role: "", is_primary: false })
      await refreshContacts()
    } catch (err) {
      console.error(err)
      setError("Failed to add contact")
    }
  }

  const startEditContact = (c: ClientContact) => {
    setEditingContactId(c.contact_id)
    setEditContactForm({
      name: c.name ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      role: c.role ?? "",
      is_primary: !!c.is_primary,
    })
  }

  const cancelEditContact = () => {
    setEditingContactId(null)
    setEditContactForm({ name: "", phone: "", email: "", role: "", is_primary: false })
  }

  const saveEditContact = async () => {
    if (!clientId || !editingContactId) return

    try {
      setError("")
      setMessage("")
      await axios.put(`${BACKEND_URL}/api/clients/${clientId}/contacts/${editingContactId}`, {
        name: editContactForm.name.trim(),
        phone: normalizeOptionalString(editContactForm.phone),
        email: normalizeOptionalString(editContactForm.email),
        role: normalizeOptionalString(editContactForm.role),
        is_primary: !!editContactForm.is_primary,
      })

      setMessage("Contact updated successfully!")
      await refreshContacts()
      cancelEditContact()
    } catch (err) {
      console.error(err)
      setError("Failed to update contact")
    }
  }

  const deleteContact = async (contactId: number) => {
    if (!clientId) return
    try {
      setError("")
      setMessage("")
      await axios.delete(`${BACKEND_URL}/api/clients/${clientId}/contacts/${contactId}`)
      setMessage("Contact deleted successfully!")
      await refreshContacts()
    } catch (err) {
      console.error(err)
      setError("Failed to delete contact")
    }
  }

  // ----------------------------
  // NEW: Block / Unblock applicant for THIS client
  // ----------------------------
  const setApplicantBlocked = async (applicantId: number, blocked: boolean) => {
    if (!clientId) return
    try {
      setError("")
      setMessage("")
      setBlockBusyApplicantId(applicantId)

      await axios.patch(`${BACKEND_URL}/api/clients/${clientId}/guards/${applicantId}/block`, {
        blocked,
      })

      setMessage(blocked ? "Applicant blocked for this client." : "Applicant unblocked for this client.")
      await refreshCompanyApplicants()
    } catch (e) {
      console.error(e)
      setError("Failed to update block status")
    } finally {
      setBlockBusyApplicantId(null)
    }
  }

  const visibleApplicants = useMemo(() => {
    const rows = companyApplicants ?? []

    // show only ACTIVE users by default
    if (!showOnlyActiveUsers) return rows

    return rows.filter((r) => {
      // if there is no user record, treat as not-active for this screen
      if (!r.user_id) return false
      // only show active users
      return r.user_is_active !== false
    })
  }, [companyApplicants, showOnlyActiveUsers])

  return (
    <div
      className={`${
        theme === "dark" ? "bg-dark-background text-white" : "bg-light-background text-gray-900"
      } min-h-screen`}
    >
      <Navbar />

      <TwoColumnLayout
        sidebarContent={<SideNavbar />}
        mainContent={
          <div className="space-y-4">
            {/* top actions */}
            <Card className="p-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Client Details</h1>
                {client && <p className="opacity-80 text-sm">{client.client_name}</p>}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => navigate(-1)} size="small">
                  Back
                </Button>
                {clientId && (
                  <Button onClick={() => navigate(`/client/edit/${clientId}`)} size="small" color="edit" icon="edit">
                    Edit Client
                  </Button>
                )}
              </div>
            </Card>

            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}

            <div className="md:grid md:grid-cols-4 md:gap-2">
              {/* Client */}
              <Card className="md:col-span-3 p-6 shadow rounded-lg">
                {client ? (
                  <ViewAsTable
                    data={[
                      { field: "Client ID", value: client.client_id },
                      { field: "Client Name", value: client.client_name },
                      { field: "Email", value: client.client_email },
                      { field: "Address", value: client.address },
                      { field: "VAT", value: client.vat ? "Yes" : "No" },
                      { field: "VAT Reg #", value: client.vat_registration_number || "N/A" },
                      { field: "Fax", value: client.client_fax || "N/A" },
                      { field: "Contract Start Date", value: String(client.client_contract_start ?? "N/A") },
                      { field: "Contract End Date", value: String(client.client_contract_end ?? "N/A") },
                      { field: "Contact Person", value: client.contact_person },
                      { field: "Contact Number", value: client.contact_number },
                    ]}
                    columns={[
                      { label: "Field", accessor: "field" },
                      { label: "Value", accessor: "value" },
                    ]}
                  />
                ) : (
                  <p>Loading...</p>
                )}
              </Card>

              {/* Add Group */}
              <Card className="md:col-span-1 p-6 shadow rounded-lg flex flex-col justify-center items-center">
                <form onSubmit={handleAddGroup} className="w-full space-y-2">
                  <h2 className="text-lg font-bold mb-2">Add Group</h2>

                  <InputField
                    type="text"
                    name="site_group_name"
                    value={groupData.site_group_name}
                    onChange={handleGroupInputChange}
                    label="Group Name"
                    required
                  />
                  <InputField
                    type="number"
                    name="billable_guard_rate"
                    value={groupData.billable_guard_rate}
                    onChange={handleGroupInputChange}
                    label="Billable Rate (Guarding)"
                    required
                  />
                  <InputField
                    type="number"
                    name="billable_supervisor_rate"
                    value={groupData.billable_supervisor_rate}
                    onChange={handleGroupInputChange}
                    label="Billable Rate (Supervisor)"
                    required
                  />
                  <InputField
                    type="number"
                    name="payable_guard_rate"
                    value={groupData.payable_guard_rate}
                    onChange={handleGroupInputChange}
                    label="Payable Rate (Guarding)"
                    required
                  />
                  <InputField
                    type="number"
                    name="payable_supervisor_rate"
                    value={groupData.payable_supervisor_rate}
                    onChange={handleGroupInputChange}
                    label="Payable Rate (Supervisor)"
                    required
                  />

                  <Button type="submit" size="small" icon="plus" color="submit" marginRight="5px" position="right">
                    Add Group
                  </Button>
                </form>
              </Card>

              {/* Site Groups */}
              <Card className="md:col-span-4 p-6 shadow rounded-lg">
                <h2 className="text-lg font-bold mb-4">Site Groups</h2>

                {siteGroups.length > 0 ? (
                  <div className="space-y-3">
                    {siteGroups.map((g) => (
                      <Card key={g.group_id} className="p-4">
                        {editingGroupId === g.group_id ? (
                          <div className="space-y-3">
                            <InputField
                              type="text"
                              name="site_group_name"
                              value={editGroupData.site_group_name}
                              onChange={(e) => setEditGroupData((p) => ({ ...p, site_group_name: e.target.value }))}
                              label="Group Name"
                              required
                            />
                            <InputField
                              type="number"
                              name="billable_guard_rate"
                              value={editGroupData.billable_guard_rate}
                              onChange={(e) => setEditGroupData((p) => ({ ...p, billable_guard_rate: e.target.value }))}
                              label="Billable Guard Rate"
                              required
                            />
                            <InputField
                              type="number"
                              name="billable_supervisor_rate"
                              value={editGroupData.billable_supervisor_rate}
                              onChange={(e) =>
                                setEditGroupData((p) => ({ ...p, billable_supervisor_rate: e.target.value }))
                              }
                              label="Billable Supervisor Rate"
                              required
                            />
                            <InputField
                              type="number"
                              name="payable_guard_rate"
                              value={editGroupData.payable_guard_rate}
                              onChange={(e) => setEditGroupData((p) => ({ ...p, payable_guard_rate: e.target.value }))}
                              label="Payable Guard Rate"
                              required
                            />
                            <InputField
                              type="number"
                              name="payable_supervisor_rate"
                              value={editGroupData.payable_supervisor_rate}
                              onChange={(e) =>
                                setEditGroupData((p) => ({ ...p, payable_supervisor_rate: e.target.value }))
                              }
                              label="Payable Supervisor Rate"
                              required
                            />

                            <div className="flex justify-end gap-2">
                              <Button onClick={cancelEditGroup} size="small" color="delete">
                                Cancel
                              </Button>
                              <Button onClick={saveEditGroup} size="small" color="submit" icon="plus">
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-semibold">{g.site_group_name}</p>
                              <p className="text-sm opacity-80">
                                Billable: Guard {g.billable_guard_rate} | Supervisor {g.billable_supervisor_rate}
                              </p>
                              <p className="text-sm opacity-80">
                                Payable: Guard {g.payable_guard_rate} | Supervisor {g.payable_supervisor_rate}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button onClick={() => startEditGroup(g)} size="small" color="edit" icon="edit" />
                              <Button onClick={() => deleteGroup(g.group_id)} size="small" color="delete" icon="trash" />
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No site groups available.</p>
                )}
              </Card>

              {/* =========================
                  CLIENT CONTACTS
                 ========================= */}
              <Card className="md:col-span-4 p-6 shadow rounded-lg">
                <h2 className="text-lg font-bold mb-4">Client Contacts</h2>

                {/* Add Contact */}
                <Card className="p-4 mb-4">
                  <form onSubmit={addContact} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <InputField type="text" name="name" value={contactForm.name} onChange={handleContactChange} label="Name" required />
                    <InputField type="text" name="phone" value={contactForm.phone} onChange={handleContactChange} label="Phone" required={false} />
                    <InputField type="email" name="email" value={contactForm.email} onChange={handleContactChange} label="Email" required={false} />
                    <InputField type="text" name="role" value={contactForm.role} onChange={handleContactChange} label="Role" required={false} />

                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm flex items-center gap-2 select-none">
                        <input type="checkbox" name="is_primary" checked={contactForm.is_primary} onChange={handleContactChange} />
                        Primary
                      </label>

                      <Button type="submit" size="small" color="submit" icon="plus">
                        Add
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* Contacts List */}
                {contacts.length ? (
                  <div className="space-y-3">
                    {contacts.map((c) => (
                      <Card key={c.contact_id} className="p-4">
                        {editingContactId === c.contact_id ? (
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                            <InputField
                              type="text"
                              name="name"
                              value={editContactForm.name}
                              onChange={(e) => setEditContactForm((p) => ({ ...p, name: e.target.value }))}
                              label="Name"
                              required
                            />
                            <InputField
                              type="text"
                              name="phone"
                              value={editContactForm.phone}
                              onChange={(e) => setEditContactForm((p) => ({ ...p, phone: e.target.value }))}
                              label="Phone"
                            />
                            <InputField
                              type="email"
                              name="email"
                              value={editContactForm.email}
                              onChange={(e) => setEditContactForm((p) => ({ ...p, email: e.target.value }))}
                              label="Email"
                            />
                            <InputField
                              type="text"
                              name="role"
                              value={editContactForm.role}
                              onChange={(e) => setEditContactForm((p) => ({ ...p, role: e.target.value }))}
                              label="Role"
                            />

                            <div className="flex items-center justify-between gap-3">
                              <label className="text-sm flex items-center gap-2 select-none">
                                <input
                                  type="checkbox"
                                  checked={editContactForm.is_primary}
                                  onChange={(e) => setEditContactForm((p) => ({ ...p, is_primary: e.target.checked }))}
                                />
                                Primary
                              </label>

                              <div className="flex gap-2 justify-end">
                                <Button onClick={cancelEditContact} size="small" color="delete">
                                  Cancel
                                </Button>
                                <Button onClick={saveEditContact} size="small" color="submit" icon="plus">
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{c.name}</p>
                                {c.is_primary && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <p className="text-sm opacity-80">
                                {c.role ? `Role: ${c.role} | ` : ""}
                                {c.phone ? `Phone: ${c.phone} | ` : ""}
                                {c.email ? `Email: ${c.email}` : ""}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button onClick={() => startEditContact(c)} size="small" color="edit" icon="edit" />
                              <Button onClick={() => deleteContact(c.contact_id)} size="small" color="delete" icon="trash" />
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No contacts yet.</p>
                )}
              </Card>

              {/* =========================
                  COMPANY APPLICANTS (ACTIVE) + BLOCK/UNBLOCK PER CLIENT
                 ========================= */}
              <Card className="md:col-span-4 p-6 shadow rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold">Applicants (Block/Unblock for this client)</h2>
                    <p className="text-sm opacity-80">
                      This does NOT ban the user globally — it only blocks them for this client.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm flex items-center gap-2 select-none">
                      <input
                        type="checkbox"
                        checked={showOnlyActiveUsers}
                        onChange={(e) => setShowOnlyActiveUsers(e.target.checked)}
                      />
                      Show only active users
                    </label>

                    <Button onClick={refreshCompanyApplicants} size="small">
                      Refresh
                    </Button>
                  </div>
                </div>

                {visibleApplicants.length ? (
                  <div className="space-y-3">
                    {visibleApplicants.map((g) => {
                      const fullName =
                        `${g.first_name ?? ""} ${g.last_name ?? ""}`.trim() || `Applicant #${g.applicant_id}`
                      const hasUser = !!g.user_id
                      const busy = blockBusyApplicantId === g.applicant_id

                      const blocked = !!g.is_blocked_for_client
                      const userActive = g.user_is_active === null ? true : !!g.user_is_active

                      return (
                        <Card key={g.applicant_id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold">{fullName}</p>

                                {/* per-client block badge */}
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    blocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {blocked ? "Blocked for Client" : "Allowed"}
                                </span>

                                {/* user badge */}
                                {hasUser ? (
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      userActive ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-800"
                                    }`}
                                  >
                                    {userActive ? "User Active" : "User Inactive"}
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-800">
                                    No User Account
                                  </span>
                                )}
                              </div>

                              <p className="text-sm opacity-80">
                                {g.email ? `Email: ${g.email} | ` : ""}
                                {g.phone ? `Phone: ${g.phone}` : ""}
                              </p>

                              <p className="text-xs opacity-70">
                                Applicant ID: {g.applicant_id} {hasUser ? `| User ID: ${g.user_id}` : ""}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                disabled={busy}
                                onClick={() => setApplicantBlocked(g.applicant_id, !blocked)}
                                size="small"
                                color={blocked ? "submit" : "delete"}
                                icon={blocked ? "plus" : "trash"}
                              >
                                {blocked ? "Unblock" : "Block"}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <p>No applicants found (or none match your filter).</p>
                )}
              </Card>
            </div>
          </div>
        }
      />

      <Footer />
    </div>
  )
}

export default ClientDetailPage
