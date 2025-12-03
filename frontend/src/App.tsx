import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './pages/auth/AuthPage';
import SuperAdminDashboard from './pages/protected/superAdmin/SuperAdminDashboard';
import AdminDashboard from './pages/protected/admin/AdminDashboard';
import StaffDashboard from './pages/protected/staff/StaffDashboard';
import StaffJobs from './pages/protected/staff/StaffJobs'; 
import RecruitmentPage from './pages/protected/recruitment/Recruitment';
import CreateJobPage from './pages/protected/recruitment/CreateJobPage';
import ViewApplications from './pages/protected/recruitment/ViewApplications';
import ApplicationDetailsPage from './pages/protected/recruitment/ApplicationDetailsPage';
import ShortlistedPage from './pages/protected/recruitment/ShortlistedPage';
import InterviewsPage from './pages/protected/recruitment/InterviewsPage';
import JobOffersPage from './pages/protected/recruitment/JobOffersPage';
import CompanyListPage from './pages/protected/recruitment/CompanyListPage';
import JobListPage from './pages/protected/recruitment/JobListPage';
import JobApplicationPage from './pages/protected/recruitment/JobApplicationPage';
import JobOfferResponsePage from './pages/protected/recruitment/JobOfferResponsePage';

// Employees
import EmployeesPage from './pages/protected/employees/EmployeesPage';
import EmployeeDetailPage from './pages/protected/employees/EmployeeDetailPage';
import DeletedEmployeesPage from './pages/protected/employees/DeletedEmployeesPage';
import DormantEmployeesPage from './pages/protected/employees/DormantEmployeesPage';
import GuardGroupPage from './pages/protected/employees/GuardGroupPage';
import AddGuardsToGroupPage from './pages/protected/employees/AddGuardsToGroupPage';
import StaffApplicationPage from './pages/protected/employees/StaffApplicationPage';

// Sub Contractors
import ViewSubcontractorsPage from './pages/protected/subcontractors/ViewSubcontractorsPage';
import AddSubcontractorsPage from './pages/protected/subcontractors/AddSubcontractorsPage';
import DeletedSubcontractorsPage from './pages/protected/subcontractors/DeletedSubcontractorsPage';
import SubcontractorDashboardPage from './pages/subcontractors/SubcontractorDashboardPage';
import ContractDetailPage from './pages/protected/subcontractors/ContractDetailPage';
import ContractInfoPage from './pages/subcontractors/ContractInfoPage';
import SubcontractorApplicationPage from './pages/subcontractors/SubcontractorApplicationPage';

// Clients
import ClientsPage from './pages/protected/clients/ClientsPage';
import AddClientPage from './pages/protected/clients/AddClientPage';
import ClientDetailPage from './pages/protected/clients/ClientDetailPage';

// Sites
import AddSitePage from './pages/protected/sites/AddSites';
import SitesPage from './pages/protected/sites/SitesPage';
import SiteDetailPage from './pages/protected/sites/SiteDetailPage';

// Roaster
import ScheduleRoasterPage from './pages/protected/roaster/ScheduleRoasterPage';
import AddRoasterPage from './pages/protected/roaster/AddRoasterPage';
import GuardRoasterPage from './pages/protected/roaster/GuardRoasterPage';
import EditRoasterPage from './pages/protected/roaster/EditRoasterPage';
import DetailedRosterViewPage from './pages/protected/roaster/DetailedRosterViewPage';

import TelemetryPage from './pages/protected/staff/TelemetryPage';

// Finance (NEW)
import InvoiceListPage from './pages/protected/finance/InvoiceListPage';
import InvoiceGeneratePage from './pages/protected/finance/InvoiceGeneratePage';
import InvoiceDetailPage from './pages/protected/finance/InvoiceDetailPage';

// Misc
import TermsAndConditionsPage from './pages/protected/terms-and-conditions/TermsAndConditionsPage';
import PrivacyPolicyPage from './pages/protected/privacy-policy/PrivacyPolicyPage';
import ContactUsPage from './pages/protected/contact-us/ContactUsPage';

