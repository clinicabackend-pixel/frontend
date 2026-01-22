import api from './api';
import type { ReporteData } from '../types/reporteStats';
import { TipoReporte } from '../types/reporteStats';

const downloadBlob = (data: Blob, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export interface DashboardStats {
  totalCasos: number;
  casosActivos: number;
  casosCerrados: number;
  totalSolicitantes: number;
  distribucionMateria: Record<string, number>;
  porcentajeVulnerabilidad: number;
}

export const reporteService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get<DashboardStats>('/reportes/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  downloadReporteGeneral: async () => {
    try {
      const response = await api.get('/reportes/general', {
        responseType: 'blob',
      });
      downloadBlob(response.data, 'reporte_general.xlsx');
    } catch (error) {
      console.error('Error downloading general report:', error);
      throw error;
    }
  },

  downloadReporteSocioeconomico: async () => {
    try {
      const response = await api.get('/reportes/socioeconomico', {
        responseType: 'blob',
      });
      const filename = 'reporte_socioeconomico.xlsx';
      downloadBlob(response.data, filename);
    } catch (error) {
      console.error('Error downloading socioeconomic report:', error);
      throw error;
    }
  },

  downloadFichaSolicitante: async (cedula: string) => {
    try {
      const response = await api.get(`/reportes/solicitante/${cedula}`, {
        responseType: 'blob'
      });
      downloadBlob(response.data, `ficha_solicitante_${cedula}.xlsx`);
    } catch (error) {
      throw error;
    }
  },

  downloadFichaPdf: async (cedula: string) => {
    try {
      const response = await api.get(`/reportes/ficha/${cedula}/pdf`, {
        responseType: 'blob'
      });
      downloadBlob(response.data, `ficha_solicitante_${cedula}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },

  downloadHistorialCasos: async (inicio: string, fin: string, usuario?: string, cedula?: string) => {
    try {
      const params: Record<string, string> = { inicio, fin };
      if (cedula) params.cedula = cedula;
      if (usuario) params.usuario = usuario;

      const response = await api.get('/reportes/historial-casos', {
        params,
        responseType: 'blob'
      });
      downloadBlob(response.data, `historial_casos_${cedula || 'general'}.xlsx`);
    } catch (error) {
      throw error;
    }
  },

  downloadReporteCaso: async (id: string) => {
    try {
      const response = await api.get(`/reportes/caso/${id}`, {
        responseType: 'blob',
      });
      downloadBlob(response.data, `reporte_caso_${id}.xlsx`);
    } catch (error) {
      console.error('Error downloading case report:', error);
      throw error;
    }
  },

  downloadReporteCasoPdf: async (id: string) => {
    try {
      const response = await api.get(`/reportes/caso/${id}/pdf`, {
        responseType: 'blob',
      });
      downloadBlob(response.data, `reporte_caso_${id}.pdf`);
    } catch (error) {
      console.error('Error downloading case PDF:', error);
      throw error;
    }
  },

  downloadReportePorEstatus: async (estatus: string) => {
    const response = await api.get(`/reportes/por-estatus/${estatus}`, {
      responseType: 'blob'
    });
    downloadBlob(response.data, `casos_${estatus}.xlsx`);
  },

  downloadReporteAuditoria: async (inicio: string, fin: string) => {
    try {
      const response = await api.get('/reportes/auditoria', {
        params: { inicio, fin },
        responseType: 'blob'
      });
      downloadBlob(response.data, `auditoria_sistema_${inicio}_al_${fin}.xlsx`);
    } catch (error) {
      console.error('Error downloading audit report:', error);
      throw error;
    }
  },

  downloadResumenSemestral: async (semestre: string, tipoCaso: number) => {
    const response = await api.get('/reportes/resumen', {
      params: { semestre, tipoCaso },
      responseType: 'blob'
    });
    downloadBlob(response.data, `resumen_${semestre}.xlsx`);
  },

  getChartData: async (tipo: TipoReporte): Promise<ReporteData> => {
    try {
      const response = await api.get<ReporteData>('/reportes/chart-data', {
        params: { tipo }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }
};

