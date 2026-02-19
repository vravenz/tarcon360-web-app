import pool from '../../config/database';

export const getEmployeesWithDetails = async (companyId: number): Promise<any[]> => {
    const query = `
        SELECT 
            u.email,
            u.is_active,
            u.is_subcontractor_employee,
            a.employee_photo,
            a.applicant_id,
            a.first_name,
            a.middle_name,
            a.last_name,
            a.phone,
            j.role_offered,
            j.offered_on,
            j.signed_on
        FROM users u
        JOIN applicants a ON u.applicant_id = a.applicant_id
        JOIN applications app ON a.applicant_id = app.applicant_id
        LEFT JOIN job_offers j ON app.application_id = j.application_id
        WHERE
        (
            (u.is_subcontractor_employee = true AND u.current_assigned_company_id = $1)
            OR (u.is_subcontractor_employee = false AND u.company_id = $1)
        )
        AND u.is_main_user = false 
        AND u.is_deleted = false 
        AND u.is_dormant = false 
        AND (
            u.is_subcontractor_employee = true 
            OR j.status = 'Accepted'
        );
    `;
    try {
        const { rows } = await pool.query(query, [companyId]);
        return rows;
    } catch (error: any) {
        throw new Error('Error fetching employees with details: ' + error.message);
    }
};

export const getEmployeeDetail = async (applicantId: number): Promise<any> => {
    const query = `
        SELECT 
            u.email, 
            u.is_subcontractor_employee,
            a.*, 
            j.*, 
            app.*
        FROM users u
        JOIN applicants a ON u.applicant_id = a.applicant_id
        JOIN applications app ON a.applicant_id = app.applicant_id
        LEFT JOIN job_offers j ON app.application_id = j.application_id
        WHERE a.applicant_id = $1 
          AND u.is_deleted = false 
          AND u.is_dormant = false;
    `;

    try {
        const { rows } = await pool.query(query, [applicantId]);
        return rows[0];  // Assuming a single detailed view per applicant
    } catch (error: any) {
        throw new Error('Error fetching employee detail: ' + error.message);
    }
};

export const updateEmployeeDetail = async (applicantId: number, employeeData: any): Promise<any> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const {
            email, first_name, middle_name, last_name, gender, date_of_birth, phone, second_phone,
            ni_number, ebds_number, next_of_kin, next_of_kin_contact_no, nationality, relationship_status,
            sia_licence, licence_type, licence_expiry, sia_not_required, additional_sia_licence,
            additional_licence_type, additional_licence_expiry, pwva_trained, leisure, leisure_interests,
            criminal_record, criminal_record_details,
            is_subcontractor_employee  // optionally include if updating subcontractor status
        } = employeeData;

        // Update applicants table
        const updateApplicantsQuery = `
            UPDATE applicants
            SET
                first_name = $1,
                middle_name = $2,
                last_name = $3,
                email = $4,
                gender = $5,
                date_of_birth = $6,
                phone = $7,
                second_phone = $8,
                ni_number = $9,
                ebds_number = $10,
                next_of_kin = $11,
                next_of_kin_contact_no = $12,
                nationality = $13,
                relationship_status = $14,
                sia_licence = $15,
                licence_type = $16,
                licence_expiry = $17,
                sia_not_required = $18,
                additional_sia_licence = $19,
                additional_licence_type = $20,
                additional_licence_expiry = $21,
                pwva_trained = $22,
                leisure = $23,
                leisure_interests = $24,
                criminal_record = $25,
                criminal_record_details = $26
            WHERE applicant_id = $27
            RETURNING *;
        `;
        const applicantParams = [
            first_name, middle_name, last_name, email, gender, date_of_birth, phone, second_phone,
            ni_number, ebds_number, next_of_kin, next_of_kin_contact_no, nationality, relationship_status,
            sia_licence, licence_type, licence_expiry, sia_not_required, additional_sia_licence,
            additional_licence_type, additional_licence_expiry, pwva_trained, leisure, leisure_interests,
            criminal_record, criminal_record_details, applicantId
        ];
        const applicantResult = await client.query(updateApplicantsQuery, applicantParams);

        // Update users table including is_subcontractor_employee if provided
        const updateUsersQuery = `
            UPDATE users
            SET 
                email = $1,
                is_subcontractor_employee = COALESCE($2, is_subcontractor_employee)
            WHERE applicant_id = $3
            RETURNING *;
        `;
        const userResult = await client.query(updateUsersQuery, [
            email, 
            is_subcontractor_employee, 
            applicantId
        ]);

        await client.query('COMMIT');

        return {
            applicant: applicantResult.rows[0],
            user: userResult.rows[0]
        };
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error("Failed to update employee detail:", error);
        throw new Error('Error updating employee detail: ' + error.message);
    } finally {
        client.release();
    }
};

export const markEmployeeAsDeleted = async (applicantId: number) => {
    const query = `
        UPDATE users
        SET is_deleted = true
        WHERE applicant_id = $1
        RETURNING *;
    `;

    try {
        const { rows } = await pool.query(query, [applicantId]);
        return rows[0];  // Assuming you want to return the updated row for verification
    } catch (error: any) {
        console.error("Failed to mark employee as deleted:", error);
        throw new Error('Error marking employee as deleted: ' + error.message);
    }
};

