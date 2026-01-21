import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    isVisible,
    onClose,
    duration = 3000
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5" />;
            case 'error': return <AlertCircle className="w-5 h-5" />;
            case 'warning': return <AlertCircle className="w-5 h-5" />; // Or a specific warning icon if available
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getStyles = () => {
        if (isDark) {
            switch (type) {
                case 'success': return 'bg-green-900/80 border-green-700 text-green-100';
                case 'error': return 'bg-red-900/80 border-red-700 text-red-100';
                case 'warning': return 'bg-yellow-900/80 border-yellow-700 text-yellow-100';
                default: return 'bg-blue-900/80 border-blue-700 text-blue-100';
            }
        } else {
            switch (type) {
                case 'success': return 'bg-green-100 border-green-500 text-green-800';
                case 'error': return 'bg-red-100 border-red-500 text-red-800';
                case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
                default: return 'bg-blue-100 border-blue-500 text-blue-800';
            }
        }
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center p-4 mb-4 rounded-lg border shadow-lg transition-all transform duration-300 ease-in-out ${getStyles()} animate-slide-up-fade`}>
            <div className="inline-flex items-center justify-center shrink-0">
                {getIcon()}
            </div>
            <div className="ml-3 text-sm font-medium mr-4">
                {message}
            </div>
            <button
                type="button"
                className={`ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                onClick={onClose}
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
