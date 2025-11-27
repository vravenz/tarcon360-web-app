import pool from '../../config/database';

interface Contract {
    contract_id: number;
    main_company_id: number;
    subcontractor_company_id: number;
    status: string;
    contract_description: string;
}

interface EmployeeRequest {
    request_id: number;
    contract_id: number;
    initial_employee_requests: number;
    request_date: Date;
    start_date: Date;
    end_date: Date | null;
    is_ongoing: boolean;
    location: string;
    pay_rate: number;
    approval_status: string;
}

export const getContractRequestsReceivedBySubcontractor = async (subcontractor_company_id: number): Promise<Contract[]> => {
    try {
        const query = `
            SELECT contracts.*, companies.company_name AS main_company_name
            FROM contracts
            JOIN companies ON contracts.main_company_id = companies.company_id
            WHERE contracts.subcontractor_company_id = $1
            ORDER BY contracts.created_at DESC;
        `;
        const result = await pool.query(query, [subcontractor_company_id]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching contract requests received by subcontractor:', error);
        throw error;
    }
};

export const getContractById = async (contract_id: number): Promise<Contract | null> => {
    try {
        const query = `
            SELECT contracts.*, companies.company_name AS main_company_name
            FROM contracts
            JOIN companies ON contracts.main_company_id = companies.company_id
            WHERE contracts.contract_id = $1;
        `;
        const result = await pool.query(query, [contract_id]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching contract details:', error);
        throw error;
    }
};

export const getEmployeeRequestsByContractId = async (contract_id: number): Promise<EmployeeRequest[]> => {
    try {
        const query = `
            SELECT er.*, COALESCE(ce.form_count, 0) AS form_submitted_count
            FROM employee_requests er
            LEFT JOIN (
                SELECT request_id, COUNT(*) AS form_count
                FROM contract_employees
                WHERE contract_id = $1
                GROUP BY request_id
            ) ce ON er.request_id = ce.request_id
            WHERE er.contract_id = $1
            ORDER BY er.created_at DESC;
        `;
        const result = await pool.query(query, [contract_id]);
        return result.rows.map(row => ({
            ...row,
            form_submitted_count: parseInt(row.form_submitted_count) // Ensure that the count is returned as an integer
        }));
    } catch (error) {
        console.error('Error fetching employee requests:', error);
        throw error;
    }
};


export const getEmployeeRequestById = async (request_id: number): Promise<EmployeeRequest | null> => {
    try {
        const query = `
            SELECT * FROM employee_requests
            WHERE request_id = $1;
        `;
        const result = await pool.query(query, [request_id]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching employee request by ID:', error);
        throw error;
    }
};

export const updateEmployeeRequestApprovalStatus = async (request_id: number, new_approval_status: string): Promise<EmployeeRequest | null> => {
    try {
        const query = `
            UPDATE employee_requests
            SET approval_status = $1, updated_at = NOW()
            WHERE request_id = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [new_approval_status, request_id]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    } catch (error) {
        console.error('Error updating employee request approval status:', error);
        throw error;
    }
};

export const getApplicationsByRequestId = async (requestId: number): Promise<any[]> => {
    try {
        const query = `
            SELECT ap.first_name, ap.middle_name, ap.last_name, ap.email, ap.phone,
                   a.application_status AS status,  -- Fetch status from applications table
                   ap.created_at                     -- Fetch the created_at date from applicants table
            FROM applications a
            JOIN contract_employees ce ON ce.applicant_id = a.applicant_id
            JOIN applicants ap ON ap.applicant_id = a.applicant_id
            WHERE ce.request_id = $1;
        `;
        const result = await pool.query(query, [requestId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching applications by request ID:', error);
        throw error;
    }
};
