// controllers/guardGroups/guardGroupController.ts
import { Request, Response } from 'express';
import * as GuardGroupModel from '../../models/guardGroups/guardGroupModel';

// Controller to create a guard group
export const createGuardGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { group_name, branch_id, created_by, company_id } = req.body;

        // Call the model function to create a guard group
        const newGuardGroup = await GuardGroupModel.createGuardGroup({
            group_name, 
            branch_id, 
            created_by, 
            company_id
        });
        res.status(201).json({ message: 'Guard group created successfully', data: newGuardGroup });
    } catch (error: any) {
        if (error.message === 'Group already exists') {
            res.status(400).json({ error: 'Group already exists' });
        } else {
            console.error('Failed to create guard group:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }
};

// Controller to fetch groups by company ID
export const fetchGroupsByCompanyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { company_id } = req.params;

        // Validate company_id
        if (!company_id || isNaN(Number(company_id))) {
            res.status(400).json({ error: 'Invalid company ID' });
            return;
        }

        const groups = await GuardGroupModel.fetchGroupsByCompanyId(Number(company_id));
        res.status(200).json(groups);
    } catch (error: any) {
        console.error('Failed to fetch groups:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Controller to add guards to a group
export const addGuardsToGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { group_id, applicant_ids } = req.body;

        // Validate input
        if (!group_id || !Array.isArray(applicant_ids) || applicant_ids.length === 0) {
            res.status(400).json({ error: 'Group ID and a list of Applicant IDs are required' });
            return;
        }

        // Call the model function to add guards to the group
        const addedGuards = await GuardGroupModel.addGuardsToGroup(group_id, applicant_ids);
        res.status(201).json({ message: 'Guards added to group successfully', data: addedGuards });
    } catch (error: any) {
        console.error('Failed to add guards to group:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};


// Controller to fetch guards in a specific group
export const fetchGuardsInGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { group_id } = req.params;

        // Validate group_id
        if (!group_id || isNaN(Number(group_id))) {
            res.status(400).json({ error: 'Invalid group ID' });
            return;
        }

        // Fetch guards in the group
        const guards = await GuardGroupModel.fetchGuardsInGroup(Number(group_id));
        res.status(200).json(guards);
    } catch (error: any) {
        console.error('Failed to fetch guards in group:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Controller to remove a guard from a group
export const removeGuardFromGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { group_id, applicant_id } = req.body;

        // Validate input
        if (!group_id || !applicant_id) {
            res.status(400).json({ error: 'Group ID and Applicant ID are required' });
            return;
        }

        // Call the model function to remove the guard
        const removedGuard = await GuardGroupModel.removeGuardFromGroup(Number(group_id), Number(applicant_id));
        if (!removedGuard) {
            res.status(404).json({ error: 'Guard not found in the group' });
            return;
        }

        res.status(200).json({ message: 'Guard removed from group successfully', data: removedGuard });
    } catch (error: any) {
        console.error('Failed to remove guard from group:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
