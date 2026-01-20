// --- Beneficiario ---
export interface BeneficiarioCreateRequest {
  cedula: string;
  tipoBeneficiario: string;
  parentesco: string;
  nombre?: string; // Optional for UI display
}

export interface BeneficiarioResponse {
  cedula: string;
  numCaso: string;
  tipoBeneficiario: string;
  parentesco: string;
  nombre?: string;
}

// --- Caso ---
export interface CasoCreateRequest {
  sintesis: string;
  tramite: string; // "ASESORÍA", "REDACCIÓN DE DOCUMENTOS", etc.
  cantBeneficiarios: number;
  idTribunal?: number; // Opcional si no aplica
  termino?: string;
  idCentro: number;
  cedula: string; // Cédula del solicitante
  username: string; // Username del abogado/estudiante
  comAmbLegal: number;
  beneficiarios: BeneficiarioCreateRequest[];
  orientacion?: string;
  estudiantesAtencion?: string[];
}

export interface CasoUpdateRequest {
  sintesis?: string;
  codCasoTribunal?: string;
  fechaResCasoTri?: string;
  fechaCreaCasoTri?: string;
  idTribunal?: number;
  comAmbLegal?: number;
}

export interface CasoResponse {
  numCaso: string;
  fechaRecepcion: string;
  sintesis: string;
  tramite: string;
  cantBeneficiarios: number;
  estatus: string;
  codCasoTribunal?: string;
  fechaResCasoTri?: string;
  fechaCreaCasoTri?: string;
  idTribunal?: number;
  nombreTribunal?: string;
  termino?: string;
  idCentro: number;
  cedula: string;
  username: string;
  comAmbLegal: number;
}

export interface AccionCreateRequest {
  titulo: string;
  descripcion: string;
  fechaRegistro: string;
  fechaEjecucion?: string;
  username: string;
  ejecutantes: string[];
}

export interface EncuentroCreateRequest {
  fechaAtencion: string;
  fechaProxima?: string;
  orientacion: string;
  observacion?: string;
  username: string;
  atendidos: string[];
}

export interface AccionResponse {
  idAccion: number;
  numCaso: string;
  titulo: string;
  descripcion: string;
  fechaRegistro: string;
  fechaEjecucion: string;
  username: string;
}

export interface EncuentroResponse {
  idEncuentro: number;
  numCaso: string;
  fechaAtencion: string;
  fechaProxima?: string;
  orientacion: string;
  observacion?: string;
  username: string;
}

export interface DocumentoResponse {
  idDocumento: number;
  numCaso: string;
  fechaRegistro: string;
  folioIni?: number;
  folioFin?: number;
  titulo: string;
  observacion?: string;
  username: string;
}

export interface PruebaResponse {
  idPrueba: number;
  numCaso: string;
  fecha: string;
  documento: string; // Título o nombre del documento probatorio
  observacion?: string;
  titulo: string;
}
export interface PruebaCreateRequest {
  fecha: string;
  documento: string; // Título o nombre del documento probatorio
  observacion?: string;
  titulo: string;
}

export interface CasoDetalleResponse {
  caso: CasoResponse;
  acciones: AccionResponse[];
  encuentros: EncuentroResponse[];
  documentos: DocumentoResponse[];
  pruebas: PruebaResponse[];
  asignados: any[];
  supervisores: any[];
  beneficiarios: BeneficiarioResponse[];
}

export interface CasoSummary {
  numCaso: string;
  fechaRecepcion: string;
  sintesis: string;
  estatus: string;
  username?: string;
  termino: string;
  cedula: string;
  nombreSolicitante: string;
  comAmbLegal: number;
  legalHierarchy?: string;
}

// Interfaz simplificada para listas
export interface CasoListResponse {
  numCaso: string;
  fechaRecepcion: string;
  estatus: string;
  cedula: string;
  nombreSolicitante: string; // Si el backend lo devuelve
  materia?: string; // Si aplica
}

// Mantenemos la interfaz Caso existente si se usa en componentes visuales
export interface Caso extends CasoResponse {
  // Campos adicionales de UI si los hay
  usuarios_asignados?: string[];
}

export interface CaseCardProps extends Caso {
  onClick?: () => void;
}
