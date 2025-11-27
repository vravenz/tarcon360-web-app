// src/components/Modal.tsx
import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    size: 'small' | 'medium' | 'large' | 'xl';
    children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, size, children }) => {
    const { theme } = useTheme();

    const sizeClass = {
        small: 'max-w-md',
        medium: 'max-w-lg',
        large: 'max-w-xl',
        xl: 'max-w-5xl'
    };

    const backgroundClass = theme === 'dark' ? 'bg-dark-background' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-white' : 'text-gray-700';
    const closeButtonColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-700';

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50`} onClick={onClose}>
        <div
            className={`${backgroundClass} ${textClass} p-5 rounded shadow-lg ${sizeClass[size]} w-full relative`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: size === 'xl' ? '50%' : undefined }} // Debug with inline style
        >
            <button className={`absolute top-2 right-2 ${closeButtonColor}`} onClick={onClose}>
                ×
            </button>
            {children}
        </div>
    </div>,
        document.body
    );
};

export default Modal;
