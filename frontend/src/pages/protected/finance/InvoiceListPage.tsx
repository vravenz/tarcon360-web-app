import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Footer from '../../../components/Footer';
import { useTheme } from '../../../context/ThemeContext';
import { BACKEND_URL } from '../../../config';
import { useAuth } from '../../../hooks/useAuth';

type InvoiceRow = {
  invoice_id: number;
  invoice_number: string;
  issue_date: string;
  status: 'draft' | 'issued' | 'part_paid' | 'paid' | 'void' | 'superseded';
  subtotal: number;
  vat_amount: number;
  total: number;
  client_id: number;
  client_name?: string;
  company_id: number;
  period_start: string;
  period_end: string;
  po_number: string | null;
};

const pillClasses: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-800',
  issued: 'bg-blue-100 text-blue-800',
  part_paid: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  void: 'bg-rose-100 text-rose-800',
  superseded: 'bg-zinc-200 text-zinc-700 line-through',
};

const InvoiceListPage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useSearchParams();
  const [clients, setClients] = useState<{ client_id: number; client_name: string }[]>([]);

  // Always scope to this company for everyone (even super admin)
  const { companyId } = useAuth();

  // UI filters (NO company_id here)
  const [filters, setFilters] = useState({
    client_id: params.get('client_id') || '',
    status: params.get('status') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
  });

  useEffect(() => {
  if (!companyId) return;

  (async () => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/clients/company/${companyId}`, {
        headers: { 'x-user-id': localStorage.getItem('userId') || '' }
      });

      setClients(resp.data || []);
    } catch (err) {
      console.error('Error loading clients list', err);
    }
  })();
}, [companyId]);

  const fetchData = async () => {
    if (!companyId) return; // wait until auth is loaded
    setLoading(true);
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/invoices`, {
        params: {
          client_id: filters.client_id || undefined,
          status: filters.status || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          company_id: companyId, // ← hard-enforced
        },
        headers: {
          'x-user-id': localStorage.getItem('userId') || '',
        },
      });
      setItems(resp.data.items || []);
    } catch (e) {
      console.error('invoices list error', e);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters change; sync URL (without company_id)
  useEffect(() => {
    fetchData();
    const q = new URLSearchParams();
    if (filters.client_id) q.set('client_id', String(filters.client_id));
    if (filters.status) q.set('status', String(filters.status));
    if (filters.from) q.set('from', String(filters.from));
    if (filters.to) q.set('to', String(filters.to));
    setParams(q, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.client_id, filters.status, filters.from, filters.to, companyId]);

  const totalSum = useMemo(
    () => items.reduce((acc, r) => acc + Number(r.total || 0), 0),
    [items]
  );

  // Optional: small guard UI until companyId is ready
  if (!companyId) {
    return (
      <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
        <Navbar />
        <TwoColumnLayout sidebarContent={<SideNavbar />} mainContent={<Card className="p-6">Loading…</Card>} />
        <Footer />
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
      <Navbar />
      <div className="flex-grow">
        <TwoColumnLayout
          sidebarContent={<SideNavbar />}
          mainContent={
            <div className={`${theme === 'dark' ? 'text-dark-text' : 'text-light-text'} space-y-4`}>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Invoices</h1>
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/finance/invoices/generate')} icon="plus" size="small" color="submit">
                    Generate Invoice
                  </Button>
                  <Button onClick={fetchData} size="small">Refresh</Button>
                </div>
              </div>

              <Card className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <InputField
                type="select"
                name="client_id"
                label="Client"
                value={filters.client_id}
                onChange={(e) => setFilters((p) => ({ ...p, client_id: e.target.value }))}
                options={[
                    { label: 'Any client', value: '' },
                    ...clients.map((c) => ({
                    label: c.client_name,
                    value: String(c.client_id),
                    })),
                ]}
                />
                <InputField
                  type="select"
                  name="status"
                  label="Status"
                  value={filters.status}
                  onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                  options={[
                    { label: 'Any', value: '' },
                    { label: 'Draft', value: 'draft' },
                    { label: 'Issued', value: 'issued' },
                    { label: 'Part Paid', value: 'part_paid' },
                    { label: 'Paid', value: 'paid' },
                    { label: 'Void', value: 'void' },
                    { label: 'Superseded', value: 'superseded' },
                  ]}
                />
                <InputField
                  type="date"
                  name="from"
                  label="From"
                  value={filters.from}
                  onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                />
                <InputField
                  type="date"
                  name="to"
                  label="To"
                  value={filters.to}
                  onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                />
              </Card>

              <Card className="p-0 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left border-b">
                    <tr className="text-zinc-500">
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Issue Date</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Period</th>
                      <th className="p-3">PO</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td className="p-3" colSpan={8}>Loading…</td></tr>
                    )}
                    {!loading && items.length === 0 && (
                      <tr><td className="p-3" colSpan={8}>No invoices found.</td></tr>
                    )}
                    {!loading && items.map((r) => (
                      <tr key={r.invoice_id} className="border-b hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="p-3 font-medium">{r.invoice_number}</td>
                        <td className="p-3">{new Date(r.issue_date).toLocaleDateString()}</td>
                        <td className="p-3">{r.client_name || `#${r.client_id}`}</td>
                        <td className="p-3">{r.period_start} → {r.period_end}</td>
                        <td className="p-3">{r.po_number || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${pillClasses[r.status] || ''}`}>{r.status}</span>
                        </td>
                        <td className="p-3 text-right font-semibold">£{Number(r.total).toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <Link className="underline" to={`/finance/invoices/${r.invoice_id}`}>Open</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {items.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={6} className="p-3 text-right font-semibold">Total of page</td>
                        <td className="p-3 text-right font-bold">£{totalSum.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </Card>
            </div>
          }
        />
      </div>
      <Footer />
    </div>
  );
};

export default InvoiceListPage;
