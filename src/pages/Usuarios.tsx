import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import usuarioService from '../services/usuarioService';
import ImportModal from '../components/users/ImportModal';
import UserFormModal from '../components/users/UserFormModal';
import type { Usuario } from '../types/usuario';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    Mail,
    User,
    Upload,
    Plus,
    MoreVertical,
    Trash2,
    CheckCircle,
    X
} from 'lucide-react';

export default function UsuariosPage() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user: currentUser } = useAuth();
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
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
    const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const itemsPerPage = 10;

    useEffect(() => {
        fetchUsuarios();
    }, []);

    // Resetear página cuando cambia el texto de búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText]);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId && menuRefs.current[openMenuId]) {
                if (!menuRefs.current[openMenuId]?.contains(event.target as Node)) {
                    setOpenMenuId(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

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
                // Ordenar de manera estable: primero por nombre, luego por username como desempate
                // Esto asegura que la posición no cambie cuando se actualiza el estatus
                const usuariosOrdenados = [...data].sort((a, b) => {
                    // Primero por nombre
                    const nombreCompare = (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' });
                    if (nombreCompare !== 0) return nombreCompare;
                    // Si el nombre es igual, ordenar por username
                    return (a.username || '').localeCompare(b.username || '', 'es', { sensitivity: 'base' });
                });
                setUsuarios(usuariosOrdenados);
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
            (user.nombre || '').toLowerCase().includes(search) ||
            (user.idUsuario || '').toLowerCase().includes(search) || // Was cedula
            (user.username || '').toLowerCase().includes(search) ||
            (user.email || '').toLowerCase().includes(search)
        );
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleDeleteClick = (user: Usuario, e: React.MouseEvent) => {
        e.stopPropagation();
        setUserToDelete(user);
        setDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const handleConfirmToggleStatus = async () => {
        if (!userToDelete) return;
        
        try {
            const nuevoEstatus = userToDelete.estatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
            // Actualizar solo el estatus, manteniendo todos los demás campos intactos
            await usuarioService.updateUsuario(userToDelete.username, { 
                estatus: nuevoEstatus,
                nombre: userToDelete.nombre,
                email: userToDelete.email,
                idUsuario: userToDelete.idUsuario,
                tipoUsuario: userToDelete.tipoUsuario,
                username: userToDelete.username,
                sexo: userToDelete.sexo
            });
            // Recargar la lista de usuarios
            await fetchUsuarios();
            setDeleteModalOpen(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Error cambiando estatus del usuario:', error);
            const accion = userToDelete.estatus === 'ACTIVO' ? 'desactivar' : 'activar';
            alert(`Error al ${accion} el usuario. Por favor, intente nuevamente.`);
        }
    };

    const toggleMenu = (username: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === username ? null : username);
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
                            Importar
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
                                    <tr 
                                        key={user.username} 
                                        className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-red-950/50' : 'hover:bg-gray-50'}`}
                                        onClick={() => navigate(`/usuarios/${user.username}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isDark ? 'bg-red-950/50 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                                                    <User size={20} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.nombre || 'Sin nombre'}</div>
                                                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>@{user.username || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                <Mail size={14} className={isDark ? 'text-gray-400' : 'text-gray-400'} /> {user.email || 'Sin email'}
                                            </div>
                                            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>CI: {user.idUsuario || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(user.tipoUsuario || 'ESTUDIANTE')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(user.estatus || 'INACTIVO')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="relative" ref={(el) => { menuRefs.current[user.username] = el; }}>
                                                <button
                                                    onClick={(e) => toggleMenu(user.username, e)}
                                                    className={`p-2 rounded-md transition-colors ${
                                                        isDark
                                                            ? 'text-gray-300 hover:text-white hover:bg-red-950/50'
                                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                    }`}
                                                    title="Opciones"
                                                >
                                                    <MoreVertical size={20} />
                                                </button>
                                                
                                                {openMenuId === user.username && (currentUser?.tipo === 'COORDINADOR' || currentUser?.tipo === 'ADMINISTRADOR') && (
                                                    <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                                                        isDark ? 'bg-[#630000] border border-red-800/50' : 'bg-white border border-gray-200'
                                                    }`}>
                                                        <div className="py-1">
                                                            <button
                                                                onClick={(e) => handleDeleteClick(user, e)}
                                                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                                                                    user.estatus === 'ACTIVO'
                                                                        ? (isDark
                                                                            ? 'text-red-300 hover:bg-red-950/50 hover:text-red-200'
                                                                            : 'text-red-600 hover:bg-red-50 hover:text-red-900')
                                                                        : (isDark
                                                                            ? 'text-green-300 hover:bg-green-950/50 hover:text-green-200'
                                                                            : 'text-green-600 hover:bg-green-50 hover:text-green-900')
                                                                }`}
                                                            >
                                                                {user.estatus === 'ACTIVO' ? (
                                                                    <>
                                                                        <Trash2 size={16} />
                                                                        Desactivar Usuario
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle size={16} />
                                                                        Activar Usuario
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
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

            {/* Modal de Confirmación de Activación/Desactivación */}
            {deleteModalOpen && userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white backdrop-blur-md rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-slide-up-modal">
                        <div className={`flex items-center justify-between p-4 ${
                            userToDelete.estatus === 'ACTIVO' ? 'bg-red-900' : 'bg-green-900'
                        }`}>
                            <h3 className="text-xl font-bold text-white">
                                {userToDelete.estatus === 'ACTIVO' ? 'Confirmar Desactivación' : 'Confirmar Activación'}
                            </h3>
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setUserToDelete(null);
                                }}
                                className="p-1 text-white hover:text-gray-200 transition-colors duration-200"
                                aria-label="Cerrar modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto bg-white p-6">
                            <p className="text-gray-700 mb-4">
                                ¿Está seguro de que desea {userToDelete.estatus === 'ACTIVO' ? 'desactivar' : 'activar'} al usuario <strong>{userToDelete.nombre}</strong> ({userToDelete.username})?
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                {userToDelete.estatus === 'ACTIVO' 
                                    ? 'El usuario será desactivado y no podrá acceder al sistema. Esta acción puede revertirse activando el usuario nuevamente.'
                                    : 'El usuario será activado y podrá acceder al sistema nuevamente.'}
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setDeleteModalOpen(false);
                                        setUserToDelete(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmToggleStatus}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                                        userToDelete.estatus === 'ACTIVO' 
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {userToDelete.estatus === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
