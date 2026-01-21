import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import usuarioService from '../../services/usuarioService';
import type { Usuario } from '../../types/usuario';


interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    usuario: Usuario | null;
}

export default function EditUserModal({ isOpen, onClose, onSuccess, usuario }: EditUserModalProps) {

    const [formData, setFormData] = useState<Partial<Usuario>>({
        nombre: '',
        email: '',
        username: '',
        idUsuario: '',
        tipoUsuario: 'ESTUDIANTE',
        estatus: 'ACTIVO',
        sexo: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (usuario && isOpen) {
            setFormData({
                nombre: usuario.nombre || '',
                email: usuario.email || '',
                username: usuario.username || '',
                idUsuario: usuario.idUsuario || '',
                tipoUsuario: usuario.tipoUsuario || 'ESTUDIANTE',
                estatus: usuario.estatus || 'ACTIVO',
                sexo: usuario.sexo || ''
            });
        }
    }, [usuario, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuario?.username) return;

        setLoading(true);
        setError('');

        try {
            const payload: any = {
                cedula: formData.idUsuario,
                nombre: formData.nombre,
                email: formData.email,
                username: formData.username,
                sexo: formData.sexo,
                estatus: formData.estatus,
                tipoUsuario: formData.tipoUsuario
            };

            await usuarioService.updateUsuario(usuario.username, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating user:', err);
            setError(err.response?.data?.message || 'Error al actualizar usuario. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white backdrop-blur-md rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 bg-red-900 border-b border-red-800">
                        <h3 className="text-xl font-bold text-white">Modificar Usuario</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 text-white hover:text-gray-200 transition-colors duration-200"
                            aria-label="Cerrar modal"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 p-6 bg-white">
                        {error && (
                            <div className="mb-4 p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Nombre Completo</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    required
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md shadow-sm sm:text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md shadow-sm sm:text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 p-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Usuario (Username)</label>
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md shadow-sm sm:text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Cédula</label>
                                    <input
                                        type="text"
                                        name="idUsuario"
                                        required
                                        value={formData.idUsuario}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md shadow-sm sm:text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 p-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Sexo</label>
                                <select
                                    name="sexo"
                                    value={formData.sexo}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md shadow-sm sm:text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 p-2"
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Rol</label>
                                    <select
                                        name="tipoUsuario"
                                        value={formData.tipoUsuario}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md shadow-sm sm:text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 p-2"
                                    >
                                        <option value="ESTUDIANTE">Estudiante</option>
                                        <option value="PROFESOR">Profesor</option>
                                        <option value="COORDINADOR">Coordinador</option>
                                        <option value="ADMINISTRADOR">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Estatus</label>
                                    <select
                                        name="estatus"
                                        value={formData.estatus}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md shadow-sm sm:text-sm border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 p-2"
                                    >
                                        <option value="ACTIVO">Activo</option>
                                        <option value="INACTIVO">Inactivo</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 bg-red-900 hover:bg-red-950"
                            >
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
