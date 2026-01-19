import api from './api';

import type { Estado, Municipio, Parroquia, AmbitoLegal, Centro, EstadoCivil, Semestre } from '../types';

const catalogoService = {
    getEstados: async () => {
        const response = await api.get<Estado[]>('/catalogos/estados');
        return response.data;
    },

    getMunicipios: async (idEstado: number) => {
        const response = await api.get<Municipio[]>('/catalogos/municipios', {
            params: { idEstado }
        });
        return response.data;
    },

    getParroquias: async (idMunicipio: number) => {
        const response = await api.get<Parroquia[]>('/catalogos/parroquias', {
            params: { idMunicipio }
        });
        return response.data;
    },

    getAllMunicipios: async () => {
        const response = await api.get<Municipio[]>('/catalogos/municipios/all');
        return response.data;
    },

    getAllParroquias: async () => {
        const response = await api.get<Parroquia[]>('/catalogos/parroquias/all');
        return response.data;
    },

    getEstadosCiviles: async () => {
        const response = await api.get<EstadoCivil[]>('/catalogos/estados-civiles');
        return response.data;
    },

    getAmbitosLegales: async () => {
        const response = await api.get<AmbitoLegal[]>('/catalogos/ambitos-legales');
        return response.data;
    },

    getCentros: async () => {
        const response = await api.get<Centro[]>('/catalogos/centros');
        return response.data;
    },

    getTribunales: async () => {
        const response = await api.get<import('../types/catalogo').Tribunal[]>('/catalogos/tribunales');
        return response.data;
    },

    getSemestres: async () => {
        const response = await api.get<Semestre[]>('/catalogos/semestres');
        return response.data;
    },

    getViviendas: async () => {
        const response = await api.get<import('../types').TipoViviendaResponse[]>('/catalogos/viviendas');
        return response.data;
    },

    getCondicionesLaborales: async () => {
        const response = await api.get<import('../types/catalogo').CondicionLaboralResponse[]>('/catalogos/condiciones-laborales');
        return response.data;
    },

    getCondicionesActividad: async () => {
        const response = await api.get<import('../types').CondicionActividadResponse[]>('/catalogos/condiciones-actividad');
        return response.data;
    },

    getNivelesEducativos: async () => {
        const response = await api.get<import('../types/catalogo').NivelEducativoResponse[]>('/catalogos/niveles-educativos');
        return response.data;
    },

    // --- CREATE METHODS ---
    createNivelEducativo: async (nombre: string) => {
        const response = await api.post('/catalogos/niveles-educativos', { nombre });
        return response.data;
    },

    createCondicionLaboral: async (nombre: string) => {
        const response = await api.post('/catalogos/condiciones-laborales', { nombre });
        return response.data;
    },

    createCondicionActividad: async (nombre: string) => {
        const response = await api.post('/catalogos/condiciones-actividad', { nombre });
        return response.data;
    },

    createTipoVivienda: async (nombre: string) => {
        const response = await api.post('/catalogos/viviendas/tipos', { nombre });
        return response.data;
    },

    createVivienda: async (idTipo: number, descripcion: string) => {
        const response = await api.post('/catalogos/viviendas', { idTipo, descripcion });
        return response.data;
    },

    // --- UPDATE STATUS METHODS ---
    updateNivelEducativoStatus: async (id: number, estatus: 'ACTIVO' | 'INACTIVO') => {
        const response = await api.patch(`/catalogos/niveles-educativos/${id}/estatus`, null, { params: { estatus } });
        return response.data;
    },

    updateCondicionLaboralStatus: async (id: number, estatus: 'ACTIVO' | 'INACTIVO') => {
        const response = await api.patch(`/catalogos/condiciones-laborales/${id}/estatus`, null, { params: { estatus } });
        return response.data;
    },

    updateCondicionActividadStatus: async (id: number, estatus: 'ACTIVO' | 'INACTIVO') => {
        const response = await api.patch(`/catalogos/condiciones-actividad/${id}/estatus`, null, { params: { estatus } });
        return response.data;
    },

    updateCategoriaViviendaStatus: async (idTipo: number, idCat: number, estatus: 'ACTIVO' | 'INACTIVO') => {
        const response = await api.patch(`/catalogos/viviendas/${idTipo}/${idCat}/estatus`, null, { params: { estatus } });
        return response.data;
    },
};



export default catalogoService;
