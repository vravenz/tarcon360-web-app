import express from 'express';
import { fetchContractRequestsReceivedBySubcontractor, fetchContractDetails, fetchEmployeeRequests, fetchEmployeeRequest, updateEmployeeRequestStatus, fetchApplicationsForRequest } from '../controllers/subcontractor/subcontractorCompany';

const router = express.Router();

// Fetch contract requests received by a subcontractor
router.get('/requests/received/:subcontractor_company_id', fetchContractRequestsReceivedBySubcontractor);

// Fetch detailed information for a specific contract
router.get('/contract/:contractId', fetchContractDetails);

// Route to get employee requests by contract ID
router.get('/employee-requests/:contractId', fetchEmployeeRequests);

router.get('/employee-request/:requestId', fetchEmployeeRequest);

// New route for updating the approval status of an employee request
router.patch('/employee-request/update-status/:requestId', updateEmployeeRequestStatus);

// Add this route in your existing router setup
router.get('/applications/request/:requestId', fetchApplicationsForRequest);

export default router;
