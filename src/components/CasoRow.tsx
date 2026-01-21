import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import Button from './common/Button';
import type { CasoSummary } from '../types/caso';

interface CasoRowProps {
    caso: CasoSummary;
    materia: string;
    onClick: () => void;
}

export default function CasoRow({ caso, materia, onClick }: CasoRowProps) {
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
        <tr className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={onClick}>
            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {caso.numCaso}
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{caso.nombreSolicitante}</div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{caso.cedula}</div>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                {materia}
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                {new Date(caso.fechaRecepcion).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    caso.estatus === 'ABIERTO' 
                        ? (isDark ? 'bg-green-300 text-green-900' : 'bg-green-100 text-green-800')
                        : caso.estatus === 'CERRADO' 
                        ? (isDark ? 'bg-gray-300 text-gray-900' : 'bg-gray-100 text-gray-800')
                        : caso.estatus === 'EN PAUSA' 
                        ? (isDark ? 'bg-yellow-300 text-yellow-900' : 'bg-yellow-100 text-yellow-800')
                        : (isDark ? 'bg-blue-300 text-blue-900' : 'bg-blue-100 text-blue-800')
                }`}>
                    {caso.estatus}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button
                    variant="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                    className={`p-0 ${isDark ? 'text-white hover:text-gray-200' : 'text-red-900 hover:text-red-700'}`}
                >
                    Ver Detalles
                </Button>
            </td>
        </tr>
    );
}
