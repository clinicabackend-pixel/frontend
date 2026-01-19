// src/types/encuesta.ts

export interface EncuestaFamiliaDto {
    cantPersonas: number;
    cantEstudiando: number;
    ingresoMes: number;
    jefeFamilia: boolean;
    cantSinTrabajo: number;
    cantNinos: number;
    cantTrabaja: number;
    idNivelEduJefe: number;
    tiempoEstudio: string;
}

export interface EncuestaViviendaDto {
    cantHabitaciones: number;
    cantBanos: number;
}

export interface CaracteristicaRequest {
    idTipoCat: number;
    idCatVivienda: number;
}

export interface DatosEncuestaRequest {
    familia: EncuestaFamiliaDto;
    vivienda: EncuestaViviendaDto;
    caracteristicas: CaracteristicaRequest[];
    idCondicion?: number;
    idCondicionActividad?: number;
}

// Response is same as Request for this case
export type DatosEncuestaResponse = DatosEncuestaRequest;
