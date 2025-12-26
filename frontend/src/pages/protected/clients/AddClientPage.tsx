import React, { useState, ChangeEvent } from "react"
import axios from "axios"
import Navbar from "../../../components/Navbar"
import SideNavbar from "../../../components/SideNavbar"
import TwoColumnLayout from "../../../components/TwoColumnLayout"
import Card from "../../../components/Card"
import InputField from "../../../components/InputField"
import Button from "../../../components/Button"
import Footer from "../../../components/Footer"
import { useTheme } from "../../../context/ThemeContext"
import { useAuth } from "../../../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { BACKEND_URL } from "../../../config"

interface ClientForm {
  client_name: string
  address: string
  contact_person: string
  contact_number: string
  client_email: string

  client_fax: string // OPTIONAL (UI) -> will be sent as null if empty
  client_invoice_terms: string

  client_contract_start: string // OPTIONAL (UI) -> will be sent as null if empty
  client_contract_end: string // OPTIONAL (UI) -> will be sent as null if empty

  client_terms: string // OPTIONAL (UI) -> will be sent as null if empty

  charge_rate_guarding: string
  charge_rate_supervisor: string

  vat: boolean
  vat_registration_number: string

  company_id: string
}

type InputFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "password"
  | "select"
  | "checkbox"
  | "date"
  | "file"
  | "radio"

type FieldConfig = {
  name: keyof ClientForm
  label: string
  type: InputFieldType
  required?: boolean
}

const AddClientPage: React.FC = () => {
  const { theme } = useTheme()
  const { companyId } = useAuth()
  const navigate = useNavigate()

  const fieldsCard1: FieldConfig[] = [
    { name: "client_name", label: "Client Name", type: "text", required: true },
    { name: "contact_person", label: "Contact Person", type: "text", required: true },
    { name: "contact_number", label: "Contact Number", type: "text", required: true },
    { name: "client_email", label: "Client Email", type: "email", required: true },

    // OPTIONAL
    { name: "client_fax", label: "Client Fax", type: "text", required: false },

    { name: "address", label: "Address", type: "textarea", required: true },

    // checkbox should NOT be forced required
    { name: "vat", label: "VAT Applicable", type: "checkbox", required: false },
  ]

  const fieldsCard2: FieldConfig[] = [
    { name: "charge_rate_guarding", label: "Charge Rate Guarding", type: "number", required: true },
    { name: "charge_rate_supervisor", label: "Charge Rate Supervisor", type: "number", required: true },
  ]

  const fieldsCard3: FieldConfig[] = [
    // OPTIONAL
    { name: "client_contract_start", label: "Contract Start Date", type: "date", required: false },
    { name: "client_contract_end", label: "Contract End Date", type: "date", required: false },
  ]

  const fieldsCard4: FieldConfig[] = [
    { name: "client_invoice_terms", label: "Invoice Terms", type: "text", required: true },

    // OPTIONAL (terms & conditions)
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
    company_id: companyId ? companyId.toString() : "",
  })

  const [message, setMessage] = useState<string>("")

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.target
    const name = target.name as keyof ClientForm
    const value =
      target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value

    setFormData((prev) => {
      // if VAT is unchecked, also clear VAT reg number
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
    return t.length ? t : null // backend will convert to Date or keep null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!companyId) {
      setMessage("Invalid company ID. Please login again.")
      return
    }

    // Build payload with optional fields converted to null if empty
    const payload = {
      ...formData,
      company_id: companyId,

      // OPTIONALS -> null if empty
      client_fax: toNullableString(formData.client_fax),
      client_contract_start: toNullableDate(formData.client_contract_start),
      client_contract_end: toNullableDate(formData.client_contract_end),
      client_terms: toNullableString(formData.client_terms),

      // If VAT false, send null reg number
      vat_registration_number: formData.vat ? toNullableString(formData.vat_registration_number) : null,
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/clients`, payload)
      if (response.status === 201) {
        setMessage("Client added successfully!")
        navigate("/clients")
      }
    } catch (error) {
      console.error("Failed to add client:", error)
      setMessage("Failed to add client. Please check the input data.")
    }
  }

  return (
    <div className={`${theme === "dark" ? "bg-dark-background" : "bg-light-background"} min-h-screen`}>
      <Navbar />
      <TwoColumnLayout
        sidebarContent={<SideNavbar />}
        mainContent={
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1 */}
                <Card className="md:col-span-2 p-6 space-y-4">
                  <h1 className="text-xl font-bold">Add New Client</h1>

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

                {/* Right Column */}
                <div className="flex flex-col space-y-4">
                  {/* Card 2 */}
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

                  {/* Card 3 */}
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

                  {/* Card 4 */}
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
                  Submit
                </Button>
              </div>
            </form>

            {message && <p className="text-red-500">{message}</p>}
          </div>
        }
      />
      <Footer />
    </div>
  )
}

export default AddClientPage
