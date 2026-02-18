import { Request, Response } from 'express';
import * as JobModel from '../../models/job/jobModel';
import * as ApplicantModel from '../../models/application/applicantModel';
import { hashPassword } from '../../utils/hashUtils';
import { createUser } from '../../models/user/userModel';
import { sendLoginCredentialsEmail } from '../../utils/emailService';
import { getPool } from "../../config/database"
const pool = getPool()

// --------------------------------------------------
// HELPER: create user + PIN + send email for offer
// --------------------------------------------------
const createEmployeeUserForOffer = async (offerId: number) => {
  // 1) Get job offer
  const jobOffer = await JobModel.getJobOfferById(offerId);
  if (!jobOffer) throw new Error('Job offer not found.');

  const { application_id: applicationId, role_offered: roleOffered, branch_id: branchIdRaw } = jobOffer;

  if (!applicationId) throw new Error('Job offer has no application_id.');
  if (!roleOffered) throw new Error('Job offer has no role_offered.');

  // 2) Get applicant (joined with job/application)
  const applicant = await ApplicantModel.findApplicationById(applicationId);
  if (!applicant || !applicant.email) throw new Error('Applicant or email not found.');

  const {
    email,
    applicant_id: applicantId,
    company_id: companyId,
  } = applicant;

  if (!companyId) {
    throw new Error('Applicant has no company_id – cannot create user.');
  }

  // 3) Avoid duplicate users for same applicant
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE applicant_id = $1 LIMIT 1',
    [applicantId]
  );
  if (existingUser.rows.length > 0) {
    console.log(
      `User already exists for applicant_id=${applicantId}. Skipping user creation.`
    );
    return;
  }

  // 4) Generate random password & hash it
  const generatedPassword = Math.random().toString(36).slice(-8); // 8 chars
  const hashedPassword = await hashPassword(generatedPassword);

  // 5) Create user (userModel will generate user_pin)
  const branchId = branchIdRaw ?? null; // if null, createUser will fallback to Head Office

  const newUser = await createUser(
    email,
    hashedPassword,
    companyId,
    roleOffered,
    false,           // isMainUser
    applicantId,     // applicantId
    true,            // isActive
    false,           // isDeleted
    false,           // isDormant
    false,           // isSubcontractorEmployee
    false,           // isSubcontractor
    branchId         // branchId
  );

  if (!newUser.user_pin) {
    throw new Error('Failed to generate user PIN on user creation.');
  }

  // 6) Email credentials (PIN + password)
  await sendLoginCredentialsEmail(email, newUser.user_pin, generatedPassword);

  console.log(
    `✅ Created user for applicant ${email} (applicant_id=${applicantId}) with role '${roleOffered}' at branch_id=${branchId}. Email sent.`
  );
};

// --------------------------------------------------
// CONTROLLERS
// --------------------------------------------------

