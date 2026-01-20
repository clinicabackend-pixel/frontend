import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faFilePdf,
  faPencil,
  faPlus,
  faFolderOpen,
  faScaleBalanced,
  faGavel,
  faUser,
  faUsers,
  faHistory,
  faCalendarAlt,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../components/layout/MainLayout';
import casoService from '../services/casoService';
import solicitanteService from '../services/solicitanteService';
import catalogoService from '../services/catalogoService';
import { reporteService } from '../services/reporteService';
import Button from '../components/common/Button';
import AddAccionModal from '../components/modals/AddAccionModal';
import AddEncuentroModal from '../components/modals/AddEncuentroModal';
import Modal from '../components/common/Modal';
import UniversalUploader from '../components/common/UniversalUploader'; // Importar Uploader
import { useAuth } from '../context/AuthContext';
import { getFullAmbitoPath } from '../utils/ambitoUtils';
import type {
  CasoDetalleResponse,
  CasoResponse,
  BeneficiarioResponse,
  CasoUpdateRequest,
  AccionCreateRequest
} from '../types/caso';
import type { Tribunal } from '../types/catalogo';
import type { SolicitanteResponse } from '../types/solicitante';
import Loader from '../components/common/Loader';

// Interface for Timeline Events
interface TimelineEvent {
  id: string;
  type: 'accion' | 'encuentro' | 'inicio';
  fecha: Date;
  titulo: string;
  descripcion?: string;
  observacion?: string;
  idAccion?: number;
  fechaEjecucion?: string;
  username?: string;
  idEncuentro?: number;
  fechaAtencion?: string;
  fechaProxima?: string;
}

