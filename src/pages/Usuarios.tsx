import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import usuarioService from '../services/usuarioService';
import ImportModal from '../components/users/ImportModal';
import UserFormModal from '../components/users/UserFormModal';
import type { Usuario } from '../types/usuario';
import { useTheme } from '../context/ThemeContext';
import {
    Mail,
    User,
    Upload,
    Plus
} from 'lucide-react';

export default function UsuariosPage() {
    const { theme } = useTheme();
    const [isDark, setIsDark] = useState(() => {
        if (theme === 'dark') return true;
        if (theme === 'light') return false;
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchText, setSearchText] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchUsuarios();
    }, []);

    // Actualizar isDark cuando cambia el theme
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

    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const data = await usuarioService.getAll();
            if (Array.isArray(data)) {
                setUsuarios(data);
            } else {
                console.error('Error: usuarioService.getAll() did not return an array', data);
                setUsuarios([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsuarios([]);
        } finally {
            setLoading(false);
        }
    };


    // Filter logic
    const filteredUsuarios = usuarios.filter((user) => {
        if (!searchText) return true;
        const search = searchText.toLowerCase();
        return (
            user.nombre.toLowerCase().includes(search) ||
            user.idUsuario.toLowerCase().includes(search) || // Was cedula
            user.username.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search)
        );
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Helper for status badge
    const getStatusBadge = (status: string) => {
        const isActive = status === 'ACTIVO';
        return (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                isActive 
                    ? (isDark ? 'bg-green-300 text-green-900' : 'bg-green-100 text-green-800')
                    : (isDark ? 'bg-gray-300 text-gray-900' : 'bg-red-100 text-red-800')
            }`}>
                {isActive ? 'Activo' : 'Inactivo'}
            </span>
        );
    };

    // Helper for role badge (Tipo)
    const getRoleBadge = (tipo: string) => {
        let colorClass = isDark ? 'bg-gray-300 text-gray-900' : 'bg-gray-100 text-gray-800';
        switch (tipo) {
            case 'ESTUDIANTE':
                colorClass = isDark ? 'bg-blue-300 text-blue-900' : 'bg-blue-100 text-blue-800';
                break;
            case 'PROFESOR':
                colorClass = isDark ? 'bg-purple-300 text-purple-900' : 'bg-purple-100 text-purple-800';
                break;
            case 'COORDINADOR':
                colorClass = isDark ? 'bg-indigo-300 text-indigo-900' : 'bg-indigo-100 text-indigo-800';
                break;
            case 'ADMINISTRADOR':
                colorClass = isDark ? 'bg-yellow-300 text-yellow-900' : 'bg-yellow-100 text-yellow-800';
                break;
        }
        return (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
                {tipo}
            </span>
        );
    };

    return (
        <MainLayout title="GESTIÓN DE USUARIOS">
            <div className="w-full mx-auto">

                {/* Controls */}
                <div className={`p-4 rounded-lg shadow-sm mb-6 border flex flex-col md:flex-row justify-between items-center gap-4 ${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'}`}>
                    <div className="w-full md:w-1/2">
                        <SearchBar
                            value={searchText}
                            onChange={setSearchText}
                            placeholder="Buscar por nombre, cédula, usuario..."
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className={`flex items-center justify-center px-4 py-2 border rounded-md transition-colors w-full md:w-auto ${
                                isDark 
                                    ? 'border-blue-500 text-blue-400 hover:bg-blue-950/50' 
                                    : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                            }`}
                        >
                            <Upload size={18} className="mr-2" />
                            Importar Masivo
                        </button>
                        <button
                            onClick={() => setIsUserModalOpen(true)}
                            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors w-full md:w-auto ${
                                isDark 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            <Plus size={18} className="mr-2" />
                            Crear usuario
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-red-700' : 'border-red-900'}`}></div>
                    </div>
                ) : (
                    <div className={`shadow overflow-hidden sm:rounded-lg border ${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'}`}>
                        <table className="min-w-full divide-y divide-border">
                            <thead className={isDark ? 'bg-red-950/30' : 'bg-gray-50'}>
                                <tr>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Usuario</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Contacto</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Rol</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Estatus</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y divide-border ${isDark ? 'bg-[#630000]' : 'bg-white'}`}>
                                {currentItems.map((user) => (
                                    <tr key={user.username} className={`transition-colors ${isDark ? 'hover:bg-red-950/50' : 'hover:bg-gray-50'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isDark ? 'bg-red-950/50 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                                                    <User size={20} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.nombre}</div>
                                                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                <Mail size={14} className={isDark ? 'text-gray-400' : 'text-gray-400'} /> {user.email}
                                            </div>
                                            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>CI: {user.idUsuario}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(user.tipoUsuario)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(user.estatus)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Future: Add Edit/View buttons */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Empty State */}
                        {currentItems.length === 0 && (
                            <div className={`px-6 py-10 text-center ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                No se encontraron usuarios.
                            </div>
                        )}

                        {/* Pagination */}
                        <div className={`px-6 py-4 border-t ${isDark ? 'border-red-800/50' : 'border-gray-200'}`}>
                            <Pagination
                                currentPage={currentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredUsuarios.length}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </div>

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={fetchUsuarios}
            />

            <UserFormModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSuccess={fetchUsuarios}
            />
        </MainLayout>
    );
}
