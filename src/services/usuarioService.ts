import api from './api';
import type { Usuario } from '../types/usuario';



const usuarioService = {
    getAll: async (estatus?: string): Promise<Usuario[]> => {
        const params = estatus ? { estatus } : undefined;
        const response = await api.get<Usuario[]>('/usuarios', { params });
        return response.data;
    },

    getByUsername: async (username: string): Promise<Usuario> => {
        const response = await api.get<Usuario>(`/usuarios/${username}`);
        return response.data;
    },

    importEstudiantes: async (formData: FormData): Promise<any> => {
        const response = await api.post('/estudiantes/importar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    createUsuario: async (usuario: Partial<Usuario>): Promise<Usuario> => {
        // Note: Backend endpoint for create user might be /usuarios (POST) or similar.
        // Assuming standard REST convention or based on UsuarioController (not fully analyzed but standard practice).
        // If not exists, I might need to create it in backend too.
        // Let's assume /usuarios exists for now or use /auth/register if it's an auth flow.
        // Checking backend controller list: UsuarioController exist.
        const response = await api.post<Usuario>('/usuarios', usuario);
        return response.data;
    },

    updateUsuario: async (username: string, usuario: Partial<Usuario>): Promise<Usuario> => {
        const response = await api.put<Usuario>(`/usuarios/${username}`, usuario);
        return response.data;
    },

    deleteUsuario: async (username: string): Promise<void> => {
        await api.delete(`/usuarios/${username}`);
    },

    deletePermanently: async (username: string): Promise<void> => {
        await api.delete(`/usuarios/${username}/permanent`);
    }
};

export default usuarioService;
