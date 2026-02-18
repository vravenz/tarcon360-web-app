import React, { useEffect, useState } from "react"
import axios from "axios"
import Navbar from "../../../components/Navbar"
import SideNavbar from "../../../components/SideNavbar"
import TwoColumnLayout from "../../../components/TwoColumnLayout"
import Card from "../../../components/Card"
import Table from "../../../components/Table"
import Button from "../../../components/Button"
import { useTheme } from "../../../context/ThemeContext"
import Footer from "../../../components/Footer"
import { useAuth } from "../../../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { BACKEND_URL } from "../../../config"

interface Client {
  client_id: number
  client_name: string
  address: string
  contact_person: string
  contact_number: string
  company_id: number
  actions?: React.ReactNode
}

const ClientsPage: React.FC = () => {
  const { theme } = useTheme()
  const { companyId } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    if (!companyId) return
    fetchClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/clients/company/${companyId}`)

      const modifiedData = (response.data ?? []).map((client: Client) => ({
        ...client,
        actions: (
          <div className="flex space-x-2">
            <Button
              onClick={() => navigate(`/client/detail/${client.client_id}`)}
              color="view"
              icon="view"
              size="small"
            />
            <Button
              onClick={() => navigate(`/client/edit/${client.client_id}`)}
              color="edit"
              icon="edit"
              size="small"
            />
            <Button
              onClick={() => deleteClient(client.client_id)}
              color="delete"
              icon="trash"
              size="small"
            />
          </div>
        ),
      }))

      setClients(modifiedData)
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    }
  }

  const deleteClient = async (client_id: number) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/clients/${client_id}`)
      fetchClients()
    } catch (error) {
      console.error("Failed to delete client:", error)
    }
  }

  const columns = [
    { header: "Client Name", accessor: "client_name", isVisible: true },
    { header: "Address", accessor: "address", isVisible: true },
    { header: "Contact Person", accessor: "contact_person", isVisible: true },
    { header: "Contact Number", accessor: "contact_number", isVisible: true },
    { header: "Actions", accessor: "actions", isVisible: true },
  ]

  return (
    <div className={`flex flex-col min-h-screen ${theme === "dark" ? "bg-dark-background" : "bg-light-background"}`}>
      <Navbar />
      <div className="flex-grow">
        <TwoColumnLayout
          sidebarContent={<SideNavbar />}
          mainContent={
            <Card className="max-w-full w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">All Clients</h1>
                <Button onClick={() => navigate("/clients/add")} size="small" color="submit" icon="plus">
                  Add Client
                </Button>
              </div>

              <Table data={clients} columns={columns} />
            </Card>
          }
        />
      </div>
      <Footer />
    </div>
  )
}

export default ClientsPage
