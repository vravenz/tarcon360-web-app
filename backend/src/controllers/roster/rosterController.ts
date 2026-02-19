// File: controllers/rosterController.ts

import { Request, Response } from 'express';
import { seedCheckCallsForAssignments } from '../../models/roster/rosterShiftCheckCalls';
import { seedCheckpointsForAssignments }    from '../../models/roster/rosterShiftCheckpoints';
import pool from '../../config/database';

// Models
import {
  Roster,
  insertRoster,
  getRosterById,
  getAllRosters,
  updateRoster,
  deleteRoster
} from '../../models/roster/roster';
import {
  RosterEmployee,
  insertRosterEmployees,
  deleteRosterEmployeesByRosterId,
  getRosterEmployeeById,
  getRosterEmployeesByRosterId,
  insertSingleRosterEmployee
} from '../../models/roster/rosterEmployees';
import {
  RosterShift,
  insertRosterShifts,
  deleteRosterShiftsByRosterId,
  getRosterShiftById,
  getRosterShiftsByRosterId,
  updateRosterShift
} from '../../models/roster/rosterShifts';
import {
  RosterShiftAssignment,
  insertRosterShiftAssignments,
  deleteAssignmentsByRosterId,
  getAssignmentsByShiftId,
  removeRosterShiftAssignment,
  getAssignmentsByRosterId,
  insertSingleRosterShiftAssignment,
  insertRosterShiftAssignmentHistory,
  getActiveAssignmentsByShiftId,
  getRemovedAssignmentsByShiftId,
  getRosterShiftHistoryByShiftId,
  getRosterShiftAssignmentHistoryByShiftId
} from '../../models/roster/rosterShiftAssignments';


import { insertRosterShiftHistory, RosterShiftHistory } from '../../models/roster/rosterShiftHistory';

export const createRoster = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const {
      company_id,
      site_id,
      po_number,
      employees  = [],
      shifts     = [],
      assignments = []
    } = req.body;

    /* ─────────────────────────────────────────────────────────── */
    await client.query('BEGIN');

    /* 1 ▸ roster */
    const newRoster: Roster = await insertRoster({ company_id, site_id, po_number });

    /* 2 ▸ roster_employees */
    let insertedEmployees: RosterEmployee[] = [];
    if (employees.length) {
      employees.forEach((e: any) => {
        e.company_id = company_id;
        e.roster_id  = newRoster.roster_id!;
      });
      insertedEmployees = await insertRosterEmployees(employees);
    }

    /* 3 ▸ roster_shifts */
    let insertedShifts: RosterShift[] = [];
    if (shifts.length) {
      shifts.forEach((s: any) => {
        s.company_id = company_id;
        s.roster_id  = newRoster.roster_id!;
      });
      insertedShifts = await insertRosterShifts(shifts);
    }

    /* 4 ▸ roster_shift_assignments (explicit or round-robin) */
    let insertedAssignments: RosterShiftAssignment[] = [];
    if (assignments.length) {
      const recs: RosterShiftAssignment[] = [];
      assignments.forEach((a: any) => {
        const shift = insertedShifts[a.shiftIndex as number];
        const emp   = insertedEmployees[a.employeeIndex as number];
        if (!shift || !emp) return;
        recs.push({
          company_id,
          roster_shift_id:       shift.roster_shift_id!,
          roster_employee_id:    emp.roster_employee_id!,
          assignment_start_time: a.assignment_start_time ?? null,
          assignment_end_time:   a.assignment_end_time   ?? null,
          actual_worked_hours:   a.actual_worked_hours   ?? null,
          assignment_status:     a.assignment_status     ?? 'active',
          employee_shift_status: a.employee_shift_status ?? 'unconfirmed'
        });
      });
      if (recs.length) insertedAssignments = await insertRosterShiftAssignments(recs);
    } else if (insertedShifts.length && insertedEmployees.length) {
      const auto: RosterShiftAssignment[] = insertedShifts.map((shift, i) => ({
        company_id,
        roster_shift_id:       shift.roster_shift_id!,
        roster_employee_id:    insertedEmployees[i % insertedEmployees.length].roster_employee_id!,
        assignment_start_time: null,
        assignment_end_time:   null,
        actual_worked_hours:   null,
        assignment_status:     'active',
        employee_shift_status: 'unconfirmed'
      }));
      insertedAssignments = await insertRosterShiftAssignments(auto);
    }

    // 5) Seed check-call QR tasks
    if (insertedAssignments.length) {
      const callPayloads = insertedAssignments
        .map(a => {
          const sh = insertedShifts.find(s => s.roster_shift_id === a.roster_shift_id);
          if (!sh) return null;
          return {
            assignment_id: a.roster_shift_assignment_id!,
            site_id,
            start_date: sh.shift_date,
            end_date:   sh.shift_date
          };
        })
        .filter(Boolean) as Array<{
          assignment_id: number;
          site_id: number;
          start_date: string;
          end_date: string;
        }>;
      if (callPayloads.length) {
        await seedCheckCallsForAssignments(callPayloads);
      }

      // 6) Seed checkpoint-scan rows
      const cpPayloads = insertedAssignments
        .map(a => {
          const sh = insertedShifts.find(s => s.roster_shift_id === a.roster_shift_id);
          if (!sh) return null;
          return {
            roster_employee_id: a.roster_employee_id!,
            site_id,
            start_date: sh.shift_date,
            end_date:   sh.shift_date
          };
        })
        .filter(Boolean) as Array<{
          roster_employee_id: number;
          site_id: number;
          start_date: string;
          end_date: string;
        }>;
      if (cpPayloads.length) {
        await seedCheckpointsForAssignments(cpPayloads);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message:   'Roster created successfully',
      roster:    newRoster,
      employees: insertedEmployees,
      shifts:    insertedShifts
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating roster:', err);
    res.status(500).json({ message: 'Server error while creating roster' });
  } finally {
    client.release();
  }
};

