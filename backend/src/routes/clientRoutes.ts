import express from 'express';
import { addClient, fetchClientsByCompanyId, getClientDetails, addClientSiteGroup, fetchClientSiteGroups } from '../controllers/clients/clientsController';

const router = express.Router();

// Route to insert a new client
router.post('/clients', addClient);
// Route to fetch clients by company ID
router.get('/clients/company/:companyId', fetchClientsByCompanyId);
// New route to fetch specific client details
router.get('/clients/company/:companyId/details/:clientId', getClientDetails);
// Route to add a new client site group
router.post('/clients/:clientId/groups', addClientSiteGroup);
// New route to get all site groups for a specific client
router.get('/clients/:clientId/groups', fetchClientSiteGroups);

export default router;
