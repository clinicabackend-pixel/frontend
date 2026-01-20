import api from './api';
import type { CasoCreateRequest, CasoDetalleResponse, CasoSummary, AccionCreateRequest, EncuentroCreateRequest, PruebaCreateRequest } from '../types/caso';

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
    }
};

export default casoService;