/**
 * Get all rosters
 */

export const getRosters = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch basic roster records with client_name and site_name now included.
    const rosters = await getAllRosters();

    // For each roster, fetch related employees, shifts, and assignments
    const completeRosters = await Promise.all(
      rosters.map(async (roster) => {
        const employees = await getRosterEmployeesByRosterId(roster.roster_id!);
        const shifts = await getRosterShiftsByRosterId(roster.roster_id!);
        const assignments = await getAssignmentsByRosterId(roster.roster_id!);
        return { ...roster, employees, shifts, assignments };
      })
    );

    res.json(completeRosters);
  } catch (error) {
    console.error('Error fetching rosters:', error);
    res.status(500).json({ message: 'Server error while fetching rosters' });
  }
};

/**
 * Get one roster by ID, optionally you can fetch employees/shifts/assignments
 */
export const getRosterDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const roster_id = parseInt(req.params.id, 10);
    if (isNaN(roster_id)) {
      res.status(400).json({ message: 'Invalid roster ID' });
      return;
    }

    const roster = await getRosterById(roster_id);
    if (!roster) {
      res.status(404).json({ message: 'Roster not found' });
      return;
    }

    // If you want, you can also fetch employees, shifts, and assignments:
    // const employees = await getRosterEmployeesByRosterId(roster_id);
    // const shifts = await getRosterShiftsByRosterId(roster_id);
    // const assignments = await getAssignmentsByRosterId(roster_id);

    res.json({
      roster
      // employees,
      // shifts,
      // assignments
    });
  } catch (error) {
    console.error('Error fetching roster details:', error);
    res.status(500).json({ message: 'Server error while fetching roster details' });
  }
};

/**
 * Update roster details (and optionally replace employees/shifts/assignments).
 * This example does a "destructive" replace: it deletes old employees/shifts/assignments,
 * then re-inserts the new ones from the request body.
 */
