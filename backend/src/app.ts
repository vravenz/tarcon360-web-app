import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import applicantRoutes from './routes/applicantRoutes';
import employeeRoutes from './routes/employeeRoutes';
import branchRoutes from './routes/branchRoutes';
import guardGroupRoutes from './routes/guardGroupRoutes';
import subcontractorRoutes from './routes/subcontractorRoutes';
import subcontractorCompanyRoutes from './routes/subcontractorCompanyRoutes';
import clientRoutes from './routes/clientRoutes';
import sitesRoutes from './routes/siteRoutes';
import roasterRoutes from './routes/roasterRoutes';
import siteCheckpointRoutes from './routes/siteCheckpointRoutes';
import siteCheckCallRoutes from './routes/siteCheckCallRoutes';
import checkCallRoutes from './routes/rosterShiftCheckCallRoutes';
import checkpointRoutes from './routes/rosterShiftCheckpointRoutes';
import mobileV1Routes from './mobile/v1/routes';
import telemetryRoutes from './routes/telemetryRoutes';
import etaRoutes from './routes/etaRoutes';
import bookOnOffRoutes from './routes/bookOnOffRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import statsRoutes from './routes/statsRoutes';

// Load environment variables
dotenv.config();

const app: Express = express();

// Environment variables for URLs and port
const PORT = process.env.PORT || 4000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const STATIC_URL = process.env.STATIC_URL || 'http://localhost';

// Middlewares
app.use(cors());
app.use(express.json()); // using built-in JSON parser

// -------------------------------------------------------
// Middleware: Extract userId from header "x-user-id" (or from body)
// -------------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  let userId: number | undefined;
  // Check for the user id in headers
  if (req.headers['x-user-id']) {
    const headerValue = req.headers['x-user-id'] as string;
    userId = parseInt(headerValue, 10);
  }
  // Optionally, check for user_id in the request body
  else if (req.body && req.body.user_id) {
    userId = parseInt(req.body.user_id, 10);
  }
  // Only assign if userId is defined and a valid number
  if (userId !== undefined && !isNaN(userId)) {
    (req as any).userId = userId;
  }
  next();
});

// -------------------------------------------------------
// Define routes
// -------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api', employeeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api', guardGroupRoutes);
app.use('/api/subcontractors', subcontractorRoutes);
app.use('/api/subcontractor-company', subcontractorCompanyRoutes);
app.use('/api', clientRoutes);
app.use('/api', sitesRoutes);
app.use('/api/sites', siteCheckpointRoutes);
app.use('/api', roasterRoutes);
app.use('/api/sites', siteCheckCallRoutes);
app.use('/api', checkCallRoutes);
app.use('/api', checkpointRoutes);
app.use('/api/tracking', telemetryRoutes);
app.use('/api/tracking', etaRoutes);
app.use('/api/tracking', bookOnOffRoutes);
app.use('/api', invoiceRoutes);
app.use('/api/stats', statsRoutes);

// Mobile API (versioned)
app.use('/api/mobile/v1', mobileV1Routes);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../src/uploads')));

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).send(`Welcome to the Security App API! Backend URL: ${BACKEND_URL}`);
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
