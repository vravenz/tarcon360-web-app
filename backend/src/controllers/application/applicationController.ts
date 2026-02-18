import { Request, Response } from 'express';
import * as ApplicantModel from '../../models/application/applicantModel';

export const submitApplication = async (req: Request, res: Response) => {
    const {
        company_id, contract_id, job_id, request_id, first_name, middle_name, last_name, email, gender, date_of_birth, phone, second_phone,
        ni_number, ebds_number, next_of_kin, next_of_kin_contact_no, nationality, relationship_status, sia_licence,
        licence_type, licence_expiry, sia_not_required, additional_sia_licence, additional_licence_type,
        additional_licence_expiry, pwva_trained, leisure, leisure_interests, criminal_record, criminal_record_details, submitted_by_subcontractor
    } = req.body;

    const employee_photo = req.file?.filename || null;

    try {
        const result = await ApplicantModel.createApplicantAndApplication(
            company_id, contract_id, job_id || null, request_id, first_name, middle_name, last_name, email, gender, date_of_birth, phone, second_phone,
            ni_number, ebds_number, next_of_kin, next_of_kin_contact_no, nationality, relationship_status, sia_licence,
            licence_type, licence_expiry, sia_not_required, additional_sia_licence, additional_licence_type,
            additional_licence_expiry, pwva_trained, employee_photo, leisure, leisure_interests, criminal_record, criminal_record_details, submitted_by_subcontractor
        );
        res.status(201).json(result);
    } catch (error: any) {
        console.error("Failed to submit application:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getApplicationsByCompanyId = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    try {
        const applications = await ApplicantModel.findApplicationsByCompanyId(parseInt(companyId));
        res.json(applications.length > 0 ? applications : []);
    } catch (error: any) {
        console.error("Failed to fetch applications:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getApplicationDetailsById = async (req: Request, res: Response) => {
    const { applicationId } = req.params;
    try {
        const application = await ApplicantModel.findApplicationById(parseInt(applicationId));
        application ? res.json(application) : res.status(404).json({ message: "Application not found" });
    } catch (error: any) {
        console.error("Failed to fetch application details:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
    const { applicationId } = req.params;
    const { status } = req.body;
    try {
        const updatedApplication = await ApplicantModel.updateApplicationStatus(parseInt(applicationId), status);
        res.json(updatedApplication);
    } catch (error: any) {
        console.error("Failed to update application status:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getShortlistedApplicationsByCompanyId = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    try {
        const applications = await ApplicantModel.findShortlistedApplicationsByCompanyId(parseInt(companyId));
        res.json(applications.length > 0 ? applications : []);
    } catch (error: any) {
        console.error("Failed to fetch shortlisted applications:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getPassedApplicantsByCompanyId = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    try {
        const passedApplicants = await ApplicantModel.findPassedApplicantsByCompanyId(parseInt(companyId));
        res.json(passedApplicants);
    } catch (error: any) {
        console.error("Failed to fetch passed applicants:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const revertApplicationStatus = async (req: Request, res: Response) => {
    const { applicationId } = req.params;
    try {
        const updatedApplication = await ApplicantModel.updateApplicationStatus(parseInt(applicationId), 'Submitted');
        res.status(200).json(updatedApplication);
    } catch (error: any) {
        console.error("Failed to revert application status:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};


// Controller to handle submitting an applicant with an optional job application by Admin or Staff
export const submitApplicant = async (req: Request, res: Response) => {
    const {
        company_id, job_id, first_name, middle_name, last_name, email, gender, date_of_birth, phone, second_phone,
        ni_number, ebds_number, next_of_kin, next_of_kin_contact_no, nationality, relationship_status, sia_licence,
        licence_type, licence_expiry, sia_not_required, additional_sia_licence, additional_licence_type,
        additional_licence_expiry, pwva_trained, leisure, leisure_interests, criminal_record, criminal_record_details
    } = req.body;

    const employee_photo = req.file?.filename || null;

    try {
        const applicant = await ApplicantModel.createApplicant(
            company_id, first_name, middle_name, last_name, email, gender, date_of_birth, phone, second_phone,
            ni_number, ebds_number, next_of_kin, next_of_kin_contact_no, nationality, relationship_status, sia_licence,
            licence_type, licence_expiry, sia_not_required, additional_sia_licence, additional_licence_type,
            additional_licence_expiry, pwva_trained, employee_photo, leisure, leisure_interests, criminal_record, criminal_record_details
        );

        let application = null;
        if (job_id) {
            application = await ApplicantModel.createApplication(job_id, applicant.applicant_id);
        }

        res.status(201).json({ applicant, application });
    } catch (error: any) {
        console.error("Failed to submit applicant/application:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};