export default function CasoDetalle() {
  const { numCaso } = useParams<{ numCaso: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [casoDetalle, setCasoDetalle] = useState<CasoDetalleResponse | null>(null);
  const [nombreSolicitante, setNombreSolicitante] = useState<string>('');
  const [solicitante, setSolicitante] = useState<SolicitanteResponse | null>(null);
  const [materiaNombre, setMateriaNombre] = useState<string>('');

  // Catalogs
  const [tribunales, setTribunales] = useState<Tribunal[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<
    'general' | 'beneficiarios' | 'historial' | 'documentos' | 'pruebas'
  >('general');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddBeneficiarioModalOpen, setIsAddBeneficiarioModalOpen] = useState(false);

  // Beneficiario Add State
  const [cedulaSearch, setCedulaSearch] = useState('');
  const [foundPerson, setFoundPerson] = useState<SolicitanteResponse | null>(null);
  const [newBenParentesco, setNewBenParentesco] = useState('');
  const [newBenTipo, setNewBenTipo] = useState('');
  const [searchError, setSearchError] = useState('');

  // Upload State
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string, type: string, name: string }>>([]);

  // Accion/Encuentro State
  const [isAddAccionModalOpen, setIsAddAccionModalOpen] = useState(false);
  const [isAddEncuentroModalOpen, setIsAddEncuentroModalOpen] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState<CasoUpdateRequest>({});




  useEffect(() => {
    const fetchData = async () => {
      if (!numCaso) return;
      setLoading(true);
      try {
        const [detalle, listaTribunales] = await Promise.all([
          casoService.getById(numCaso),
          catalogoService.getTribunales().catch(() => []),
        ]);

        setCasoDetalle(detalle);
        setTribunales(listaTribunales);

        if (detalle.caso.cedula) {
          try {
            const sol = await solicitanteService.getByCedula(detalle.caso.cedula);
            setSolicitante(sol);
            const nombreCompleto = `${sol.nombre} ${sol.apellido || ''}`.trim();
            setNombreSolicitante(nombreCompleto || detalle.caso.cedula);
          } catch (err) {
            console.warn('No se pudo cargar info del solicitante', err);
            setNombreSolicitante(detalle.caso.cedula);
          }
        }

        const materiaPath = await getFullAmbitoPath(detalle.caso.comAmbLegal);
        setMateriaNombre(materiaPath);
        setError(null);
      } catch (err) {
        console.error('Error cargando caso:', err);
        setError('No se pudo cargar el caso. Verifique que exista.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [numCaso]);

  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return 'N/A';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const openEditModal = () => {
    if (!casoDetalle) return;
    setEditFormData({
      sintesis: casoDetalle.caso.sintesis,
      idTribunal: casoDetalle.caso.idTribunal,
      codCasoTribunal: casoDetalle.caso.codCasoTribunal || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!numCaso || !casoDetalle) return;
    try {
      await casoService.update(numCaso, editFormData);
      const updatedCaso = { ...casoDetalle.caso, ...editFormData };
      if (editFormData.idTribunal) {
        const trib = tribunales.find((t) => t.idTribunal === editFormData.idTribunal);
        if (trib) updatedCaso.nombreTribunal = trib.nombreTribunal;
      }
      setCasoDetalle({ ...casoDetalle, caso: updatedCaso as CasoResponse });
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating caso', err);
      alert('Error al actualizar el caso');
    }
  };


  const handleSearchPerson = async () => {
    setSearchError('');
    setFoundPerson(null);
    if (!cedulaSearch) return;

    try {
      const persona = await solicitanteService.getByCedula(cedulaSearch);
      if (persona) {
        setFoundPerson(persona);
      } else {
        setSearchError('Persona no encontrada.');
      }
    } catch (e) {
      setSearchError('Persona no encontrada o error al buscar.');
    }
  };

  const handleAddBeneficiarioClick = async () => {
    if (!numCaso || !casoDetalle || !foundPerson || !newBenParentesco || !newBenTipo) return;

    const newBen = {
      cedula: foundPerson.cedula,
      nombre: foundPerson.nombre,
      parentesco: newBenParentesco,
      tipoBeneficiario: newBenTipo,
    };

    try {
      await casoService.addBeneficiario(numCaso, newBen);

      const addedBen: BeneficiarioResponse = {
        cedula: newBen.cedula,
        nombre: newBen.nombre || '',
        parentesco: newBen.parentesco,
        tipoBeneficiario: newBen.tipoBeneficiario,
        numCaso: numCaso,
      };

      const newBeneficiarios = casoDetalle.beneficiarios
        ? [...casoDetalle.beneficiarios, addedBen]
        : [addedBen];
      setCasoDetalle({ ...casoDetalle, beneficiarios: newBeneficiarios });

      // Reset state
      setFoundPerson(null);
      setCedulaSearch('');
      setNewBenParentesco('');
      setNewBenTipo('');
      setIsAddBeneficiarioModalOpen(false);
    } catch (error) {
      console.error("Error adding beneficiario:", error);
      alert("Error al agregar beneficiario");
    }
  };



  const handleAddAccion = async (data: AccionCreateRequest) => {
    if (!numCaso || !casoDetalle) return;
    try {
      await casoService.createAccion(numCaso, data);
      const updated = await casoService.getById(numCaso);
      setCasoDetalle(updated);
      setIsAddAccionModalOpen(false);
    } catch (err) {
      console.error('Error adding accion', err);
      alert('Error al registrar la acción');
    }
  };

  const handleAddEncuentro = async (data: any) => {
    if (!numCaso || !casoDetalle) return;
    try {
      await casoService.createEncuentro(numCaso, data);
      const updated = await casoService.getById(numCaso);
      setCasoDetalle(updated);
      setIsAddEncuentroModalOpen(false);
    } catch (err) {
      console.error('Error adding encuentro', err);
      alert('Error al registrar el encuentro');
    }
  };

  if (loading) return <Loader text="Cargando caso..." />;

  if (error || !casoDetalle) {
    return (
      <MainLayout title="Error">
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-red-600 text-xl font-semibold mb-4">{error || 'Caso no encontrado'}</p>
          <Button onClick={() => navigate('/casos')} variant="primary">Volver a casos</Button>
        </div>
      </MainLayout>
    );
  }

  const { caso, beneficiarios, acciones, encuentros, documentos, pruebas } = casoDetalle;

  return (
    <MainLayout title={`Caso ${caso.numCaso}`}>
      <div className="max-w-7xl mx-auto w-full pb-20 animate-fade-in-up">
        {/* Top Actions */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/casos')}
            className="text-gray-600 hover:text-red-900 pl-0"
            icon={faArrowLeft}
          >
            Volver
          </Button>
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => caso.numCaso && reporteService.downloadReporteCasoPdf(caso.numCaso)}
              variant="secondary"
              size="sm"
              icon={faFilePdf}
              className="text-red-700 hover:text-red-900 border-red-200 hover:border-red-300"
            >
              Exportar PDF
            </Button>
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${caso.estatus === 'ABIERTO'
                ? 'bg-green-100 text-green-800 border-green-200'
                : 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
            >
              {caso.estatus}
            </span>
          </div>
        </div>

        {/* Header Summary Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faFolderOpen} className="text-red-900 opacity-70" />
                {nombreSolicitante}
              </h1>
              <p className="text-sm text-gray-500 mt-1 ml-8">
                Solicitante - C.I: {caso.cedula}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-red-900 font-semibold text-lg">
                <FontAwesomeIcon icon={faScaleBalanced} />
                {materiaNombre}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Materia</div>
            </div>
          </div>

          {/* Solicitante Details */}
          {solicitante && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-xs text-gray-500">Teléfono</span>
                <span className="font-medium text-sm text-gray-900">{solicitante.telfCelular || solicitante.telfCasa || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Correo</span>
                <span className="font-medium text-sm text-gray-900 truncate" title={solicitante.email}>{solicitante.email || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Edad / Civil</span>
                <span className="font-medium text-sm text-gray-900">{calculateAge(solicitante.fechaNacimiento)} años, {solicitante.estadoCivil}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Dirección</span>
                <span className="font-medium text-sm text-gray-900 truncate" title={`${solicitante.nombreParroquia || solicitante.idParroquia}, ${solicitante.nombreMunicipio || solicitante.idMunicipio}`}>{solicitante.nombreParroquia || solicitante.idParroquia}</span>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha Recepción</span>
              <span className="text-sm font-medium text-gray-900">{new Date(caso.fechaRecepcion).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Trámite</span>
              <span className="text-sm font-medium text-gray-900">{caso.tramite}</span>
            </div>
            <div>
              <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Asignado a</span>
              <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                {caso.username || 'Sin asignar'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Tribunal</span>
              <div className="text-sm font-medium text-gray-900 flex flex-col">
                {caso.nombreTribunal ? (
                  <>
                    <span>{caso.nombreTribunal}</span>
                    <span className="text-xs text-gray-500 font-normal">{caso.codCasoTribunal}</span>
                  </>
                ) : (
                  <span className="text-gray-400 italic">No asignado</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'general', label: 'General' },
              { id: 'beneficiarios', label: 'Beneficiarios' },
              { id: 'historial', label: 'Historial' },
              { id: 'documentos', label: 'Documentos' },
              // { id: 'pruebas', label: 'Pruebas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                      py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                    ? 'border-red-900 text-red-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* GENERAL */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Síntesis del Caso</h3>
                <Button variant="outline" size="sm" onClick={openEditModal} icon={faPencil}>
                  Editar
                </Button>
              </div>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50 p-6 rounded-lg border border-gray-100">
                {caso.sintesis || 'No hay síntesis registrada.'}
              </p>
            </div>
          )}

          {/* BENEFICIARIOS */}
          {activeTab === 'beneficiarios' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="text-gray-400" />
                  Beneficiarios ({beneficiarios?.length || 0})
                </h3>
                <Button variant="primary" size="sm" onClick={() => setIsAddBeneficiarioModalOpen(true)} icon={faPlus}>
                  Agregar Beneficiario
                </Button>
              </div>

              {!beneficiarios || beneficiarios.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">No hay beneficiarios registrados en este caso.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {beneficiarios.map(ben => (
                    <div key={ben.cedula} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-sm transition-shadow">
                      <div>
                        <p className="font-semibold text-gray-900">{ben.nombre}</p>
                        <p className="text-sm text-gray-500">C.I: {ben.cedula}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                            {ben.parentesco}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                            {ben.tipoBeneficiario}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          alert("Funcionalidad de edición en desarrollo");
                        }}
                        className="text-gray-400 hover:text-red-900 p-2"
                      >            <FontAwesomeIcon icon={faPencil} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORIAL */}
          {activeTab === 'historial' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faHistory} className="text-gray-400" />
                  Línea de Tiempo
                </h3>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsAddEncuentroModalOpen(true)} icon={faCalendarAlt}>
                    Registrar Cita
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsAddAccionModalOpen(true)} icon={faGavel}>
                    Registrar Acción
                  </Button>
                </div>
              </div>

              <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-4 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-200">
                {/* Timeline Logic */}
                {(() => {
                  const timeline: TimelineEvent[] = [];
                  acciones?.forEach(a => timeline.push({
                    id: `accion-${a.idAccion}`,
                    type: 'accion',
                    fecha: new Date(a.fechaRegistro),
                    titulo: a.titulo,
                    descripcion: a.descripcion,
                    username: a.username
                  }));
                  encuentros?.forEach(e => timeline.push({
                    id: `encuentro-${e.idEncuentro}`,
                    type: 'encuentro',
                    fecha: new Date(e.fechaAtencion),
                    titulo: e.orientacion,
                    observacion: e.observacion,
                    fechaProxima: e.fechaProxima
                  }));

                  // Initial Event
                  timeline.push({
                    id: 'inicio',
                    type: 'inicio',
                    fecha: new Date(caso.fechaRecepcion),
                    titulo: 'Apertura del Caso',
                    descripcion: `Caso registrado en el sistema. ${caso.username ? 'Asignado a ' + caso.username : ''}`
                  });

                  return timeline.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()).map((event) => (
                    <div key={event.id} className="relative pl-6 sm:pl-8">
                      <div className={`absolute left-0 sm:left-2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm
                                        ${event.type === 'inicio' ? 'bg-green-500' :
                          event.type === 'accion' ? 'bg-red-600' : 'bg-blue-500'}
                                     `}></div>

                      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded w-fit uppercase
                                                ${event.type === 'inicio' ? 'bg-green-100 text-green-800' :
                              event.type === 'accion' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
                                             `}>
                            {event.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {event.fecha.toLocaleDateString()} - {event.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-800 mb-1">{event.titulo}</h4>
                        {event.descripcion && <p className="text-gray-600 text-sm mb-2">{event.descripcion}</p>}
                        {event.observacion && (
                          <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-100">
                            <strong>Observación:</strong> {event.observacion}
                          </div>
                        )}
                        {event.fechaProxima && (
                          <div className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            Próxima Cita: {new Date(event.fechaProxima).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* DOCUMENTOS */}
          {activeTab === 'documentos' && (
            <div className="space-y-6">
              {/* Uploader Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Subir Nuevo Documento</h3>
                <UniversalUploader
                  onUploadComplete={async (data) => {
                    const newFile = { url: data.url, type: data.type, name: `Archivo ${data.type}` };
                    setUploadedFiles(prev => [...prev, newFile]);

                    // Persist as Prueba
                    if (numCaso && casoDetalle) {
                      try {
                        await casoService.createPrueba(numCaso, {
                          fecha: new Date().toISOString().split('T')[0],
                          documento: data.url, // Store URL in documento field
                          titulo: `Archivo Digital (${data.type})`,
                          observacion: 'Subido desde el detalle del caso',
                          username: user?.username || 'Desconocido'
                        });
                        // Refresh data
                        const updated = await casoService.getById(numCaso);
                        setCasoDetalle(updated);
                      } catch (err) {
                        console.error("Error creating prueba from upload:", err);
                      }
                    }
                  }}
                />

                {/* Mostrar Pruebas (Archivos Digitales) */}
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Archivos Digitales</h3>
                  {!pruebas || pruebas.length === 0 ? (
                    <p className="text-gray-500 italic">No hay archivos digitales asociados.</p>
                  ) : (
                    <ul className="space-y-3">
                      {pruebas.map((prueba) => {
                        // Check if documento is a URL (simple check)
                        const isUrl = prueba.documento.startsWith('http');
                        return (
                          <li key={prueba.idPrueba} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-50 text-blue-600 p-2 rounded">
                                <FontAwesomeIcon icon={faFilePdf} />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{prueba.titulo}</p>
                                <p className="text-xs text-gray-500">{new Date(prueba.fecha).toLocaleDateString()} - {prueba.observacion}</p>
                              </div>
                            </div>
                            {isUrl ? (
                              <a
                                href={prueba.documento}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium transition-colors"
                              >
                                Ver Archivo
                              </a>
                            ) : (
                              <span className="text-sm text-gray-500">{prueba.documento}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Existing Documents List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Expediente Físico</h3>
                {!documentos || documentos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 italic">
                    No hay documentos físicos registrados en este caso.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {documentos.map((doc, _idx) => (
                      <li key={_idx} className="py-3 flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded text-gray-500">
                          <FontAwesomeIcon icon={faFolderOpen} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.titulo || 'Documento sin título'}</p>
                          <p className="text-sm text-gray-500">{doc.observacion}</p>
                          <div className="text-xs text-gray-400 mt-1">
                            Fila: {doc.folioIni} - {doc.folioFin} | Registrado: {new Date(doc.fechaRegistro).toLocaleDateString()}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* Edit Case Modal (Simplified) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Caso"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Síntesis</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-32 p-2 border"
              value={editFormData.sintesis || ''}
              onChange={e => setEditFormData({ ...editFormData, sintesis: e.target.value })}
            />
          </div>
          {/* Simplified Tribunal Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tribunal</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-10 border"
              value={editFormData.idTribunal || ''}
              onChange={e => setEditFormData({ ...editFormData, idTribunal: Number(e.target.value) })}
            >
              <option value="">Seleccione Tribunal</option>
              {tribunales.map(t => (
                <option key={t.idTribunal} value={t.idTribunal}>{t.nombreTribunal}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Código/Expediente en Tribunal</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-10 border px-3"
              value={editFormData.codCasoTribunal || ''}
              onChange={e => setEditFormData({ ...editFormData, codCasoTribunal: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleUpdate}>Guardar Cambios</Button>
          </div>
        </div>
      </Modal>

      {/* Add Accion Modal */}
      <AddAccionModal
        isOpen={isAddAccionModalOpen}
        onClose={() => setIsAddAccionModalOpen(false)}
        onSuccess={handleAddAccion}
      />

      {/* Add Encuentro Modal */}
      <AddEncuentroModal
        isOpen={isAddEncuentroModalOpen}
        onClose={() => setIsAddEncuentroModalOpen(false)}
        onSuccess={handleAddEncuentro}
      />

      {/* Add Beneficiario Modal */}
      <Modal
        isOpen={isAddBeneficiarioModalOpen}
        onClose={() => setIsAddBeneficiarioModalOpen(false)}
        title="Agregar Beneficiario"
      >
        <div className="space-y-4">
          {/* Buscar por Cédula */}
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
              placeholder="Buscar por Cédula"
              value={cedulaSearch}
              onChange={e => setCedulaSearch(e.target.value)}
            />
            <button
              type="button"
              onClick={handleSearchPerson}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Buscar
            </button>
          </div>

          {searchError && (
            <p className="text-red-500 text-sm">{searchError}</p>
          )}

          {foundPerson && (
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="font-bold text-green-900">{foundPerson.nombre} {foundPerson.apellido}</p>
              <p className="text-sm text-green-700">C.I: {foundPerson.cedula}</p>
            </div>
          )}

          {/* Parentesco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parentesco</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
              value={newBenParentesco}
              onChange={e => setNewBenParentesco(e.target.value)}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 appearance-none bg-white"
              value={newBenTipo}
              onChange={e => setNewBenTipo(e.target.value)}
            >
              <option value="">Seleccione...</option>
              <option value="DIRECTO">Directo</option>
              <option value="INDIRECTO">Indirecto</option>
            </select>
          </div>

          {/* Botón Agregar */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleAddBeneficiarioClick}
              disabled={!foundPerson || !newBenParentesco || !newBenTipo}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Agregar
            </button>
          </div>
        </div>
      </Modal>

    </MainLayout>
  );
}