export const updateRosterDetails = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const roster_id = parseInt(req.params.id, 10);
    if (isNaN(roster_id)) {
      res.status(400).json({ message: 'Invalid roster ID' });
      return;
    }    

    const {
      company_id,
      site_id,
      po_number,
      employees = [],
      shifts = [],
      assignments = []
    } = req.body;

    await client.query('BEGIN');

    // 1) Update the main Roster record
    const updatedRoster = await updateRoster(roster_id, { company_id, site_id, po_number });

    // 2) Delete existing employees (which can cascade to assignments if foreign keys are set up with ON DELETE CASCADE).
    //    Otherwise, we must also manually delete assignments, then shifts, etc.
    await deleteAssignmentsByRosterId(roster_id);
    await deleteRosterShiftsByRosterId(roster_id);
    await deleteRosterEmployeesByRosterId(roster_id);

    // 3) Re-insert employees
    let insertedEmployees: RosterEmployee[] = [];
    if (employees.length > 0) {
      employees.forEach((emp: RosterEmployee) => {
        emp.company_id = updatedRoster.company_id;
        emp.roster_id = updatedRoster.roster_id!;
      });
      insertedEmployees = await insertRosterEmployees(employees);
    }

    // 4) Re-insert shifts
    let insertedShifts: RosterShift[] = [];
    if (shifts.length > 0) {
      shifts.forEach((shift: RosterShift) => {
        shift.company_id = updatedRoster.company_id;
        shift.roster_id = updatedRoster.roster_id!;
      });
      insertedShifts = await insertRosterShifts(shifts);
    }

    // 5) Re-insert assignments
    if (assignments.length > 0) {
      const assignmentRecords: RosterShiftAssignment[] = [];
      for (const a of assignments) {
        const shiftIndex = a.shiftIndex;
        const employeeIndex = a.employeeIndex;
        if (shiftIndex == null || employeeIndex == null) continue;
        if (!insertedShifts[shiftIndex] || !insertedEmployees[employeeIndex]) continue;

        assignmentRecords.push({
          company_id: updatedRoster.company_id,
          roster_shift_id: insertedShifts[shiftIndex].roster_shift_id!,
          roster_employee_id: insertedEmployees[employeeIndex].roster_employee_id!,
          assignment_start_time: a.assignment_start_time ?? null,
          assignment_end_time: a.assignment_end_time ?? null,
          actual_worked_hours: a.actual_worked_hours ?? null,
          assignment_status: a.assignment_status ?? 'active',
          employee_shift_status: a.employee_shift_status ?? 'unconfirmed'
        });
      }
      if (assignmentRecords.length > 0) {
        await insertRosterShiftAssignments(assignmentRecords);
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Roster updated successfully',
      roster: updatedRoster
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating roster:', error);
    res.status(500).json({ message: 'Server error while updating roster' });
  } finally {
    client.release();
  }
};

/**
 * Delete a roster by ID
 */
export const removeRoster = async (req: Request, res: Response): Promise<void> => {
  try {
    const roster_id = parseInt(req.params.id, 10);
    if (isNaN(roster_id)) {
      res.status(400).json({ message: 'Invalid roster ID' });
      return;
    }    

    await deleteRoster(roster_id);
    res.json({ message: 'Roster deleted successfully' });
  } catch (error) {
    console.error('Error deleting roster:', error);
    res.status(500).json({ message: 'Server error while deleting roster' });
  }
};

// Get Shifts Single by ID

export const getRosterShiftDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const shift_id = parseInt(req.params.id, 10);
    if (isNaN(shift_id)) {
      res.status(400).json({ message: 'Invalid shift ID' });
      return;
    }

    const shift = await getRosterShiftById(shift_id);
    if (!shift) {
      res.status(404).json({ message: 'Shift not found' });
      return;
    }

    // Return the shift data
    res.json(shift);
  } catch (error) {
    console.error('Error fetching shift details:', error);
    res.status(500).json({ message: 'Server error while fetching shift details' });
  }
};

