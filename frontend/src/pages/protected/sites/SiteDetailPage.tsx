import React, { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import Navbar from "../../../components/Navbar"
import SideNavbar from "../../../components/SideNavbar"
import TwoColumnLayout from "../../../components/TwoColumnLayout"
import Card from "../../../components/Card"
import ViewAsTable from "../../../components/ViewAsTable"
import Footer from "../../../components/Footer"
import Button from "../../../components/Button"
import { BACKEND_URL } from "../../../config"
import { useTheme } from "../../../context/ThemeContext"
import AssignCheckpoints from "./AssignCheckpoints"
import CheckCalls from "./CheckCalls"

interface Site {
  site_id: number
  site_name: string
  site_group: string
  contact_person: string
  contact_number: string
  site_address: string
  post_code: string
  weekly_contracted_hours: number
  trained_guards_required: boolean
  site_billable_rate_guarding: number
  site_billable_rate_supervisor: number
  site_payable_rate_guarding: number
  site_payable_rate_supervisor: number
  site_note: string
  is_mobile_allowed: boolean
}

interface SiteApplicantRow {
  applicant_id: number
  first_name: string
  last_name: string
  email: string
  phone: string | null
  user_id: number | null
  user_is_active: boolean | null
  user_is_dormant: boolean | null
  is_blocked_for_site: boolean
}

const SiteDetailPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>()
  const { theme } = useTheme()

  const [site, setSite] = useState<Site | null>(null)
  const [error, setError] = useState<string>("")
  const [message, setMessage] = useState<string>("")

  // NEW: site-level guards/applicants + block toggle
  const [siteGuards, setSiteGuards] = useState<SiteApplicantRow[]>([])
  const [busyApplicantId, setBusyApplicantId] = useState<number | null>(null)

  const refreshSiteGuards = async () => {
    if (!siteId) return
    const { data } = await axios.get(`${BACKEND_URL}/api/sites/${siteId}/guards`)
    setSiteGuards(data ?? [])
  }

  const toggleSiteBlock = async (applicant_id: number, blocked: boolean) => {
    if (!siteId) return
    try {
      setError("")
      setMessage("")
      setBusyApplicantId(applicant_id)

      await axios.patch(`${BACKEND_URL}/api/sites/${siteId}/guards/${applicant_id}/block`, { blocked })

      setMessage(blocked ? "Applicant blocked for this site." : "Applicant unblocked for this site.")
      await refreshSiteGuards()
    } catch (e) {
      console.error(e)
      setError("Failed to update site block status")
    } finally {
      setBusyApplicantId(null)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!siteId) return
      try {
        setError("")
        setMessage("")
        const { data } = await axios.get(`${BACKEND_URL}/api/sites/${siteId}`)
        setSite(data)

        await refreshSiteGuards()
      } catch (err) {
        console.error("Failed to fetch site data:", err)
        setError("Failed to load site details")
      }
    }
    fetchData()
  }, [siteId])

  const guardsVisible = useMemo(() => siteGuards ?? [], [siteGuards])

  return (
    <div className={`${theme === "dark" ? "bg-dark-background" : "bg-light-background"} min-h-screen`}>
      <Navbar />

      <TwoColumnLayout
        sidebarContent={<SideNavbar />}
        mainContent={
          <div className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}

            {/* Top row: Site Details + Check Calls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Site Details */}
              <Card className="p-6">
                <h1 className="text-2xl font-bold mb-4">Site Details</h1>

                {site ? (
                  <ViewAsTable
                    data={[
                      { field: "Site ID", value: site.site_id },
                      { field: "Site Name", value: site.site_name },
                      { field: "Site Group", value: site.site_group },
                      { field: "Contact Person", value: site.contact_person },
                      { field: "Contact Number", value: site.contact_number },
                      { field: "Address", value: site.site_address },
                      { field: "Post Code", value: site.post_code },
                      { field: "Contracted Hours", value: site.weekly_contracted_hours },
                      { field: "Trained Guards", value: site.trained_guards_required ? "Yes" : "No" },
                      { field: "Billable Rate Guarding", value: site.site_billable_rate_guarding },
                      { field: "Billable Rate Supervisor", value: site.site_billable_rate_supervisor },
                      { field: "Payable Rate Guarding", value: site.site_payable_rate_guarding },
                      { field: "Payable Rate Supervisor", value: site.site_payable_rate_supervisor },
                      { field: "Mobile Allowed", value: site.is_mobile_allowed ? "Yes" : "No" },
                      { field: "Site Note", value: site.site_note },
                    ]}
                    columns={[
                      { label: "Field", accessor: "field" },
                      { label: "Value", accessor: "value" },
                    ]}
                  />
                ) : (
                  <p>No site details available.</p>
                )}
              </Card>

              {/* Check Calls */}
              {site && <CheckCalls siteId={site.site_id} />}
            </div>

            {/* Assigned / Company Applicants - site level ban/unban */}
            <Card className="p-6 shadow rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Site Applicants (Ban/Unban per Site)</h2>
                <Button onClick={refreshSiteGuards} size="small">
                  Refresh
                </Button>
              </div>

              {guardsVisible.length ? (
                <div className="space-y-3">
                  {guardsVisible.map((g) => {
                    const fullName = `${g.first_name ?? ""} ${g.last_name ?? ""}`.trim() || `Applicant #${g.applicant_id}`
                    const busy = busyApplicantId === g.applicant_id
                    const blocked = !!g.is_blocked_for_site

                    return (
                      <Card key={g.applicant_id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{fullName}</p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  blocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                                }`}
                              >
                                {blocked ? "Blocked (Site)" : "Allowed"}
                              </span>
                            </div>

                            <p className="text-sm opacity-80">
                              {g.email ? `Email: ${g.email} | ` : ""}
                              {g.phone ? `Phone: ${g.phone}` : ""}
                            </p>

                            <p className="text-xs opacity-70">
                              Applicant ID: {g.applicant_id} {g.user_id ? `| User ID: ${g.user_id}` : ""}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            {blocked ? (
                              <Button
                                disabled={busy}
                                onClick={() => toggleSiteBlock(g.applicant_id, false)}
                                size="small"
                                color="submit"
                                icon="plus"
                              >
                                Unban
                              </Button>
                            ) : (
                              <Button
                                disabled={busy}
                                onClick={() => toggleSiteBlock(g.applicant_id, true)}
                                size="small"
                                color="delete"
                                icon="trash"
                              >
                                Ban
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <p>No applicants found for this site.</p>
              )}
            </Card>

            {/* Below: Assign Checkpoints */}
            {site && site.is_mobile_allowed && (
              <Card className="p-6">
                <AssignCheckpoints siteId={site.site_id} />
              </Card>
            )}
          </div>
        }
      />

      <Footer />
    </div>
  )
}

export default SiteDetailPage
