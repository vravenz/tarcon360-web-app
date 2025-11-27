import { Request, Response } from 'express';
import * as BranchModel from '../../models/branches/branchModel';

export const listAllBranches = async (req: Request, res: Response) => {
    try {
        const branches = await BranchModel.getAllBranches();
        res.json(branches);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch branches", error: error.message });
    }
};
