import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import SideNavbar from '../../../components/SideNavbar';
import TwoColumnLayout from '../../../components/TwoColumnLayout';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Footer from '../../../components/Footer';
import InputField from '../../../components/InputField';
import { useTheme } from '../../../context/ThemeContext';
import { BACKEND_URL } from '../../../config';
import CreditNoteModal from '../../../components/CreditNoteModal';
import InvoicePreview from '../../../components/InvoicePreview';

type Invoice = any;
type Item = any;
type Payment = any;
type Credit = any;

const InvoiceDetailPage: React.FC = () => {
  const { theme } = useTheme();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [showCredit, setShowCredit] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paid_on: '',
    method: '',
    reference: ''
  });

  const load = async () => {
    try {
      const inv = await axios.get(`${BACKEND_URL}/api/invoices/${invoiceId}`);
      setInvoice(inv.data.invoice);
      setItems(inv.data.items || []);
      setCredits(inv.data.credits || []);
      setPayments(inv.data.payments || []);
      const ev = await axios.get(`${BACKEND_URL}/api/invoices/${invoiceId}/events`);
      setEvents(ev.data.items || []);
    } catch (e) {
      console.error(e);
      setMsg('Failed to load invoice.');
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [invoiceId]);

  const addPayment = async () => {
    setMsg(null);
    if (!paymentForm.amount || !paymentForm.paid_on) {
      setMsg('amount and paid_on required.');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/invoices/${invoiceId}/payments`, {
        amount: Number(paymentForm.amount),
        paid_on: paymentForm.paid_on,
        method: paymentForm.method || null,
        reference: paymentForm.reference || null
      });
      setPaymentForm({ amount: '', paid_on: '', method: '', reference: '' });
      load();
    } catch (e: any) {
      console.error(e);
      setMsg(e?.response?.data?.error || 'Failed to add payment.');
    }
  };

  const regenerate = async () => {
    setMsg(null);
    if (!invoice) return;
    try {
      await axios.post(`${BACKEND_URL}/api/invoices/${invoice.invoice_group_id}/regenerate`, {
        vat_rate_pct: invoice.vat_rate_pct,
        supplier_logo_url: invoice.supplier_logo_url,
        footer_notes: invoice.footer_notes
      }, {
        headers: { 'x-user-id': localStorage.getItem('userId') || '' }
      });
      // Go back to list or reload events
      load();
    } catch (e: any) {
      console.error(e);
      setMsg(e?.response?.data?.error || 'Failed to regenerate.');
    }
  };

  const totals = invoice ? {
    subtotal: Number(invoice.subtotal || 0),
    vat: Number(invoice.vat_amount || 0),
    total: Number(invoice.total || 0)
  } : { subtotal: 0, vat: 0, total: 0 };

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-dark-background' : 'bg-light-background'}`}>
      <Navbar />
      <div className="flex-grow">
        <TwoColumnLayout
          sidebarContent={<SideNavbar />}
          mainContent={
            <div className={`${theme === 'dark' ? 'text-dark-text' : 'text-light-text'} space-y-4`}>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Invoice Detail</h1>
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/finance/invoices')}>Back</Button>
                  {invoice && <Button onClick={regenerate} icon="refresh">Regenerate</Button>}
                  {invoice && <Button onClick={() => setShowCredit(true)} icon="minus">Credit Note</Button>}
                </div>
              </div>

              {invoice && (
                <>
                  <InvoicePreview invoice={invoice} creditsCount={credits.length} />

                  <Card className="p-0 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left border-b">
                        <tr className="text-zinc-500">
                          <th className="p-3">Description</th>
                          <th className="p-3">Role</th>
                          <th className="p-3 text-right">Hours</th>
                          <th className="p-3 text-right">Rate</th>
                          <th className="p-3 text-right">Line</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 && <tr><td className="p-3" colSpan={5}>No items.</td></tr>}
                        {items.map((it: any) => (
                          <tr key={it.item_id} className="border-b">
                            <td className="p-3">{it.description}</td>
                            <td className="p-3">{it.role || '-'}</td>
                            <td className="p-3 text-right">{Number(it.qty_hours).toFixed(2)}</td>
                            <td className="p-3 text-right">£{Number(it.unit_rate).toFixed(2)}</td>
                            <td className="p-3 text-right font-medium">£{Number(it.line_subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      {items.length > 0 && (
                        <tfoot>
                          <tr>
                            <td className="p-3 text-right font-semibold" colSpan={4}>Subtotal</td>
                            <td className="p-3 text-right font-bold">£{totals.subtotal.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-right font-semibold" colSpan={4}>VAT ({invoice.vat_rate_pct}%)</td>
                            <td className="p-3 text-right font-bold">£{totals.vat.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-right font-semibold" colSpan={4}>Total</td>
                            <td className="p-3 text-right font-extrabold">£{totals.total.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </Card>

                  {/* Credits */}
                  <Card className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Credit Notes</h3>
                    </div>
                    {credits.length === 0 ? (
                      <div className="text-sm">No credit notes linked.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="text-left border-b">
                            <tr className="text-zinc-500">
                              <th className="p-2">Credit #</th>
                              <th className="p-2">Issued</th>
                              <th className="p-2">Reason</th>
                              <th className="p-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {credits.map((c: any) => (
                              <tr key={c.credit_note_id} className="border-b">
                                <td className="p-2">{c.credit_number}</td>
                                <td className="p-2">{new Date(c.issue_date).toLocaleDateString()}</td>
                                <td className="p-2">{c.reason || '-'}</td>
                                <td className="p-2 text-right">£{Number(c.total).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>

                  {/* Payments */}
                  <Card className="p-4 space-y-3">
                    <h3 className="font-semibold">Payments</h3>
                    {payments.length === 0 ? (
                      <div className="text-sm">No payments recorded.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="text-left border-b">
                            <tr className="text-zinc-500">
                              <th className="p-2">Date</th>
                              <th className="p-2">Method</th>
                              <th className="p-2">Ref</th>
                              <th className="p-2 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((p: any) => (
                              <tr key={p.payment_id} className="border-b">
                                <td className="p-2">{new Date(p.paid_on).toLocaleDateString()}</td>
                                <td className="p-2">{p.method || '-'}</td>
                                <td className="p-2">{p.reference || '-'}</td>
                                <td className="p-2 text-right">£{Number(p.amount).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <InputField type="date" name="paid_on" label="Paid On" value={paymentForm.paid_on}
                        onChange={(e)=>setPaymentForm((p)=>({...p, paid_on: e.target.value}))} />
                      <InputField type="text" name="method" label="Method" value={paymentForm.method}
                        onChange={(e)=>setPaymentForm((p)=>({...p, method: e.target.value}))} />
                      <InputField type="text" name="reference" label="Reference" value={paymentForm.reference}
                        onChange={(e)=>setPaymentForm((p)=>({...p, reference: e.target.value}))} />
                      <InputField type="number" name="amount" label="Amount" value={paymentForm.amount}
                        onChange={(e)=>setPaymentForm((p)=>({...p, amount: e.target.value}))} />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={addPayment} color="submit">Add Payment</Button>
                    </div>
                  </Card>

                  {/* Audit Trail */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Events</h3>
                    {events.length === 0 ? (
                      <div className="text-sm">No events yet.</div>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {events.map((ev) => (
                          <li key={ev.event_id} className="flex items-center justify-between border-b py-1">
                            <div>{ev.event_type}</div>
                            <div className="text-zinc-500">{new Date(ev.occurred_at).toLocaleString()}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </>
              )}

              {msg && <div className="text-sm">{msg}</div>}
            </div>
          }
        />
      </div>
      <Footer />

      {invoice && showCredit && (
        <CreditNoteModal
          invoiceGroupId={invoice.invoice_group_id}
          linkInvoiceId={invoice.invoice_id}
          onClose={() => setShowCredit(false)}
          onCreated={() => { setShowCredit(false); load(); }}
        />
      )}
    </div>
  );
};

export default InvoiceDetailPage;
