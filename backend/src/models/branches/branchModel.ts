import { getPool } from "../../config/database"
const pool = getPool()

export const getAllBranches = async () => {
    try {
        const result = await pool.query('SELECT * FROM branches');
        return result.rows;
    } catch (error: any) {
        throw new Error(`Error fetching branches: ${error.message}`);
    }
};
