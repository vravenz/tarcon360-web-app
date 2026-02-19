import { Request, Response } from 'express';
import * as InterviewModel from '../../models/interview/interviewModel';
import * as ApplicantModel from '../../models/application/applicantModel';
import pool from '../../config/database';

export const createInterview = async (req: Request, res: Response) => {
    const { applicationId } = req.params;
    const { interview_date, interviewer, notes } = req.body;

    try {
        const interview = await InterviewModel.scheduleInterview(parseInt(applicationId), {
            interview_date,
            interviewer,
            notes,
            outcome: 'Pending'
        });
        res.status(201).json(interview);
    } catch (error: any) {
        console.error("Failed to schedule interview:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getInterviewsByCompanyId = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    try {
        const interviews = await InterviewModel.findInterviewsByCompanyId(parseInt(companyId));
        res.json(interviews);
    } catch (error: any) {
        console.error("Failed to fetch interviews:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const updateInterviewOutcome = async (req: Request, res: Response) => {
    const { interviewId } = req.params;
    const { outcome } = req.body;

    try {
        const updatedInterview = await InterviewModel.updateInterviewOutcome(parseInt(interviewId), outcome);

        const newStatus = outcome === 'Passed' ? 'Passed' : 'Rejected';
        await ApplicantModel.updateApplicationStatus(updatedInterview.application_id, newStatus);

        res.json(updatedInterview);
    } catch (error: any) {
        console.error("Failed to update interview outcome:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const deleteInterview = async (req: Request, res: Response) => {
    const { interviewId } = req.params;
    const client = await pool.connect();
    try {
        // Start database transaction
        const client = await pool.connect();
        await client.query('BEGIN');

        // Retrieve the application_id before deleting the interview
        const interviewQuery = 'SELECT application_id FROM interviews WHERE interview_id = $1';
        const interviewResult = await client.query(interviewQuery, [interviewId]);
        if (interviewResult.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ message: 'Interview not found' });
            return;
        }
        const applicationId = interviewResult.rows[0].application_id;

        // Delete the interview
        const deleteQuery = 'DELETE FROM interviews WHERE interview_id = $1';
        await client.query(deleteQuery, [interviewId]);

        // Update the application status to 'Submitted'
        const updateQuery = 'UPDATE applications SET application_status = $1 WHERE application_id = $2';
        await client.query(updateQuery, ['Submitted', applicationId]);

        // Commit transaction
        await client.query('COMMIT');
        res.status(200).json({ message: 'Interview deleted and application status updated to Submitted' });
    } catch (error: any) {
        console.error('Failed to delete interview and update application status:', error);
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        client.release();
    }
};
