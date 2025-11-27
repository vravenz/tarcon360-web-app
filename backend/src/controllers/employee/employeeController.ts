import { Request, Response } from 'express';
import * as EmployeeModel from '../../models/employees/employeeModel';

export const fetchEmployees = async (req: Request, res: Response): Promise<void> => {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
        res.status(400).json({ error: "Invalid company ID" });
        return;
    }

    try {
        const employees = await EmployeeModel.getEmployeesWithDetails(companyId);
        res.json(employees);
    } catch (error: any) {
        console.error("Failed to fetch employees:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const fetchEmployeeDetail = async (req: Request, res: Response): Promise<void> => {
    const applicantId = parseInt(req.params.applicantId);
    if (isNaN(applicantId)) {
        res.status(400).json({ error: "Invalid applicant ID" });
        return;
    }

    try {
        const employeeDetail = await EmployeeModel.getEmployeeDetail(applicantId);
        res.json(employeeDetail);
    } catch (error: any) {
        console.error("Failed to fetch employee detail:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const updateEmployeeDetail = async (req: Request, res: Response): Promise<void> => {
    const applicantId = parseInt(req.params.applicantId);
    const employeeData = req.body;

    if (isNaN(applicantId)) {
        res.status(400).json({ error: "Invalid applicant ID" });
        return;
    }

    try {
        const updatedData = await EmployeeModel.updateEmployeeDetail(applicantId, employeeData);
        res.json({ message: "Employee updated successfully", data: updatedData });
    } catch (error: any) {
        console.error("Failed to update employee detail:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
    const applicantId = parseInt(req.params.applicantId);

    if (isNaN(applicantId)) {
        res.status(400).json({ error: "Invalid applicant ID" });
        return;
    }

    try {
        const deletedEmployee = await EmployeeModel.markEmployeeAsDeleted(applicantId);
        res.json({ message: "Employee marked as deleted successfully", data: deletedEmployee });
    } catch (error: any) {
        console.error("Failed to delete employee:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const fetchDeletedEmployees = async (req: Request, res: Response): Promise<void> => {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
        res.status(400).json({ error: "Invalid company ID" });
        return;
    }

    try {
        const employees = await EmployeeModel.getDeletedEmployeesWithDetails(companyId);
        res.json(employees);
    } catch (error: any) {
        console.error("Failed to fetch deleted employees:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const restoreEmployeeDetail = async (req: Request, res: Response): Promise<void> => {
    const applicantId = parseInt(req.params.applicantId);
    if (isNaN(applicantId)) {
        res.status(400).json({ error: "Invalid applicant ID" });
        return;
    }

    try {
        const restoredEmployee = await EmployeeModel.restoreEmployee(applicantId);
        res.json({ message: "Employee restored successfully", data: restoredEmployee });
    } catch (error: any) {
        console.error("Failed to restore employee:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const updateEmployeeDormantStatus = async (req: Request, res: Response): Promise<void> => {
    const applicantId = parseInt(req.params.applicantId);
    const { dormant } = req.body;

    console.log("Applicant ID:", applicantId);
    console.log("Dormant status:", dormant);

    if (isNaN(applicantId) || dormant === undefined) {
        res.status(400).json({ error: "Invalid parameters" });
        return;
    }

    try {
        const updatedEmployee = await EmployeeModel.setEmployeeDormant(applicantId, dormant);
        console.log("Updated Employee:", updatedEmployee);
        res.json({ message: "Employee status updated successfully", data: updatedEmployee });
    } catch (error: any) {
        console.error("Failed to update employee status:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};


export const fetchDormantEmployees = async (req: Request, res: Response): Promise<void> => {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
        res.status(400).json({ error: "Invalid company ID" });
        return;
    }

    try {
        const employees = await EmployeeModel.getDormantEmployeesWithDetails(companyId);
        res.json(employees);
    } catch (error: any) {
        console.error("Failed to fetch dormant employees:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

// Fetch direct employees
export const fetchDirectEmployees = async (req: Request, res: Response): Promise<void> => {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
        res.status(400).json({ error: "Invalid company ID" });
        return;
    }

    try {
        const directEmployees = await EmployeeModel.getDirectEmployees(companyId);
        res.json(directEmployees);
    } catch (error: any) {
        console.error("Failed to fetch direct employees:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

// Fetch subcontractor employees
export const fetchSubcontractorEmployees = async (req: Request, res: Response): Promise<void> => {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
        res.status(400).json({ error: "Invalid company ID" });
        return;
    }

    try {
        const subcontractorEmployees = await EmployeeModel.getSubcontractorEmployees(companyId);
        res.json(subcontractorEmployees);
    } catch (error: any) {
        console.error("Failed to fetch subcontractor employees:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};