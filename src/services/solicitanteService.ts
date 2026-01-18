import api from './api';
import type { SolicitanteRequest, SolicitanteResponse } from '../types';
import type { EncuestaResponse } from '../types/encuesta_response';
import type { CasoSummary } from '../types/caso';

// La interfaz Solicitante ahora coincide directamente con SolicitanteRequest
export type Solicitante = SolicitanteRequest;

export interface SolicitanteConRespuesta extends SolicitanteResponse {
    // Interfaz opcional para cuando necesitemos la respuesta completa
}

const solicitanteService = {
    getAll: async (activeCasesOnly: boolean = false, role: string = 'TODOS') => {
        let url = '/solicitantes?';
        if (activeCasesOnly) url += 'activeCases=true&';
        if (role && role !== 'TODOS') url += `role=${role}`;

        const response = await api.get<SolicitanteResponse[]>(url);
        return response.data;
    },

    getByCedula: async (cedula: string) => {
        const response = await api.get<SolicitanteResponse>(`/solicitantes/${cedula}`);
        return response.data;
    },

    create: async (data: SolicitanteRequest) => {
        // Aseguramos que la cédula se use como ID si es necesario por el backend
        // El backend espera un objeto Solicitante
        const response = await api.post('/solicitantes', data);
        return response.data;
    },

    update: async (cedula: string, data: SolicitanteRequest) => {
        const response = await api.put(`/solicitantes/${cedula}`, data);
        return response.data;
    },

    delete: async (cedula: string) => {
        const response = await api.delete(`/solicitantes/${cedula}`);
        return response.data;
    },

    getEncuesta: async (cedula: string) => {
        const response = await api.get<EncuestaResponse>(`/solicitantes/${cedula}/encuesta-resumen`);
        return response.data;
    },

    getEncuestaEdicion: async (cedula: string) => {
        const response = await api.get<import('../types/encuesta').DatosEncuestaResponse>(`/solicitantes/${cedula}/encuesta`);
        return response.data;
    },

    saveEncuesta: async (cedula: string, data: import('../types/encuesta').DatosEncuestaRequest) => {
        const response = await api.post(`/solicitantes/${cedula}/encuesta`, data);
        return response.data;
    },

    getCasosTitular: async (cedula: string) => {
        const response = await api.get<CasoSummary[]>(`/solicitantes/${cedula}/casos-titular`);
        return response.data;
    },

    getCasosBeneficiario: async (cedula: string) => {
        const response = await api.get<CasoSummary[]>(`/solicitantes/${cedula}/casos-beneficiario`);
        return response.data;
    },
};

export default solicitanteService;