import Profile from './pages/protected/staff/Profile';
import StaffStats from './pages/protected/staff/StaffStats';

import PrivateRoute from './components/PrivateRoute';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <Routes>

          {/* Public */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/job-offer/:offerId" element={<JobOfferResponsePage />} />
          <Route path="/subcontractor-dashboard" element={<SubcontractorDashboardPage />} />

          {/* Protected */}
          <Route element={<PrivateRoute />}>
            <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/staff/jobs" element={<StaffJobs />} />

            {/* Recruitment */}
            <Route path="/recruitment" element={<RecruitmentPage />} />
            <Route path="/recruitment/create-job" element={<CreateJobPage />} />
            <Route path="/recruitment/applications" element={<ViewApplications />} />
            <Route path="/recruitment/applications/:applicationId" element={<ApplicationDetailsPage />} />
            <Route path="/recruitment/shortlisted" element={<ShortlistedPage />} />
            <Route path="/recruitment/interviews" element={<InterviewsPage />} />
            <Route path="/recruitment/job-offers" element={<JobOffersPage />} />
            <Route path="/companies" element={<CompanyListPage />} />
            <Route path="/jobs/:companyId" element={<JobListPage />} />
            <Route path="/apply/:jobId" element={<JobApplicationPage />} />

            {/* Employees */}
            <Route path="/workspace/employees" element={<EmployeesPage />} />
            <Route path="/employees/details/:applicantId" element={<EmployeeDetailPage />} /> 
            <Route path="/workspace/employees/deleted-employees" element={<DeletedEmployeesPage />} />
            <Route path="/workspace/employees/dormant-employees" element={<DormantEmployeesPage />} />
            <Route path="/workspace/employees/guard-groups" element={<GuardGroupPage />} />
            <Route path="/workspace/staff-application" element={<StaffApplicationPage />} />
            <Route path="/guard-groups/:groupId/add-guards" element={<AddGuardsToGroupPage />} />

            {/* Subcontractors */}
            <Route path="/workspace/subcontractors" element={<ViewSubcontractorsPage />} />
            <Route path="/workspace/subcontractors/add" element={<AddSubcontractorsPage />} />
            <Route path="/workspace/subcontractors/removed" element={<DeletedSubcontractorsPage />} />
            <Route path="/contract-detail/:contractId" element={<ContractDetailPage />} />
            <Route path="/contract-info/:contractId" element={<ContractInfoPage />} />
            <Route path="/subcontractor-application/:requestId" element={<SubcontractorApplicationPage />} />

            {/* Clients */}
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/add" element={<AddClientPage />} />
            <Route path="/client/detail/:clientId" element={<ClientDetailPage />} />

            {/* Sites */}
            <Route path="/sites/add" element={<AddSitePage />} />
            <Route path="/sites" element={<SitesPage />} />
            <Route path="/sites/:siteId" element={<SiteDetailPage />} />

            {/* Rosters */}
            <Route path="/rosters/add" element={<AddRoasterPage />} />
            <Route path="/rosters/schedule" element={<ScheduleRoasterPage />} />
            <Route path="/rosters/guards" element={<GuardRoasterPage />} />
            <Route path="/rosters/edit/:id" element={<EditRoasterPage />} />
            <Route path="/rosters/view/:id" element={<DetailedRosterViewPage />} />

            <Route path="/staff/telemetry/:assignmentId" element={<TelemetryPage />} />

            {/* ==============================
                FINANCE ROUTES (NEW)
             ============================== */}
            <Route path="/finance" element={<Navigate to="/finance/invoices" replace />} />
            <Route path="/finance/invoices" element={<InvoiceListPage />} />
            <Route path="/finance/invoices/generate" element={<InvoiceGeneratePage />} />
            <Route path="/finance/invoices/:invoiceId" element={<InvoiceDetailPage />} />

            {/* Others */}
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/contact-us" element={<ContactUsPage />} />

            <Route path="/staff/profile" element={<Profile />} />
            <Route path="/staff/stats" element={<StaffStats />} />

          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
