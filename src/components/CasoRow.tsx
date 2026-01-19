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
        <tr className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-red-950/30' : 'hover:bg-gray-50'}`} onClick={onClick}>
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
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    caso.estatus === 'ABIERTO' 
                        ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800')
                        : caso.estatus === 'CERRADO' 
                        ? (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800')
                        : caso.estatus === 'EN PAUSA' 
                        ? (isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                        : (isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800')
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
                    className={`p-0 ${isDark ? 'text-red-300 hover:text-red-200' : 'text-red-900 hover:text-red-700'}`}
                >
                    Ver Detalles
                </Button>
            </td>
        </tr>
    );
}
