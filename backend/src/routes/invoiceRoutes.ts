import express from 'express';
import {
  generateInvoice,
  regenerateInvoice,
  getInvoiceById,
  listInvoices,
  addPayment,
  listInvoiceEvents,
} from '../controllers/invoices/invoicesController';
import {
  createCreditNote,
  getCreditNoteById,
  listCreditsForGroup,
} from '../controllers/invoices/creditNotesController';

const router = express.Router();

/** Invoices */
router.post('/invoices/generate', generateInvoice);
router.post('/invoices/:invoiceGroupId/regenerate', regenerateInvoice);
router.get('/invoices/:invoiceId', getInvoiceById);
router.get('/invoices', listInvoices);
router.post('/invoices/:invoiceId/payments', addPayment);
router.get('/invoices/:invoiceId/events', listInvoiceEvents);

/** Credit Notes */
router.post('/credit-notes', createCreditNote);
router.get('/credit-notes/:creditNoteId', getCreditNoteById);
router.get('/invoice-groups/:invoiceGroupId/credit-notes', listCreditsForGroup);

export default router;
