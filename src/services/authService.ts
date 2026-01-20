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
        const response = await api.get<User>('/auth/me');
        return response.data;
    },

    logout: (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('user');
        // O limpia todo si prefieres: localStorage.clear();
    },
};
