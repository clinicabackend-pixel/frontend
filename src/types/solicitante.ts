export interface SolicitanteRequest {
    cedula: string;
    nombre: string;
    sexo: string;
    estadoCivil: string;
    fechaNacimiento: string; // LocalDate in Java, string (ISO) in JS
    concubinato: boolean;
    nacionalidad: string;
    condicionLaboral?: string;
    condicionActividad?: string;
    telfCasa: string;
    telfCelular: string;
    email: string;
    idParroquia: number;
    nivelEducativo?: string;
}

export interface SolicitanteResponse {
    cedula: string;
    nombre: string;
    sexo: string;
    estadoCivil: string;
    fechaNacimiento: string;
    concubinato: boolean;
    nacionalidad: string;
    condicionLaboral?: string;
    condicionActividad?: string;
    telfCasa: string;
    telfCelular: string;
    email: string;
    idParroquia?: number;
    nivelEducativo?: string;
    apellido?: string;
    nombreParroquia?: string;
    nombreMunicipio?: string;
    nombreEstado?: string;
    trabaja?: boolean;
    nombreNivel?: string;
    condicionTrabajo?: string;
}
