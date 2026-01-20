import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { ReporteEstadisticoDto } from '../types/reporteStats';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
    },
    titlePage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        marginTop: 10,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#CCC',
        paddingBottom: 5,
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    chartImage: {
        width: 450,
        height: 300,
        objectFit: 'contain',
    },
    statsTable: {
        display: 'flex',
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#000',
        marginTop: 20,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        minHeight: 25,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    tableCol: {
        width: '50%',
        borderRightWidth: 1,
        borderRightColor: '#000',
        padding: 5,
    },
    tableColLast: {
        width: '50%',
        padding: 5,
    },
    tableCell: {
        fontSize: 10,
        textAlign: 'left',
    },
    tableCellNum: {
        fontSize: 10,
        textAlign: 'right',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 10,
        textAlign: 'center',
        color: 'grey',
    },
});

interface ReportePDFProps {
    data: ReporteEstadisticoDto;
    charts: {
        materia: string;
        parroquia: string;
        historico: string;
    };
    anio: number;
}

const TableRow = ({ label, value, isHeader = false }: { label: string; value: string | number; isHeader?: boolean }) => (
    <View style={[styles.tableRow, isHeader ? styles.tableHeader : {}]}>
        <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{label}</Text>
        </View>
        <View style={styles.tableColLast}>
            <Text style={isHeader ? styles.tableCell : styles.tableCellNum}>{value}</Text>
        </View>
    </View>
);

export const ReportePDF: React.FC<ReportePDFProps> = ({ data, charts, anio }) => {
    return (
        <Document>
            {/* Portada */}
            <Page size="A4" style={styles.page}>
                <View style={styles.titlePage}>
                    <Text style={styles.mainTitle}>Memoria y Cuenta {anio}</Text>
                    <Text style={styles.subtitle}>Clínica Jurídica - Reporte Estadístico</Text>
                    <Text style={{ marginTop: 50, fontSize: 12 }}>Generado el: {new Date().toLocaleDateString()}</Text>
                </View>
            </Page>

            {/* Distribución por Materia */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>Distribución de Casos por Materia</Text>

                {charts.materia && (
                    <View style={styles.chartContainer}>
                        <Image src={charts.materia} style={styles.chartImage} />
                    </View>
                )}

                <View style={styles.statsTable}>
                    <TableRow label="Materia" value="Cantidad" isHeader={true} />
                    {data.casosPorMateria.map((item, index) => (
                        <TableRow key={index} label={item.materia} value={item.cantidad} />
                    ))}
                </View>

                <Text style={styles.footer}>Página 2</Text>
            </Page>

            {/* Usuarios por Parroquia */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>Casos Atendidos por Parroquia</Text>

                {charts.parroquia && (
                    <View style={styles.chartContainer}>
                        <Image src={charts.parroquia} style={styles.chartImage} />
                    </View>
                )}

                <View style={styles.statsTable}>
                    <TableRow label="Parroquia" value="Cantidad" isHeader={true} />
                    {data.casosPorParroquia.map((item, index) => (
                        <TableRow key={index} label={item.parroquia} value={item.cantidad} />
                    ))}
                </View>

                <Text style={styles.footer}>Página 3</Text>
            </Page>

            {/* Comparativa Histórica & Beneficiarios */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>Comparativa Histórica y Beneficiarios</Text>

                {charts.historico && (
                    <View style={styles.chartContainer}>
                        <Image src={charts.historico} style={styles.chartImage} />
                    </View>
                )}

                <View style={[styles.statsTable, { marginBottom: 20 }]}>
                    <TableRow label="Año" value="Casos Totales" isHeader={true} />
                    {data.historicoCasos.map((item, index) => (
                        <TableRow key={index} label={item.anio.toString()} value={item.cantidad} />
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Resumen de Beneficiarios</Text>
                <View style={styles.statsTable}>
                    <TableRow label="Tipo" value="Total" isHeader={true} />
                    <TableRow label="Directos" value={data.beneficiarios.directos} />
                    <TableRow label="Indirectos" value={data.beneficiarios.indirectos} />
                    <TableRow label="Total General" value={data.beneficiarios.directos + data.beneficiarios.indirectos} />
                </View>

                <Text style={styles.footer}>Página 4</Text>
            </Page>
        </Document>
    );
};

export default ReportePDF;
