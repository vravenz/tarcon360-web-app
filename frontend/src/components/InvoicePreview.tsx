import React from 'react';
import Card from './Card';

interface Props {
  invoice: any;
  creditsCount: number;
}

const InvoicePreview: React.FC<Props> = ({ invoice, creditsCount }) => {
  const isCredit = creditsCount > 0;
  const title = isCredit ? 'CREDIT NOTE' : 'INVOICE';

  return (
    <Card className="p-6 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-extrabold tracking-wide">{title}</div>
          <div className="text-sm text-zinc-500">No: {invoice.invoice_number}</div>
          <div className="text-sm text-zinc-500">Issue: {new Date(invoice.issue_date).toLocaleDateString()}</div>
          <div className="text-sm text-zinc-500">Due: {new Date(invoice.due_date).toLocaleDateString()}</div>
        </div>
        {invoice.supplier_logo_url ? (
          <img src={invoice.supplier_logo_url} alt="Logo" className="h-12 object-contain" />
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Card className="p-4">
          <div className="font-semibold mb-1">From (Supplier)</div>
          <div className="whitespace-pre-line">
            {invoice.supplier_name}
            {invoice.supplier_address ? `\n${invoice.supplier_address}` : ''}
            {invoice.supplier_vat_no ? `\nVAT: ${invoice.supplier_vat_no}` : ''}
          </div>
        </Card>
        <Card className="p-4">
          <div className="font-semibold mb-1">Bill To (Client)</div>
          <div className="whitespace-pre-line">
            {invoice.client_name}
            {invoice.client_address ? `\n${invoice.client_address}` : ''}
            {invoice.client_vat_no ? `\nVAT: ${invoice.client_vat_no}` : ''}
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default InvoicePreview;
