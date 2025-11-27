// src/routes/applicantRoutes.ts
import express from 'express';
import { upload } from '../middleware/upload';

import * as applicationController from '../controllers/application/applicationController';
import * as interviewController from '../controllers/application/interviewController';
import * as jobOfferController from '../controllers/job/jobController';

const router = express.Router();

// Route to submit an applicant directly by admin or staff, optionally linked to a job.
router.post('/add-applicant', upload.single('employee_photo'), applicationController.submitApplicant);

// Application-related routes
router.post('/submit', upload.single('employee_photo'), applicationController.submitApplication);
router.get('/:companyId', applicationController.getApplicationsByCompanyId);
router.get('/details/:applicationId', applicationController.getApplicationDetailsById);
router.patch('/update-status/:applicationId', applicationController.updateApplicationStatus);
router.get('/shortlisted/:companyId', applicationController.getShortlistedApplicationsByCompanyId);
router.get('/passed/:companyId', applicationController.getPassedApplicantsByCompanyId);

// Interview-related routes
router.get('/interviews/:companyId', interviewController.getInterviewsByCompanyId);
router.post('/interviews/:applicationId', interviewController.createInterview);
router.put('/interviews/outcome/:interviewId', interviewController.updateInterviewOutcome);
router.patch('/revert-status/:applicationId', applicationController.revertApplicationStatus);
router.delete('/interviews/:interviewId', interviewController.deleteInterview);

// Job offer-related routes
router.post('/send-offer/:applicationId', jobOfferController.sendJobOffer);
router.put('/offers/status/:offerId', jobOfferController.updateJobOfferStatus);
router.post('/offer-response/:offerId', jobOfferController.handleJobOfferResponse);
router.get('/offers/:offerId', jobOfferController.getJobOfferDetails);

export default router;
