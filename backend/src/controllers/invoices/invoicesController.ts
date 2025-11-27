import type { Request, Response } from 'express';
import pool from '../../config/database';

/** Utility: currency round to 2dp */
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Fetch supplier snapshot from logged-in user → companies */
async function getSupplierSnapshot(userId?: number) {
  // userId is optional—fall back to the first company if not present
  if (userId) {
    const ures = await pool.query(
      `SELECT u.id AS user_id, u.company_id, c.company_name, c.company_address, c.vat_registration_number,
              c.invoice_terms, c.payment_terms
       FROM users u
       LEFT JOIN companies c ON c.company_id = u.company_id
       WHERE u.id = $1
       LIMIT 1`,
      [userId]
    );
    const u = ures.rows[0];
    if (u?.company_id) {
      return {
        supplier_company_id: u.company_id,
        supplier_user_id: u.user_id,
        supplier_name: u.company_name || 'Your Company',
        supplier_address: u.company_address || '',
        supplier_vat_no: u.vat_registration_number || null,
        terms_text: u.invoice_terms || 'Net 30',
        payment_terms: u.payment_terms || null,
      };
    }
  }

  // Fallback: pick any company row (or throw if you prefer hard fail)
  const cres = await pool.query(
    `SELECT company_id, company_name, company_address, vat_registration_number, invoice_terms, payment_terms
     FROM companies
     ORDER BY company_id ASC
     LIMIT 1`
  );
  const c = cres.rows[0];
  return {
    supplier_company_id: c?.company_id ?? 0,
    supplier_user_id: null,
    supplier_name: c?.company_name ?? 'Your Company',
    supplier_address: c?.company_address ?? '',
    supplier_vat_no: c?.vat_registration_number ?? null,
    terms_text: c?.invoice_terms ?? 'Net 30',
    payment_terms: c?.payment_terms ?? null,
  };
}

/** Fetch client snapshot */
async function getClientSnapshot(clientId: number) {
  const { rows } = await pool.query(
    `SELECT client_name, address, vat_registration_number
     FROM clients WHERE client_id = $1`,
    [clientId]
  );
  if (!rows[0]) throw new Error('Client not found');
  return {
    client_name: rows[0].client_name,
    client_address: rows[0].address || null,
    client_vat_no: rows[0].vat_registration_number || null,
  };
}

/** Get or create invoice_group for {company_id, client_id, period} + optional PO */
async function upsertInvoiceGroup(companyId: number, clientId: number, periodStart: string, periodEnd: string, po?: string) {
  // Try find existing group
  const find = await pool.query(
    `SELECT invoice_group_id
     FROM invoice_groups
     WHERE company_id = $1 AND client_id = $2
       AND period_start = $3 AND period_end = $4
       AND (po_number IS NOT DISTINCT FROM $5)`,
    [companyId, clientId, periodStart, periodEnd, po ?? null]
  );
  if (find.rows[0]) return find.rows[0].invoice_group_id;

  // Create new group
  const ins = await pool.query(
    `INSERT INTO invoice_groups(company_id, client_id, period_start, period_end, po_number)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING invoice_group_id`,
    [companyId, clientId, periodStart, periodEnd, po ?? null]
  );
  return ins.rows[0].invoice_group_id;
}

/** Compute next version in a group */
async function nextVersion(invoiceGroupId: number) {
  const { rows } = await pool.query(
    `SELECT COALESCE(MAX(version),0)+1 AS v FROM invoices WHERE invoice_group_id = $1`,
    [invoiceGroupId]
  );
  return Number(rows[0].v) || 1;
}

