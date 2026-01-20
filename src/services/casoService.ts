
import api from './api';
import type {
    CasoCreateRequest,
    CasoDetalleResponse,
    CasoSummary,
    AccionCreateRequest,
    EncuentroCreateRequest,
    PruebaCreateRequest,
} from '../types/caso';
// Assuming these are added to types/caso.ts as per previous step, or we use `any` if temporarily needed, 
// but best to use the types we just defined.
import type { Tribunal, Materia, Solicitante } from '../types/caso';

const casoService = {
    create: async (data: CasoCreateRequest): Promise<CasoDetalleResponse> => {
        const response = await api.post<CasoDetalleResponse>('/casos', data);
        return response.data;
    },

    update: async (id: string, data: any): Promise<void> => {
        await api.put(`/casos/${id}`, data);
    },

    addBeneficiario: async (id: string, data: any): Promise<void> => {
        await api.post(`/casos/${id}/beneficiarios`, data);
    },

    updateBeneficiario: async (id: string, cedula: string, data: { tipoBeneficiario: string; parentesco: string }) => {
        await api.patch(`/casos/${id}/beneficiarios/${cedula}`, data);
    },

    createAccion: async (id: string, data: AccionCreateRequest): Promise<void> => {
        await api.post(`/casos/${id}/acciones`, data);
    },

    createEncuentro: async (id: string, data: EncuentroCreateRequest): Promise<void> => {
        await api.post(`/casos/${id}/encuentros`, data);
    },

    createPrueba: async (id: string, data: PruebaCreateRequest): Promise<void> => {
        await api.post(`/casos/${id}/pruebas`, data);
    },

    getAll: async (estatus?: string, username?: string, termino?: string): Promise<CasoSummary[]> => {
        const params = new URLSearchParams();
        if (estatus) params.append('estatus', estatus);
        if (username) params.append('username', username);
        if (termino) params.append('termino', termino);

        const response = await api.get<CasoSummary[]>(`/casos?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string): Promise<CasoDetalleResponse> => {
        const response = await api.get<CasoDetalleResponse>(`/casos/${id}`);
        return response.data;
    },

    assignStudent: async (id: string, data: { username: string; termino: string }): Promise<void> => {
        await api.post(`/casos/${id}/asignacion`, data);
    },

    assignSupervisor: async (id: string, data: { username: string; termino: string }): Promise<void> => {
        await api.post(`/casos/${id}/supervision`, data);
    },

    unassignStudent: async (id: string, username: string, termino: string): Promise<void> => {
        await api.delete(`/casos/${id}/asignacion/estudiante/${username}/termino/${termino}`);
    },

    // --- Added Missing Methods ---

    getTribunales: async (): Promise<Tribunal[]> => {
        // Assuming endpoint exists, otherwise this will fail at runtime. 
        // If not, we might need to mock or use a generic 'master-data' endpoint.
        const response = await api.get<Tribunal[]>('/tribunales');
        return response.data;
    },

    getMaterias: async (): Promise<Materia[]> => {
        const response = await api.get<Materia[]>('/materias');
        return response.data;
    },

    getSolicitanteByCedula: async (cedula: string): Promise<Solicitante> => {
        const response = await api.get<Solicitante>(`/solicitantes/${cedula}`);
        return response.data;
    }
};

export default casoService;
