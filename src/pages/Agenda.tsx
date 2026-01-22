import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import casoService from '../services/casoService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    Briefcase, ArrowUp, ArrowDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AccionResponse } from '../types/caso';

interface AccionPendiente extends AccionResponse {
    numCaso: string;
    sintesisCaso?: string;
    nombreSolicitante?: string;
}

export default function AgendaPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';

    // Theme logic copy (to ensure consistency, or refactor to hook later)
    const [darkMode, setDarkMode] = useState(isDark);
    useEffect(() => {
        if (theme === 'dark') setDarkMode(true);
        else if (theme === 'light') setDarkMode(false);
        else if (typeof window !== 'undefined') {
            setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }, [theme]);

    const [accionesPendientes, setAccionesPendientes] = useState<AccionPendiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchText, setSearchText] = useState('');
    const [ordenFecha, setOrdenFecha] = useState<'nueva' | 'vieja'>('nueva'); // 'nueva' = más reciente primero, 'vieja' = más antigua primero
    const navigate = useNavigate();

    const itemsPerPage = 10;

    // Obtener username del usuario
    const username = user?.username || localStorage.getItem('username') || '';

    useEffect(() => {
        if (username || user?.tipoUsuario === 'COORDINADOR' || user?.tipoUsuario === 'PROFESOR') {
            fetchAccionesPendientes();
        }
    }, [username, user]);

    const fetchAccionesPendientes = async () => {
        setLoading(true);
        try {
            const puedeVerTodosLosCasos = user?.tipoUsuario === 'COORDINADOR' || user?.tipoUsuario === 'ADMINISTRADOR' || user?.tipoUsuario === 'PROFESOR';
            const currentUsername = user?.username || username;
            const userFilter = (currentUsername && !puedeVerTodosLosCasos) ? currentUsername : undefined;

            if (!currentUsername && !puedeVerTodosLosCasos) {
                setAccionesPendientes([]);
                setLoading(false);
                return;
            }

            // Obtener todos los casos del usuario
            const todosCasos = await casoService.getAll(undefined, userFilter, undefined);

            // Obtener acciones pendientes de todos los casos
            const acciones: AccionPendiente[] = [];

            // Procesar casos en lotes para mejorar rendimiento
            const tamanoLote = 20;
            for (let i = 0; i < todosCasos.length; i += tamanoLote) {
                const lote = todosCasos.slice(i, i + tamanoLote);

                const promesas = lote.map(async (caso) => {
                    try {
                        const casoDetalle = await casoService.getById(caso.numCaso);
                        // Filtrar solo acciones pendientes (sin fechaEjecucion o fechaEjecucion vacía)
                        const accionesPendientes = (casoDetalle.acciones || []).filter((accion: AccionResponse) =>
                            !accion.fechaEjecucion || accion.fechaEjecucion.trim() === ''
                        );

                        return accionesPendientes.map((accion: AccionResponse) => ({
                            ...accion,
                            numCaso: caso.numCaso,
                            sintesisCaso: caso.sintesis || '',
                            nombreSolicitante: caso.nombreSolicitante || ''
                        }));
                    } catch (error) {
                        console.error(`Error cargando caso ${caso.numCaso}:`, error);
                        return [];
                    }
                });

                const resultados = await Promise.all(promesas);
                resultados.forEach(accionesCaso => {
                    acciones.push(...accionesCaso);
                });
            }

            // Ordenar por fecha de registro (más recientes primero)
            acciones.sort((a, b) => {
                const fechaA = new Date(a.fechaRegistro);
                const fechaB = new Date(b.fechaRegistro);
                return fechaB.getTime() - fechaA.getTime();
            });

            setAccionesPendientes(acciones);
        } catch (error) {
            console.error('Error fetching acciones pendientes:', error);
            setAccionesPendientes([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredAcciones = accionesPendientes.filter((accion) => {
        if (!searchText) return true;
        const search = searchText.toLowerCase();
        return (
            accion.titulo.toLowerCase().includes(search) ||
            accion.descripcion?.toLowerCase().includes(search) ||
            accion.numCaso.toLowerCase().includes(search) ||
            accion.nombreSolicitante?.toLowerCase().includes(search)
        );
    });

    // Función helper para parsear fechas locales
    const parseLocalDate = (dateString: string): Date => {
        const partes = dateString.split('-');
        if (partes.length === 3) {
            const año = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const dia = parseInt(partes[2], 10);
            return new Date(año, mes, dia);
        }
        return new Date(dateString);
    };

    // Sort logic
    const sortedAcciones = [...filteredAcciones].sort((a, b) => {
        const fechaA = parseLocalDate(a.fechaRegistro).getTime();
        const fechaB = parseLocalDate(b.fechaRegistro).getTime();
        return ordenFecha === 'nueva' ? fechaB - fechaA : fechaA - fechaB;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedAcciones.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const toggleOrdenFecha = () => {
        setOrdenFecha(prev => prev === 'nueva' ? 'vieja' : 'nueva');
        setCurrentPage(1); // Resetear a la primera página al cambiar el orden
    };

    return (
        <MainLayout title="AGENDA DE ACCIONES PENDIENTES">
            <div className="w-full mx-auto">

                {/* Controls */}
                <div className={`p-4 rounded-lg shadow-sm mb-6 border flex flex-col md:flex-row justify-between items-center gap-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="w-full md:w-1/2">
                        <SearchBar
                            value={searchText}
                            onChange={setSearchText}
                            placeholder="Buscar por título, caso, solicitante..."
                            isDark={darkMode}
                        />
                    </div>
                    <button
                        onClick={toggleOrdenFecha}
                        className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 text-sm font-medium ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        title={ordenFecha === 'nueva' ? 'Ordenar: Más antigua primero' : 'Ordenar: Más nueva primero'}
                    >
                        {ordenFecha === 'nueva' ? (
                            <>
                                <ArrowDown size={16} />
                                <span>Más nueva</span>
                            </>
                        ) : (
                            <>
                                <ArrowUp size={16} />
                                <span>Más vieja</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-red-900' : 'border-red-900'}`}></div>
                    </div>
                ) : (
                    <div className={`shadow overflow-hidden sm:rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            <thead className={darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}>
                                <tr>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Acción</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Caso</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Solicitante</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Fecha Registro</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                                {currentItems.map((accion) => (
                                    <tr
                                        key={`${accion.numCaso}-${accion.idAccion}`}
                                        onClick={() => navigate(`/casos/${accion.numCaso}`)}
                                        className={`transition-colors cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                                                    <Briefcase size={20} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{accion.titulo}</div>
                                                    {accion.descripcion && (
                                                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-2`}>
                                                            {accion.descripcion}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{accion.numCaso}</div>
                                            {accion.sintesisCaso && (
                                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} line-clamp-1`}>
                                                    {accion.sintesisCaso}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {accion.nombreSolicitante || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {parseLocalDate(accion.fechaRegistro).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/casos/${accion.numCaso}`);
                                                }}
                                                className={`${darkMode ? 'text-white hover:text-gray-200' : 'text-blue-600 hover:text-blue-900'}`}
                                            >
                                                Ver Caso
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Empty State */}
                        {currentItems.length === 0 && (
                            <div className={`px-6 py-10 text-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {searchText
                                    ? 'No se encontraron acciones pendientes que coincidan con la búsqueda.'
                                    : 'No hay acciones pendientes en los casos asignados.'}
                            </div>
                        )}

                        {/* Pagination */}
                        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <Pagination
                                currentPage={currentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={sortedAcciones.length}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
