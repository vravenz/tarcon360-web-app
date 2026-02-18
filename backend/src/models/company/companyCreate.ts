import pool from '../../config/database';

interface Company {
  company_id?: number;
  first_name: string;
  last_name: string;
  company_name: string;
  company_address?: string;
  contact_person?: string;
  contact_number?: string;
  contact_department?: string;
  invoice_terms?: string;
  payment_terms?: string;
  vat_registered?: boolean;
  vat_registration_number?: string;
  is_subcontractor?: boolean;
}

export const createCompany = async (
  firstName: string,
  lastName: string,
  companyName: string,
  companyAddress: string,
  contactPerson: string,
  contactNumber: string,
  contactDepartment: string,
  invoiceTerms: string,
  paymentTerms: string,
  vatRegistered: boolean,
  vatRegistrationNumber: string,
  isSubcontractor: boolean = false
): Promise<Company | null> => {
  // Check if the company already exists
  const check = await pool.query(
    'SELECT 1 FROM companies WHERE company_name = $1',
    [companyName]
  );

  if ((check.rowCount ?? 0) > 0) return null;

  // Insert a new company if it does not exist
  const result = await pool.query(
    'INSERT INTO companies (first_name, last_name, company_name, company_address, contact_person, contact_number, contact_department, invoice_terms, payment_terms, vat_registered, vat_registration_number, is_subcontractor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
    [firstName, lastName, companyName, companyAddress, contactPerson, contactNumber, contactDepartment, invoiceTerms, paymentTerms, vatRegistered, vatRegistrationNumber, isSubcontractor]
  );

  if ((result.rowCount ?? 0) === 0) throw new Error("Failed to create the company");

  return result.rows[0];
};
