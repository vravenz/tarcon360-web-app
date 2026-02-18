import type { Request, Response } from 'express';
import { getPool } from "../../config/database"
const pool = getPool()

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

async function nextCreditNumber(companyId: number) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c
     FROM credit_notes cn
     JOIN invoice_groups ig ON ig.invoice_group_id = cn.invoice_group_id
     WHERE ig.company_id = $1`,
    [companyId]
  );
  const seq = rows[0].c + 1;
  return `CRN-${companyId}-${String(seq).padStart(5, '0')}`;
}

/** POST /api/credit-notes
 * body: { invoice_group_id, link_invoice_id?, lines:[{ site_id?, roster_shift_assignment_id?, description, role, qty_hours, unit_rate }], reason?, vat_rate_pct? }
 */
export async function createCreditNote(req: Request, res: Response) {
  try {
    const { invoice_group_id, link_invoice_id, lines, reason, vat_rate_pct } = req.body;
    if (!invoice_group_id || !Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({ error: 'invoice_group_id and at least one line are required' });
      return;
    }

    // Find group to know company (for numbering)
    const g = await pool.query(
      `SELECT * FROM invoice_groups WHERE invoice_group_id = $1`,
      [invoice_group_id]
    );
    if (!g.rows[0]) { res.status(404).json({ error: 'invoice_group not found' }); return; }
    const companyId = Number(g.rows[0].company_id);

    const credit_number = await nextCreditNumber(companyId);
    const vr = Number(vat_rate_pct ?? 20.0);

    let subtotal = 0;
    for (const ln of lines) subtotal += Number(ln.qty_hours) * Number(ln.unit_rate);
    subtotal = r2(subtotal);
    const vat_amount = r2((subtotal * vr) / 100);
    const total = r2(subtotal + vat_amount);

    const ins = await pool.query(
      `INSERT INTO credit_notes(invoice_group_id, credit_number, reason, vat_rate_pct, subtotal, vat_amount, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING credit_note_id`,
      [invoice_group_id, credit_number, reason ?? null, vr, subtotal, vat_amount, total]
    );
    const credit_note_id = ins.rows[0].credit_note_id;

    for (const ln of lines) {
      const line_sub = r2(Number(ln.qty_hours) * Number(ln.unit_rate));
      await pool.query(
        `INSERT INTO credit_note_items(credit_note_id, site_id, roster_shift_assignment_id, description, role, qty_hours, unit_rate, line_subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          credit_note_id,
          ln.site_id ?? null,
          ln.roster_shift_assignment_id ?? null,
          ln.description,
          ln.role ?? null,
          Number(ln.qty_hours),
          Number(ln.unit_rate),
          line_sub
        ]
      );
    }

    if (link_invoice_id) {
      await pool.query(
        `INSERT INTO credit_note_links(credit_note_id, invoice_id) VALUES ($1,$2)`,
        [credit_note_id, Number(link_invoice_id)]
      );
      await pool.query(
        `INSERT INTO invoice_events(invoice_id, event_type, event_json)
         VALUES ($1,'credited', jsonb_build_object('credit_note_id',$2))`,
        [Number(link_invoice_id), credit_note_id]
      );
    }

    res.status(201).json({ ok: true, credit_note_id, credit_number, subtotal, vat_amount, total });
  } catch (err: any) {
    console.error('createCreditNote error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

/** GET /api/credit-notes/:creditNoteId */
export async function getCreditNoteById(req: Request, res: Response) {
  try {
    const { creditNoteId } = req.params;
    const cn = await pool.query(`SELECT * FROM credit_notes WHERE credit_note_id=$1`, [creditNoteId]);
    if (!cn.rows[0]) { res.status(404).json({ error: 'Credit note not found' }); return; }

    const items = await pool.query(
      `SELECT * FROM credit_note_items WHERE credit_note_id=$1 ORDER BY credit_item_id ASC`,
      [creditNoteId]
    );

    res.json({ ok: true, credit_note: cn.rows[0], items: items.rows });
  } catch (err: any) {
    console.error('getCreditNoteById error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

/** GET /api/invoice-groups/:invoiceGroupId/credit-notes */
export async function listCreditsForGroup(req: Request, res: Response) {
  try {
    const { invoiceGroupId } = req.params;
    const { rows } = await pool.query(
      `SELECT * FROM credit_notes WHERE invoice_group_id=$1 ORDER BY credit_note_id DESC`,
      [invoiceGroupId]
    );
    res.json({ ok: true, items: rows });
  } catch (err: any) {
    console.error('listCreditsForGroup error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}
