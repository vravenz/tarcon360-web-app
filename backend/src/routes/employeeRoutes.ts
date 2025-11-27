import express from 'express';
import {fetchEmployees, fetchEmployeeDetail, updateEmployeeDetail, deleteEmployee, fetchDeletedEmployees, restoreEmployeeDetail, updateEmployeeDormantStatus, fetchDormantEmployees, fetchDirectEmployees, fetchSubcontractorEmployees} from '../controllers/employee/employeeController';

const router = express.Router();

router.get('/:companyId/employees', fetchEmployees);
router.get('/:companyId/direct-employees', fetchDirectEmployees);
router.get('/:companyId/subcontractor-employees', fetchSubcontractorEmployees);
router.get('/employees/details/:applicantId', fetchEmployeeDetail);
router.patch('/employees/details/:applicantId', updateEmployeeDetail);
router.delete('/employees/details/:applicantId', deleteEmployee);
router.get('/:companyId/deleted-employees', fetchDeletedEmployees);
router.patch('/employees/restore/:applicantId', restoreEmployeeDetail);
router.patch('/employees/:applicantId/dormant', updateEmployeeDormantStatus);
router.get('/:companyId/dormant-employees', fetchDormantEmployees);

export default router;
