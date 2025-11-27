// pages/protected/roaster/AssignmentTreeChart.tsx

import React from 'react';

// IMPORTANT: remove the .then((mod) => mod.default)
import dynamic from 'next/dynamic';

// If you do the old pattern: .then((mod) => mod.default)
// that can cause "_interop_require_default._ is not a function" in Next
const Tree = dynamic(() => import('react-d3-tree'), {
  ssr: false,
});

// ----------------------
// Type Definitions
// ----------------------
export interface Assignment {
  roster_shift_assignment_id: number;
  company_id: number;
  roster_shift_id: number;
  roster_employee_id: number;
  assignment_start_time?: string;
  assignment_end_time?: string;
  actual_worked_hours?: number;
  assignment_status: string;
  employee_shift_status: string;
  first_name: string;
  last_name: string;
  employee_photo?: string;
}

export interface RemovedAssignment extends Assignment {
  removal_id: number;
  removed_at: string;
  removal_reason?: string;
}

export interface RosterShift {
  roster_shift_id: number;
  shift_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  break_time?: any;
  shift_status?: string;
}

export interface DetailedShift {
  shift: RosterShift;
  activeAssignments: Assignment[];
  removedAssignments: RemovedAssignment[];
}

// ----------------------
// Helper Functions
// ----------------------

// Formats a date string into "MM/DD/YYYY hh:mm AM/PM"
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString([], {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
  return `${formattedDate} ${formattedTime}`;
};

// Formats a time string (e.g. "09:00:00") into "9:00 AM"
export const formatTime = (timeString: string): string => {
  if (!timeString) return '-';
  let timeWithDate = timeString;
  if (!timeString.includes('T')) {
    timeWithDate = `1970-01-01T${timeString}`;
  }
  const date = new Date(timeWithDate);
  if (isNaN(date.getTime())) return timeString;
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

// ----------------------
// Build the Tree Data
// ----------------------
interface TreeNode {
  name: string;
  attributes?: { [key: string]: string };
  children?: TreeNode[];
  photo?: string;
}

const buildAssignmentTreeData = (shiftData: DetailedShift): TreeNode => {
  const activeNodes: TreeNode[] = shiftData.activeAssignments.map((assignment) => ({
    name: `${assignment.first_name} ${assignment.last_name}`,
    attributes: {
      'Start Time': assignment.assignment_start_time
        ? formatDateTime(assignment.assignment_start_time)
        : '-',
      'End Time': assignment.assignment_end_time
        ? formatDateTime(assignment.assignment_end_time)
        : '-',
    },
    photo: assignment.employee_photo,
  }));

  const removedNodes: TreeNode[] = shiftData.removedAssignments.map((assignment) => ({
    name: `${assignment.first_name} ${assignment.last_name}`,
    attributes: {
      'Removed At': formatDateTime(assignment.removed_at),
      Reason: assignment.removal_reason || '-',
    },
    photo: assignment.employee_photo,
  }));

  return {
    name: `Shift on ${formatDateTime(shiftData.shift.shift_date)}`,
    attributes: {
      'Scheduled Time': `${formatTime(shiftData.shift.scheduled_start_time)} - ${formatTime(
        shiftData.shift.scheduled_end_time
      )}`,
      Status: shiftData.shift.shift_status || '-',
    },
    children: [
      { name: 'Active Assignments', children: activeNodes },
      { name: 'Removed Assignments', children: removedNodes },
    ],
  };
};

// ----------------------
// Custom Node Renderer
// ----------------------
interface CustomNodeProps {
  nodeDatum: TreeNode;
  toggleNode: () => void;
}

const renderNodeWithPhoto = ({ nodeDatum, toggleNode }: CustomNodeProps) => {
  return (
    <g>
      <circle r="15" fill="#fff" stroke="steelblue" onClick={toggleNode} />
      {nodeDatum.photo && (
        <image
          href={nodeDatum.photo}
          x="-15"
          y="-15"
          height="30"
          width="30"
          clipPath="circle(15px at 15px 15px)"
        />
      )}
      <text fill="black" strokeWidth="1" x="20" dy="-5">
        {nodeDatum.name}
      </text>
      {nodeDatum.attributes &&
        Object.entries(nodeDatum.attributes).map(([key, value], idx) => (
          <text key={idx} fill="gray" x="20" dy={`${15 + idx * 15}`}>
            {key}: {value}
          </text>
        ))}
    </g>
  );
};

// ----------------------
// Main Component
// ----------------------
interface AssignmentTreeChartProps {
  shift: DetailedShift;
}

const AssignmentTreeChart: React.FC<AssignmentTreeChartProps> = ({ shift }) => {
  const treeData = buildAssignmentTreeData(shift);
  const containerStyles: React.CSSProperties = { width: '100%', height: '500px' };

  return (
    <div style={containerStyles}>
      <Tree
        data={treeData}
        orientation="vertical"
        renderCustomNodeElement={(rd3tProps: unknown) =>
          renderNodeWithPhoto(rd3tProps as CustomNodeProps)
        }
        translate={{ x: 200, y: 50 }}
      />
    </div>
  );
};

export default AssignmentTreeChart;