export const sendJobOffer = async (req: Request, res: Response) => {
  const applicationId = parseInt(req.params.applicationId);
  const { offerDetails, hourlyPayRate, paymentPeriod, fixedPay, travelExpense, roleOffered, branchId } = req.body;

  try {
    const application = await ApplicantModel.findApplicationById(applicationId);
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Ensure branchId is passed and parsed as a number
    if (!branchId) {
      res.status(400).json({ error: 'Branch ID is required' });
      return;
    }
    const parsedBranchId = parseInt(branchId);

    const jobOffer = await JobModel.createJobOffer(
      applicationId,
      offerDetails,
      hourlyPayRate,
      paymentPeriod,
      fixedPay,
      travelExpense,
      application.email,
      roleOffered,
      parsedBranchId // Now including branchId in the function call
    );

    await ApplicantModel.updateApplicationStatus(applicationId, 'Offered');

    res.status(201).json({ message: 'Job offer sent successfully', jobOffer });
  } catch (error: any) {
    console.error('Failed to send job offer:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const updateJobOfferStatus = async (req: Request, res: Response) => {
  const { offerId } = req.params;
  const { status } = req.body;

  try {
    const updatedOffer = await JobModel.updateJobOfferStatus(parseInt(offerId), status);
    const newStatus = status === 'Accepted' ? 'Accepted' : 'Rejected';
    await ApplicantModel.updateApplicationStatus(updatedOffer.application_id, newStatus);

    res.json(updatedOffer);
  } catch (error: any) {
    console.error('Failed to update job offer status:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const handleJobOfferResponse = async (req: Request, res: Response) => {
  const offerId = parseInt(req.params.offerId);
  const { token, status } = req.body;

  try {
    // Step 1: Validate token
    const valid = await JobModel.validateJobOfferToken(offerId, token);
    if (!valid) {
      res.status(403).json({ error: 'Invalid or expired token.' });
      return;
    }

    // Step 2: Update job offer status (+ signed_on)
    const signedOnDate = status === 'Accepted' ? new Date() : null;
    const updatedOffer = await JobModel.updateJobOfferStatus(offerId, status, signedOnDate);

    // Keep applications table in sync as well
    const newStatus = status === 'Accepted' ? 'Accepted' : 'Rejected';
    await ApplicantModel.updateApplicationStatus(updatedOffer.application_id, newStatus);

    if (status === 'Accepted') {
      // Step 3: Respond quickly
      res.status(200).json({
        message: `Job offer ${status.toLowerCase()} successfully. User credentials creation in progress.`,
        offer: updatedOffer,
      });

      // Step 4: Background user creation + email
      setImmediate(async () => {
        try {
          await createEmployeeUserForOffer(offerId);
        } catch (backgroundError) {
          console.error('Background process (user creation) failed:', backgroundError);
        }
      });
    } else {
      res.status(200).json({ message: `Job offer ${status.toLowerCase()} successfully`, offer: updatedOffer });
    }
  } catch (error: any) {
    console.error('Failed to handle job offer response:', {
      message: error.message,
      stack: error.stack,
      offerId,
      status,
      token,
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const getJobOffers = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const offers = await JobModel.getJobOffersByCompanyId(parseInt(companyId));
    res.json(offers);
  } catch (error: any) {
    console.error('Failed to fetch job offers:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// ✅ This was previously only updating status.
//    Now it ALSO triggers user creation + email, using the same helper as handleJobOfferResponse.
export const acceptJobOffer = async (req: Request, res: Response) => {
  const { offerId } = req.params;

  try {
    const numericOfferId = parseInt(offerId);

    // Update status + signed_on
    const updatedOffer = await JobModel.updateJobOfferStatus(
      numericOfferId,
      'Accepted',
      new Date()
    );

    // Keep application row in sync
    await ApplicantModel.updateApplicationStatus(updatedOffer.application_id, 'Accepted');

    res.json(updatedOffer);

    // Background: create user + send email
    setImmediate(async () => {
      try {
        await createEmployeeUserForOffer(numericOfferId);
      } catch (err) {
        console.error('Background user creation after acceptJobOffer failed:', err);
      }
    });
  } catch (error: any) {
    console.error('Failed to accept job offer:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const rejectJobOffer = async (req: Request, res: Response) => {
  const { offerId } = req.params;
  try {
    // Pass null explicitly for signed_on when rejecting
    const updatedOffer = await JobModel.updateJobOfferStatus(
      parseInt(offerId),
      'Rejected',
      null
    );
    await ApplicantModel.updateApplicationStatus(updatedOffer.application_id, 'Rejected');

    res.json(updatedOffer);
  } catch (error: any) {
    console.error('Failed to reject job offer:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const updateJobStatus = async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { status } = req.body;

  try {
    const updatedJob = await JobModel.updateJobStatus(parseInt(jobId), status);
    res.json(updatedJob);
  } catch (error: any) {
    console.error('Failed to update job status:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  const { jobId } = req.params;
  try {
    const deletedJob = await JobModel.deleteJobById(parseInt(jobId));
    if (deletedJob) {
      res.json({ message: 'Job deleted successfully', job: deletedJob });
    } else {
      res.status(404).json({ error: 'Job not found' });
    }
  } catch (error: any) {
    console.error('Failed to delete job:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const getJobOfferDetails = async (req: Request, res: Response) => {
  const offerId = parseInt(req.params.offerId);

  try {
    const jobOffer = await JobModel.getJobOfferById(offerId);

    if (!jobOffer) {
      res.status(404).json({ error: 'Job offer not found' });
      return;
    }

    res.status(200).json(jobOffer);
  } catch (error: any) {
    console.error('Failed to fetch job offer details:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
