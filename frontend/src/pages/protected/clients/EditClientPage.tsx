import React, { useEffect, useState, ChangeEvent } from "react"
import axios from "axios"
import { useNavigate, useParams } from "react-router-dom"
import Navbar from "../../../components/Navbar"
import SideNavbar from "../../../components/SideNavbar"
import TwoColumnLayout from "../../../components/TwoColumnLayout"
import Card from "../../../components/Card"
import InputField from "../../../components/InputField"
import Button from "../../../components/Button"
import Footer from "../../../components/Footer"
import { useTheme } from "../../../context/ThemeContext"
import { useAuth } from "../../../hooks/useAuth"
import { BACKEND_URL } from "../../../config"

interface ClientForm {
  client_name: string
  address: string
  contact_person: string
  contact_number: string
  client_email: string

  client_fax: string
  client_invoice_terms: string

  client_contract_start: string
  client_contract_end: string

  client_terms: string

  charge_rate_guarding: string
  charge_rate_supervisor: string

  vat: boolean
  vat_registration_number: string

  company_id: string
}

type InputFieldType = "text" | "textarea" | "number" | "email" | "checkbox" | "date"

type FieldConfig = {
  name: keyof ClientForm
  label: string
  type: InputFieldType
  required?: boolean
}

const toDateInputValue = (v: any) => {
  if (!v) return ""
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const EditClientPage: React.FC = () => {
  const { theme } = useTheme()
  const { companyId } = useAuth()
  const navigate = useNavigate()
  const { clientId } = useParams<{ clientId: string }>()

  const fieldsCard1: FieldConfig[] = [
    { name: "client_name", label: "Client Name", type: "text", required: true },
    { name: "contact_person", label: "Contact Person", type: "text", required: true },
    { name: "contact_number", label: "Contact Number", type: "text", required: true },
    { name: "client_email", label: "Client Email", type: "email", required: true },
    { name: "client_fax", label: "Client Fax", type: "text", required: false },
    { name: "address", label: "Address", type: "textarea", required: true },
    { name: "vat", label: "VAT Applicable", type: "checkbox", required: false },
  ]

  const fieldsCard2: FieldConfig[] = [
    { name: "charge_rate_guarding", label: "Charge Rate Guarding", type: "number", required: true },
    { name: "charge_rate_supervisor", label: "Charge Rate Supervisor", type: "number", required: true },
  ]

  const fieldsCard3: FieldConfig[] = [
    { name: "client_contract_start", label: "Contract Start Date", type: "date", required: false },
    { name: "client_contract_end", label: "Contract End Date", type: "date", required: false },
  ]

  const fieldsCard4: FieldConfig[] = [
    { name: "client_invoice_terms", label: "Invoice Terms", type: "text", required: true },
    { name: "client_terms", label: "Client Terms & Conditions", type: "textarea", required: false },
  ]

  const [formData, setFormData] = useState<ClientForm>({
    client_name: "",
    address: "",
    contact_person: "",
    contact_number: "",
    client_email: "",
    client_fax: "",
    client_invoice_terms: "",
    client_contract_start: "",
    client_contract_end: "",
    client_terms: "",
    charge_rate_guarding: "",
    charge_rate_supervisor: "",
    vat: false,
    vat_registration_number: "",
    company_id: companyId ? String(companyId) : "",
  })

  const [loading, setLoading] = useState<boolean>(true)
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      if (!companyId || !clientId) return
      try {
        setLoading(true)
        setError("")
        const res = await axios.get(`${BACKEND_URL}/api/clients/company/${companyId}/details/${clientId}`)
        const c = res.data

        setFormData((prev) => ({
          ...prev,
          client_name: c.client_name ?? "",
          address: c.address ?? "",
          contact_person: c.contact_person ?? "",
          contact_number: c.contact_number ?? "",
          client_email: c.client_email ?? "",
          client_fax: c.client_fax ?? "",
          client_invoice_terms: c.client_invoice_terms ?? "",
          client_contract_start: toDateInputValue(c.client_contract_start),
          client_contract_end: toDateInputValue(c.client_contract_end),
          client_terms: c.client_terms ?? "",
          charge_rate_guarding: String(c.charge_rate_guarding ?? ""),
          charge_rate_supervisor: String(c.charge_rate_supervisor ?? ""),
          vat: !!c.vat,
          vat_registration_number: c.vat_registration_number ?? "",
          company_id: String(companyId),
        }))
      } catch (e) {
        console.error(e)
        setError("Failed to load client")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [companyId, clientId])

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.target
    const name = target.name as keyof ClientForm
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value

    setFormData((prev) => {
      if (name === "vat" && value === false) {
        return { ...prev, vat: false, vat_registration_number: "" }
      }
      return { ...prev, [name]: value as any }
    })
  }

  const toNullableString = (v: string) => {
    const t = (v ?? "").trim()
    return t.length ? t : null
  }

  const toNullableDate = (v: string) => {
    const t = (v ?? "").trim()
    return t.length ? t : null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!companyId || !clientId) {
      setError("Invalid client/company. Please login again.")
      return
    }

    try {
      setError("")
      setMessage("")

      const payload = {
        ...formData,
        company_id: companyId,

        client_fax: toNullableString(formData.client_fax),
        client_contract_start: toNullableDate(formData.client_contract_start),
        client_contract_end: toNullableDate(formData.client_contract_end),
        client_terms: toNullableString(formData.client_terms),

        vat_registration_number: formData.vat ? toNullableString(formData.vat_registration_number) : null,
      }

      await axios.put(`${BACKEND_URL}/api/clients/${clientId}`, payload)

      setMessage("Client updated successfully!")
      navigate(`/client/detail/${clientId}`)
    } catch (e) {
      console.error(e)
      setError("Failed to update client.")
    }
  }

  return (
    <div className={`${theme === "dark" ? "bg-dark-background" : "bg-light-background"} min-h-screen`}>
      <Navbar />
      <TwoColumnLayout
        sidebarContent={<SideNavbar />}
        mainContent={
          <div className="space-y-6">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Edit Client</h1>
                <p className="opacity-80 text-sm">Client ID: {clientId}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate(-1)} size="small">
                  Back
                </Button>
              </div>
            </Card>

            {loading ? (
              <Card className="p-6">Loading...</Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="md:col-span-2 p-6 space-y-4">
                    {fieldsCard1.map((field) => (
                      <InputField
                        key={field.name}
                        type={field.type}
                        name={field.name}
                        value={formData[field.name] as any}
                        onChange={handleChange}
                        label={field.label}
                        required={!!field.required}
                      />
                    ))}

                    {formData.vat && (
                      <InputField
                        type="text"
                        name="vat_registration_number"
                        value={formData.vat_registration_number}
                        onChange={handleChange}
                        label="VAT Registration Number"
                        required
                      />
                    )}
                  </Card>

                  <div className="flex flex-col space-y-4">
                    <Card className="p-6 space-y-4">
                      {fieldsCard2.map((field) => (
                        <InputField
                          key={field.name}
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] as any}
                          onChange={handleChange}
                          label={field.label}
                          required={!!field.required}
                        />
                      ))}
                    </Card>

                    <Card className="p-6 space-y-4">
                      {fieldsCard3.map((field) => (
                        <InputField
                          key={field.name}
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] as any}
                          onChange={handleChange}
                          label={field.label}
                          required={!!field.required}
                        />
                      ))}
                    </Card>

                    <Card className="p-6 space-y-4">
                      {fieldsCard4.map((field) => (
                        <InputField
                          key={field.name}
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] as any}
                          onChange={handleChange}
                          label={field.label}
                          required={!!field.required}
                        />
                      ))}
                    </Card>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" color="submit" icon="plus" marginRight="5px" size="small">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}
          </div>
        }
      />
      <Footer />
    </div>
  )
}

export default EditClientPage
