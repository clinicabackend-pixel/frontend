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
        const response = await api.get<any[]>('/catalogos/estados-civiles');
        return response.data.map(item => ({
            id: item.idEstadoCivil,
            nombre: item.nombreEstadoCivil,
            estatus: item.estatus
        }));
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
        const response = await api.get<any[]>('/catalogos/tribunales');
        return response.data.map(t => ({
            id: t.idTribunal,
            nombre: t.nombreTribunal,
            materia: t.materia,
            instancia: t.instancia,
            ubicacion: t.ubicacion,
            estatus: t.estatus
        }));
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

    // --- ESTADO CIVIL METHODS ---
    createEstadoCivil: async (nombre: string) => {
        const response = await api.post('/catalogos/estados-civiles', { nombre });
        return response.data;
    },

    updateEstadoCivilStatus: async (id: number, estatus: 'ACTIVO' | 'INACTIVO') => {
        const response = await api.patch(`/catalogos/estados-civiles/${id}/estatus`, null, { params: { estatus } });
        return response.data;
    },

    // --- TRIBUNAL METHODS ---
    createTribunal: async (tribunal: Partial<import('../types/catalogo').Tribunal>) => {
        const response = await api.post('/catalogos/tribunales', tribunal);
        return response.data;
    },

    updateTribunalStatus: async (id: number, estatus: 'ACTIVO' | 'INACTIVO') => {
        const response = await api.patch(`/catalogos/tribunales/${id}/estatus`, null, { params: { estatus } });
        return response.data;
    },

    // --- SEMESTRE METHODS ---
    createSemestre: async (semestre: Partial<Semestre>) => {
        const response = await api.post('/catalogos/semestres', semestre);
        return response.data;
    },

    // Optional: Update Semestre if needed (e.g. change dates)
    updateSemestre: async (termino: string, data: Partial<Semestre>) => {
        const response = await api.put(`/catalogos/semestres/${termino}`, data);
        return response.data;
    },

    // --- CENTRO METHODS ---
    createCentro: async (centro: { nombre: string; abreviatura: string; idParroquia: number }) => {
        const response = await api.post('/catalogos/centros', centro);
        return response.data;
    },

    // --- AMBITO LEGAL SCHEMA METHODS ---
    createMateria: async (nombre: string) => {
        const response = await api.post('/catalogos/materias', { nombre });
        return response.data;
    },

    createCategoria: async (nombre: string, idMateria: number) => {
        const response = await api.post('/catalogos/categorias', { nombre, idMateria });
        return response.data;
    },

    createSubcategoria: async (nombre: string, idCategoria: number) => {
        const response = await api.post('/catalogos/subcategorias', { nombre, idCategoria });
        return response.data;
    },

    createAmbito: async (nombre: string, idSubcategoria: number) => {
        const response = await api.post('/catalogos/ambitos', { nombre, idSubcategoria });
        return response.data;
    },

};

export default catalogoService;
