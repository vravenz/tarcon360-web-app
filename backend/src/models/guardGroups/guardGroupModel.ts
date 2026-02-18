// models/guardGroupModel.ts
import pool from '../../config/database';

// Define the interface for GuardGroup
interface GuardGroup {
    group_name: string;
    branch_id: number;
    created_by: number;
    company_id: number;
}

// Define the interface for GuardGroupMember
export interface GuardGroupMember {
    group_id: number;
    applicant_id: number;
    employee_photo: string | null;
}

// Function to check if a group already exists
export const checkIfGroupExists = async (group_name: string, branch_id: number): Promise<boolean> => {
    const query = `
        SELECT COUNT(*) 
        FROM public.guard_groups 
        WHERE group_name = $1 AND branch_id = $2;
    `;
    try {
        const { rows } = await pool.query(query, [group_name, branch_id]);
        return rows[0].count > 0; // If count is greater than 0, the group exists
    } catch (error: any) {
        console.error('Error checking if group exists:', error);
        throw new Error('Error checking if group exists: ' + error.message);
    }
};

// Function to create a guard group
export const createGuardGroup = async (guardGroup: GuardGroup): Promise<any> => {
    const { group_name, branch_id, created_by, company_id } = guardGroup;

    // Check if the group already exists
    const groupExists = await checkIfGroupExists(group_name, branch_id);
    if (groupExists) {
        throw new Error('Group already exists');
    }

    const query = `
        INSERT INTO public.guard_groups (group_name, branch_id, created_by, company_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    try {
        const { rows } = await pool.query(query, [group_name, branch_id, created_by, company_id]);
        return rows[0];
    } catch (error: any) {
        console.error('Error creating guard group:', error);
        throw new Error('Error creating guard group: ' + error.message);
    }
};

// Function to fetch groups by company ID
export const fetchGroupsByCompanyId = async (company_id: number): Promise<GuardGroup[]> => {
    const query = `
        SELECT * 
        FROM public.guard_groups
        WHERE company_id = $1
        ORDER BY created_at DESC;
    `;
    try {
        const { rows } = await pool.query(query, [company_id]);
        return rows;
    } catch (error: any) {
        console.error('Error fetching groups:', error);
        throw new Error('Error fetching groups: ' + error.message);
    }
};

// Function to add multiple guards to a guard group
export const addGuardsToGroup = async (group_id: number, applicant_ids: number[]): Promise<any[]> => {
    const query = `
        INSERT INTO public.guard_group_members (group_id, applicant_id)
        VALUES ($1, $2)
        RETURNING *;
    `;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];

        // Insert each applicant ID into the guard group
        for (const applicant_id of applicant_ids) {
            const { rows } = await client.query(query, [group_id, applicant_id]);
            results.push(rows[0]);
        }

        await client.query('COMMIT');
        return results;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error adding guards to group:', error);
        throw new Error('Error adding guards to group: ' + error.message);
    } finally {
        client.release();
    }
};

// Function to fetch guards in a specific group
export const fetchGuardsInGroup = async (group_id: number): Promise<any[]> => {
    const query = `
        SELECT 
            ggm.group_id,
            ggm.applicant_id,
            a.first_name,
            a.middle_name,
            a.last_name,
            a.email,
            a.phone,
            a.employee_photo,        
            u.is_subcontractor_employee,
            CASE 
              WHEN u.is_subcontractor_employee THEN u.company_id 
              ELSE u.current_assigned_company_id 
            END AS subcontractor_company_id,
            c.company_name AS subcontractor_company_name
        FROM public.guard_group_members ggm
        JOIN applicants a ON ggm.applicant_id = a.applicant_id
        JOIN users u ON a.applicant_id = u.applicant_id
        LEFT JOIN companies c 
          ON (CASE 
                WHEN u.is_subcontractor_employee THEN u.company_id 
                ELSE u.current_assigned_company_id 
              END) = c.company_id
        WHERE ggm.group_id = $1;
    `;

    try {
        const { rows } = await pool.query(query, [group_id]);
        return rows;
    } catch (error: any) {
        console.error('Error fetching guards in group:', error);
        throw new Error('Error fetching guards in group: ' + error.message);
    }
};

// Function to remove a guard from a group
export const removeGuardFromGroup = async (group_id: number, applicant_id: number): Promise<any> => {
    const query = `
        DELETE FROM public.guard_group_members
        WHERE group_id = $1 AND applicant_id = $2
        RETURNING *;
    `;
    try {
        const { rows } = await pool.query(query, [group_id, applicant_id]);
        return rows[0];
    } catch (error: any) {
        console.error('Error removing guard from group:', error);
        throw new Error('Error removing guard from group: ' + error.message);
    }
};