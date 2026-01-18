export interface FamiliaResponse {
    cedula: string;
    cantPersonas: number;
    ingresoMes: number;
    jefeFamilia: boolean;
    cantNinos: number;
    cantTrabaja: number;
    cantEstudiando: number;
    cantSinTrabajo: number;
    idNivelEduJefe: number;
    tiempoEstudio: string;
}

export interface ViviendaResponse {
    cedula: string;
    tipoVivienda: string;
    cantHabitaciones: number;
    cantBanos: number;
    materialPiso: string;
    materialParedes: string;
    materialTecho: string;
    servicioAgua: string;
    eliminacionExcretas: string;
    aseoUrbano: string;
}

export interface EncuestaResponse {
    familia: FamiliaResponse;
    vivienda: ViviendaResponse;
}
