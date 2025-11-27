import { Request, Response } from 'express';
import * as JobModel from '../../models/job/jobModel';

export const createJob = async (req: Request, res: Response) => {
    try {
        const { company_id, title, description, location, start_date, end_date, is_ongoing } = req.body;
        const status = req.body.status || 'Open';
        const job = await JobModel.createJob(company_id, title, description, location, start_date, end_date, is_ongoing, status);
        res.status(201).json(job);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getJobs = async (req: Request, res: Response) => {
    try {
        const { company_id } = req.params;
        const jobs = await JobModel.getJobsByCompanyId(parseInt(company_id));
        res.json(jobs);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getOpenJobs = async (req: Request, res: Response) => {
    try {
        const { company_id } = req.params;
        const jobs = await JobModel.getOpenJobsByCompanyId(parseInt(company_id));
        res.json(jobs);
    } catch (error: any) {
        console.error("Failed to fetch open jobs", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getJobStatus = async (req: Request, res: Response) => {
    const { jobId } = req.params;
    try {
        const job = await JobModel.getJobStatusById(parseInt(jobId));
        res.json(job);
    } catch (error: any) {
        console.error("Failed to fetch job status:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getCompaniesWithJobs = async (req: Request, res: Response) => {
    try {
        const companies = await JobModel.getCompaniesWithOpenJobs();
        res.json(companies);
    } catch (error: any) {
        console.error("Failed to fetch companies with open jobs:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};
