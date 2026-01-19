import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';

interface ReportCardProps {
    title: string;
    description: string;
    icon: any;
    children: React.ReactNode;
    onDownload: () => void;
    loading: boolean;
    fileType?: 'PDF' | 'EXCEL';
}

const ReportCard = ({ title, description, icon, children, onDownload, loading, fileType = 'EXCEL' }: ReportCardProps) => {
    const { theme } = useTheme();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (theme === 'dark') {
            setIsDark(true);
        } else if (theme === 'light') {
            setIsDark(false);
        } else {
            if (typeof window !== 'undefined') {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                setIsDark(mediaQuery.matches);
                const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
                mediaQuery.addEventListener('change', handler);
                return () => mediaQuery.removeEventListener('change', handler);
            }
        }
    }, [theme]);

    return (
        <div className={`rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full ${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'}`}>
            <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-red-800/50 bg-red-900/30' : 'border-gray-100 bg-gray-50/50'}`}>
                <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
                <div className={`p-2 rounded-lg ${fileType === 'PDF' ? (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-50 text-red-900') : (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-50 text-green-900')}`}>
                    <FontAwesomeIcon icon={icon} className="text-xl" />
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${fileType === 'PDF' ? (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800') : (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800')}`}>
                        {fileType}
                    </span>
                </div>
                <p className={`text-sm mb-4 h-10 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{description}</p>
                <div className="space-y-4 flex-1">
                    {children}
                </div>
                <div className={`mt-6 pt-4 border-t ${isDark ? 'border-red-800/50' : 'border-gray-50'}`}>
                <button
                    onClick={onDownload}
                    disabled={loading}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm text-white flex items-center justify-center gap-2 transition-colors
                        ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : fileType === 'PDF'
                                ? 'bg-red-900 hover:bg-red-800 active:bg-red-950 shadow-sm'
                                : 'bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-sm'}`}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generando...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faDownload} />
                            Descargar {fileType}
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
    );
};

export default ReportCard;
