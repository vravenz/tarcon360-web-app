import pool from '../../config/database';

export interface Site {
    client_id: number;
    group_id: number;
    site_name: string;
    contact_person: string;
    contact_number: string;
    site_address: string; 
    post_code: string; 
    weekly_contracted_hours: number; 
    trained_guards_required: boolean;
    site_billable_rate_guarding: number;
    site_billable_rate_supervisor: number;
    site_payable_rate_guarding: number;
    site_payable_rate_supervisor: number;
    site_note: string;
    company_id: number; 
    is_mobile_allowed: boolean;
    site_latitude?: number | null;
    site_longitude?: number | null;
    site_radius?: number | null;
    site_group?: string;
}

// Insert Site
export const insertSite = async (site: Site): Promise<Site> => {
    const {
        client_id, group_id, site_name, contact_person, contact_number,
        site_address, post_code, weekly_contracted_hours, trained_guards_required,
        site_billable_rate_guarding, site_billable_rate_supervisor,
        site_payable_rate_guarding, site_payable_rate_supervisor, site_note,
        company_id , is_mobile_allowed, site_latitude, site_longitude, site_radius
    } = site;

    try {
        const query = `
            INSERT INTO sites (
                client_id, group_id, site_name, contact_person, contact_number,
                site_address, post_code, weekly_contracted_hours, trained_guards_required,
                site_billable_rate_guarding, site_billable_rate_supervisor,
                site_payable_rate_guarding, site_payable_rate_supervisor, site_note,
                company_id, is_mobile_allowed, site_latitude, site_longitude, site_radius
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *;
        `;
        const values = [
            client_id, group_id, site_name, contact_person, contact_number,
            site_address, post_code, weekly_contracted_hours, trained_guards_required,
            site_billable_rate_guarding, site_billable_rate_supervisor,
            site_payable_rate_guarding, site_payable_rate_supervisor, site_note,
            company_id, is_mobile_allowed,
            site_latitude,
            site_longitude,
            site_radius
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error inserting new site:', error);
        throw error;
    }
};

// Fetch Site Data
export const getSite = async (siteId: number): Promise<Site | null> => {
    try {
        const query = `
            SELECT 
                s.*, 
                csg.site_group_name AS site_group
            FROM sites s
            LEFT JOIN clients_site_groups csg ON s.group_id = csg.group_id
            WHERE s.site_id = $1;
        `;
        const result = await pool.query(query, [siteId]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching site data:', error);
        throw error;
    }
};

// Fetch All Sites
export const getAllSites = async (): Promise<Site[]> => {
    try {
        const query = `SELECT *, company_id FROM sites;`;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching all sites:', error);
        throw error;
    }
};

// Get Sites by client
export const getSitesByClient = async (clientId: number): Promise<Site[]> => {
    try {
        const query = `SELECT * FROM sites WHERE client_id = $1;`;
        const result = await pool.query(query, [clientId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching sites by client:', error);
        throw error;
    }
};