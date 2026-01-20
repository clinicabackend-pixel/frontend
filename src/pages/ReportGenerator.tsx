import React, { useState, useRef, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import type { ReporteEstadisticoDto } from '../types/reporteStats';
import { TipoReporte, type ReporteData } from '../types/reporteStats';
import { reporteService } from '../services/reporteService';
import ReportePDF from '../components/ReportePDF';
import ReporteChart from '../components/charts/ReporteChart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faSpinner, faChartPie } from '@fortawesome/free-solid-svg-icons';

const ReportGenerator: React.FC = () => {
    // Individual Data States
    const [materiaData, setMateriaData] = useState<ReporteData | null>(null);
    const [parroquiaData, setParroquiaData] = useState<ReporteData | null>(null);
    const [historicoData, setHistoricoData] = useState<ReporteData | null>(null);
    const [beneficiariosData, setBeneficiariosData] = useState<ReporteData | null>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
    const [chartImages, setChartImages] = useState<{ materia: string; parroquia: string; historico: string } | null>(null);

    // Refs for Charts (to capture image)
    const materiaChartRef = useRef<any>(null);
    const parroquiaChartRef = useRef<any>(null);
    const historicoChartRef = useRef<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all required reports in parallel
                const [materia, parroquia, historico, beneficiarios] = await Promise.all([
                    reporteService.getChartData(TipoReporte.RESUMEN_CASOS_POR_MATERIA),
                    reporteService.getChartData(TipoReporte.USUARIOS_POR_PARROQUIA),
                    reporteService.getChartData(TipoReporte.HISTORICO_CASOS),
                    reporteService.getChartData(TipoReporte.TOTAL_BENEFICIARIOS)
                ]);

                setMateriaData(materia);
                setParroquiaData(parroquia);
                setHistoricoData(historico);
                setBeneficiariosData(beneficiarios);
            } catch (error) {
                console.error("Error fetching report data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleGenerateReport = async () => {
        setGeneratingPdf(true);

        // Allow charts to render if they weren't somehow
        setTimeout(() => {
            try {
                const materiaImg = materiaChartRef.current?.toBase64Image();
                const parroquiaImg = parroquiaChartRef.current?.toBase64Image();
                const historicoImg = historicoChartRef.current?.toBase64Image();

                if (materiaImg && parroquiaImg && historicoImg) {
                    setChartImages({
                        materia: materiaImg,
                        parroquia: parroquiaImg,
                        historico: historicoImg
                    });
                } else {
                    console.error("Could not capture all charts");
                }
            } catch (error) {
                console.error("Error capturing charts", error);
            } finally {
                setGeneratingPdf(false);
            }
        }, 500);
    };

    // Construct DTO for PDF Report
    const buildReportDto = (): ReporteEstadisticoDto | null => {
        if (!materiaData || !parroquiaData || !historicoData || !beneficiariosData) return null;

        return {
            casosPorMateria: materiaData.labels.map((label, i) => ({
                materia: label,
                cantidad: materiaData.values[i]
            })),
            casosPorParroquia: parroquiaData.labels.map((label, i) => ({
                parroquia: label,
                cantidad: parroquiaData.values[i]
            })),
            historicoCasos: historicoData.labels.map((label, i) => ({
                anio: parseInt(label) || 0,
                cantidad: historicoData.values[i]
            })),
            beneficiarios: {
                directos: beneficiariosData.values[0] || 0,
                indirectos: beneficiariosData.values[1] || 0
            }
        };
    };

    const pdfData = buildReportDto();

    if (loading) return <div className="p-10 text-center"><FontAwesomeIcon icon={faSpinner} spin size="2x" /> Cargando datos...</div>;
    if (!materiaData || !parroquiaData || !historicoData) return <div>Error al cargar datos. Asegúrate de que el backend esté corriendo.</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <FontAwesomeIcon icon={faChartPie} />
                    Generador de Memoria y Cuenta
                </h1>

                <p className="mb-6 text-gray-600">
                    Este módulo genera el reporte anual "Memoria y Cuenta" capturando los gráficos estadísticos y compilándolos en un documento PDF oficial.
                </p>

                <div className="flex gap-4 mb-8">
                    <button
                        onClick={handleGenerateReport}
                        disabled={generatingPdf || chartImages !== null}
                        className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors flex items-center gap-2
                    ${(generatingPdf || chartImages) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {generatingPdf ? 'Capturando Gráficos...' : (chartImages ? 'Gráficos Capturados' : 'Preparar Reporte PDF')}
                    </button>

                    {chartImages && pdfData && (
                        <PDFDownloadLink
                            document={<ReportePDF data={pdfData} charts={chartImages} anio={new Date().getFullYear()} />}
                            fileName={`memoria_y_cuenta_${new Date().getFullYear()}.pdf`}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2"
                        >
                            {({ loading }) => (loading ? 'Generando Documento...' : <><FontAwesomeIcon icon={faFilePdf} /> Descargar PDF</>)}
                        </PDFDownloadLink>
                    )}

                    {chartImages && (
                        <button
                            onClick={() => setChartImages(null)} // Reset
                            className="text-sm text-gray-500 underline"
                        >
                            Reiniciar
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
                    <div className="bg-white p-4 rounded border shadow-sm">
                        {/* We don't need titles here as ReporteChart handles them, but for container consistency we can keep wrappers */}
                        <div className="flex justify-center">
                            <ReporteChart ref={materiaChartRef} data={materiaData} />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded border shadow-sm">
                        <div>
                            <ReporteChart ref={parroquiaChartRef} data={parroquiaData} />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded border shadow-sm md:col-span-2">
                        <div>
                            <ReporteChart ref={historicoChartRef} data={historicoData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportGenerator;
