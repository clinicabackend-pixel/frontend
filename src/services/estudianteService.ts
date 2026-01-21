import api from './api';

export interface EstudianteInfo {
    username: string;
    cedula: string;
    nombre: string;
    apellido?: string;
    termino?: string;
    tipoDeEstudiante?: string;
    nrc?: number;
    semestre?: string;
    seccion?: string;
}

const estudianteService = {
    getActiveStudents: async (conCasos?: boolean): Promise<EstudianteInfo[]> => {
        const params: any = { activo: true };
        if (conCasos) params.conCasos = true;
        const response = await api.get('/estudiantes', { params });
        return response.data;
    },

    getAllStudents: async (): Promise<EstudianteInfo[]> => {
        const response = await api.get('/estudiantes');
        return response.data;
    }
};

export default estudianteService;
