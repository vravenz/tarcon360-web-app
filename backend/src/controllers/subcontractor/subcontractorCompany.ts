import { Request, Response } from 'express';
import {
    getContractRequestsReceivedBySubcontractor,
    getContractById,
    getEmployeeRequestsByContractId,
    getEmployeeRequestById,
    updateEmployeeRequestApprovalStatus,
    getApplicationsByRequestId
} from '../../models/subcontractor/subcontractorCompany';

export const fetchContractRequestsReceivedBySubcontractor = async (req: Request, res: Response): Promise<void> => {
    const subcontractor_company_id = parseInt(req.params.subcontractor_company_id);
    if (isNaN(subcontractor_company_id)) {
        res.status(400).send('Invalid subcontractor company ID');
        return;
    }
    try {
        const requests = await getContractRequestsReceivedBySubcontractor(subcontractor_company_id);
        if (requests.length > 0) {
            res.json(requests);
        } else {
            res.status(404).send('No contract requests found');
        }
    } catch (error) {
        console.error('Error fetching contract requests:', error);
        res.status(500).send('Server error');
    }
};

export const fetchContractDetails = async (req: Request, res: Response): Promise<void> => {
    const contractId = parseInt(req.params.contractId);
    if (isNaN(contractId)) {
        res.status(400).send('Invalid contract ID');
        return;
    }
    try {
        const contractDetails = await getContractById(contractId);
        if (contractDetails) {
            res.json(contractDetails);
        } else {
            res.status(404).send('Contract not found');
        }
    } catch (error) {
        console.error('Error fetching contract details:', error);
        res.status(500).send('Server error');
    }
};

export const fetchEmployeeRequests = async (req: Request, res: Response): Promise<void> => {
    const contractId = parseInt(req.params.contractId);
    if (isNaN(contractId)) {
        res.status(400).send('Invalid contract ID');
        return;
    }

    try {
        const employeeRequests = await getEmployeeRequestsByContractId(contractId);
        if (employeeRequests.length > 0) {
            res.json(employeeRequests);
        } else {
            res.status(404).send('No employee requests found for this contract');
        }
    } catch (error) {
        console.error('Error fetching employee requests:', error);
        res.status(500).send('Server error');
    }
};

export const fetchEmployeeRequest = async (req: Request, res: Response): Promise<void> => {
    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) {
        res.status(400).send('Invalid request ID');
        return;
    }
    try {
        const employeeRequest = await getEmployeeRequestById(requestId);
        if (employeeRequest) {
            res.json(employeeRequest);
        } else {
            res.status(404).send('Employee request not found');
        }
    } catch (error) {
        console.error('Error fetching employee request:', error);
        res.status(500).send('Server error');
    }
};

// Controller function to update employee request approval status
export const updateEmployeeRequestStatus = async (req: Request, res: Response): Promise<void> => {
    const requestId = parseInt(req.params.requestId);
    const { new_approval_status } = req.body; // assuming the new status is sent in the request body

    if (isNaN(requestId) || !new_approval_status) {
        res.status(400).send('Invalid request ID or missing status');
        return;
    }

    try {
        const updatedRequest = await updateEmployeeRequestApprovalStatus(requestId, new_approval_status);
        if (updatedRequest) {
            res.json(updatedRequest);
        } else {
            res.status(404).send('Employee request not found');
        }
    } catch (error) {
        console.error('Error updating employee request status:', error);
        res.status(500).send('Server error');
    }
};


export const fetchApplicationsForRequest = async (req: Request, res: Response): Promise<void> => {
    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) {
        res.status(400).send('Invalid request ID');
        return;
    }
    try {
        const applications = await getApplicationsByRequestId(requestId);
        if (applications.length > 0) {
            res.json(applications);
        } else {
            res.status(404).send('No applications found for this request');
        }
    } catch (error) {
        console.error('Error fetching applications for request:', error);
        res.status(500).send('Server error');
    }
};
