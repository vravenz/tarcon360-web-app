import React, { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

const InvoiceGeneratePage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { companyId } = useAuth();

  const [form, setForm] = useState({
    client_id: '',
    period_start: '',
    period_end: '',
    vat_rate_pct: 20,
    footer_notes: 'Thank you for your business.',
  });

  const [clients, setClients] = useState<{ client_id: number; client_name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Load clients for dropdown
  useEffect(() => {
    if (!companyId) return;

    (async () => {
      try {
        const resp = await axios.get(
          `${BACKEND_URL}/api/clients/company/${companyId}`,
          {
            headers: {
              'x-user-id': localStorage.getItem('userId') || '',
            },
          }
        );
        setClients(resp.data || []);
      } catch (err) {
        console.error('Error loading clients list', err);
      }
    })();
  }, [companyId]);

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!form.client_id || !form.period_start || !form.period_end) {
      setMsg('Client, period_start and period_end are required.');
      return;
    }

    try {
      setBusy(true);
      const resp = await axios.post(
        `${BACKEND_URL}/api/invoices/generate`,
        {
          client_id: Number(form.client_id),
          period_start: form.period_start,
          period_end: form.period_end,
          vat_rate_pct: Number(form.vat_rate_pct),
          footer_notes: form.footer_notes || null,
          // po_number & supplier_logo_url removed as requested
        },
        {
          headers: {
            'x-user-id': localStorage.getItem('userId') || '',
          },
        }
      );

      const id = resp.data?.invoice_id;
      setMsg('Invoice generated successfully.');
      if (id) navigate(`/finance/invoices/${id}`);
    } catch (err: any) {
      console.error(err);
      setMsg(err?.response?.data?.error || 'Failed to generate invoice.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`flex flex-col min-h-screen ${
        theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'
      }`}
    >
      <Navbar />
      <div className="flex-grow">
        <TwoColumnLayout
          sidebarContent={<SideNavbar />}
          mainContent={
            <form
              onSubmit={onSubmit}
              className={`${
                theme === 'dark' ? 'text-dark-text' : 'text-light-text'
              } space-y-4`}
            >
              <h1 className="text-xl font-bold">Generate Invoice</h1>
              <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client dropdown instead of numeric ID */}
                <InputField
                  type="select"
                  name="client_id"
                  label="Client"
                  required
                  value={form.client_id}
                  onChange={onChange}
                  options={[
                    { label: 'Select client…', value: '' },
                    ...clients.map((c) => ({
                      label: c.client_name,
                      value: String(c.client_id),
                    })),
                  ]}
                />

                <InputField
                  type="date"
                  name="period_start"
                  label="Period Start"
                  required
                  value={form.period_start}
                  onChange={onChange}
                />
                <InputField
                  type="date"
                  name="period_end"
                  label="Period End"
                  required
                  value={form.period_end}
                  onChange={onChange}
                />
                <InputField
                  type="number"
                  name="vat_rate_pct"
                  label="VAT %"
                  required
                  value={String(form.vat_rate_pct)}
                  onChange={onChange}
                />
                <InputField
                  type="text"
                  name="footer_notes"
                  label="Footer Notes"
                  value={form.footer_notes}
                  onChange={onChange}
                />
              </Card>
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="submit"
                  icon="plus"
                  disabled={busy}
                >
                  {busy ? 'Generating…' : 'Generate'}
                </Button>
              </div>
              {msg && <div className="text-sm">{msg}</div>}
            </form>
          }
        />
      </div>
      <Footer />
    </div>
  );
};

export default InvoiceGeneratePage;
