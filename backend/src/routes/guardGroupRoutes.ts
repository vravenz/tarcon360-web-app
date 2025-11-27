import express from 'express';
import * as GuardGroupController from '../controllers/guardGroups/guardGroupController';

const router = express.Router();

router.post('/guard-groups', GuardGroupController.createGuardGroup);

// Route to fetch groups by company ID
router.get('/guard-groups/:company_id', GuardGroupController.fetchGroupsByCompanyId);


// Route to add guards to a group
router.post('/guard-groups/add-guards', GuardGroupController.addGuardsToGroup);

router.get('/guard-groups/:group_id/guards', GuardGroupController.fetchGuardsInGroup);

router.delete('/guard-groups/remove-guard', GuardGroupController.removeGuardFromGroup);


export default router;
