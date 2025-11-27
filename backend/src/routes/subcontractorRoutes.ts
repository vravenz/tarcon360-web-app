// src/routes/subcontractors.ts

import express from 'express';
import {
    searchSubcontractor,
    sendContractRequest,
    fetchContractRequests,
    fetchContractDetails,
    addEmployeeRequestHandler,
    getApplicantsByRequest,
    updateApplicantStatus
} from '../controllers/subcontractor/subcontractorController';
import { createSubcontractorAccount } from '../controllers/subcontractor/subcontractorCreate';

const router = express.Router();

router.get('/search', searchSubcontractor); // Search for a subcontractor by email
router.post('/request', sendContractRequest); // Endpoint to send a contract request
router.get('/requests/:main_company_id', fetchContractRequests); // Fetch contract requests by main company ID
router.get('/contract/:contractId', fetchContractDetails); // Fetch specific contract details by contract ID
router.post('/employee-request', addEmployeeRequestHandler); // Endpoint to add a new employee request
// New route for fetching applicants by request ID
router.get('/requests/:requestId/applicants', getApplicantsByRequest);

router.post('/applicant-status-update', updateApplicantStatus);

router.post('/create', createSubcontractorAccount); // Create a new subcontractor account

export default router;
