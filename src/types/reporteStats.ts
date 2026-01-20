export interface CasoPorMateria {
    materia: string;
    cantidad: number;
}

export interface CasoPorParroquia {
    parroquia: string;
    cantidad: number;
}

export interface Beneficiarios {
    directos: number;
    indirectos: number;
}

export interface HistoricoCasos {
    anio: number;
    cantidad: number;
}

export interface ReporteEstadisticoDto {
    casosPorMateria: CasoPorMateria[];
    casosPorParroquia: CasoPorParroquia[];
    beneficiarios: Beneficiarios;
    historicoCasos: HistoricoCasos[];
}

export enum TipoReporte {
    // A. Detalle por Materias
    MATERIA_CIVIL_SUCESIONES = 'MATERIA_CIVIL_SUCESIONES',
    MATERIA_CIVIL_FAMILIA_ORDINARIOS = 'MATERIA_CIVIL_FAMILIA_ORDINARIOS',
    MATERIA_CIVIL_FAMILIA_PROTECCION = 'MATERIA_CIVIL_FAMILIA_PROTECCION',
    MATERIA_CIVIL_PERSONAS = 'MATERIA_CIVIL_PERSONAS',
    MATERIA_CIVIL_BIENES = 'MATERIA_CIVIL_BIENES',
    MATERIA_CIVIL_CONTRATOS = 'MATERIA_CIVIL_CONTRATOS',
    MATERIA_PENAL = 'MATERIA_PENAL',
    MATERIA_LABORAL = 'MATERIA_LABORAL',
    MATERIA_MERCANTIL = 'MATERIA_MERCANTIL',
    MATERIA_OTROS = 'MATERIA_OTROS',

    // B. Estadísticas Demográficas y Geográficas
    RESUMEN_CASOS_POR_MATERIA = 'RESUMEN_CASOS_POR_MATERIA',
    CLASIFICACION_POR_GENERO = 'CLASIFICACION_POR_GENERO',
    USUARIOS_POR_ESTADO = 'USUARIOS_POR_ESTADO',
    USUARIOS_POR_PARROQUIA = 'USUARIOS_POR_PARROQUIA',

    // C. Unidades Especiales
    CONCILIACION_RESUMEN = 'CONCILIACION_RESUMEN',
    DEFENSORIA_NNA_BENEFICIARIOS = 'DEFENSORIA_NNA_BENEFICIARIOS',
    DEFENSORIA_NNA_TIPOS_CASOS = 'DEFENSORIA_NNA_TIPOS_CASOS',
    DEFENSORIA_NNA_UBICACION = 'DEFENSORIA_NNA_UBICACION',

    // D. Gestión y Formación
    VOLUNTARIADO_BENEFICIARIOS = 'VOLUNTARIADO_BENEFICIARIOS',
    FORMACION_ACADEMICA = 'FORMACION_ACADEMICA',
    HISTORICO_CASOS = 'HISTORICO_CASOS',
    TOTAL_BENEFICIARIOS = 'TOTAL_BENEFICIARIOS'
}

export interface ReporteData {
    labels: string[];
    values: number[];
    datasetLabel: string;
    chartType: 'bar' | 'pie' | 'horizontalBar' | 'line';
}

