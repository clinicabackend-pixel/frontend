import api from './api';

export interface LoginCredentials {
    username: string;
    password?: string;
}

export interface AuthResponse {
    jwt: string;
}

export interface User {
    idUsuario: string; // was cedula
    nombre: string;
    sexo: string;
    email: string;
    username: string;
    estatus: string; // was status
    tipoUsuario: string; // was tipo
}

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<any>('/auth/me');
        // El backend devuelve 'idUsuario' pero el frontend espera 'cedula'
        // Mapear idUsuario -> cedula
        return {
            cedula: response.data.idUsuario || response.data.cedula || '',
            nombre: response.data.nombre || '',
            sexo: response.data.sexo || '',
            email: response.data.email || '',
            username: response.data.username || '',
            status: response.data.estatus || response.data.status || '',
            tipo: response.data.tipoUsuario || response.data.tipo || ''
        };
    },

    logout: (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('user');
        // O limpia todo si prefieres: localStorage.clear();
    },
};
