import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser, faBriefcase, faAddressCard, faPhone, faEnvelope, faEdit, faFileAlt, faMapMarkerAlt, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/common/Button';
import solicitanteService from '../services/solicitanteService';
import { reporteService } from '../services/reporteService';
import type { SolicitanteResponse } from '../types/solicitante';
import type { CasoSummary } from '../types/caso';
import type { EncuestaResponse } from '../types/encuesta_response';
import SolicitanteForm from '../components/forms/SolicitanteForm';
import EncuestaForm from '../components/forms/EncuestaForm';
import Modal from '../components/common/Modal';

export function SolicitanteDetalle() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [solicitante, setSolicitante] = useState<SolicitanteResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showEncuestaModal, setShowEncuestaModal] = useState(false);

    // New state for Encuesta and Cases
    // New state for Encuesta and Cases
    const [encuesta, setEncuesta] = useState<EncuestaResponse | null>(null);
    const [casosTitular, setCasosTitular] = useState<CasoSummary[]>([]);
    const [casosBeneficiario, setCasosBeneficiario] = useState<CasoSummary[]>([]);

    useEffect(() => {
        if (id) {
            loadSolicitante(id);
        }
    }, [id]);

    const loadSolicitante = async (cedula: string) => {
        setLoading(true);
        try {
            const data = await solicitanteService.getByCedula(cedula);
            setSolicitante(data);

            // Fetch Encuesta
            try {
                const encuestaData = await solicitanteService.getEncuesta(cedula);
                setEncuesta(encuestaData);
            } catch (error) {
                console.log("Encuesta no encontrada o error al cargar");
                setEncuesta(null);
            }

            // Fetch Casos
            try {
                const casosT = await solicitanteService.getCasosTitular(cedula);
                setCasosTitular(casosT);
            } catch (error) {
                console.error("Error cargando casos titular", error);
            }

            try {
                const casosB = await solicitanteService.getCasosBeneficiario(cedula);
                setCasosBeneficiario(casosB);
            } catch (error) {
                console.error("Error cargando casos beneficiario", error);
            }
        } catch (err) {
            console.error(err);
            setError('No se pudo cargar la información del solicitante.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditSuccess = () => {
        setIsEditing(false);
        if (id) loadSolicitante(id);
        alert('Solicitante actualizado exitosamente');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
            </div>
        );
    }

    if (error || !solicitante) {
        return (
            <MainLayout title="DETALLE DEL SOLICITANTE">
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p className="text-xl text-red-600 font-semibold">{error || 'Solicitante no encontrado'}</p>
                    <Button onClick={() => navigate('/solicitantes')} variant="primary">Volver a la lista</Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="DETALLE DEL SOLICITANTE">
            <div className="max-w-4xl mx-auto animate-fade-in-up w-full">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/solicitantes')}
                    className="mb-6 pl-0 hover:bg-transparent hover:text-red-900 text-gray-600"
                    icon={faArrowLeft}
                >
                    Volver a la lista
                </Button>

                {isEditing ? (
                    <div className="bg-white/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Editar Solicitante</h2>
                            <Button variant="ghost" onClick={() => setIsEditing(false)} icon={faArrowLeft}>Cancelar</Button>
                        </div>
                        <SolicitanteForm
                            initialData={solicitante}
                            onSuccess={handleEditSuccess}
                            onCancel={() => setIsEditing(false)}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        {/* Header Section */}
                        <div className="bg-linear-to-r from-red-900 to-red-800 p-8 text-white relative overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                                <FontAwesomeIcon icon={faUser} size="10x" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">{solicitante.nombre} {solicitante.apellido}</h1>
                                    <div className="flex items-center gap-3 mt-2 text-red-100">
                                        <FontAwesomeIcon icon={faAddressCard} />
                                        <span className="text-lg font-medium">{solicitante.cedula}</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xs"
                                    icon={faEdit}
                                >
                                    Editar Informaci&oacute;n
                                </Button>
                                <Button
                                    onClick={() => solicitante && reporteService.downloadFichaPdf(solicitante.cedula)}
                                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xs ml-2"
                                    icon={faFilePdf}
                                >
                                    Ficha PDF
                                </Button>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Informacion Personal */}
                            <section>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                    <FontAwesomeIcon icon={faUser} className="text-red-900" />
                                    Informaci&oacute;n Personal
                                </h3>
                                <dl className="grid grid-cols-1 gap-y-3 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Fecha de Nacimiento</dt>
                                        <dd className="font-medium text-gray-900">{solicitante.fechaNacimiento}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Sexo</dt>
                                        <dd className="font-medium text-gray-900">{solicitante.sexo}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Nacionalidad</dt>
                                        <dd className="font-medium text-gray-900">{solicitante.nacionalidad}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Nivel Educativo</dt>
                                        <dd className="font-medium text-gray-900">{solicitante.nombreNivel || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Estado Civil</dt>
                                        <dd className="font-medium text-gray-900">
                                            {solicitante.estadoCivil}
                                            {solicitante.concubinato && <span className="text-xs ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">En Concubinato</span>}
                                        </dd>
                                    </div>
                                </dl>
                            </section>

                            {/* Contacto */}
                            <section>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                    <FontAwesomeIcon icon={faPhone} className="text-red-900" />
                                    Contacto
                                </h3>
                                <dl className="grid grid-cols-1 gap-y-3 text-sm">
                                    <div className="flex items-start gap-3">
                                        <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 mt-1" />
                                        <div>
                                            <dt className="text-gray-500 sr-only">Email</dt>
                                            <dd className="font-medium text-gray-900">{solicitante.email || 'N/A'}</dd>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <FontAwesomeIcon icon={faPhone} className="text-gray-400 mt-1" />
                                        <div>
                                            <dt className="text-gray-500">Tel&eacute;fono Celular</dt>
                                            <dd className="font-medium text-gray-900">{solicitante.telfCelular || 'N/A'}</dd>
                                            <dt className="text-gray-500 mt-1">Tel&eacute;fono Casa</dt>
                                            <dd className="font-medium text-gray-900">{solicitante.telfCasa || 'N/A'}</dd>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 mt-1" />
                                        <div>
                                            <dt className="text-gray-500">Direcci&oacute;n</dt>
                                            <dd className="font-medium text-gray-900">
                                                {solicitante.nombreEstado || 'Estado (?)'}, {solicitante.nombreMunicipio || 'Municipio (?)'}, {solicitante.nombreParroquia || 'Parroquia (?)'}
                                            </dd>
                                        </div>
                                    </div>
                                </dl>
                            </section>



                            {/* Laboral */}
                            <section>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                    <FontAwesomeIcon icon={faBriefcase} className="text-red-900" />
                                    Informaci&oacute;n Laboral
                                </h3>
                                <dl className="grid grid-cols-1 gap-y-3 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Trabaja actualmente</dt>
                                        <dd className={`font-medium ${solicitante.trabaja ? 'text-green-600' : 'text-gray-900'}`}>
                                            {solicitante.trabaja ? 'S\u00ED' : 'No'}
                                        </dd>
                                    </div>
                                    {solicitante.trabaja && (
                                        <div>
                                            <dt className="text-gray-500">Condici&oacute;n</dt>
                                            <dd className="font-medium text-gray-900">{solicitante.condicionTrabajo || 'N/A'}</dd>
                                        </div>
                                    )}
                                </dl>
                            </section>
                        </div>

                        {/* Encuesta Socioeconómica */}
                        <div className="border-t border-gray-100 p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                                    <FontAwesomeIcon icon={faFileAlt} className="text-red-900" />
                                    Encuesta Socioecon&oacute;mica
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowEncuestaModal(true)}
                                    icon={faEdit}
                                >
                                    {encuesta ? 'Modificar Encuesta' : 'Registrar Encuesta'}
                                </Button>
                            </div>

                            {encuesta ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section>
                                        <h4 className="font-semibold text-gray-700 mb-2">Datos Familiares</h4>
                                        <dl className="grid grid-cols-1 gap-y-2 text-sm">
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Cant. Personas</dt>
                                                <dd className="font-medium text-gray-900">{encuesta.familia?.cantPersonas}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Cant. Ni&ntilde;os</dt>
                                                <dd className="font-medium text-gray-900">{encuesta.familia?.cantNinos}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Cant. Estudiando</dt>
                                                <dd className="font-medium text-gray-900">{encuesta.familia?.cantEstudiando}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Cant. Trabaja</dt>
                                                <dd className="font-medium text-gray-900">{encuesta.familia?.cantTrabaja}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Cant. Sin Trabajo</dt>
                                                <dd className="font-medium text-gray-900">{encuesta.familia?.cantSinTrabajo}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Ingreso Mensual</dt>
                                                <dd className="font-medium text-gray-900">{encuesta.familia?.ingresoMes}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Es Jefe de Familia</dt>
                                                <dd className="font-medium text-gray-900">{encuesta.familia?.jefeFamilia ? 'S\u00ED' : 'No'}</dd>
                                            </div>
                                            {encuesta.familia?.tiempoEstudio && (
                                                <div className="flex justify-between border-b border-gray-50 pb-1">
                                                    <dt className="text-gray-500">Tiempo Estudio</dt>
                                                    <dd className="font-medium text-gray-900">{encuesta.familia?.tiempoEstudio}</dd>
                                                </div>
                                            )}
                                        </dl>
                                    </section>
                                    <section>
                                        <h4 className="font-semibold text-gray-700 mb-2">Vivienda</h4>
                                        <dl className="grid grid-cols-1 gap-y-2 text-sm">
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Tipo</dt>
                                                <dd className="font-medium text-gray-900">{encuesta.vivienda?.tipoVivienda || 'N/A'}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Habitaciones</dt>
                                                <dd className="font-medium text-gray-900">{encuesta.vivienda?.cantHabitaciones}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Ba&ntilde;os</dt>
                                                <dd className="font-medium text-gray-900">{encuesta.vivienda?.cantBanos}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Material Piso</dt>
                                                <dd className="font-medium text-gray-900 max-w-[150px] truncate" title={encuesta.vivienda?.materialPiso}>{encuesta.vivienda?.materialPiso || 'N/A'}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Material Paredes</dt>
                                                <dd className="font-medium text-gray-900 max-w-[150px] truncate" title={encuesta.vivienda?.materialParedes}>{encuesta.vivienda?.materialParedes || 'N/A'}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Material Techo</dt>
                                                <dd className="font-medium text-gray-900 max-w-[150px] truncate" title={encuesta.vivienda?.materialTecho}>{encuesta.vivienda?.materialTecho || 'N/A'}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Serv. Agua</dt>
                                                <dd className="font-medium text-gray-900 text-xs max-w-[150px] truncate" title={encuesta.vivienda?.servicioAgua}>{encuesta.vivienda?.servicioAgua || 'N/A'}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Serv. Aseo</dt>
                                                <dd className="font-medium text-gray-900 text-xs max-w-[150px] truncate" title={encuesta.vivienda?.aseoUrbano}>{encuesta.vivienda?.aseoUrbano || 'N/A'}</dd>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <dt className="text-gray-500">Excretas</dt>
                                                <dd className="font-medium text-gray-900 text-xs max-w-[150px] truncate" title={encuesta.vivienda?.eliminacionExcretas}>{encuesta.vivienda?.eliminacionExcretas || 'N/A'}</dd>
                                            </div>
                                        </dl>
                                    </section>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No hay encuesta registrada para este solicitante.</p>
                            )}
                        </div>

                        {/* Modal Encuesta */}
                        {showEncuestaModal && solicitante && (
                            <Modal
                                isOpen={showEncuestaModal}
                                onClose={() => setShowEncuestaModal(false)}
                                title={`Encuesta Socioeconómica - ${solicitante.nombre}`}
                            >
                                <EncuestaForm
                                    cedula={solicitante.cedula}
                                    onSuccess={() => {
                                        alert("Encuesta guardada con éxito");
                                        setShowEncuestaModal(false);
                                        loadSolicitante(solicitante.cedula);
                                    }}
                                    onCancel={() => setShowEncuestaModal(false)}
                                />
                            </Modal>
                        )}

                        {/* Listado de Casos */}
                        <div className="bg-gray-50 p-8 border-t border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <FontAwesomeIcon icon={faBriefcase} className="text-red-900" />
                                Historial de Casos
                            </h3>

                            {/* Casos como Solicitante */}
                            <div className="mb-8">
                                <h4 className="font-semibold text-lg text-red-800 mb-4 border-l-4 border-red-800 pl-3">
                                    Como Solicitante (Titular)
                                </h4>
                                {casosTitular.length > 0 ? (
                                    <div className="overflow-x-auto bg-white rounded-lg shadow-xs border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caso #</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S&iacute;ntesis</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">&Aacute;mbito</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {casosTitular.map((caso) => (
                                                    <tr key={caso.numCaso} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/casos/${caso.numCaso}`)}>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-900">{caso.numCaso}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{caso.fechaRecepcion}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{caso.sintesis}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={caso.legalHierarchy}>{caso.legalHierarchy || 'N/A'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${caso.estatus === 'ABIERTO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {caso.estatus}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No tiene casos registrados como titular.</p>
                                )}
                            </div>

                            {/* Casos como Beneficiario */}
                            <div>
                                <h4 className="font-semibold text-lg text-blue-800 mb-4 border-l-4 border-blue-800 pl-3">
                                    Como Beneficiario
                                </h4>
                                {casosBeneficiario.length > 0 ? (
                                    <div className="overflow-x-auto bg-white rounded-lg shadow-xs border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caso #</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S&iacute;ntesis</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">&Aacute;mbito</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {casosBeneficiario.map((caso) => (
                                                    <tr key={caso.numCaso} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/casos/${caso.numCaso}`)}>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-900">{caso.numCaso}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{caso.fechaRecepcion}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{caso.sintesis}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={caso.legalHierarchy}>{caso.legalHierarchy || 'N/A'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${caso.estatus === 'ABIERTO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {caso.estatus}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No tiene casos registrados como beneficiario.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default SolicitanteDetalle;
