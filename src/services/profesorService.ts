import api from './api';

export interface ProfesorInfo {
    username: string;
    cedula: string;
    nombre: string;
    apellido?: string;
    termino?: string;
    email?: string;
}

const profesorService = {
    getAllProfesores: async (): Promise<ProfesorInfo[]> => {
        const response = await api.get('/profesores');
        return response.data;
    }
};

export default profesorService;
