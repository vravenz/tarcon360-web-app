// File: src/pages/AddRosterPage/hooks/useFetchEmployees.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../../config';

interface Employee {
  applicant_id: number;
  first_name: string;
  last_name: string;
  employee_photo: string | null;
  is_subcontractor_employee?: boolean;
  subcontractor_company_id?: number | null;
  subcontractor_company_name?: string;
}

export const useFetchEmployees = (companyId: number | null, groupId: number) => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const fetchEmployees = useCallback(async () => {
    if (!companyId || !groupId) return;
    try {
      // Example: GET /api/guard-groups/:groupId/guards
      const { data } = await axios.get<Employee[]>(
        `${BACKEND_URL}/api/guard-groups/${groupId}/guards`
      );
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    }
  }, [companyId, groupId]);

  return { employees, fetchEmployees };
};
