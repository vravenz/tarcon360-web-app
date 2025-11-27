import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  FaPlus, FaTrash, FaEye, FaEdit, FaUserClock, FaThumbtack, FaBan, 
  FaCalendarCheck, FaTimesCircle, FaUndo, FaCheckCircle, FaHandshake, 
  FaUserTie, FaClipboardList, FaCheck, FaThumbsUp, FaSearch, 
  FaPaperPlane, FaDownload, FaLock, FaSyncAlt, FaMinus,
} from 'react-icons/fa';

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'outline' | 'transparent' | 'link';
  color?: 'submit' | 'delete' | 'edit' | 'view' | 'dormant';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  icon?: 'plus' | 'trash' | 'view' | 'edit' | 'dormant' | 'shortlist' | 'reject' | 'schedule' | 'cancel' | 'undo' | 'result' | 'offer' | 'employee' | 'cv' | 'tick' | 'accept' | 'search' | 'send' | 'download' | 'lock' | 'refresh' | 'minus';
  marginRight?: string; // New prop for icon margin-right
  marginLeft?: string;  // New prop for icon margin-left
  position?: 'left' | 'center' | 'right'; // New prop for content alignment
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  type = 'button',
  onClick,
  variant,
  color,
  size = 'medium',
  disabled = false,
  icon,
  marginRight,
  marginLeft,
  position = 'center', // default position center
}) => {
  const { theme } = useTheme();

  // Alignment classes based on position prop
  const positionClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[position];

  const baseClasses = `flex items-center ${positionClasses} rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-200`;

  // Sizes
  const sizeClasses = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-5 py-3 text-base',
    large: 'px-6 py-4 text-lg',
    xlarge: 'px-8 py-5 text-xl',
  };

  // Colors based on theme
  const colorClasses = {
    submit: theme === 'dark'
      ? 'bg-[#3C8D72] text-black hover:bg-[#4EA888]' 
      : 'bg-[#3DAF7C] text-white hover:bg-[#47C08B]',
    delete: theme === 'dark'
      ? 'bg-[#B85050] text-black hover:bg-[#D16666]' 
      : 'bg-[#E34747] text-white hover:bg-[#F25858]',
    edit: theme === 'dark'
      ? 'bg-[#D79B46] text-black hover:bg-[#E0AD63]' 
      : 'bg-[#F1A832] text-white hover:bg-[#F5BA54]',
    view: theme === 'dark'
      ? 'bg-[#4579B4] text-black hover:bg-[#5B91D0]' 
      : 'bg-[#3498DB] text-white hover:bg-[#5DADE2]',
    dormant: theme === 'dark'
      ? 'bg-[#5C6975] text-black hover:bg-[#75838F]' 
      : 'bg-[#A0AEC0] text-white hover:bg-[#C2CCD7]',
  };

  // Variant-specific styles
  const variantClasses = {
    outline: `border-2 ${
      theme === 'dark' ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'
    }`,
    transparent: 'bg-transparent',
    link: `${theme === 'dark' ? 'text-dark-text' : 'text-light-text'} underline bg-transparent hover:bg-light-hover dark:hover:bg-dark-hover`,
  };

  // Disabled styles
  const disabledClasses = disabled
    ? 'bg-gray-400 text-black opacity-50 cursor-not-allowed'
    : '';

  // Icons mapping
  const iconMap = {
    plus: <FaPlus />,
    trash: <FaTrash />,
    view: <FaEye />,
    edit: <FaEdit />,
    dormant: <FaUserClock />,
    shortlist: <FaThumbtack />,
    reject: <FaBan />,
    schedule: <FaCalendarCheck />,
    cancel: <FaTimesCircle />,
    undo: <FaUndo />,
    result: <FaCheckCircle />,
    offer: <FaHandshake />,
    employee: <FaUserTie />,
    cv: <FaClipboardList />,
    tick: <FaCheck />,
    accept: <FaThumbsUp />,
    search: <FaSearch />,
    send: <FaPaperPlane />,
    download: <FaDownload />,
    lock: <FaLock />,
    refresh: <FaSyncAlt />,
    minus: <FaMinus />, 
  };

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${disabledClasses || (color ? colorClasses[color] : variantClasses[variant || 'outline'])}
    ${className}
  `;

  return (
    <button
      className={buttonClasses}
      onClick={!disabled ? onClick : undefined}
      type={type}
      disabled={disabled}
    >
      {icon && (
        <span style={{ marginRight, marginLeft }}>
          {iconMap[icon]}
        </span>
      )}
      {children}
    </button>
  );
};

export default Button;
