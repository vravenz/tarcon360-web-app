// File: routes/roasterRoutes.ts

import express from 'express';
import {
  createRoster,
  getRosters,
  getRosterDetails,
  updateRosterDetails,
  removeRoster,
  getRosterShiftDetails,
  getShiftAssignments,
  getRosterEmployeeDetails,
  updateRosterShiftAssignment,
  removeRosterShiftAssignmentController,
  updateRosterShiftDetails,
  createRosterShiftAssignment,
  createSingleRosterEmployee,
  getDetailedRosterView
} from '../controllers/roster/rosterController';
import { listRosterAssignments } from '../controllers/roster/assignmentListController';


const router = express.Router();

router.post('/rosters', createRoster);
router.get('/rosters', getRosters);
router.get('/rosters/:id', getRosterDetails);
router.put('/rosters/:id', updateRosterDetails);
router.delete('/rosters/:id', removeRoster);

router.get('/rostershifts/:id', getRosterShiftDetails);
router.get('/rostershiftassignments/shift/:id', getShiftAssignments);
router.put('/rostershiftassignments/:id', updateRosterShiftAssignment);
router.delete('/rostershiftassignments/:id', removeRosterShiftAssignmentController);
router.put('/rostershifts/:id', updateRosterShiftDetails);

router.post('/rostershiftassignments', createRosterShiftAssignment);

router.get('/rosters/:id/detailed', getDetailedRosterView);

router.get('/rosteremployees/:id', getRosterEmployeeDetails);

router.post('/rosteremployees', createSingleRosterEmployee);

router.get('/roster/assignments', listRosterAssignments);

export default router;
