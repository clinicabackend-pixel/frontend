// Definiciones básicas para catálogos, movidas aquí para centralización
export interface Estado {
    idEstado: number;
    nombreEstado: string;
}

export interface Municipio {
    idMunicipio: number;
    nombreMunicipio: string;
    idEstado: number;
}

export interface Parroquia {
    idParroquia: number;
    nombreParroquia: string;
    idMunicipio: number;
}

export interface EstadoCivil {
    id: number;
    nombre: string;
    estatus?: 'ACTIVO' | 'INACTIVO';
}

export interface Centro {
    idCentro: number;
    nombreCentro: string;
    idParroquia: number;
}

export interface AmbitoLegal {
    id: number;
    descripcion: string;
    tipo: 'MATERIA' | 'CATEGORIA' | 'SUBCATEGORIA' | 'AMBITO';
    children?: AmbitoLegal[];
}

export interface CategoriaViviendaResponse {
    id: number;
    descripcion: string;
    estatus?: 'ACTIVO' | 'INACTIVO';
}

export interface TipoViviendaResponse {
    id: number;
    nombre: string;
    categorias: CategoriaViviendaResponse[];
    estatus?: 'ACTIVO' | 'INACTIVO';
}

export interface Semestre {
    termino: string;
    nombre: string;
    fechaInicio?: string;
    fechaFin?: string;
}

export interface CondicionLaboralResponse {
    id: number;
    nombre: string;
    estatus?: 'ACTIVO' | 'INACTIVO';
}

export interface CondicionActividadResponse {
    id: number;
    nombre: string;
    estatus?: 'ACTIVO' | 'INACTIVO';
}

export interface NivelEducativoResponse {
    id: number;
    nombre: string;
    estatus?: 'ACTIVO' | 'INACTIVO';
}

export interface Tribunal {
    id: number;
    nombre: string;
    materia: string;
    instancia: string;
    ubicacion: string;
    estatus?: 'ACTIVO' | 'INACTIVO';
}

