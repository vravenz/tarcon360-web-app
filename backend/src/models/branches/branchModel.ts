import pool from '../../config/database';

export const getAllBranches = async () => {
    try {
        const result = await pool.query('SELECT * FROM branches');
        return result.rows;
    } catch (error: any) {
        throw new Error(`Error fetching branches: ${error.message}`);
    }
};
