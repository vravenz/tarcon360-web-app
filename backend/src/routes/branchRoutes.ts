import express from 'express';
import * as BranchController from '../controllers/branches/branchController';

const router = express.Router();

router.get('/', BranchController.listAllBranches);

export default router;
