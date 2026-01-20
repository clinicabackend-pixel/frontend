import api from './api';

export interface Documento {
    idDocumento: number;
    numCaso: string;
    fechaRegistro: string;
    folioIni: number;
    folioFin: number;
    titulo: string;
    observacion: string;
    username: string;
}

export interface DocumentoCreateRequest {
    numCaso: string;
    titulo: string;
    observacion?: string;
    folioIni?: number;
    folioFin?: number;
}

const documentoService = {
    getByCaso: async (numCaso: string): Promise<Documento[]> => {
        const response = await api.get<Documento[]>(`/documentos/caso/${numCaso}`);
        return response.data;
    },

    create: async (data: DocumentoCreateRequest): Promise<Documento> => {
        const response = await api.post<Documento>('/documentos', data);
        return response.data;
    },

    delete: async (numCaso: string, idDocumento: number): Promise<void> => {
        await api.delete(`/documentos/caso/${numCaso}/${idDocumento}`);
    }
};

export default documentoService;
