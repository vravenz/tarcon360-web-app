import pool from '../../config/database';

export const createApplicantAndApplication = async (
    company_id: number, 
    contract_id: number | null,
    job_id: number | null,
    request_id: number | null, 
    first_name: string, 
    middle_name: string, 
    last_name: string, 
    email: string, 
    gender: string, 
    date_of_birth: string,
    phone: string | null, 
    second_phone: string | null, 
    ni_number: string, 
    ebds_number: string, 
    next_of_kin: string,
    next_of_kin_contact_no: string, 
    nationality: string,
    relationship_status: string,
    sia_licence: string | null,
    licence_type: string | null,
    licence_expiry: string | null,
    sia_not_required: boolean,
    additional_sia_licence: string | null,
    additional_licence_type: string | null,
    additional_licence_expiry: string | null,
    pwva_trained: boolean,
    employee_photo: string | null,
    leisure: string | null,
    leisure_interests: string | null,
    criminal_record: string | null,
    criminal_record_details: string | null,
    submitted_by_subcontractor: boolean,
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const insertApplicant = `
            INSERT INTO applicants (
                company_id, first_name, middle_name, last_name, email, gender, date_of_birth, phone, second_phone, 
                ni_number, ebds_number, next_of_kin, next_of_kin_contact_no, nationality, relationship_status, 
                sia_licence, licence_type, licence_expiry, sia_not_required, additional_sia_licence, 
                additional_licence_type, additional_licence_expiry, pwva_trained, employee_photo, leisure, leisure_interests,
                criminal_record, criminal_record_details
            )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28) RETURNING applicant_id;
            `;
        const params = [
            company_id, first_name, middle_name, last_name, email, gender, date_of_birth, phone, second_phone, 
            ni_number, ebds_number, next_of_kin, next_of_kin_contact_no, nationality, relationship_status, 
            sia_licence, licence_type, licence_expiry, sia_not_required, additional_sia_licence,
            additional_licence_type, additional_licence_expiry, pwva_trained, employee_photo, leisure, leisure_interests,
            criminal_record, criminal_record_details
        ];
        const applicantResult = await client.query(insertApplicant, params);
        const applicant_id = applicantResult.rows[0].applicant_id;

        // Insert application into the applications table
        const insertApplication = `
                INSERT INTO applications (job_id, applicant_id, application_status, submitted_by_subcontractor)
                VALUES ($1, $2, 'Submitted', $3) RETURNING *;
            `;
            const applicationResult = await client.query(insertApplication, [
                job_id, // Can be null
                applicant_id,
                submitted_by_subcontractor // True for subcontractor submissions
            ]);

             // Conditionally insert into contract_employees if submitted by a subcontractor
             if (submitted_by_subcontractor && contract_id && request_id !== undefined) {
                const insertContractEmployee = `
                    INSERT INTO contract_employees (contract_id, applicant_id, request_id, assigned_date, status)
                    VALUES ($1, $2, $3, CURRENT_DATE, 'Pending');
                `;
                await client.query(insertContractEmployee, [contract_id, applicant_id, request_id]);
            }

            await client.query('COMMIT');
            return {
                applicant: applicantResult.rows[0],
                application: applicationResult.rows[0]
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Find Applications
export const findApplicationsByCompanyId = async (companyId: number) => {
    const query = `
        SELECT applications.*, jobs.title AS job_title, applicants.first_name, applicants.middle_name, applicants.last_name, applicants.employee_photo,
               job_offers.status AS offer_status
        FROM applications
        LEFT JOIN jobs ON applications.job_id = jobs.job_id
        LEFT JOIN applicants ON applications.applicant_id = applicants.applicant_id
        LEFT JOIN job_offers ON applications.application_id = job_offers.application_id
        WHERE jobs.company_id = $1;
    `;
    const { rows } = await pool.query(query, [companyId]);
    return rows;
};

export const findApplicationById = async (applicationId: number) => {
    const query = `
        SELECT applicants.*, applications.*, jobs.title AS job_title, jobs.description
        FROM applications
        JOIN jobs ON applications.job_id = jobs.job_id
        JOIN applicants ON applications.applicant_id = applicants.applicant_id
        WHERE applications.application_id = $1;
    `;
    const { rows } = await pool.query(query, [applicationId]);
    return rows[0];
};


export const findShortlistedApplicationsByCompanyId = async (companyId: number) => {
    const query = `
        SELECT applicants.*, applications.*, jobs.title AS job_title
        FROM applications
        JOIN jobs ON applications.job_id = jobs.job_id
        JOIN applicants ON applications.applicant_id = applicants.applicant_id
        WHERE jobs.company_id = $1 AND applications.application_status = 'Shortlisted';
    `;
    const { rows } = await pool.query(query, [companyId]);
    return rows;
};

export const findPassedApplicantsByCompanyId = async (companyId: number) => {
    try {
        const query = `
            SELECT a.application_id, ap.first_name, ap.last_name, ap.email
            FROM applications a
            JOIN applicants ap ON a.applicant_id = ap.applicant_id
            WHERE ap.company_id = $1 AND a.application_status = 'Passed';
        `;
        const { rows } = await pool.query(query, [companyId]);
        return rows;
    } catch (error) {
        console.error("Error in findPassedApplicantsByCompanyId:", error); // Log the error
        throw error; // Rethrow to let the controller handle it
    }
};

// Update Application Status
export const updateApplicationStatus = async (applicationId: number, status: string) => {
    const query = `
        UPDATE applications
        SET application_status = $1
        WHERE application_id = $2
        RETURNING *;
    `;
    const values = [status, applicationId];
    const result = await pool.query(query, values);
    return result.rows[0];
};


// Submit Applications by Admin or Staff
export const createApplicant = async (
    company_id: number, 
    first_name: string, 
    middle_name: string, 
    last_name: string, 
    email: string, 
    gender: string, 
    date_of_birth: string,
    phone: string | null, 
    second_phone: string | null, 
    ni_number: string, 
    ebds_number: string, 
    next_of_kin: string,
    next_of_kin_contact_no: string, 
    nationality: string,
    relationship_status: string,
    sia_licence: string | null,
    licence_type: string | null,
    licence_expiry: string | null,
    sia_not_required: boolean,
    additional_sia_licence: string | null,
    additional_licence_type: string | null,
    additional_licence_expiry: string | null,
    pwva_trained: boolean,
    employee_photo: string | null,
    leisure: string | null,
    leisure_interests: string | null,
    criminal_record: string | null,
    criminal_record_details: string | null
) => {
    const client = await pool.connect();
    try {
        const insertApplicant = `
            INSERT INTO applicants (
                company_id, first_name, middle_name, last_name, email, gender, date_of_birth, phone, second_phone, 
                ni_number, ebds_number, next_of_kin, next_of_kin_contact_no, nationality, relationship_status, 
                sia_licence, licence_type, licence_expiry, sia_not_required, additional_sia_licence, 
                additional_licence_type, additional_licence_expiry, pwva_trained, employee_photo, leisure, leisure_interests,
                criminal_record, criminal_record_details
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28) RETURNING applicant_id;
        `;
        const params = [
            company_id, first_name, middle_name, last_name, email, gender, date_of_birth, phone, second_phone, 
            ni_number, ebds_number, next_of_kin, next_of_kin_contact_no, nationality, relationship_status, 
            sia_licence, licence_type, licence_expiry, sia_not_required, additional_sia_licence,
            additional_licence_type, additional_licence_expiry, pwva_trained, employee_photo, leisure, leisure_interests,
            criminal_record, criminal_record_details
        ];
        const applicantResult = await client.query(insertApplicant, params);
        return applicantResult.rows[0];
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
};

export const createApplication = async (job_id: number, applicant_id: number) => {
    const client = await pool.connect();
    try {
        const insertApplication = `
            INSERT INTO applications (job_id, applicant_id, application_status)
            VALUES ($1, $2, 'Submitted') RETURNING *;
        `;
        const applicationResult = await client.query(insertApplication, [job_id, applicant_id]);
        return applicationResult.rows[0];
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
};