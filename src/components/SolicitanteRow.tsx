import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
// import Button from './common/Button';
import type { SolicitanteResponse } from '../types/solicitante';

interface SolicitanteRowProps {
    solicitante: SolicitanteResponse;
    onClick: () => void;
    onEncuestaClick: (solicitante: SolicitanteResponse) => void;
    onEditClick: () => void;
}

export default function SolicitanteRow({ solicitante, onClick, onEncuestaClick, onEditClick }: SolicitanteRowProps) {
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
        <tr className={`transition-all duration-200 border-b last:border-none hover:shadow-sm ${isDark ? 'hover:bg-gray-700 border-gray-700' : 'border-gray-200 hover:bg-white'}`} onClick={onClick}>
            <td className="px-6 py-5 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isDark ? 'bg-gray-700 text-white' : 'bg-red-100 text-red-900'}`}>
                            {solicitante.nombre.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {solicitante.apellido && solicitante.apellido.trim() && solicitante.apellido !== solicitante.nombre
                                ? `${solicitante.nombre} ${solicitante.apellido}`
                                : solicitante.nombre}
                        </div>
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{solicitante.trabaja ? 'Trabaja' : 'No trabaja'}</div>
                    </div>
                </div>
            </td>
            <td className={`px-6 py-5 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {solicitante.cedula}
            </td>

            <td className={`px-6 py-5 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{solicitante.telfCelular || solicitante.telfCasa}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{solicitante.email}</span>
                </div>
            </td>
            <td className={`px-6 py-5 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isDark ? 'bg-indigo-300 text-indigo-900' : 'bg-indigo-100 text-indigo-800'}`}>
                    {solicitante.estadoCivil}
                </span>
            </td>
            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-3 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditClick();
                        }}
                        className={`p-2 rounded-full transition-colors ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-400 hover:text-red-800 hover:bg-red-50'}`}
                        title="Ver Detalle"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEncuestaClick(solicitante);
                        }}
                        className={`p-2 rounded-full transition-colors ${isDark ? 'text-gray-300 hover:text-white hover:bg-red-950/50' : 'text-gray-400 hover:text-blue-800 hover:bg-blue-50'}`}
                        title="Encuesta"
                    >
                        <FontAwesomeIcon icon={faFileAlt} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