export const getShiftAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const shift_id = parseInt(req.params.id, 10);
    if (isNaN(shift_id)) {
      res.status(400).json({ message: 'Invalid shift ID' });
      return;
    }
    const assignments = await getAssignmentsByShiftId(shift_id);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching shift assignments:', error);
    res.status(500).json({ message: 'Server error while fetching shift assignments' });
  }
};

/**
 * Get a single roster employee by its ID.
 * This endpoint returns the detailed employee record (joined with applicants).
 */
export const getRosterEmployeeDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const roster_employee_id = parseInt(req.params.id, 10);
    if (isNaN(roster_employee_id)) {
      res.status(400).json({ message: 'Invalid roster employee ID' });
      return;
    }
    const employee = await getRosterEmployeeById(roster_employee_id);
    if (!employee) {
      res.status(404).json({ message: 'Roster employee not found' });
      return;
    }
    res.json(employee);
  } catch (error) {
    console.error('Error fetching roster employee details:', error);
    res.status(500).json({ message: 'Server error while fetching roster employee details' });
  }
};

/**
 * Update a roster shift assignment.
 * This function takes the assignment ID from the request parameters
 * and updates the assignment record based on the request body.
 */
export const updateRosterShiftAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const roster_shift_assignment_id = parseInt(req.params.id, 10);
    if (isNaN(roster_shift_assignment_id)) {
      res.status(400).json({ message: 'Invalid roster shift assignment ID' });
      return;
    }
    // Import and call the model function from models/rosterShiftAssignments.ts
    const updatedAssignment = await (
      await import('../../models/roster/rosterShiftAssignments')
    ).updateRosterShiftAssignment(roster_shift_assignment_id, req.body);
    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating roster shift assignment:', error);
    res.status(500).json({ message: 'Server error while updating roster shift assignment' });
  }
};


// -----------------------------------------------------------------------------
// Update Roster Shift Details (excluding shift date, start/end times, break time)
// and then insert a history record.
export const updateRosterShiftDetails = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const shift_id = parseInt(req.params.id, 10);
    if (isNaN(shift_id)) {
      res.status(400).json({ message: 'Invalid shift ID' });
      return;
    }

    // Fetch the current shift details
    const currentShift = await getRosterShiftById(shift_id);
    if (!currentShift) {
      res.status(404).json({ message: 'Shift not found' });
      return;
    }

    // Update the shift record (this update does NOT change shift_date, start/end times, or break_time)
    const updatedShift = await updateRosterShift(shift_id, req.body);

    // Build a diff object that includes only fields that have changed.
    // If a field is unchanged, we set its value to undefined.
    const diffHistoryData: RosterShiftHistory = {
      company_id: currentShift.company_id,
      roster_shift_id: shift_id,
      shift_status: updatedShift.shift_status !== currentShift.shift_status ? updatedShift.shift_status : undefined,
      penalty: updatedShift.penalty !== currentShift.penalty ? updatedShift.penalty : undefined,
      comments: updatedShift.comments !== currentShift.comments ? updatedShift.comments : undefined,
      shift_instruction: updatedShift.shift_instruction !== currentShift.shift_instruction ? updatedShift.shift_instruction : undefined,
      payable_rate_type: updatedShift.payable_rate_type !== currentShift.payable_rate_type ? updatedShift.payable_rate_type : undefined,
      payable_role: updatedShift.payable_role !== currentShift.payable_role ? updatedShift.payable_role : undefined,
      payable_amount: updatedShift.payable_amount !== currentShift.payable_amount ? updatedShift.payable_amount : undefined,
      billable_role: updatedShift.billable_role !== currentShift.billable_role ? updatedShift.billable_role : undefined,
      billable_amount: updatedShift.billable_amount !== currentShift.billable_amount ? updatedShift.billable_amount : undefined,
      payable_expenses: updatedShift.payable_expenses !== currentShift.payable_expenses ? updatedShift.payable_expenses : undefined,
      billable_expenses: updatedShift.billable_expenses !== currentShift.billable_expenses ? updatedShift.billable_expenses : undefined,
      unpaid_shift: updatedShift.unpaid_shift !== currentShift.unpaid_shift ? updatedShift.unpaid_shift : undefined,
      training_shift: updatedShift.training_shift !== currentShift.training_shift ? updatedShift.training_shift : undefined,
      updated_by: (req as any).userId,
    };

    // Check if at least one field has changed.
    const fieldsToCheck = [
      'shift_status', 'penalty', 'comments', 'shift_instruction', 'payable_rate_type',
      'payable_role', 'payable_amount', 'billable_role', 'billable_amount',
      'payable_expenses', 'billable_expenses', 'unpaid_shift', 'training_shift'
    ];
    const isChanged = fieldsToCheck.some(field => diffHistoryData[field as keyof RosterShiftHistory] !== undefined);

    if (isChanged) {
      // Insert a history record capturing the changed fields.
      await insertRosterShiftHistory(diffHistoryData);
    } else {
      console.log('No changes detected. History record not inserted.');
    }

    // Send the updated shift details as JSON.
    res.json(updatedShift);
  } catch (error) {
    console.error('Error updating roster shift:', error);
    res.status(500).json({ message: 'Server error while updating roster shift' });
  } finally {
    client.release();
  }
};

