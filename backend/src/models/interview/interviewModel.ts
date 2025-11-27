import express from 'express';
import pool from '../../config/database';

interface InterviewData {
    interview_date: Date;
    interviewer: string;
    notes?: string;
    outcome?: string;
}


export const scheduleInterview = async (applicationId: number, interviewData: InterviewData): Promise<any> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const insertInterview = `
            INSERT INTO interviews (application_id, interview_date, interviewer, notes, outcome)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const values = [
            applicationId,
            interviewData.interview_date,
            interviewData.interviewer,
            interviewData.notes || '',
            interviewData.outcome || 'Pending'
        ];
        const result = await client.query(insertInterview, values);
        
        // Update the application status
        const updateStatus = `
            UPDATE applications
            SET application_status = 'Scheduled'
            WHERE application_id = $1 RETURNING *;
        `;
        await client.query(updateStatus, [applicationId]);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const findInterviewsByCompanyId = async (companyId: number) => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT i.*, a.first_name, a.last_name, j.title as job_title
            FROM interviews i
            JOIN applications ap ON i.application_id = ap.application_id
            JOIN applicants a ON ap.applicant_id = a.applicant_id
            JOIN jobs j ON ap.job_id = j.job_id
            WHERE j.company_id = $1;
        `;
        const result = await client.query(query, [companyId]);
        return result.rows;
    } catch (error) {
        console.error("Error fetching interviews:", error);
        throw error;  // Rethrow the error to be caught by the controller
    } finally {
        client.release();
    }
};


export const updateInterviewOutcome = async (interviewId: number, outcome: string) => {
    const query = `
        UPDATE interviews
        SET outcome = $1
        WHERE interview_id = $2
        RETURNING *;
    `;
    const values = [outcome, interviewId];
    const result = await pool.query(query, values);
    return result.rows[0];
};
