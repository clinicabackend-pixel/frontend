import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartBar,
    faUser,
    faHistory,
    faFileAlt,
    faList,
    faChartPie
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/MainLayout';
import ReportCard from '../components/ReportCard';
import { reporteService } from '../services/reporteService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import catalogoService from '../services/catalogoService';
import CustomSelect from '../components/common/CustomSelect';
import CustomDatePicker from '../components/common/CustomDatePicker';
import type { AmbitoLegal } from '../types/catalogo';

export default function Reportes() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const canViewRestrictedReports = user?.tipoUsuario === 'COORDINADOR' || user?.tipoUsuario === 'ADMINISTRADOR';
    const [isDark, setIsDark] = useState(() => {
        if (theme === 'dark') return true;
        if (theme === 'light') return false;
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });
    // Estados para inputs
    const [cedulaSolicitante, setCedulaSolicitante] = useState('');

    const [historialUsuario, setHistorialUsuario] = useState('');
    const [historialInicio, setHistorialInicio] = useState('');
    const [historialFin, setHistorialFin] = useState('');

    const [casoId, setCasoId] = useState('');

    const [statusFilter, setStatusFilter] = useState('ABIERTO');

    const [resumenSemestre, setResumenSemestre] = useState('');
    const [resumenTipo, setResumenTipo] = useState<number>(0); // 0 = Select...

    const [auditoriaInicio, setAuditoriaInicio] = useState('');
    const [auditoriaFin, setAuditoriaFin] = useState('');


    // Estados de carga
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [dashboardStats, setDashboardStats] = useState<import('../services/reporteService').DashboardStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [materias, setMaterias] = useState<AmbitoLegal[]>([]);
    const [loadingMaterias, setLoadingMaterias] = useState(true);

    // Initial fetch for dashboard stats
    useEffect(() => {
        reporteService.getDashboardStats()
            .then(stats => setDashboardStats(stats))
            .catch(err => console.error("Error loading stats", err))
            .finally(() => setLoadingStats(false));
    }, []);

    // Cargar materias del catálogo
    useEffect(() => {
        const loadMaterias = async () => {
            setLoadingMaterias(true);
            try {
                const ambitosLegales = await catalogoService.getAmbitosLegales();
                // Filtrar solo las materias (tipo === 'MATERIA')
                const materiasList = ambitosLegales.filter(ambito => ambito.tipo === 'MATERIA');
                setMaterias(materiasList);
            } catch (error) {
                console.error("Error cargando materias:", error);
                setMaterias([]);
            } finally {
                setLoadingMaterias(false);
            }
        };
        loadMaterias();
    }, []);

    // Actualizar isDark cuando cambia el theme
    useEffect(() => {
        if (theme === 'dark') {
            setIsDark(true);
        } else if (theme === 'light') {
            setIsDark(false);
        } else {
            if (typeof window !== 'undefined') {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                setIsDark(mediaQuery.matches);
                const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
                mediaQuery.addEventListener('change', handler);
                return () => mediaQuery.removeEventListener('change', handler);
            }
        }
    }, [theme]);

    const handleDownload = async (key: string, downloadFn: () => Promise<void>) => {
        setLoading(prev => ({ ...prev, [key]: true }));
        setNotification(null);
        try {
            await downloadFn();
            setNotification({ type: 'success', message: 'Reporte descargado correctamente.' });
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Error al descargar el reporte.' });
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    return (
        <Layout title="Reportes e Indicadores">
            <div className="max-w-7xl mx-auto p-6 pb-32">
                <div className="mb-8">
                    <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        <FontAwesomeIcon icon={faChartBar} className={isDark ? 'text-white' : 'text-red-900'} />
                        Reportes y Estadísticas
                    </h1>
                    <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Tablero de control y centro de descarga de reportes.
                    </p>
                </div>

                {/* DASHBOARD SECTION */}
                <div className="mb-10 animate-fade-in-down">
                    <h2 className={`text-xl font-semibold mb-4 border-l-4 pl-3 ${isDark ? 'text-white border-red-700' : 'text-gray-800 border-red-900'}`}>
                        Indicadores Clave
                    </h2>

                    {loadingStats ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className={`p-6 rounded-lg shadow h-32 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-white'}`}></div>
                            ))}
                        </div>
                    ) : dashboardStats ? (
                        <>
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className={`p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-sm uppercase font-semibold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Total Casos</p>
                                            <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{dashboardStats.totalCasos}</p>
                                        </div>
                                        <div className={`p-3 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                            <FontAwesomeIcon icon={faFileAlt} size="lg" className={isDark ? 'text-white' : ''} />
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-sm uppercase font-semibold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Casos Activos</p>
                                            <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>{dashboardStats.casosActivos}</p>
                                        </div>
                                        <div className={`p-3 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-green-50 text-green-600'}`}>
                                            <FontAwesomeIcon icon={faChartBar} size="lg" className={isDark ? 'text-white' : ''} />
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-sm uppercase font-semibold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Casos Cerrados</p>
                                            <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{dashboardStats.casosCerrados}</p>
                                        </div>
                                        <div className={`p-3 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            <FontAwesomeIcon icon={faHistory} size="lg" className={isDark ? 'text-white' : ''} />
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-sm uppercase font-semibold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Solicitantes</p>
                                            <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-red-400' : 'text-red-900'}`}>{dashboardStats.totalSolicitantes}</p>
                                        </div>
                                        <div className={`p-3 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-red-50 text-red-900'}`}>
                                            <FontAwesomeIcon icon={faUser} size="lg" className={isDark ? 'text-white' : ''} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Materia Distribution */}
                                <div className={`p-6 rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                    <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Distribución por Materia</h3>
                                    <div className="space-y-4">
                                        {Object.entries(dashboardStats.distribucionMateria).map(([materia, count]) => {
                                            const percentage = Math.round((count / dashboardStats.totalCasos) * 100) || 0;
                                            return (
                                                <div key={materia}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{materia}</span>
                                                        <span className={isDark ? 'text-gray-300' : 'text-gray-500'}>{count} ({percentage}%)</span>
                                                    </div>
                                                    <div className={`w-full rounded-full h-2.5 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                                        <div
                                                            className={`h-2.5 rounded-full ${isDark ? 'bg-red-900' : 'bg-red-900'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Object.keys(dashboardStats.distribucionMateria).length === 0 && (
                                            <p className={`text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay datos de materias disponibles.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Vulnerability Indicator */}
                                <div className={`p-6 rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                    <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Índice de Vulnerabilidad (Estimado)</h3>
                                    <div className="flex flex-col items-center justify-center" style={{ minHeight: '280px' }}>
                                        <div className="relative w-40 h-40">
                                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                                <path
                                                    className={isDark ? 'text-gray-800' : 'text-gray-200'}
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3.8"
                                                />
                                                <path
                                                    className="text-yellow-500 transition-all duration-1000 ease-out"
                                                    strokeDasharray={`${dashboardStats.porcentajeVulnerabilidad}, 100`}
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3.8"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{Math.round(dashboardStats.porcentajeVulnerabilidad)}%</span>
                                                <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Ingresos Bajos</span>
                                            </div>
                                        </div>
                                        <p className={`text-sm mt-4 text-center max-w-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                            Porcentaje de familias con ingresos inferiores al umbral referencial.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={`p-4 rounded-md ${isDark ? 'bg-gray-800/50 text-red-200 border border-gray-700' : 'bg-red-50 text-red-700'}`}>
                            No se pudieron cargar los indicadores.
                        </div>
                    )}
                </div>

                {notification && (
                    <div className={`mb-6 p-4 rounded-lg border-l-4 ${notification.type === 'success'
                        ? (isDark ? 'bg-green-900/50 border-green-500 text-green-200' : 'bg-green-50 border-green-500 text-green-700')
                        : (isDark ? 'bg-gray-800/50 border-red-500 text-red-200' : 'bg-red-50 border-red-500 text-red-700')
                        }`} role="alert">
                        <p className="font-medium">{notification.message}</p>
                    </div>
                )}


                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {/* 1. Ficha del Solicitante */}
                    <ReportCard
                        title="Ficha del Solicitante"
                        description="Información personal y de contacto detallada de un solicitante."
                        icon={faUser}
                        loading={loading['ficha'] || false}
                        fileType="PDF"
                        onDownload={() => {
                            if (!cedulaSolicitante) { setNotification({ type: 'error', message: 'Ingrese la cédula' }); return; }
                            handleDownload('ficha', () => reporteService.downloadFichaPdf(cedulaSolicitante));
                        }}
                    >
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-700'}`}>Cédula / DNI</label>
                            <input
                                type="text"
                                value={cedulaSolicitante}
                                onChange={(e) => setCedulaSolicitante(e.target.value)}
                                className={`w-full h-10 px-3 border rounded-md focus:ring-2 focus:ring-red-900 focus:border-transparent outline-none transition-shadow ${isDark
                                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300'
                                    }`}
                                placeholder="Ej: V-12345678"
                            />
                        </div>
                    </ReportCard>

                    {/* 2. Historial de Casos */}
                    <ReportCard
                        title="Historial de Casos"
                        description="Lista de casos en un rango de fechas. Filtrar por usuario es opcional."
                        icon={faHistory}
                        loading={loading['historial'] || false}
                        onDownload={() => {
                            if (!historialInicio || !historialFin) {
                                setNotification({ type: 'error', message: 'Indique el rango de fechas' }); return;
                            }
                            handleDownload('historial', () => reporteService.downloadHistorialCasos(historialInicio, historialFin, historialUsuario));
                        }}
                    >
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <CustomDatePicker
                                        label="Desde"
                                        value={historialInicio}
                                        onChange={(value) => setHistorialInicio(value)}
                                    />
                                </div>
                                <div>
                                    <CustomDatePicker
                                        label="Hasta"
                                        value={historialFin}
                                        onChange={(value) => setHistorialFin(value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-700'}`}>Usuario Asignado (Opcional)</label>
                                <input
                                    type="text"
                                    value={historialUsuario}
                                    onChange={(e) => setHistorialUsuario(e.target.value)}
                                    className={`w-full h-10 px-3 border rounded-md focus:ring-2 focus:ring-red-900 outline-none ${isDark
                                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
                                        : 'border-gray-300'
                                        }`}
                                    placeholder="Ej: jperez"
                                />
                            </div>
                        </div>
                    </ReportCard>

                    {/* 3. Detalle de Caso */}
                    <ReportCard
                        title="Detalle de Caso"
                        description="Expediente completo de un caso con todas sus acciones, documentos y seguimiento."
                        icon={faFileAlt}
                        loading={loading['caso'] || false}
                        fileType="PDF"
                        onDownload={() => {
                            if (!casoId) { setNotification({ type: 'error', message: 'Ingrese el número de caso' }); return; }
                            handleDownload('caso', () => reporteService.downloadReporteCasoPdf(casoId));
                        }}
                    >
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-700'}`}>Número de Caso</label>
                            <input
                                type="text"
                                value={casoId}
                                onChange={(e) => setCasoId(e.target.value)}
                                className={`w-full h-10 px-3 border rounded-md focus:ring-2 focus:ring-red-900 outline-none ${isDark
                                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
                                    : 'border-gray-300'
                                    }`}
                                placeholder="Ej: C-2024-001"
                            />
                        </div>
                    </ReportCard>

                    {/* 4. Consulta por Estatus */}
                    <ReportCard
                        title="Casos por Estatus"
                        description="Listado de casos filtrados por su estado actual."
                        icon={faList}
                        loading={loading['estatus'] || false}
                        onDownload={() => {
                            handleDownload('estatus', () => reporteService.downloadReportePorEstatus(statusFilter));
                        }}
                    >
                        <CustomSelect
                            value={statusFilter}
                            options={[
                                { value: 'ABIERTO', label: 'Abierto' },
                                { value: 'CERRADO', label: 'Cerrado' },
                                { value: 'PENDIENTE', label: 'Pendiente' },
                                { value: 'EN_PROCESO', label: 'En Proceso' },
                                { value: 'ARCHIVO', label: 'Archivo' }
                            ]}
                            onChange={(value) => setStatusFilter(value as string)}
                            placeholder="Seleccione un estatus"
                        />
                    </ReportCard>

                    {/* 5. Informe Resumen - Solo COORDINADOR y ADMINISTRADOR */}
                    {canViewRestrictedReports && (
                        <ReportCard
                            title="Informe Resumen"
                            description="Estadísticas y conteos por semestre y tipo de caso."
                            icon={faChartPie}
                            loading={loading['resumen'] || false}
                            onDownload={() => {
                                if (!resumenSemestre || !resumenTipo) {
                                    setNotification({ type: 'error', message: 'Complete los campos del resumen' }); return;
                                }
                                handleDownload('resumen', () => reporteService.downloadResumenSemestral(resumenSemestre, resumenTipo));
                            }}
                        >
                            <div className="space-y-3">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-700'}`}>Semestre Académico</label>
                                    <input
                                        type="text"
                                        value={resumenSemestre}
                                        onChange={(e) => setResumenSemestre(e.target.value)}
                                        className={`w-full h-10 px-3 border rounded-md focus:ring-2 focus:ring-red-900 outline-none ${isDark
                                            ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
                                            : 'border-gray-300'
                                            }`}
                                        placeholder="Ej: 2024-1"
                                    />
                                </div>
                                <div>
                                    <CustomSelect
                                        label="Tipo de Caso (Materia)"
                                        value={resumenTipo}
                                        options={[
                                            { value: 0, label: 'Seleccione...' },
                                            ...materias.map(materia => ({ value: materia.id, label: materia.descripcion }))
                                        ]}
                                        onChange={(value) => setResumenTipo(Number(value))}
                                        placeholder="Seleccione una materia"
                                        disabled={loadingMaterias || materias.length === 0}
                                    />
                                    {loadingMaterias && (
                                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cargando materias...</p>
                                    )}
                                    {!loadingMaterias && materias.length === 0 && (
                                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay materias disponibles</p>
                                    )}
                                </div>
                            </div>
                        </ReportCard>
                    )}

                    {/* 6. Memoria y Cuenta - Solo COORDINADOR y ADMINISTRADOR */}
                    {canViewRestrictedReports && (
                        <ReportCard
                            title="Memoria y Cuenta"
                            description="Generación del informe anual con gráficos estadísticos, usuarios por parroquia y comparativas."
                            icon={faChartPie}
                            loading={false}
                            onDownload={() => {
                                window.location.href = '/reportes/memoria-cuenta';
                            }}
                        >
                            <button
                                onClick={() => window.location.href = '/reportes/memoria-cuenta'}
                                className={`w-full py-2 px-4 rounded-md font-semibold text-white transition-colors ${isDark ? 'bg-red-900 hover:bg-red-950' : 'bg-red-900 hover:bg-red-950'
                                    }`}
                            >
                                Ir al Generador
                            </button>
                        </ReportCard>
                    )}

                    {/* 7. Reporte Socioeconómico - Solo COORDINADOR y ADMINISTRADOR */}
                    {canViewRestrictedReports && (
                        <ReportCard
                            title="Reporte Socioeconómico"
                            description="Reporte unificado con datos laborales, familiares y de vivienda."
                            icon={faFileAlt}
                            loading={loading['socioeconomico'] || false}
                            onDownload={() => {
                                handleDownload('socioeconomico', () => reporteService.downloadReporteSocioeconomico());
                            }}
                        >
                            <div className="h-4"></div>
                        </ReportCard>
                    )}

                    {/* 7. Auditoría del Sistema (Sólo Coordinador/Admin) */}
                    {(user?.tipoUsuario === 'COORDINADOR' || user?.tipoUsuario === 'ADMINISTRADOR') && (
                        <ReportCard
                            title="Auditoría del Sistema"
                            description="Registro de eventos y cambios en el sistema (Log de Auditoría)."
                            icon={faList}
                            loading={loading['auditoria'] || false}
                            onDownload={() => {
                                if (!auditoriaInicio || !auditoriaFin) {
                                    setNotification({ type: 'error', message: 'Debe indicar el rango de fechas' }); return;
                                }
                                handleDownload('auditoria', () => reporteService.downloadReporteAuditoria(auditoriaInicio, auditoriaFin));
                            }}
                        >
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <CustomDatePicker
                                        label="Desde"
                                        value={auditoriaInicio}
                                        onChange={(value) => setAuditoriaInicio(value)}
                                    />
                                </div>
                                <div>
                                    <CustomDatePicker
                                        label="Hasta"
                                        value={auditoriaFin}
                                        onChange={(value) => setAuditoriaFin(value)}
                                    />
                                </div>
                            </div>
                        </ReportCard>
                    )}

                </div>
            </div>
        </Layout>
    );
}
