import express from 'express';
import { addSite, fetchSite, fetchAllSites, fetchSitesByClient } from '../controllers/sites/sitesController';

const router = express.Router();

// Route definitions for site operations
router.post('/sites', addSite);
router.get('/sites/:siteId', fetchSite); // Route to fetch a specific site by ID
router.get('/sites', fetchAllSites); // New route to fetch all sites
router.get('/clients/:clientId/sites', fetchSitesByClient);

export default router;
