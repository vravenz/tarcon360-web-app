// File: src/pages/AddRosterPage/hooks/useFetchSites.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../../config';

interface Site {
  site_id: number;
  site_name: string;
  site_payable_rate_guarding?: number;
  site_payable_rate_supervisor?: number;
  site_billable_rate_guarding?: number;
  site_billable_rate_supervisor?: number;
}

export const useFetchSites = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteDetails, setSelectedSiteDetails] = useState<Site | null>(null);

  // 1) Fetch a list of sites for a given client
  const fetchSites = useCallback(async (clientId: number) => {
    try {
      // Example endpoint: GET /api/clients/:clientId/sites
      const { data } = await axios.get<Site[]>(`${BACKEND_URL}/api/clients/${clientId}/sites`);
      setSites(data);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setSites([]);
    }
  }, []);

  // 2) Fetch one site detail
  const handleSelectSite = useCallback(async (siteId: number) => {
    if (!siteId) {
      setSelectedSiteDetails(null);
      return;
    }
    try {
      // GET /api/sites/:siteId
      const { data } = await axios.get<Site>(`${BACKEND_URL}/api/sites/${siteId}`);
      setSelectedSiteDetails(data);
    } catch (error) {
      console.error('Error fetching site details:', error);
      setSelectedSiteDetails(null);
    }
  }, []);

  return {
    sites,
    selectedSiteDetails,
    fetchSites,
    handleSelectSite,
  };
};
