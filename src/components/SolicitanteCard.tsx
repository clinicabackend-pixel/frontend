import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope, faIdCard } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import type { SolicitanteResponse } from '../types/solicitante';

interface SolicitanteCardProps {
    solicitante: SolicitanteResponse;
    onClick?: () => void;
    onEncuestaClick?: () => void;
}

function SolicitanteCard({ solicitante, onClick, onEncuestaClick }: SolicitanteCardProps) {
    const { theme } = useTheme();
    const [isDark, setIsDark] = useState(false);
    const nombreCompleto = `${solicitante.nombre} ${solicitante.apellido || ''}`.trim();

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
        <div
            onClick={onClick}
            className={`rounded-xl shadow-md border p-5 hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col justify-between ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
        >
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                        <div className="h-14 flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg min-w-10 ${isDark ? 'bg-gray-700 text-white' : 'bg-red-50 text-red-900'}`}>
                                {nombreCompleto.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <div className="min-h-14 flex items-center">
                                <h3 className={`text-lg font-bold line-clamp-2 w-full group-hover:transition-colors ${isDark ? 'text-white group-hover:text-white' : 'text-gray-800 group-hover:text-red-900'}`}>
                                    {nombreCompleto}
                                </h3>
                            </div>
                            <div className={`flex items-center text-sm gap-1 ${isDark ? 'text-white' : 'text-gray-500'}`}>
                                <FontAwesomeIcon icon={faIdCard} className={`w-3 h-3 ${isDark ? 'text-white' : ''}`} />
                                <span>{solicitante.cedula}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mt-4">
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-white' : 'text-gray-600'}`}>
                        <FontAwesomeIcon icon={faPhone} className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-400'}`} />
                        <span>{solicitante.telfCelular || solicitante.telfCasa || 'No registrado'}</span>
                    </div>

                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-white' : 'text-gray-600'}`}>
                        <FontAwesomeIcon icon={faEnvelope} className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-400'}`} />
                        <span className="truncate" title={solicitante.email}>{solicitante.email || 'No registrado'}</span>
                    </div>


                </div>
            </div>

            <div className={`mt-4 pt-3 border-t flex justify-between items-center text-xs ${isDark ? 'border-gray-700 text-white' : 'border-gray-100 text-gray-500'}`}>
                <div className="flex flex-col gap-2">
                    <span className={isDark ? 'text-white' : ''}>{solicitante.estadoCivil}</span>
                    <span className={`px-2 py-1 rounded-full w-fit text-xs font-semibold ${solicitante.trabaja ? (isDark ? 'bg-green-300 text-green-900' : 'bg-green-100 text-green-800') : (isDark ? 'bg-gray-300 text-gray-900' : 'bg-gray-100 text-gray-800')}`}>
                        {solicitante.trabaja ? 'Trabaja' : 'No trabaja'}
                    </span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEncuestaClick && onEncuestaClick();
                    }}
                    className={`px-3 py-1 rounded transition-colors ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600 hover:text-gray-200' : 'bg-red-50 text-red-900 hover:bg-red-100'}`}
                >
                    <FontAwesomeIcon icon={faIdCard} className={`mr-1 ${isDark ? 'text-white' : ''}`} />
                    Encuesta
                </button>
            </div>
        </div>
    );
}

export default SolicitanteCard;
