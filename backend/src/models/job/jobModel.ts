import pool from '../../config/database';
import crypto from 'crypto';
import { sendJobOfferEmail } from '../../utils/emailService';

export const getJobOffersByCompanyId = async (companyId: number) => {
    const result = await pool.query(
        `SELECT o.*, a.first_name, a.last_name
         FROM job_offers o
         JOIN applications ap ON o.application_id = ap.application_id
         JOIN applicants a ON ap.applicant_id = a.applicant_id
         JOIN jobs j ON ap.job_id = j.job_id
         WHERE j.company_id = $1`,
        [companyId]
    );
    return result.rows;
};

// Update job offer status to "Accepted" or "Rejected"
export const updateJobOfferStatus = async (offerId: number, status: string, signed_on: Date | null = null) => {
    const query = `
        UPDATE job_offers
        SET status = $1, signed_on = $2
        WHERE offer_id = $3
        RETURNING *;
    `;
    const values = [status, signed_on, offerId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const createJobOffer = async (
    applicationId: number,
    offerDetails: string,
    hourlyPayRate: number,
    paymentPeriod: string,
    fixedPay: number,
    travelExpense: number,
    applicantEmail: string,
    roleOffered: string,
    branchId: number  // New parameter for branch ID
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const uniqueToken = crypto.randomBytes(16).toString('hex');
        const insertOfferQuery = `
            INSERT INTO job_offers (application_id, offer_details, hourly_pay_rate, payment_period, fixed_pay, travel_expense, status, token, role_offered, branch_id)
            VALUES ($1, $2, $3, $4, $5, $6, 'Offered', $7, $8, $9)
            RETURNING offer_id;
        `;
        const offerValues = [applicationId, offerDetails, hourlyPayRate, paymentPeriod, fixedPay, travelExpense, uniqueToken, roleOffered, branchId];
        const offerResult = await client.query(insertOfferQuery, offerValues);
        const offerId = offerResult.rows[0].offer_id;

        const offerUrl = `http://localhost:3000/job-offer/${offerId}?token=${uniqueToken}`;
        await sendJobOfferEmail(applicantEmail, offerUrl, offerDetails);

        await client.query('COMMIT');
        return { offerId, offerUrl };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const validateJobOfferToken = async (offerId: number, token: string): Promise<any> => {
    const query = `
        SELECT offer_id, hourly_pay_rate, payment_period, fixed_pay, travel_expense, token 
        FROM job_offers 
        WHERE offer_id = $1 AND token = $2 AND status = 'Offered'
    `;
    const result = await pool.query(query, [offerId, token]);
    if (result.rows.length > 0) {
        return result.rows[0];  // return the row containing offer details
    }
    return false;
};

// Job Create
export const createJob = async (
    company_id: number, title: string, description: string, location: string, 
    start_date: Date | null, end_date: Date | null, is_ongoing: boolean, 
    status: string = 'Open'
) => {
    const result = await pool.query(
        `INSERT INTO jobs (company_id, title, description, location, start_date, end_date, is_ongoing, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [company_id, title, description, location, start_date, end_date, is_ongoing, status]
    );
    return result.rows[0];
};

// Job Delete
export const deleteJobById = async (jobId: number) => {
    const result = await pool.query(
        'DELETE FROM jobs WHERE job_id = $1 RETURNING *',
        [jobId]
    );
    return result.rows[0];
};

// Job Find
export const getJobsByCompanyId = async (company_id: number) => {
    const result = await pool.query('SELECT * FROM jobs WHERE company_id = $1', [company_id]);
    return result.rows;
};

export const getOpenJobsByCompanyId = async (company_id: number) => {
    const result = await pool.query(
        "SELECT * FROM jobs WHERE company_id = $1 AND status = 'Open'",
        [company_id]
    );
    return result.rows;
};

export const getJobStatusById = async (jobId: number) => {
    const result = await pool.query(
        "SELECT status FROM jobs WHERE job_id = $1",
        [jobId]
    );
    return result.rows[0];
};

export const getCompaniesWithOpenJobs = async () => {
    const query = `
        SELECT DISTINCT companies.company_id, companies.company_name
        FROM companies
        JOIN jobs ON companies.company_id = jobs.company_id
        WHERE jobs.status = 'Open';
    `;
    const result = await pool.query(query);
    return result.rows;
};

// End Job Find

// Job Update
export const updateJobStatus = async (jobId: number, status: string) => {
    const result = await pool.query(
        'UPDATE jobs SET status = $1, updated_at = NOW() WHERE job_id = $2 RETURNING *',
        [status, jobId]
    );
    return result.rows[0];
};

// This is for to insert the data from job offer to the users table for applicants
export const getJobOfferById = async (offerId: number) => {
    const query = `
        SELECT offer_id, application_id, offer_details, offered_on, status, signed_on,
               hourly_pay_rate, payment_period, fixed_pay, travel_expense, role_offered, branch_id
        FROM job_offers
        WHERE offer_id = $1;
    `;
    const result = await pool.query(query, [offerId]);
    return result.rows[0];
};
