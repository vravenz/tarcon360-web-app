import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
    FaUsers, FaProjectDiagram, FaMapMarkedAlt, FaCog, FaCalendarAlt, 
    FaFileInvoiceDollar, FaBook, FaTrash, FaUserClock, FaUserShield, 
    FaUserPlus, FaUserSlash 
} from 'react-icons/fa';
import { 
    MdWork, MdVisibility, MdPlaylistAddCheck, MdEventNote, MdLocalOffer 
} from 'react-icons/md';

interface NavSubItem {
    label: string;
    path: string;
    icon?: JSX.Element;
    subItems?: NavSubItem[];
}

type SideNavItemType = {
    [key: string]: NavSubItem[];
};

const sideNavItems: SideNavItemType = {
    '/workspace/employees': [
        { label: 'Add', path: '/workspace/staff-application', icon: <FaUsers /> },
        { label: 'View', path: '/workspace/employees', icon: <FaUsers /> },
        { label: 'Trashed', path: '/workspace/employees/deleted-employees', icon: <FaTrash /> },
        { label: 'Dormant', path: '/workspace/employees/dormant-employees', icon: <FaUserClock /> },
        { label: 'Guard Groups', path: '/workspace/employees/guard-groups', icon: <FaUserShield /> },
    ],
    '/workspace/subcontractors': [
        { label: 'Add', path: '/workspace/subcontractors/add', icon: <FaUserPlus /> },
        { label: 'View', path: '/workspace/subcontractors', icon: <FaUsers /> },
        { label: 'Deleted', path: '/workspace/subcontractors/removed', icon: <FaUserSlash /> },
    ],
    '/dashboard': [
        { label: 'Teams', path: '/dashboard/teams', icon: <FaUsers /> },
        { label: 'Projects', path: '/dashboard/projects', icon: <FaProjectDiagram /> },
    ],
    '/recruitment': [
        { label: 'Create Job', path: '/recruitment/create-job', icon: <MdWork /> },
        { label: 'Applications', path: '/recruitment/applications', icon: <MdVisibility /> },
        { label: 'Shortlisted', path: '/recruitment/shortlisted', icon: <MdPlaylistAddCheck /> },
        { label: 'Interviews', path: '/recruitment/interviews', icon: <MdEventNote /> },
        { label: 'Job Offers', path: '/recruitment/job-offers', icon: <MdLocalOffer /> }
    ],
    '/clients': [
        { label: 'Client List', path: '/clients', icon: <FaUsers /> },
        { label: 'Add Client', path: '/clients/add', icon: <FaCog /> },
    ],
    '/sites': [
        { label: 'Site List', path: '/sites', icon: <FaMapMarkedAlt /> },
        { label: 'Add Site', path: '/sites/add', icon: <FaMapMarkedAlt /> }
    ],    
    '/rosters': [
        { label: 'Add Roster', path: '/rosters/add', icon: <FaCalendarAlt /> },
        { label: 'Guards Roster', path: '/rosters/guards', icon: <FaCalendarAlt /> },
        { label: 'Client Roster', path: '/rosters/schedule', icon: <FaCalendarAlt /> },
    ],
    '/events': [
        { label: 'Event Calendar', path: '/events/calendar', icon: <FaCalendarAlt /> },
        { label: 'Create Event', path: '/events/create', icon: <FaBook /> },
    ],
    '/finance': [
        { label: 'Overview', path: '/finance/overview', icon: <FaFileInvoiceDollar /> },
        { label: 'Reports', path: '/finance/reports', icon: <FaBook /> },
    ],
    '/reports': [
        { label: 'Monthly', path: '/reports/monthly', icon: <FaBook /> },
        { label: 'Yearly', path: '/reports/yearly', icon: <FaBook /> },
    ],
};

const SideNavbar = () => {
    const location = useLocation();
    const { theme } = useTheme();

    const findClosestNavKey = (path: string) => {
        // First, check if the current path matches any item within a group.
        for (const key of Object.keys(sideNavItems)) {
          const group = sideNavItems[key];
          if (group.some(item => item.path === path)) {
            return key;
          }
        }
      
        // If no exact match is found, fall back to prefix matching.
        for (const key of Object.keys(sideNavItems)) {
          if (path.startsWith(key)) {
            return key;
          }
        }
      
        return '/';
      };
      

    const currentNavKey = findClosestNavKey(location.pathname);
    const items = sideNavItems[currentNavKey] || [];

    const backgroundColorClass = theme === 'dark' ? 'bg-dark-cardBackground' : 'bg-light-cardBackground';
    const textColorClass = theme === 'dark' ? 'text-dark-text' : 'text-light-text';
    const hoverBackgroundClass = theme === 'dark' ? 'hover:bg-dark-hover' : 'hover:bg-light-hover';
    const borderColorClass = theme === 'dark' ? 'border-dark-border' : 'border-light-border';

    return (
        <div className={`w-36 h-full ${backgroundColorClass} shadow-md rounded-lg`}>
            <ul>
                {items.map((item: NavSubItem, index: number) => (
                    
                    <Link
                        to={item.path}
                        key={index}
                        className={`flex flex-col items-center justify-center transition-colors duration-300 ease-in-out p-4 ${hoverBackgroundClass} ${textColorClass} ${
                            index !== items.length - 1 ? `border-b ${borderColorClass}` : ''
                        }`}
                    >
                        {item.icon && <span className="text-lg mb-2">{item.icon}</span>}
                        <div className="text-sm">{item.label}</div>
                        {item.subItems && (
                            <ul className={`${backgroundColorClass} transition-colors duration-300 ease-in-out shadow-md rounded mt-1`}>
                                {item.subItems.map(sub => (
                                    <li key={sub.label}>
                                        <Link to={sub.path} className={`block px-4 py-2 text-sm ${hoverBackgroundClass} ${textColorClass}`}>
                                            {sub.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Link>
                ))}
            </ul>
        </div>
    );
};

export default SideNavbar;