/** Very simple numberer; replace with your own series (e.g., KFA-YY-####) */
async function nextInvoiceNumber(companyId: number) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM invoices WHERE supplier_company_id = $1`,
    [companyId]
  );
  const seq = rows[0].c + 1;
  return `INV-${companyId}-${String(seq).padStart(5, '0')}`;
}

/** Query roster to build invoice items (uses rs.billable_amount or resolve_billable_rate(site, role)) */
async function fetchInvoiceRows(companyId: number, clientId: number, periodStart: string, periodEnd: string) {
  const q = `
    SELECT
      r.site_id,
      si.site_name,
      COALESCE(rs.billable_role, 'guard') AS role,
      ROUND(SUM(COALESCE(rsa.actual_worked_hours, 0))::numeric, 2) AS hours,
      ROUND(
        COALESCE(
          rs.billable_amount,
          resolve_billable_rate(r.site_id, COALESCE(rs.billable_role, 'guard'))
        )::numeric, 2
      ) AS rate
    FROM roster_shifts rs
    JOIN roster r                   ON r.roster_id = rs.roster_id
    JOIN sites si                   ON si.site_id  = r.site_id
    JOIN roster_shift_assignments rsa ON rsa.roster_shift_id = rs.roster_shift_id
    WHERE rs.shift_date BETWEEN $1 AND $2
      AND rs.company_id = $3
      AND si.client_id = $4
      AND rsa.assignment_status IN ('active','completed')
    GROUP BY r.site_id, si.site_name, COALESCE(rs.billable_role, 'guard'),
             COALESCE(rs.billable_amount, resolve_billable_rate(r.site_id, COALESCE(rs.billable_role, 'guard')))
    HAVING SUM(COALESCE(rsa.actual_worked_hours, 0)) > 0
    ORDER BY si.site_name, role
  `;
  const { rows } = await pool.query(q, [periodStart, periodEnd, companyId, clientId]);
  return rows as Array<{ site_id: number; site_name: string; role: string; hours: number; rate: number }>;
}

/** ------------------ Controllers ------------------ */

/** POST /api/invoices/generate */
export async function generateInvoice(req: Request, res: Response) {
  try {
    const {
      client_id,
      period_start,
      period_end,
      po_number,
      vat_rate_pct = 20.0,
      supplier_logo_url = null,
      footer_notes = 'Thank you for your business.',
    } = req.body;

    const userId = (req as any).userId as number | undefined;
    if (!client_id || !period_start || !period_end) {
      res.status(400).json({ error: 'client_id, period_start, period_end are required' });
      return;
    }

    // Supplier snapshot (users -> companies)
    const supplier = await getSupplierSnapshot(userId);
    const client = await getClientSnapshot(Number(client_id));

    // Ensure group and version
    const invoice_group_id = await upsertInvoiceGroup(
      supplier.supplier_company_id,
      Number(client_id),
      period_start,
      period_end,
      po_number ?? null
    );
    const version = await nextVersion(invoice_group_id);

    // Create shell
    const invoice_number = await nextInvoiceNumber(supplier.supplier_company_id);
    const issue_date = new Date();
    const due_date = new Date(issue_date); due_date.setDate(issue_date.getDate() + 30);
    const ins = await pool.query(
      `INSERT INTO invoices(
        invoice_group_id, version, invoice_number, issue_date, due_date, terms_text, currency,
        supplier_company_id, supplier_user_id, supplier_name, supplier_address, supplier_vat_no, supplier_logo_url, footer_notes,
        client_name, client_address, client_vat_no,
        vat_rate_pct, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,'GBP',
        $7,$8,$9,$10,$11,$12,$13,
        $14,$15,$16,
        $17,'issued'
      )
      RETURNING invoice_id`,
      [
        invoice_group_id, version, invoice_number, issue_date, due_date, supplier.terms_text,
        supplier.supplier_company_id, supplier.supplier_user_id, supplier.supplier_name, supplier.supplier_address,
        supplier.supplier_vat_no, supplier_logo_url, footer_notes,
        client.client_name, client.client_address, client.client_vat_no,
        vat_rate_pct,
      ]
    );
    const invoice_id = ins.rows[0].invoice_id;

    // Build items from roster
    const rows = await fetchInvoiceRows(supplier.supplier_company_id, Number(client_id), period_start, period_end);
    let subtotal = 0;
    for (const r of rows) {
      const line = r2(Number(r.hours) * Number(r.rate));
      subtotal += line;
      await pool.query(
        `INSERT INTO invoice_items(invoice_id, site_id, description, role, qty_hours, unit_rate, line_subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [invoice_id, r.site_id, `Services at ${r.site_name}`, r.role, r.hours, r.rate, line]
      );
    }

    // Totals
    const vat_amount = r2((subtotal * Number(vat_rate_pct)) / 100);
    const total = r2(subtotal + vat_amount);
    await pool.query(`UPDATE invoices SET subtotal=$1, vat_amount=$2, total=$3 WHERE invoice_id=$4`,
      [subtotal, vat_amount, total, invoice_id]);

    // Event
    await pool.query(
      `INSERT INTO invoice_events(invoice_id, event_type, event_json)
       VALUES ($1,'generated', jsonb_build_object('period_start',$2,'period_end',$3,'po',$4))`,
      [invoice_id, period_start, period_end, po_number ?? null]
    );

    res.status(201).json({ ok: true, invoice_id, invoice_group_id, version, invoice_number, subtotal, vat_amount, total });
  } catch (err: any) {
    console.error('generateInvoice error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

/** POST /api/invoices/:invoiceGroupId/regenerate */
export async function regenerateInvoice(req: Request, res: Response) {
  try {
    const { invoiceGroupId } = req.params;
    const {
      vat_rate_pct, supplier_logo_url = null, footer_notes = 'Thank you for your business.',
    } = req.body;

    // Load group + get company/client/period
    const g = await pool.query(
      `SELECT ig.*, c.client_name, c.address AS client_address, c.vat_registration_number AS client_vat_no
       FROM invoice_groups ig
       JOIN clients c ON c.client_id = ig.client_id
       WHERE ig.invoice_group_id = $1`,
      [invoiceGroupId]
    );
    if (!g.rows[0]) { res.status(404).json({ error: 'invoice_group not found' }); return; }
    const ig = g.rows[0];

    // Supplier snapshot (from current user or fallback)
    const supplier = await getSupplierSnapshot((req as any).userId);

    // Next version + shell
    const version = await nextVersion(Number(invoiceGroupId));
    const invoice_number = await nextInvoiceNumber(supplier.supplier_company_id);
    const issue_date = new Date();
    const due_date = new Date(issue_date); due_date.setDate(issue_date.getDate() + 30);
    const ins = await pool.query(
      `INSERT INTO invoices(
        invoice_group_id, version, invoice_number, issue_date, due_date, terms_text, currency,
        supplier_company_id, supplier_user_id, supplier_name, supplier_address, supplier_vat_no, supplier_logo_url, footer_notes,
        client_name, client_address, client_vat_no,
        vat_rate_pct, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,'GBP',
        $7,$8,$9,$10,$11,$12,$13,
        $14,$15,$16,
        COALESCE($17, 20.0),'issued'
      )
      RETURNING invoice_id`,
      [
        invoiceGroupId, version, invoice_number, issue_date, due_date, supplier.terms_text,
        supplier.supplier_company_id, supplier.supplier_user_id, supplier.supplier_name, supplier.supplier_address,
        supplier.supplier_vat_no, supplier_logo_url, footer_notes,
        ig.client_name, ig.client_address, ig.client_vat_no,
        vat_rate_pct ?? null,
      ]
    );
    const invoice_id = ins.rows[0].invoice_id;

    // Rebuild items from roster
    const rows = await fetchInvoiceRows(ig.company_id, ig.client_id, ig.period_start, ig.period_end);
    let subtotal = 0;
    for (const r of rows) {
      const line = r2(Number(r.hours) * Number(r.rate));
      subtotal += line;
      await pool.query(
        `INSERT INTO invoice_items(invoice_id, site_id, description, role, qty_hours, unit_rate, line_subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [invoice_id, r.site_id, `Services at ${r.site_name}`, r.role, r.hours, r.rate, line]
      );
    }
    const appliedVat = Number(vat_rate_pct ?? 20.0);
    const vat_amount = r2((subtotal * appliedVat) / 100);
    const total = r2(subtotal + vat_amount);
    await pool.query(`UPDATE invoices SET subtotal=$1, vat_amount=$2, total=$3 WHERE invoice_id=$4`,
      [subtotal, vat_amount, total, invoice_id]);

    // Mark previous version as superseded
    await pool.query(
      `UPDATE invoices SET status='superseded'
       WHERE invoice_group_id=$1 AND invoice_id <> $2 AND status <> 'superseded'`,
      [invoiceGroupId, invoice_id]
    );

    await pool.query(
      `INSERT INTO invoice_events(invoice_id, event_type, event_json)
       VALUES ($1,'generated', jsonb_build_object('regenerated', true))`,
      [invoice_id]
    );

    res.status(201).json({ ok: true, invoice_id, version, invoice_number, subtotal, vat_amount, total });
  } catch (err: any) {
    console.error('regenerateInvoice error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

/** GET /api/invoices/:invoiceId */
export async function getInvoiceById(req: Request, res: Response) {
  try {
    const { invoiceId } = req.params;
    const inv = await pool.query(`SELECT * FROM invoices WHERE invoice_id = $1`, [invoiceId]);
    if (!inv.rows[0]) { res.status(404).json({ error: 'Invoice not found' }); return; }

    const items = await pool.query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY item_id ASC`,
      [invoiceId]
    );

    // linked credits and payments
    const credits = await pool.query(
      `SELECT cn.* FROM credit_note_links l
       JOIN credit_notes cn ON cn.credit_note_id = l.credit_note_id
       WHERE l.invoice_id = $1 ORDER BY cn.credit_note_id ASC`,
      [invoiceId]
    );
    const pays = await pool.query(
      `SELECT * FROM payments WHERE invoice_id = $1 ORDER BY paid_on ASC, payment_id ASC`,
      [invoiceId]
    );

    res.json({
      ok: true,
      invoice: inv.rows[0],
      items: items.rows,
      credits: credits.rows,
      payments: pays.rows,
    });
  } catch (err: any) {
    console.error('getInvoiceById error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

/** GET /api/invoices?client_id=&company_id=&status=&from=&to= */
export async function listInvoices(req: Request, res: Response) {
  try {
    const { client_id, company_id, status, from, to } = req.query as any;

    const conds: string[] = [];
    const vals: any[] = [];
    let i = 1;

    if (client_id) { conds.push(`ig.client_id = $${i++}`); vals.push(Number(client_id)); }
    if (company_id) { conds.push(`ig.company_id = $${i++}`); vals.push(Number(company_id)); }
    if (status) { conds.push(`inv.status = $${i++}`); vals.push(String(status)); }
    if (from) { conds.push(`inv.issue_date >= $${i++}`); vals.push(from); }
    if (to) { conds.push(`inv.issue_date <= $${i++}`); vals.push(to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const q = `
      SELECT inv.*, ig.client_id, ig.company_id, ig.period_start, ig.period_end, ig.po_number
      FROM invoices inv
      JOIN invoice_groups ig ON ig.invoice_group_id = inv.invoice_group_id
      ${where}
      ORDER BY inv.issue_date DESC, inv.invoice_id DESC
      LIMIT 200
    `;
    const { rows } = await pool.query(q, vals);
    res.json({ ok: true, items: rows });
  } catch (err: any) {
    console.error('listInvoices error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

/** POST /api/invoices/:invoiceId/payments */
export async function addPayment(req: Request, res: Response) {
  try {
    const { invoiceId } = req.params;
    const { amount, paid_on, method, reference } = req.body;

    if (!amount || !paid_on) {
      res.status(400).json({ error: 'amount and paid_on are required' });
      return;
    }

    const ins = await pool.query(
      `INSERT INTO payments (invoice_id, amount, paid_on, method, reference)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [invoiceId, Number(amount), paid_on, method ?? null, reference ?? null]
    );

    await pool.query(
      `INSERT INTO invoice_events(invoice_id, event_type, event_json)
       VALUES ($1,'payment_added', jsonb_build_object('amount',$2,'paid_on',$3))`,
      [invoiceId, Number(amount), paid_on]
    );

    // Optional: recompute status
    const inv = await pool.query(`SELECT total FROM invoices WHERE invoice_id=$1`, [invoiceId]);
    const pay = await pool.query(`SELECT COALESCE(SUM(amount),0)::numeric AS paid FROM payments WHERE invoice_id=$1`, [invoiceId]);
    const paid = Number(pay.rows[0].paid);
    const total = Number(inv.rows[0].total);
    const status = paid <= 0 ? 'issued' : (paid < total ? 'part_paid' : 'paid');
    await pool.query(`UPDATE invoices SET status=$1 WHERE invoice_id=$2`, [status, invoiceId]);

    res.status(201).json({ ok: true, payment: ins.rows[0], status });
  } catch (err: any) {
    console.error('addPayment error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

/** GET /api/invoices/:invoiceId/events */
export async function listInvoiceEvents(req: Request, res: Response) {
  try {
    const { invoiceId } = req.params;
    const ev = await pool.query(
      `SELECT * FROM invoice_events WHERE invoice_id=$1 ORDER BY occurred_at ASC, event_id ASC`,
      [invoiceId]
    );
    res.json({ ok: true, items: ev.rows });
  } catch (err: any) {
    console.error('listInvoiceEvents error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}
