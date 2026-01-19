import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import Button from './common/Button';
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
        <tr className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-red-950/30' : 'hover:bg-gray-50'}`} onClick={onClick}>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-red-950/50 text-red-300' : 'bg-red-100 text-red-900'}`}>
                            {solicitante.nombre.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{solicitante.nombre} {solicitante.apellido || ''}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{solicitante.trabaja ? 'Trabaja' : 'No trabaja'}</div>
                    </div>
                </div>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                {solicitante.cedula}
            </td>

            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                <div className="flex flex-col">
                    <span>{solicitante.telfCelular || solicitante.telfCasa}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{solicitante.email}</span>
                </div>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isDark ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                    {solicitante.estadoCivil}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditClick();
                        }}
                        className={`rounded-full border-none p-2 h-8 w-8 ${isDark ? 'bg-red-950/50 text-red-300 hover:bg-red-950/70 hover:text-red-400' : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-900'}`}
                        title="Ver Detalle / Editar"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEncuestaClick(solicitante);
                        }}
                        className={`rounded-full border-none p-2 h-8 w-8 ${isDark ? 'bg-red-950/50 text-red-300 hover:bg-red-950/70 hover:text-red-400' : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-900'}`}
                        title="Encuesta"
                    >
                        <FontAwesomeIcon icon={faFileAlt} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}