// -----------------------------------------------------------------------------
// Remove a roster shift assignment by first logging its removal
export const removeRosterShiftAssignmentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const roster_shift_assignment_id = parseInt(req.params.id, 10);
    if (isNaN(roster_shift_assignment_id)) {
      res.status(400).json({ message: 'Invalid roster shift assignment ID' });
      return;
    }
    const { removal_reason, company_id } = req.body;
    // If company_id is not provided, try to resolve it from the assignment
    let resolved_company_id = company_id;
    if (!resolved_company_id) {
      const result = await pool.query(
        "SELECT company_id FROM public.roster_shift_assignments WHERE roster_shift_assignment_id = $1",
        [roster_shift_assignment_id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Assignment not found' });
        return;
      }
      resolved_company_id = result.rows[0].company_id;
    }
    const removed_by = (req as any).userId;
    if (!removed_by) {
      res.status(400).json({ message: 'Missing user id for removal' });
      return;
    }

    const updatedAssignment = await removeRosterShiftAssignment(
      roster_shift_assignment_id,
      removal_reason,
      resolved_company_id,
      removed_by
    );

    res.json({
      message: 'Shift assignment marked as removed and removal logged successfully',
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error('Error removing roster shift assignment:', error);
    res.status(500).json({ message: 'Server error while removing roster shift assignment' });
  }
};

/**
 * Create a single new shift assignment for an existing shift.
 * This endpoint is typically called after removing a previous assignment
 * so you can assign a new employee to the same shift.
 */
export const createRosterShiftAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    // We expect fields: company_id, roster_shift_id, roster_employee_id, etc.
    const {
      company_id,
      roster_shift_id,
      roster_employee_id,
      assignment_start_time,
      assignment_end_time,
      actual_worked_hours,
      assignment_status = 'active',
      employee_shift_status = 'unconfirmed',
      comments,
      change_reason
    } = req.body;

    // Optionally, you may want to do some validation:
    if (!company_id || !roster_shift_id || !roster_employee_id) {
      res.status(400).json({ message: 'Missing required fields. company_id, roster_shift_id, and roster_employee_id are mandatory.' });
      return;
    }

    // Insert the assignment
    const newAssignmentData: RosterShiftAssignment = {
      company_id,
      roster_shift_id,
      roster_employee_id,
      assignment_start_time: assignment_start_time ?? null,
      assignment_end_time: assignment_end_time ?? null,
      actual_worked_hours: actual_worked_hours ?? null,
      assignment_status,
      employee_shift_status
    };

    const newAssignment = await insertSingleRosterShiftAssignment(newAssignmentData);

    // If you want to keep a history log:
    // We'll assume the user ID is in a header or token (like x-user-id).
    const updated_by = parseInt(req.headers['x-user-id'] as string, 10) || 0;
    if (updated_by) {
      await insertRosterShiftAssignmentHistory({
        company_id: newAssignment.company_id,
        roster_shift_assignment_id: newAssignment.roster_shift_assignment_id!,
        assignment_status: newAssignment.assignment_status,
        actual_worked_hours: newAssignment.actual_worked_hours,
        comments: comments ?? null,
        updated_by,
        change_reason: change_reason ?? 'New assignment created'
      });
    }

    res.status(201).json({
      message: 'New roster shift assignment created successfully.',
      assignment: newAssignment
    });
  } catch (error) {
    console.error('Error creating roster shift assignment:', error);
    res.status(500).json({ message: 'Server error while creating shift assignment.' });
  }
};

