// File: src/controllers/subcontractors/subcontractorCreate.ts

import { Request, Response } from 'express';
import pool from '../../config/database';
import { hashPassword } from '../../utils/hashUtils';
import { createUser } from '../../models/user/userModel';

/**
 * Checks if an email is already used in the 'users' table.
 */
async function checkEmailExists(email: string): Promise<boolean> {
  const emailCheckQuery = 'SELECT 1 FROM users WHERE email = $1';
  const result = await pool.query(emailCheckQuery, [email]);
  return ((result.rowCount ?? 0) > 0);
}

/**
 * Checks if a company name already exists in the 'companies' table.
 */
async function checkCompanyNameExists(companyName: string): Promise<boolean> {
  const nameCheckQuery = 'SELECT 1 FROM companies WHERE LOWER(company_name) = LOWER($1)';
  const result = await pool.query(nameCheckQuery, [companyName]);
  return ((result.rowCount ?? 0) > 0);
}

/**
 * Creates a new subcontractor "company" row in the 'companies' table.
 * Returns the created row.
 */
async function createSubcontractorCompany(
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
  vatRegistrationNumber: string | null
) {
  const insertQuery = `
    INSERT INTO companies (
      first_name,
      last_name,
      company_name,
      company_address,
      contact_person,
      contact_number,
      contact_department,
      invoice_terms,
      payment_terms,
      vat_registered,
      vat_registration_number,
      is_subcontractor
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
    RETURNING company_id, company_name, is_subcontractor;
  `;

  const values = [
    firstName,
    lastName,
    companyName,
    companyAddress,
    contactPerson,
    contactNumber,
    contactDepartment,
    invoiceTerms,
    paymentTerms,
    vatRegistered,
    vatRegistrationNumber
  ];

  const result = await pool.query(insertQuery, values);
  return result.rows[0];
}

/**
 * Controller: Creates a new subcontractor in the system.
 */
export const createSubcontractorAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    // Expecting the following structure in req.body:
    // {
    //   firstName, lastName, companyName, companyAddress, contactPerson,
    //   contactNumber, contactDepartment, invoiceTerms, paymentTerms,
    //   vatRegistered, vatRegistrationNumber, email, password
    // }
    const {
      firstName,
      lastName,
      companyName,
      companyAddress,
      contactPerson,
      contactNumber,
      contactDepartment,
      invoiceTerms,
      paymentTerms,
      vatRegistered,
      vatRegistrationNumber,
      email,
      password
    } = req.body;

    // Validate required fields
    if (!email || !password || !companyName) {
      res.status(400).json({ error: 'Missing required fields: email, password, companyName.' });
      return;
    }

    // Check for existing email or company name
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      res.status(409).json({ error: 'Email is already in use.' });
      return;
    }

    const companyNameExists = await checkCompanyNameExists(companyName);
    if (companyNameExists) {
      res.status(409).json({ error: 'Company name already exists.' });
      return;
    }

    // Create the subcontractor "Company" row
    const newCompany = await createSubcontractorCompany(
      firstName || '',
      lastName || '',
      companyName,
      companyAddress || '',
      contactPerson || '',
      contactNumber || '',
      contactDepartment || '',
      invoiceTerms || '',
      paymentTerms || '',
      vatRegistered || false,
      vatRegistrationNumber || null
    );

    // Hash the user's password
    const hashedPassword = await hashPassword(password);

    // Create the user (role "Subcontractor", with isSubcontractor flag set to true)
    const roleName = 'Subcontractor';
    const createdUser = await createUser(
      email,
      hashedPassword,
      newCompany.company_id, // Newly created subcontractor company's ID
      roleName,
      true,                // isMainUser (adjust as needed)
      null,                // applicantId
      true,                // isActive
      false,               // isDeleted
      false,               // isDormant
      false,               // isSubcontractorEmployee
      true,                // isSubcontractor
      null,                // branchId (null will default to Head Office)
      null                 // currentAssignedCompanyId
    );

    // Remove the password from the response object
    delete createdUser.password;

    // Send success response
    res.status(201).json({
      message: 'Subcontractor account created successfully!',
      company: newCompany,
      user: createdUser
    });
    return;
  } catch (error: any) {
    console.error('Error creating subcontractor account:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
    return;
  }
};
