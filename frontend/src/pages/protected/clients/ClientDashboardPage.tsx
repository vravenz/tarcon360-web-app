import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import Text from '../../../components/Text';
import Table from '../../../components/Table';
import Button from '../../../components/Button';
import Footer from '../../../components/Footer';
import { useTheme } from '../../../context/ThemeContext';

interface Metric {
  label: string;
  value: string | number;
  highlight?: 'green' | 'red' | 'yellow';
}

interface SiteRow {
  siteId: number;
  name: string;
  address: string;
  weeklyHours: number;
}

interface ContractRow {
  contractId: number;
  status: string;
  startDate: string;
  endDate: string;
}

interface TableColumn {
  header: string;
  accessor: string;
  isVisible: boolean;
}

/* ─── Dummy data ─────────────────────────────────── */
const dummyClient = {
  clientId: 42,
  clientName: 'Acme Corp.',
  address: '123 Industrial Way',
  contactPerson: 'Alice Smith',
  contactNumber: '+92 300 1234567',
  invoiceTerms: 'Net 30',
  chargeRateGuarding: 25.0,
  chargeRateSupervisor: 40.0,
  vat: true,
  contractStart: '2024-01-01',
  contractEnd: '2025-12-31'
};

const metrics: Metric[] = [
  { label: 'Sites Managed',    value: 8 },
  { label: 'Site Groups',      value: 3 },
  { label: 'Active Contracts', value: 2, highlight: 'green' },
  { label: 'Guard Rate (PKR)', value: '₨25.00' },
  { label: 'Supervisor Rate',  value: '₨40.00' },
  { label: 'VAT Registered',   value: dummyClient.vat ? 'Yes' : 'No' }
];

const dummySites: SiteRow[] = [
  { siteId: 101, name: 'Mall Entrance', address: 'Alpha Mall Rd.', weeklyHours: 40 },
  { siteId: 102, name: 'Office Park',   address: 'Beta Plaza St.', weeklyHours: 35 }
];

const dummyContracts: ContractRow[] = [
  { contractId: 201, status: 'Active', startDate: '2024-01-01', endDate: '2025-12-31' },
  { contractId: 202, status: 'Expiring Soon', startDate: '2023-02-15', endDate: '2024-01-15' }
];

/* ─── Component ───────────────────────────────────── */
const ClientDashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const siteColumns: TableColumn[] = useMemo(() => [
    { header: 'Site ID',        accessor: 'siteId',      isVisible: true },
    { header: 'Name',           accessor: 'name',        isVisible: true },
    { header: 'Address',        accessor: 'address',     isVisible: true },
    { header: 'Weekly Hours',   accessor: 'weeklyHours', isVisible: true }
  ], []);

  const contractColumns: TableColumn[] = useMemo(() => [
    { header: 'Contract ID',    accessor: 'contractId', isVisible: true },
    { header: 'Status',         accessor: 'status',     isVisible: true },
    { header: 'Start Date',     accessor: 'startDate',  isVisible: true },
    { header: 'End Date',       accessor: 'endDate',    isVisible: true }
  ], []);

  return (
    <div className={`flex flex-col min-h-screen ${
      theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'
    }`}>
      <Navbar />

      <TwoColumnLayout
        sidebarContent={<SideNavbar />}
        mainContent={
          <div className="space-y-6 p-6">
            {/* ── HEADER ─────────────────── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                  <Text className="text-2xl font-semibold">AC</Text>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{dummyClient.clientName}</h1>
                  <Text>{dummyClient.address}</Text>
                  <Text>Contact: {dummyClient.contactPerson} ({dummyClient.contactNumber})</Text>
                  <Text>Invoice Terms: {dummyClient.invoiceTerms}</Text>
                  <Text>
                    Contract: {dummyClient.contractStart} → {dummyClient.contractEnd}
                  </Text>
                </div>
              </div>
              <Button onClick={() => navigate(-1)} size="small">
                Back
              </Button>
            </div>

            {/* ── METRICS GRID ───────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((m, idx) => (
                <Card key={idx} className="p-4 flex flex-col items-center">
                  <Text className="text-sm text-gray-500">{m.label}</Text>
                  <Text className="text-3xl font-semibold" highlight={m.highlight}>
                    {m.value}
                  </Text>
                </Card>
              ))}
            </div>

            {/* ── SITES LIST ────────────────── */}
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Managed Sites</h2>
              <Table data={dummySites} columns={siteColumns} />
            </Card>

            {/* ── CONTRACT HISTORY ──────────── */}
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Contract History</h2>
              <Table data={dummyContracts} columns={contractColumns} />
            </Card>
          </div>
        }
      />

      <Footer />
    </div>
  );
};

export default ClientDashboardPage;
