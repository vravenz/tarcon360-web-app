// jobRoutes.ts
import express from 'express';

// Import controllers from separate files
import * as jobApplicationController from '../controllers/job/jobApplicationController';
import * as jobOfferController from '../controllers/job/jobController';
import * as jobUpdateDeleteController from '../controllers/job/jobController';

const router = express.Router();

// Job creation and retrieval routes
router.post('/', jobApplicationController.createJob);
router.get('/companies', jobApplicationController.getCompaniesWithJobs);
router.get('/:company_id', jobApplicationController.getJobs);
router.get('/:company_id/open', jobApplicationController.getOpenJobs);
router.get('/status/:jobId', jobApplicationController.getJobStatus);

// Job update and deletion routes
router.post('/update/:jobId', jobUpdateDeleteController.updateJobStatus);
router.delete('/delete/:jobId', jobUpdateDeleteController.deleteJob);

// Job offer management routes
router.get('/offers/:companyId', jobOfferController.getJobOffers);
router.put('/offers/accept/:offerId', jobOfferController.acceptJobOffer);
router.put('/offers/reject/:offerId', jobOfferController.rejectJobOffer);

export default router;
