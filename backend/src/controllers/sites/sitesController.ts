import { Request, Response } from 'express';
import {getSite, insertSite, getAllSites, getSitesByClient, Site } from '../../models/sites/sites';
import {
  getCompanyApplicantsForSite,
  setApplicantBlockedForSite,
} from "../../models/sites/siteApplicantBlocks"

// Add Site
export const addSite = async (req: Request, res: Response): Promise<void> => {
    try {
        const newSite: Site = await insertSite(req.body);
        res.status(201).json(newSite);
    } catch (error) {
        console.error('Error adding new site:', error);
        res.status(500).send('Server error');
    }
};

// Get Site Data
export const fetchSite = async (req: Request, res: Response): Promise<void> => {
    const siteId = parseInt(req.params.siteId);
    if (!siteId) {
        res.status(400).send('Invalid site ID');
        return;
    }

    try {
        const site = await getSite(siteId);
        if (site) {
            res.json(site);
        } else {
            res.status(404).send('Site not found');
        }
    } catch (error) {
        console.error('Error fetching site:', error);
        res.status(500).send('Server error');
    }
};

// Get All Sites Data
export const fetchAllSites = async (req: Request, res: Response): Promise<void> => {
    try {
        const sites = await getAllSites();
        res.json(sites);
    } catch (error) {
        console.error('Error fetching all sites:', error);
        res.status(500).send('Server error');
    }
};

// Get Site by Client
export const fetchSitesByClient = async (req: Request, res: Response): Promise<void> => {
    const { clientId } = req.params;
    if (!clientId) {
        res.status(400).send('Client ID is required');
        return;
    }
    try {
        const sites: Site[] = await getSitesByClient(parseInt(clientId, 10));
        res.json(sites);
    } catch (error) {
        console.error('Error fetching sites by client:', error);
        res.status(500).send('Server error while fetching sites');
    }
};

// GET /api/sites/:siteId/guards
export const listSiteGuards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { siteId } = req.params
    if (!siteId) return void res.status(400).send("siteId is required")

    const rows = await getCompanyApplicantsForSite(parseInt(siteId, 10))
    res.json(rows)
  } catch (e) {
    console.error("Error listing site guards:", e)
    res.status(500).send("Server error")
  }
}

// PATCH /api/sites/:siteId/guards/:applicantId/block  body: { blocked: true|false }
export const setSiteGuardBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { siteId, applicantId } = req.params
    const b = req.body ?? {}

    if (!siteId || !applicantId) return void res.status(400).send("siteId and applicantId are required")

    const blocked = b.blocked === undefined ? true : !!b.blocked

    const out = await setApplicantBlockedForSite(
      parseInt(siteId, 10),
      parseInt(applicantId, 10),
      blocked
    )

    res.json({ ok: true, ...out })
  } catch (e) {
    console.error("Error blocking/unblocking applicant for site:", e)
    res.status(500).send("Server error")
  }
}