/**
 * Create a single RosterEmployee record.
 * This is needed when the user picks a new applicant who isn't yet in roster_employees.
 */
export const createSingleRosterEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    // Destructure the required fields from the request body.
    const {
      company_id,
      roster_id,
      applicant_id,
      staff = null,
      guard_group = null,
      subcontractor = null
    } = req.body;

    // Basic validation
    if (!company_id || !roster_id || !applicant_id) {
      res.status(400).json({
        message: 'Missing required fields: company_id, roster_id, and applicant_id are required.'
      });
      return;
    }

    // Build the RosterEmployee object.
    const newRosterEmployeeData: RosterEmployee = {
      company_id,
      roster_id,
      applicant_id,
      staff,
      guard_group,
      subcontractor
    };

    // Insert the new RosterEmployee into the database.
    const createdEmployee = await insertSingleRosterEmployee(newRosterEmployeeData);

    // Return success response.
    res.status(201).json({
      message: 'New roster employee created successfully.',
      roster_employee_id: createdEmployee.roster_employee_id,
      roster_employee: createdEmployee
    });
  } catch (error) {
    console.error('Error creating single roster employee:', error);
    res.status(500).json({ message: 'Server error while creating single roster employee.' });
  }
};


/**
 * GET /api/rosters/:id/detailed
 * Returns full roster details including:
 * - Basic roster information
 * - All shifts for that roster, and for each shift:
 *   - Active assignments (with employee details)
 *   - Removed assignments (with removal info)
 *   - Shift history records
 *   - Assignment history records
 */
export const getDetailedRosterView = async (req: Request, res: Response): Promise<void> => {
  try {
    const roster_id = parseInt(req.params.id, 10);
    if (isNaN(roster_id)) {
      res.status(400).json({ message: 'Invalid roster ID' });
      return;
    }

    // Fetch the basic roster details.
    const roster = await getRosterById(roster_id);
    if (!roster) {
      res.status(404).json({ message: 'Roster not found' });
      return;
    }

    // Fetch all shifts for this roster.
    const shifts = await getRosterShiftsByRosterId(roster_id);

    // For each shift, fetch detailed info.
    const detailedShifts = await Promise.all(
      shifts.map(async (shift) => {
        // Use non-null assertion since roster_shift_id should be defined.
        const activeAssignments = await getActiveAssignmentsByShiftId(shift.roster_shift_id!);
        const removedAssignments = await getRemovedAssignmentsByShiftId(shift.roster_shift_id!);
        const shiftHistory = await getRosterShiftHistoryByShiftId(shift.roster_shift_id!);
        const assignmentHistory = await getRosterShiftAssignmentHistoryByShiftId(shift.roster_shift_id!);
        return {
          shift,
          activeAssignments,
          removedAssignments,
          shiftHistory,
          assignmentHistory
        };
      })
    );

    res.json({
      roster,
      shifts: detailedShifts
    });
  } catch (error) {
    console.error('Error fetching detailed roster view:', error);
    res.status(500).json({ message: 'Server error while fetching detailed roster view' });
  }
};