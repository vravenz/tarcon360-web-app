import { getPool } from "../../config/database"
const pool = () => getPool()

interface User {
  id?: number;
  first_name?: string;
  last_name?: string;
  email: string;
  password?: string;
  role?: string;
  role_id?: number; 
  company_id: number;
  user_pin?: string;
  is_main_user: boolean;
  is_active?: boolean;
  is_dormant?: boolean;
  applicant_id?: number;
  is_deleted?: boolean;
  branch_id?: number;
  branch_name?: string; 
  is_subcontractor_employee?: boolean;
  is_subcontractor: boolean;
  company_is_subcontractor?: boolean;
}

// Generate a unique 5-digit user PIN
const generateUserPin = async (): Promise<string> => {
  let pin: string;
  let exists = true;
  do {
    pin = Math.floor(10000 + Math.random() * 90000).toString();
    const result = await pool().query('SELECT 1 FROM users WHERE user_pin = $1', [pin]);
    exists = result.rows.length > 0;
  } while (exists);
  return pin;
};

export const createUser = async (
  email: string,
  password: string,
  companyId: number,
  roleName: string,
  isMainUser: boolean,
  applicantId: number | null = null,
  isActive: boolean = true,
  isDeleted: boolean = false,
  isDormant: boolean = false,
  isSubcontractorEmployee: boolean = false,
  isSubcontractor: boolean = false,
  branchId: number | null = null,
  currentAssignedCompanyId: number | null = null
): Promise<User> => {

   // Adjusting isMainUser based on isSubcontractor status
   isMainUser = isSubcontractor ? false : isMainUser;

  const roleQuery = await pool().query('SELECT role_id FROM roles WHERE role_name = $1', [roleName]);
  const roleId = roleQuery.rows.length > 0 ? roleQuery.rows[0].role_id : null;
  if (!roleId) {
    throw new Error(`Role '${roleName}' not found in roles table`);
  }

  // Only fetch default branch ID if not provided
  if (branchId === null) {
    const branchQuery = await pool().query('SELECT branch_id FROM branches WHERE branch_name = $1', ['Head Office']);
    branchId = branchQuery.rows.length > 0 ? branchQuery.rows[0].branch_id : null;
    if (!branchId) {
      throw new Error('Default branch "Head Office" not found in branches table. Please ensure the branch is created first.');
    }
  }

  const userPin = await generateUserPin();
  const result = await pool().query(
    'INSERT INTO users (email, password, role_id, company_id, user_pin, is_main_user, is_active, is_dormant, applicant_id, is_subcontractor_employee, is_subcontractor, is_deleted, branch_id, current_assigned_company_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
    [email, password, roleId, companyId, userPin, isMainUser, isActive, isDormant, applicantId, isSubcontractorEmployee, isSubcontractor, isDeleted, branchId, currentAssignedCompanyId]
  );
  
  return result.rows[0];
};

export const findUserByEmailOrPin = async (identifier: string): Promise<User | null> => {
  const query = `
      SELECT 
        u.id, 
        u.email, 
        u.password, 
        u.role_id,                -- <-- add this
        r.role_name as role, 
        u.company_id, 
        u.user_pin, 
        u.is_active,
        u.is_dormant,
        u.is_deleted,
        u.is_subcontractor,
        u.is_subcontractor_employee,
        u.branch_id, 
        b.branch_name,
        c.is_subcontractor as company_is_subcontractor
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN branches b ON u.branch_id = b.branch_id
      LEFT JOIN companies c ON u.company_id = c.company_id
      WHERE (u.email = $1 OR u.user_pin::text = $1)
        AND u.is_deleted = false
      LIMIT 1
    `;
  const result = await pool().query(query, [identifier]);
  return result.rows.length > 0 ? result.rows[0] : null;
};
