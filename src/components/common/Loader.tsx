import React from 'react';

interface LoaderProps {
    fullScreen?: boolean;
    text?: string;
    className?: string;
    isDark?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ fullScreen = false, text = 'Cargando...', className = '', isDark = false }) => {
    const containerClasses = fullScreen
        ? `fixed inset-0 ${isDark ? 'bg-red-900/80' : 'bg-white/80'} backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4`
        : `flex flex-col items-center justify-center p-8 ${className}`;

    return (
        <div className={containerClasses}>
            <div className={`animate-spin rounded-full h-12 w-12 border-4 ${isDark ? 'border-red-800 border-t-red-300' : 'border-gray-200 border-t-red-900'} mb-4 shadow-sm`}></div>
            {text && <p className={`${isDark ? 'text-white' : 'text-black'} font-medium animate-pulse`}>{text}</p>}
        </div>
    );
};

export default Loader;
