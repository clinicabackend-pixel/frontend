
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
import type { Materia, Solicitante } from '../types/caso';
import type { Tribunal } from '../types/catalogo';

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

    updateAccion: async (id: string, idAccion: number, data: { fechaEjecucion?: string; titulo?: string; descripcion?: string }): Promise<void> => {
        await api.patch(`/casos/${id}/acciones/${idAccion}`, data);
    },

    createEncuentro: async (id: string, data: EncuentroCreateRequest): Promise<void> => {
        await api.post(`/casos/${id}/encuentros`, data);
    },

    createPrueba: async (id: string, data: PruebaCreateRequest): Promise<void> => {
        await api.post(`/casos/${id}/pruebas`, data);
    },

    deletePrueba: async (idCaso: string, idPrueba: number): Promise<void> => {
        await api.delete(`/casos/${idCaso}/pruebas/${idPrueba}`);
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

    unassignSupervisor: async (id: string, username: string, termino: string): Promise<void> => {
        await api.delete(`/casos/${id}/supervision/profesor/${username}/termino/${termino}`);
    },

    // --- Added Missing Methods ---

    getTribunales: async (): Promise<Tribunal[]> => {
        const response = await api.get<Tribunal[]>('/catalogos/tribunales');
        return response.data;
    },

    getMaterias: async (): Promise<Materia[]> => {
        // Map AmbitoLegalResponse to Materia
        const response = await api.get<any[]>('/catalogos/ambitos-legales');
        // Assuming backend returns a tree or list. 
        // If it returns a tree, we might need to flatten it or just pick the top level.
        // For now, let's assume simple list or map what we can. 
        // If `AmbitoLegalResponse` has { id: number, nombre: string }, map it.
        return response.data.map(item => ({
            idMateria: item.id || item.idAmbito || 0, // Fallback
            nombreMateria: item.nombre || item.descripcion || ''
        }));
    },

    getSolicitanteByCedula: async (cedula: string): Promise<Solicitante> => {
        const response = await api.get<Solicitante>(`/solicitantes/${cedula}`);
        return response.data;
    },

    updateEstatus: async (id: string, nuevoEstatus: string, observacion?: string): Promise<void> => {
        await api.patch(`/casos/${id}/estatus`, {
            estatus: nuevoEstatus,
            observacion
        });
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/casos/${id}`);
    }
};

export default casoService;
