import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import usuarioService from '../services/usuarioService';
import ImportModal from '../components/users/ImportModal';
import UserFormModal from '../components/users/UserFormModal';
import type { Usuario } from '../types/usuario';
import {
    Mail,
    User,
    Upload,
    Plus,
    Trash2
} from 'lucide-react';

export default function UsuariosPage() {
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

    const handleDelete = async (username: string) => {
        if (window.confirm(`¿Estás seguro de que deseas desactivar al usuario ${username}?`)) {
            try {
                await usuarioService.deleteUsuario(username);
                // Refresh list
                await fetchUsuarios();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Hubo un error al intentar desactivar el usuario.');
            }
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
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                {isActive ? 'Activo' : 'Inactivo'}
            </span>
        );
    };

    // Helper for role badge (Tipo)
    const getRoleBadge = (tipo: string) => {
        let colorClass = 'bg-gray-100 text-gray-800';
        switch (tipo) {
            case 'ESTUDIANTE':
                colorClass = 'bg-blue-100 text-blue-800';
                break;
            case 'PROFESOR':
                colorClass = 'bg-purple-100 text-purple-800';
                break;
            case 'COORDINADOR':
                colorClass = 'bg-indigo-100 text-indigo-800';
                break;
            case 'ADMINISTRADOR':
                colorClass = 'bg-yellow-100 text-yellow-800';
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
                <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
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
                            className="flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors w-full md:w-auto"
                        >
                            <Upload size={18} className="mr-2" />
                            Importar Masivo
                        </button>
                        <button
                            onClick={() => setIsUserModalOpen(true)}
                            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full md:w-auto"
                        >
                            <Plus size={18} className="mr-2" />
                            Crear usuario
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.map((user) => (
                                    <tr key={user.username} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                                    <User size={20} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                                                    <div className="text-sm text-gray-500">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 flex items-center gap-2">
                                                <Mail size={14} className="text-gray-400" /> {user.email}
                                            </div>
                                            <div className="text-sm text-gray-500">CI: {user.idUsuario}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(user.tipoUsuario)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(user.estatus)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDelete(user.username)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                    title="Desactivar usuario"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Empty State */}
                        {currentItems.length === 0 && (
                            <div className="px-6 py-10 text-center text-gray-500">
                                No se encontraron usuarios.
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200">
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
