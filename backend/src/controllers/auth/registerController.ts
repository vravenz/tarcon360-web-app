import { Request, Response } from 'express';
import { createCompany } from '../../models/company/companyCreate';
import { createUser } from '../../models/user/userModel';
import { hashPassword } from '../../utils/hashUtils';
import pool from '../../config/database';

const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, company } = req.body;

    // Validate password
    if (typeof password !== 'string' || password.trim() === '') {
      res.status(400).json({ error: "Password must be a valid string" });
      return;
    }

    // Validate company details
    if (!company || !company.firstName || !company.lastName || !company.companyName ||
        !company.companyAddress || !company.contactPerson || !company.contactNumber ||
        !company.contactDepartment) {
      res.status(400).json({ error: "Company information is incomplete." });
      return;
    }

    // Create the company with or without subcontractor status
    const newCompany = await createCompany(
      company.firstName, company.lastName, company.companyName,
      company.companyAddress, company.contactPerson, company.contactNumber,
      company.contactDepartment, company.invoiceTerms || null, company.paymentTerms || null,
      company.vatRegistered, company.vatRegistrationNumber || null, company.isSubcontractor || false
    );
    if (!newCompany) {
      res.status(409).json({ error: "Company name already exists." });
      return;
    }

    // Hash the user's password
    const hashedPassword = await hashPassword(password);

    // Define user role based on whether the company is a subcontractor
    const roleName = company.isSubcontractor ? 'Subcontractor' : 'Super Admin';


    // Fetch the default branch ID
    const branchQuery = await pool.query('SELECT branch_id FROM branches WHERE branch_name = $1', ['Head Office']);
    const branchId = branchQuery.rows.length > 0 ? branchQuery.rows[0].branch_id : null;
    if (!branchId) {
      res.status(500).json({ error: 'Default branch "Head Office" not found in branches table. Please ensure the branch is created first.' });
      return;
    }

    // Create the user with subcontractor status based on the company registration
    const newUser = await createUser(
      email,
      hashedPassword,
      newCompany.company_id!,
      roleName,
      true, // isMainUser
      null, // applicantId
      true, // isActive
      false, // isDeleted
      false, // isDormant
      false, // isSubcontractorEmployee, explicitly set to false for subcontractors
      company.isSubcontractor || false, // isSubcontractor
      branchId
    );

    // Ensure sensitive information like password is not sent back in response
    delete newUser.password;
    res.status(201).json({
      ...newUser,
      message: "User registered successfully. Use your email or the provided PIN to log in.",
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
};

export default register;
