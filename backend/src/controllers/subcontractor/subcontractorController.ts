import { Request, Response } from 'express';
import { getSubcontractorByEmail, createSubcontractor, createContractRequest, getContractRequests, getContractById, addEmployeeRequest, getApplicantsByRequestId } from '../../models/subcontractor/subcontractorModel';
import pool from '../../config/database';
import { hashPassword } from '../../utils/hashUtils';
import { createUser } from '../../models/user/userModel';
import { sendLoginCredentialsEmail } from '../../utils/emailService';

export const searchSubcontractor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.query as { email: string };
        const subcontractor = await getSubcontractorByEmail(email);
        if (subcontractor) {
            res.json(subcontractor);
        } else {
            res.status(404).send('Subcontractor not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
};

export const addSubcontractor = async (req: Request, res: Response): Promise<void> => {
    try {
        const subcontractorData = req.body;
        const newSubcontractor = await createSubcontractor(subcontractorData);
        res.status(201).json(newSubcontractor);
    } catch (error) {
        res.status(500).send('Server error');
    }
};

export const sendContractRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            main_company_id,
            subcontractor_company_id,
            contract_description,
            employee_requests
        } = req.body;

        // Validate required fields
        if (!main_company_id || !subcontractor_company_id || !contract_description || !Array.isArray(employee_requests)) {
            res.status(400).send('Missing required fields or invalid request format.');
            return;
        }

        // Check for existing active contracts (optional)
        const existingContractQuery = `
            SELECT * FROM contracts
            WHERE main_company_id = $1 AND subcontractor_company_id = $2;
        `;
        const existingContracts = await pool.query(existingContractQuery, [main_company_id, subcontractor_company_id]);
        
        if ((existingContracts.rowCount || 0) > 0) {
            res.status(409).send('A contract with this subcontractor already exists.');
            return;
        }

        // Create contract and associated employee requests
        const newContractRequest = await createContractRequest({
            main_company_id,
            subcontractor_company_id,
            contract_description,
            employee_requests // This now needs to be an array of detailed request objects
        });

        res.status(201).json(newContractRequest);
    } catch (error) {
        console.error('Failed to send contract request:', error);
        res.status(500).send('Server error');
    }
};

export const fetchContractRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const main_company_id = parseInt(req.params.main_company_id);
        if (isNaN(main_company_id)) {
            res.status(400).send('Invalid company ID');
            return;
        }

        const requests = await getContractRequests(main_company_id);
        if (requests.length > 0) {
            res.json(requests);
        } else {
            res.status(404).send('No contract requests found');
        }
    } catch (error) {
        console.error('Error fetching contract requests:', error);
        res.status(500).send('Server error');
    }
};

export const fetchContractDetails = async (req: Request, res: Response) => {
    const contractId = parseInt(req.params.contractId);
    if (isNaN(contractId)) {
        res.status(400).send('Invalid contract ID');
        return;
    }

    try {
        const contract = await getContractById(contractId);
        if (contract) {
            res.json(contract);
        } else {
            res.status(404).send('Contract not found');
        }
    } catch (error) {
        console.error('Error in fetchContractDetails:', error);
        res.status(500).send('Server error');
    }
};

export const addEmployeeRequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { contractId, employee_request_count, startDate, endDate, isOngoing, location, payRate } = req.body;

    // Validate input
    if (!contractId || isNaN(contractId) || !employee_request_count || isNaN(employee_request_count) || isNaN(payRate)) {
        res.status(400).send("Invalid input data");
        return;
    }

    try {
        const result = await addEmployeeRequest(contractId, employee_request_count, new Date(startDate), endDate ? new Date(endDate) : null, isOngoing, location, payRate);
        res.status(201).json({
            message: "Employee request added successfully",
            data: result
        });
    } catch (error) {
        console.error('Error adding employee request:', error);
        res.status(500).send('Server error');
    }
};

export const getApplicantsByRequest = async (req: Request, res: Response): Promise<void> => {
    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) {
        res.status(400).send('Invalid request ID');
        return;
    }

    try {
        const applicants = await getApplicantsByRequestId(requestId);
        if (applicants.length > 0) {
            res.json(applicants);
        } else {
            res.status(404).send('No applicants found for this request');
        }
    } catch (error) {
        console.error('Failed to fetch applicants:', error);
        res.status(500).send('Server error');
    }
};


export const updateApplicantStatus = async (req: Request, res: Response): Promise<void> => {
    const { applicantId, status, acceptingCompanyId } = req.body;  // acceptingCompanyId should be provided in the request

    try {
        const updateQuery = `
            UPDATE contract_employees
            SET status = $1
            WHERE applicant_id = $2 RETURNING *;
        `;
        const updateResult = await pool.query(updateQuery, [status, applicantId]);

        if (status === 'Accepted' && updateResult.rows.length > 0) {
            const employee = updateResult.rows[0];

            const applicantQuery = `
                SELECT email, company_id
                FROM applicants
                WHERE applicant_id = $1;
            `;
            const applicantResult = await pool.query(applicantQuery, [employee.applicant_id]);
            if (applicantResult.rows.length === 0) {
                res.status(404).send('Applicant not found.');
                return;
            }
            const { email, company_id } = applicantResult.rows[0];

            const generatedPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await hashPassword(generatedPassword);

            const newUser = await createUser(email, hashedPassword, company_id, 'Staff', false, employee.applicant_id, true, false, false, true, false, null, acceptingCompanyId);

            if (!newUser || !newUser.user_pin) {
                throw new Error("User creation failed");
            }

            await sendLoginCredentialsEmail(email, newUser.user_pin, generatedPassword);

            res.json({ message: 'Applicant accepted successfully and credentials sent.' });
        } else {
            res.json({ message: 'Applicant status updated successfully' });
        }
    } catch (error) {
        console.error('Error updating applicant status:', error);
        res.status(500).send('Server error');
    }
};
  