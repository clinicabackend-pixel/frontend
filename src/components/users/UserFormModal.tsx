import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import usuarioService from '../../services/usuarioService';
import catalogoService from '../../services/catalogoService';
import type { Usuario } from '../../types/usuario';
import type { Semestre } from '../../types/catalogo';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UserFormModal({ isOpen, onClose, onSuccess }: UserFormModalProps) {
    const [formData, setFormData] = useState<Partial<Usuario>>({
        username: '',
        email: '',
        nombre: '',
        idUsuario: '', // Cedula
        tipoUsuario: 'ESTUDIANTE',
        estatus: 'ACTIVO',
        termino: ''
    });
    const [semestres, setSemestres] = useState<Semestre[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSemestres();
        }
    }, [isOpen]);

    const fetchSemestres = async () => {
        try {
            const data = await catalogoService.getSemestres();
            setSemestres(data);
        } catch (error) {
            console.error('Error fetching semestres:', error);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Adapt formData to backend expectations if needed.
            // Backend Usuario: username, cedula (idUsuario?), nombre, email, status, tipo, contrasena
            // Frontend type Usuario: username, idUsuario (cedula), nombre, email, estatus, tipoUsuario

            const payload: any = {
                ...formData,
                cedula: formData.idUsuario, // Map idUsuario to cedula for backend if needed, or keep consistent
                status: formData.estatus,
                tipo: formData.tipoUsuario,
                termino: formData.termino || undefined // Include semester if present
            };

            await usuarioService.createUsuario(payload);
            onSuccess();
            onClose();
            setFormData({
                username: '',
                email: '',
                nombre: '',
                idUsuario: '',
                tipoUsuario: 'ESTUDIANTE',
                estatus: 'ACTIVO',
                termino: ''
            });
        } catch (err) {
            console.error('Error creating user:', err);
            setError('Error al crear usuario. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    const showSemester = formData.tipoUsuario === 'ESTUDIANTE' || formData.tipoUsuario === 'PROFESOR';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white backdrop-blur-md rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 bg-red-900">
                        <h3 className="text-xl font-bold text-white">Crear Nuevo Usuario</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 text-white hover:text-gray-200 transition-colors duration-200"
                            aria-label="Cerrar modal"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="overflow-y-auto bg-white p-6 flex-1">
                        {error && (
                            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Usuario (Username)</label>
                                    <input type="text" name="username" required value={formData.username} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cédula</label>
                                    <input type="text" name="idUsuario" required value={formData.idUsuario} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                                    <select name="tipoUsuario" value={formData.tipoUsuario} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2">
                                        <option value="ESTUDIANTE">Estudiante</option>
                                        <option value="PROFESOR">Profesor</option>
                                        <option value="COORDINADOR">Coordinador</option>
                                        <option value="ADMINISTRADOR">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Estatus</label>
                                    <select name="estatus" value={formData.estatus} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2">
                                        <option value="ACTIVO">Activo</option>
                                        <option value="INACTIVO">Inactivo</option>
                                    </select>
                                </div>
                            </div>
                            {showSemester && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Semestre</label>
                                    <select
                                        name="termino"
                                        value={formData.termino || ''}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                        required={showSemester}
                                    >
                                        <option value="">Seleccione un semestre</option>
                                        {semestres.map(sem => (
                                            <option key={sem.termino} value={sem.termino}>
                                                {sem.nombre || sem.termino}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Si no selecciona uno, se asignará el semestre activo automáticamente.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Guardar Usuario'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
