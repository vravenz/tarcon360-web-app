import pool from '../../config/database';

interface SubcontractorData {
    firstName: string;
    lastName: string;
    companyName: string;
    companyAddress: string;
    contactPerson: string;
    contactNumber: string;
    contactDepartment: string;
    email: string;
    isSubcontractor: boolean;
}

interface EmployeeRequest {
    employee_request_count: number;
    start_date: Date;
    end_date: Date;
    is_ongoing: boolean;
    location: string;
    pay_rate: number;
}

interface ContractRequestData {
    main_company_id: number;
    subcontractor_company_id: number;
    contract_description: string;
    employee_requests: EmployeeRequest[];
}

export const getSubcontractorByEmail = async (email: string) => {
    try {
        const query = `
            SELECT c.company_id, c.company_name, c.contact_person, u.email FROM companies c
            JOIN users u ON u.company_id = c.company_id
            WHERE u.email = $1 AND c.is_subcontractor = true;
        `;
        const result = await pool.query(query, [email]);
        console.log(result.rows[0]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching subcontractor by email:', error);
        throw error;
    }
};

export const createSubcontractor = async (subcontractorData: SubcontractorData) => {
    const { firstName, lastName, companyName, companyAddress, contactPerson, contactNumber, contactDepartment, email, isSubcontractor } = subcontractorData;
    try {
        const result = await pool.query(
            'INSERT INTO companies (first_name, last_name, company_name, company_address, contact_person, contact_number, contact_department, email, is_subcontractor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [firstName, lastName, companyName, companyAddress, contactPerson, contactNumber, contactDepartment, email, isSubcontractor]
        );
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

export const createContractRequest = async (contractRequestData: ContractRequestData) => {
    const {
        main_company_id,
        subcontractor_company_id,
        contract_description,
        employee_requests
    } = contractRequestData;

    try {
        await pool.query('BEGIN');

        // Insert the contract
        const contractInsertQuery = `
            INSERT INTO contracts (
                main_company_id, 
                subcontractor_company_id, 
                contract_description, 
                created_at
            ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            RETURNING contract_id;
        `;
        const contractResult = await pool.query(contractInsertQuery, [
            main_company_id,
            subcontractor_company_id,
            contract_description
        ]);

        const contract_id = contractResult.rows[0].contract_id;

        // Insert initial employee requests if provided
        if (employee_requests && employee_requests.length > 0) {
            const employeeRequestInsertQuery = `
                INSERT INTO employee_requests (
                    contract_id, 
                    employee_request_count, 
                    start_date, 
                    end_date, 
                    is_ongoing, 
                    location, 
                    pay_rate, 
                    request_date, 
                    approval_status, 
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'pending', CURRENT_TIMESTAMP)
            `;

            for (const request of employee_requests) {
                await pool.query(employeeRequestInsertQuery, [
                    contract_id,
                    request.employee_request_count,
                    request.start_date,
                    request.end_date,
                    request.is_ongoing,
                    request.location,
                    request.pay_rate
                ]);
            }
        }

        await pool.query('COMMIT');
        return contractResult.rows[0];
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error creating contract request:', error);
        throw error;
    }
};

export const getContractRequests = async (main_company_id: number) => {
    try {
        // Adjusted query to join with employee_requests and sum up employee counts
        const query = `
            SELECT comp.company_id, comp.company_name,
                   c.contract_id,
                   SUM(er.employee_request_count) as total_employee_requests,
                   c.contract_description, c.status as contract_status
            FROM contracts c
            JOIN companies comp ON c.subcontractor_company_id = comp.company_id
            LEFT JOIN employee_requests er ON c.contract_id = er.contract_id
            WHERE c.main_company_id = $1
            GROUP BY c.contract_id, comp.company_id
            ORDER BY comp.company_name;
        `;
        const result = await pool.query(query, [main_company_id]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching contract requests:', error);
        throw error;
    }
};

export const getContractById = async (contractId: number) => {
    const contractQuery = `
        SELECT contracts.*, companies.company_name
        FROM contracts
        JOIN companies ON contracts.subcontractor_company_id = companies.company_id
        WHERE contracts.contract_id = $1;
    `;

    const employeeRequestsQuery = `
        SELECT *
        FROM employee_requests
        WHERE contract_id = $1;
    `;

    try {
        const contractResult = await pool.query(contractQuery, [contractId]);
        const employeeRequestsResult = await pool.query(employeeRequestsQuery, [contractId]);

        if (contractResult.rows.length) {
            const contract = contractResult.rows[0];
            contract.employee_requests = employeeRequestsResult.rows;
            return contract;
        }
        return null; // Return null if contract is not found
    } catch (error) {
        console.error('Error fetching contract by ID:', error);
        throw error;
    }
};

export const addEmployeeRequest = async (
    contractId: number,
    employeeRequests: number,
    startDate: Date,
    endDate: Date | null,
    isOngoing: boolean,
    location: string,
    payRate: number
) => {
    try {
        await pool.query('BEGIN');

        const insertEmployeeRequest = `
            INSERT INTO employee_requests (
                contract_id, 
                employee_request_count,
                start_date,
                end_date,
                is_ongoing,
                location,
                pay_rate,
                request_date, 
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_TIMESTAMP)
            RETURNING request_id;
        `;

        const result = await pool.query(insertEmployeeRequest, [
            contractId,
            employeeRequests,
            startDate,
            endDate, 
            isOngoing,
            location,
            payRate,
        ]);

        await pool.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Failed to add employee request:', error);
        throw error;
    }
};

export const getApplicantsByRequestId = async (requestId: number) => {
    try {
        const query = `
            SELECT 
                ce.applicant_id,
                a.first_name, 
                a.middle_name, 
                a.last_name, 
                a.email, 
                a.phone
            FROM contract_employees ce
            JOIN applicants a ON ce.applicant_id = a.applicant_id
            WHERE ce.request_id = $1;
        `;
        const result = await pool.query(query, [requestId]);
        return result.rows;
    } catch (error) {
        console.error('Failed to fetch applicants:', error);
        throw error;
    }
};
