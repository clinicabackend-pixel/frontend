import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faUser,
    faEnvelope,
    faIdCard,
    faShieldAlt,
    faCheckCircle,
    faTimesCircle,
    faEdit,
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/common/Button';
import usuarioService from '../services/usuarioService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import EditUserModal from '../components/users/EditUserModal';
import type { Usuario } from '../types/usuario';
import Loader from '../components/common/Loader';

export default function UsuarioDetalle() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user: currentUser } = useAuth();
    const isDark = theme === 'dark';
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Por ahora el botón está disponible para todos, más adelante se implementará control por roles
    const canEdit = true;

    useEffect(() => {
        if (username) {
            loadUsuario(username);
        }
    }, [username]);

    const loadUsuario = async (usernameParam: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await usuarioService.getByUsername(usernameParam);
            setUsuario(data);
        } catch (err) {
            console.error('Error cargando usuario:', err);
            setError('No se pudo cargar la información del usuario.');
        } finally {
            setLoading(false);
        }
    };

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
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full border ${colorClass}`}>
                {tipo}
            </span>
        );
    };

    if (loading) {
        return (
            <MainLayout title="Cargando...">
                <Loader text="Cargando información del usuario..." isDark={isDark} />
            </MainLayout>
        );
    }

    if (error || !usuario) {
        return (
            <MainLayout title="Error">
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p className={`text-xl font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                        {error || 'Usuario no encontrado'}
                    </p>
                    <Button onClick={() => navigate('/usuarios')} variant="primary">
                        Volver a la lista
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title={`Usuario: ${usuario.username}`}>
            <div className="max-w-4xl mx-auto w-full pb-20 animate-fade-in-up">
                {/* Top Actions */}
                <div className="flex justify-between items-center mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/usuarios')}
                        className={`${isDark ? 'text-white hover:text-black' : 'text-gray-600 hover:text-red-900'} pl-0`}
                        icon={faArrowLeft}
                    >
                        Volver
                    </Button>
                    {canEdit && (
                        <Button
                            variant="primary"
                            onClick={() => setIsEditModalOpen(true)}
                            icon={faEdit}
                            className={isDark ? 'bg-red-950 hover:bg-red-900' : ''}
                        >
                            Modificar Información
                        </Button>
                    )}
                </div>

                {/* Header Card */}
                <div className={`${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'} rounded-xl shadow-md border p-6 mb-6`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Avatar */}
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${isDark ? 'bg-red-950/50 text-red-300' : 'bg-red-100 text-red-900'}`}>
                            {(usuario.nombre && usuario.nombre.length > 0) ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {usuario.nombre || 'Sin nombre'}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <FontAwesomeIcon icon={faIdCard} className="text-sm" />
                                    <span className="text-sm">@{usuario.username || 'N/A'}</span>
                                </div>
                                <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <FontAwesomeIcon icon={faIdCard} className="text-sm" />
                                    <span className="text-sm">CI: {usuario.idUsuario || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status and Role Badges */}
                        <div className="flex flex-col gap-2 items-end">
                            {getStatusBadge(usuario.estatus || 'INACTIVO')}
                            {getRoleBadge(usuario.tipoUsuario || 'ESTUDIANTE')}
                        </div>
                    </div>
                </div>

                {/* Details Card */}
                <div className={`${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'} rounded-xl shadow-md border p-6`}>
                    <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Información del Usuario
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email */}
                        <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-950/30 border-red-800/50' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-red-800/50 text-red-300' : 'bg-red-100 text-red-900'}`}>
                                    <FontAwesomeIcon icon={faEnvelope} />
                                </div>
                                <div>
                                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Correo Electrónico
                                    </p>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {usuario.email || 'Sin email'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sexo */}
                        <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-950/30 border-red-800/50' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-red-800/50 text-red-300' : 'bg-red-100 text-red-900'}`}>
                                    <FontAwesomeIcon icon={faUser} />
                                </div>
                                <div>
                                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Sexo
                                    </p>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {usuario.sexo || 'No especificado'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Username */}
                        <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-950/30 border-red-800/50' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-red-800/50 text-red-300' : 'bg-red-100 text-red-900'}`}>
                                    <FontAwesomeIcon icon={faIdCard} />
                                </div>
                                <div>
                                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Nombre de Usuario
                                    </p>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {usuario.username}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ID Usuario */}
                        <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-950/30 border-red-800/50' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-red-800/50 text-red-300' : 'bg-red-100 text-red-900'}`}>
                                    <FontAwesomeIcon icon={faIdCard} />
                                </div>
                                <div>
                                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Cédula de Identidad
                                    </p>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {usuario.idUsuario}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info Section */}
                    <div className={`mt-6 pt-6 border-t ${isDark ? 'border-red-800/50' : 'border-gray-100'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className={`text-xs uppercase tracking-wide mb-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                    Rol en el Sistema
                                </p>
                                <div className="flex items-center gap-2">
                                    {getRoleBadge(usuario.tipoUsuario)}
                                </div>
                            </div>
                            <div>
                                <p className={`text-xs uppercase tracking-wide mb-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                    Estado de la Cuenta
                                </p>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(usuario.estatus)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    if (username) {
                        loadUsuario(username);
                    }
                }}
                usuario={usuario}
            />
        </MainLayout>
    );
}
