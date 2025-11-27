// src/utils/checkRole.tsx

export const isSuperAdmin = (): boolean => {
    return checkRole('Super Admin');
};

export const isAdmin = (): boolean => {
    return checkRole('Admin');
};

export const isStaff = (): boolean => {
    return checkRole('Staff');
};

// A helper function to consolidate role checking logic
const checkRole = (roleName: string): boolean => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return false;

        const userData = JSON.parse(userStr);
        
        return userData.user && userData.user.role === roleName;
    } catch (error) {
        console.error(`Failed to parse user data from localStorage:`, error);
        return false;  
    }
};
