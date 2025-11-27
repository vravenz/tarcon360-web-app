// File: src/pages/AddRosterPage/hooks/useFetchClients.ts
import { useCallback, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../../config';

interface Client {
  client_id: number;
  client_name: string;
}

export const useFetchClients = () => {
  const [clients, setClients] = useState<Client[]>([]);

  const fetchClients = useCallback(async (companyId: number) => {
    try {
      // Example endpoint: GET /api/clients/company/:companyId
      const { data } = await axios.get<Client[]>(
        `${BACKEND_URL}/api/clients/company/${companyId}`
      );
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  }, []);

  return { clients, fetchClients };
};
