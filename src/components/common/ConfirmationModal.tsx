import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info' | 'warning';
    isLoading?: boolean;
    showCancel?: boolean;
}

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    isLoading = false,
    showCancel = true
}: ConfirmationModalProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        if (isLoading) return;
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-900 text-xl" />;
            case 'warning':
                return <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 text-xl" />;
            default:
                return <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 text-xl" />;
        }
    };

    const getIconBg = () => {
        switch (variant) {
            case 'danger': return 'bg-red-50';
            case 'warning': return 'bg-yellow-50';
            default: return 'bg-blue-50';
        }
    };

    const getConfirmBtnClass = () => {
        switch (variant) {
            case 'danger': return 'bg-red-900 hover:bg-red-800 focus:ring-red-900';
            case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600';
            default: return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600';
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-60 flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div className={`relative w-full max-w-md bg-white rounded-xl shadow-2xl transform transition-all duration-300 overflow-hidden ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getIconBg()} flex items-center justify-center`}>
                            {getIcon()}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    {showCancel && (
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-white hover:border-gray-400 transition-colors focus:outline-none disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-white font-medium text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:shadow-none translate-y-0 active:translate-y-0.5 ${getConfirmBtnClass()}`}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Procesando...
                            </span>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
