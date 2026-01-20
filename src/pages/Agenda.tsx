import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import estudianteService, { type EstudianteInfo } from '../services/estudianteService'; // type-only import
import { useTheme } from '../context/ThemeContext';
import {
    User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AgendaPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark'; // Simplified check, ideally use the logic like in Usuarios or hook

    // Theme logic copy (to ensure consistency, or refactor to hook later)
    const [darkMode, setDarkMode] = useState(isDark);
    useEffect(() => {
        if (theme === 'dark') setDarkMode(true);
        else if (theme === 'light') setDarkMode(false);
        else if (typeof window !== 'undefined') {
            setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }, [theme]);

    const [estudiantes, setEstudiantes] = useState<EstudianteInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    const itemsPerPage = 10;

    useEffect(() => {
        fetchAgenda();
    }, []);

    const fetchAgenda = async () => {
        setLoading(true);
        try {
            // Fetch students WHO HAVE CASES (conCasos=true)
            const data = await estudianteService.getActiveStudents(true);
            setEstudiantes(data);
        } catch (error) {
            console.error('Error fetching agenda:', error);
            setEstudiantes([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredEstudiantes = estudiantes.filter((est) => {
        if (!searchText) return true;
        const search = searchText.toLowerCase();
        return (
            est.nombre.toLowerCase().includes(search) ||
            est.cedula.toLowerCase().includes(search) ||
            est.username.toLowerCase().includes(search)
        );
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEstudiantes.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <MainLayout title="AGENDA DE ESTUDIANTES CON CASOS">
            <div className="w-full mx-auto">

                {/* Controls */}
                <div className={`p-4 rounded-lg shadow-sm mb-6 border flex flex-col md:flex-row justify-between items-center gap-4 ${darkMode ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'}`}>
                    <div className="w-full md:w-1/2">
                        <SearchBar
                            value={searchText}
                            onChange={setSearchText}
                            placeholder="Buscar estudiante..."
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-red-700' : 'border-red-900'}`}></div>
                    </div>
                ) : (
                    <div className={`shadow overflow-hidden sm:rounded-lg border ${darkMode ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'}`}>
                        <table className={`min-w-full divide-y ${darkMode ? 'divide-red-800/50' : 'divide-gray-200'}`}>
                            <thead className={darkMode ? 'bg-red-950/30' : 'bg-gray-50'}>
                                <tr>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Estudiante</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Cédula</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Casos Asignados</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-red-800/50 bg-[#630000]' : 'divide-gray-200 bg-white'}`}>
                                {currentItems.map((est) => (
                                    <tr 
                                        key={est.username} 
                                        onClick={() => navigate(`/casos?username=${est.username}`)}
                                        className={`transition-colors cursor-pointer ${darkMode ? 'hover:bg-red-950/50' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-red-950/50 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                                                    <User size={20} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{est.nombre} {est.apellido}</div>
                                                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>@{est.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{est.cedula}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {/* Ideally we show count of cases or a link. Since backend only filters, we assume > 0 */}
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                                                Activo con Casos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/casos?username=${est.username}`);
                                                }}
                                                className={`${darkMode ? 'text-white hover:text-gray-200' : 'text-blue-600 hover:text-blue-900'}`}
                                            >
                                                Ver Casos
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Empty State */}
                        {currentItems.length === 0 && (
                            <div className={`px-6 py-10 text-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                No hay estudiantes con casos asignados en el término actual.
                            </div>
                        )}

                        {/* Pagination */}
                        <div className={`px-6 py-4 border-t ${darkMode ? 'border-red-800/50' : 'border-gray-200'}`}>
                            <Pagination
                                currentPage={currentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredEstudiantes.length}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