export const getDeletedEmployeesWithDetails = async (companyId: number): Promise<any[]> => {
    const query = `
        SELECT 
            u.email, 
            u.is_active,
            u.is_subcontractor_employee,
            a.employee_photo,
            a.applicant_id,
            a.first_name, 
            a.middle_name, 
            a.last_name, 
            a.phone, 
            j.role_offered, 
            j.offered_on, 
            j.signed_on
        FROM users u
        JOIN applicants a ON u.applicant_id = a.applicant_id
        JOIN applications app ON a.applicant_id = app.applicant_id
        LEFT JOIN job_offers j ON app.application_id = j.application_id
        WHERE
        (
            (u.is_subcontractor_employee = true AND u.current_assigned_company_id = $1)
            OR (u.is_subcontractor_employee = false AND u.company_id = $1)
        )
        AND u.is_main_user = false 
        AND u.is_deleted = true 
        AND (
            u.is_subcontractor_employee = true 
            OR j.status = 'Accepted'
        );
    `;
    try {
        const { rows } = await pool.query(query, [companyId]);
        return rows;
    } catch (error: any) {
        throw new Error('Error fetching deleted employees with details: ' + error.message);
    }
};

export const restoreEmployee = async (applicantId: number) => {
    const query = `
        UPDATE users
        SET is_deleted = false
        WHERE applicant_id = $1
        RETURNING *;
    `;

    try {
        const { rows } = await pool.query(query, [applicantId]);
        return rows[0];  // Return the restored employee for verification
    } catch (error: any) {
        console.error("Failed to restore employee:", error);
        throw new Error('Error restoring employee: ' + error.message);
    }
};

export const setEmployeeDormant = async (applicantId: number, dormant: boolean) => {
    const query = `
        UPDATE users
        SET is_dormant = $2
        WHERE applicant_id = $1
        RETURNING *;
    `;

    try {
        const { rows } = await pool.query(query, [applicantId, dormant]);
        return rows[0];
    } catch (error: any) {
        console.error("Failed to update employee status:", error);
        throw new Error('Error updating employee status: ' + error.message);
    }
};

export const getDormantEmployeesWithDetails = async (companyId: number): Promise<any[]> => {
    const query = `
        SELECT 
            u.email, 
            u.is_active,
            u.is_subcontractor_employee,
            a.employee_photo,
            a.applicant_id,
            a.first_name, 
            a.middle_name, 
            a.last_name, 
            a.phone, 
            j.role_offered, 
            j.offered_on, 
            j.signed_on
        FROM users u
        JOIN applicants a ON u.applicant_id = a.applicant_id
        JOIN applications app ON a.applicant_id = app.applicant_id
        LEFT JOIN job_offers j ON app.application_id = j.application_id
        WHERE
        (
            (u.is_subcontractor_employee = true AND u.current_assigned_company_id = $1)
            OR (u.is_subcontractor_employee = false AND u.company_id = $1)
        )
        AND u.is_main_user = false 
        AND u.is_deleted = false 
        AND u.is_dormant = true 
        AND (
            u.is_subcontractor_employee = true 
            OR j.status = 'Accepted'
        );
    `;
    try {
        const { rows } = await pool.query(query, [companyId]);
        return rows;
    } catch (error: any) {
        throw new Error('Error fetching dormant employees with details: ' + error.message);
    }
};

export const getDirectEmployees = async (companyId: number): Promise<any[]> => {
    const query = `
        SELECT 
            u.email,
            u.is_active,
            u.is_subcontractor_employee,
            a.employee_photo,
            a.applicant_id,
            a.first_name,
            a.middle_name,
            a.last_name,
            a.phone,
            j.role_offered,
            j.offered_on,
            j.signed_on
        FROM users u
        JOIN applicants a ON u.applicant_id = a.applicant_id
        JOIN applications app ON a.applicant_id = app.applicant_id
        LEFT JOIN job_offers j ON app.application_id = j.application_id
        WHERE 
            u.is_subcontractor_employee = false 
            AND u.company_id = $1
            AND u.is_main_user = false 
            AND u.is_deleted = false 
            AND u.is_dormant = false 
            AND j.status = 'Accepted';
    `;
    try {
        const { rows } = await pool.query(query, [companyId]);
        return rows;
    } catch (error: any) {
        throw new Error('Error fetching direct employees: ' + error.message);
    }
};


export const getSubcontractorEmployees = async (companyId: number): Promise<any[]> => {
    const query = `
        SELECT 
            u.email,
            u.is_active,
            u.is_subcontractor_employee,
            a.employee_photo,
            a.applicant_id,
            a.first_name,
            a.middle_name,
            a.last_name,
            a.phone
            -- Note: Skipping job_offers joins, as subcontractors may not have job offers.
        FROM users u
        JOIN applicants a ON u.applicant_id = a.applicant_id
        WHERE 
            u.is_subcontractor_employee = true 
            AND u.current_assigned_company_id = $1
            AND u.is_main_user = false 
            AND u.is_deleted = false 
            AND u.is_dormant = false;
    `;
    try {
        const { rows } = await pool.query(query, [companyId]);
        return rows;
    } catch (error: any) {
        throw new Error('Error fetching subcontractor employees: ' + error.message);
    }
};
