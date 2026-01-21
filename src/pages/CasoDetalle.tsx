import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import casoService from '../services/casoService';
import solicitanteService from '../services/solicitanteService';
import catalogoService from '../services/catalogoService';
import { reporteService } from '../services/reporteService';
import Modal from '../components/common/Modal';
import CustomSelect from '../components/common/CustomSelect';
import Button from '../components/common/Button';
import AddAccionModal from '../components/modals/AddAccionModal';
import AddEncuentroModal from '../components/modals/AddEncuentroModal';
import SolicitanteForm from '../components/forms/SolicitanteForm';
import AssignStudentModal from '../components/AssignStudentModal';
import AssignSupervisorModal from '../components/AssignSupervisorModal';
import AddDocumentoModal from '../components/modals/AddDocumentoModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import UniversalUploader from '../components/common/UniversalUploader';
import { Plus, Search, UserPlus, Pencil, CheckCircle, XCircle } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faTrash, faFolderOpen, faFilePdf, faFileAlt, faFileWord, faFileImage } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import type {
  CasoDetalleResponse,
  CasoResponse,
  BeneficiarioResponse,
  CasoUpdateRequest,
  AccionCreateRequest,
} from '../types/caso';
import type { Tribunal } from '../types/catalogo';

import type { SolicitanteResponse } from '../types/solicitante';
import { getFullAmbitoPath } from '../utils/ambitoUtils';

// Función helper para parsear fechas en formato YYYY-MM-DD como fechas locales (no UTC)
const parseLocalDate = (dateString: string): Date => {
  const partes = dateString.split('-');
  if (partes.length === 3) {
    const año = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // Los meses son 0-indexados
    const dia = parseInt(partes[2], 10);
    return new Date(año, mes, dia);
  }
  return new Date(dateString);
};

function CasoDetalle() {
  const { numCaso } = useParams<{ numCaso: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    // Calcular el estado inicial basado en el theme
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    // theme === 'system'
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    'general' | 'beneficiarios' | 'historial' | 'documentos' | 'pruebas' | 'responsables' | 'folios'
  >('general');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddBeneficiarioModalOpen, setIsAddBeneficiarioModalOpen] = useState(false);

  // Estado para el modal de eventos de la línea de tiempo
  const [selectedEvento, setSelectedEvento] = useState<any>(null);
  const [isEventoModalOpen, setIsEventoModalOpen] = useState(false);

  // Student Assignment State (para pestaña Responsables)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssignSupervisorModalOpen, setIsAssignSupervisorModalOpen] = useState(false);
  const [unassignData, setUnassignData] = useState<{ isOpen: boolean; username: string; termino: string; nombre: string }>({
    isOpen: false,
    username: '',
    termino: '',
    nombre: ''
  });
  const [unassignLoading, setUnassignLoading] = useState(false);

  // Supervisor Unassignment State
  const [unassignSupervisorData, setUnassignSupervisorData] = useState<{ isOpen: boolean; username: string; termino: string; nombre: string }>({
    isOpen: false,
    username: '',
    termino: '',
    nombre: ''
  });
  const [unassignSupervisorLoading, setUnassignSupervisorLoading] = useState(false);

  // Document/Folio State (para pestaña Folios)
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);

  // Modal de confirmación state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    success: boolean;
    message: string;
  }>({
    isOpen: false,
    success: false,
    message: '',
  });

  // Funciones para el modal de confirmación
  const showConfirmationModal = (success: boolean, message: string) => {
    setConfirmationModal({ isOpen: true, success, message });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({ isOpen: false, success: false, message: '' });
  };

  // Actualizar isDark cuando cambia el theme
  useEffect(() => {
    if (theme === 'dark') {
      setIsDark(true);
    } else if (theme === 'light') {
      setIsDark(false);
    } else {
      // theme === 'system'
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
    }
  }, [theme]);

  // Cerrar modal de evento con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEventoModalOpen) {
        setIsEventoModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEventoModalOpen]);

  // Beneficiario Add State (Inline)
  const [cedulaSearch, setCedulaSearch] = useState('');
  const [foundPerson, setFoundPerson] = useState<any>(null); // Persona encontrada (SolicitanteResponse)
  const [newBenParentesco, setNewBenParentesco] = useState('');
  const [newBenTipo, setNewBenTipo] = useState('');
  const [showSolicitanteForm, setShowSolicitanteForm] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Accion State
  const [isAddAccionModalOpen, setIsAddAccionModalOpen] = useState(false);

  // Encuentro State
  const [isAddEncuentroModalOpen, setIsAddEncuentroModalOpen] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState<CasoUpdateRequest>({});

  // Permisos
  const canAssign = user?.tipoUsuario === 'ADMINISTRADOR' || user?.tipoUsuario === 'COORDINADOR' || user?.tipoUsuario === 'PROFESOR';

  useEffect(() => {
    const fetchData = async () => {
      if (!numCaso) return;
      setLoading(true);
      try {
        // 1. Fetch Case Details and Catalogs
        const [detalle, listaTribunales] = await Promise.all([
          casoService.getById(numCaso),
          catalogoService.getTribunales().catch(() => []), // Silent fail for catalogs
        ]);

        setCasoDetalle(detalle);
        setTribunales(listaTribunales);

        // 2. Fetch Solicitante Name (Parallel if possible, but dependent on cedula)
        if (detalle.caso.cedula) {
          try {
            const sol = await solicitanteService.getByCedula(detalle.caso.cedula);
            setSolicitante(sol);
            // Usamos 'apellido' opcionalmente o solo nombre
            // Si apellido existe y es diferente de nombre, concatenar. Si no, usar solo nombre
            const nombreCompleto = sol.apellido && sol.apellido.trim() && sol.apellido !== sol.nombre
                ? `${sol.nombre} ${sol.apellido}`.trim()
                : sol.nombre || '';
            setNombreSolicitante(nombreCompleto || detalle.caso.cedula);
          } catch (err) {
            console.warn('No se pudo cargar info del solicitante', err);
            setNombreSolicitante(detalle.caso.cedula);
          }
        }

        // 3. Resolve Materia Name using Tree Search (Full Path)
        const materiaPath = await getFullAmbitoPath(detalle.caso.comAmbLegal);
        setMateriaNombre(materiaPath);
      } catch (err) {
        console.error('Error cargando caso:', err);
        setError('No se pudo cargar el caso. Verifique que exista.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [numCaso]);

  const handleMenuClick = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // Helper to calculate age if needed (though backend might send it)
  const calculateAge = (birthDateString: string) => {
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
      // Refresh data locally
      const updatedCaso = { ...casoDetalle.caso, ...editFormData };
      // If Tribunal changed, update Name too
      if (editFormData.idTribunal) {
        const trib = tribunales.find((t) => t.idTribunal === editFormData.idTribunal);
        if (trib) updatedCaso.nombreTribunal = trib.nombreTribunal;
      }
      setCasoDetalle({ ...casoDetalle, caso: updatedCaso as CasoResponse });
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating caso', err);
      showConfirmationModal(false, 'Error al actualizar el caso');
    }
  };

  // Handler para refrescar datos después de asignar/desasignar estudiante
  const handleRefresh = async () => {
    if (!numCaso) return;
    try {
      const updated = await casoService.getById(numCaso);
      setCasoDetalle(updated);
    } catch (err) {
      console.error('Error refreshing case data', err);
    }
  };

  // Handler para desasignar estudiante
  const handleUnassignConfirm = async () => {
    if (!numCaso) return;
    setUnassignLoading(true);
    try {
      await casoService.unassignStudent(numCaso, unassignData.username, unassignData.termino);
      setUnassignData(prev => ({ ...prev, isOpen: false }));
      await handleRefresh();
    } catch (err) {
      console.error('Error unassigning student:', err);
      showConfirmationModal(false, 'Error al desasignar el estudiante.');
    } finally {
      setUnassignLoading(false);
    }
  };

  // Handler para desasignar supervisor
  const handleUnassignSupervisorConfirm = async () => {
    if (!numCaso) return;
    setUnassignSupervisorLoading(true);
    try {
      await casoService.unassignSupervisor(numCaso, unassignSupervisorData.username, unassignSupervisorData.termino);
      setUnassignSupervisorData(prev => ({ ...prev, isOpen: false }));
      await handleRefresh();
    } catch (err) {
      console.error('Error unassigning supervisor:', err);
      // alert('Error al desasignar el supervisor. Asegúrate de que tienes permiso.'); // We can improve this with a toast notification later
    } finally {
      setUnassignSupervisorLoading(false);
    }
  };

  /* --- Funciones de Editar Beneficiario --- */
  const [editingBeneficiario, setEditingBeneficiario] = useState<SolicitanteResponse | null>(null);
  const [editingRelacion, setEditingRelacion] = useState({ parentesco: '', tipoBeneficiario: '' });
  const [isEditBeneficiarioModalOpen, setIsEditBeneficiarioModalOpen] = useState(false);

  const handleEditBeneficiario = async (cedula: string) => {
    try {
      setLoading(true);
      const [solicitanteData, casoData] = await Promise.all([
        solicitanteService.getByCedula(cedula),
        // We need current relationship data. We can find it in 'beneficiarios' state
        Promise.resolve(casoDetalle?.beneficiarios?.find((b) => b.cedula === cedula)),
      ]);

      setEditingBeneficiario(solicitanteData);
      if (casoData) {
        setEditingRelacion({
          parentesco: casoData.parentesco,
          tipoBeneficiario: casoData.tipoBeneficiario,
        });
      }
      setIsEditBeneficiarioModalOpen(true);
    } catch (e) {
      console.error('Error cargando beneficiario', e);
      showConfirmationModal(false, 'No se pudo cargar la información del beneficiario');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBeneficiarioSuccess = () => {
    setIsEditBeneficiarioModalOpen(false);
    setEditingBeneficiario(null);
    // Refresh parent data to show updated names if changed
    const refresh = async () => {
      if (!numCaso) return;
      const updatedCaso = await casoService.getById(numCaso);
      setCasoDetalle(updatedCaso);
    };
    refresh();
  };

  /* --- Funciones de Beneficiario Inline --- */

  const handleAddBeneficiarioInternal = async (newBen: any) => {
    if (!numCaso || !casoDetalle) return;
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

    // Reset modal state
    setFoundPerson(null);
    setCedulaSearch('');
    setNewBenParentesco('');
    setNewBenTipo('');
    setIsAddBeneficiarioModalOpen(false);
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
        setSearchError('Persona no encontrada. Puede registrarla.');
      }
    } catch (e) {
      setSearchError('Persona no encontrada o error al buscar.');
    }
  };

  const handleAddBeneficiarioClick = async () => {
    if (!foundPerson || !newBenParentesco || !newBenTipo) return;

    const newBen = {
      cedula: foundPerson.cedula,
      nombre: foundPerson.nombre, // Se envía para UI optimista, backend lo saca de DB
      parentesco: newBenParentesco,
      tipoBeneficiario: newBenTipo,
    };
    await handleAddBeneficiarioInternal(newBen);
  };

  const handleNewPersonSuccess = (newPerson: any) => {
    // Al crear persona, volvemos al modo de "persona encontrada"
    setShowSolicitanteForm(false);
    setFoundPerson(newPerson);
    setCedulaSearch(newPerson.cedula);
    setSearchError('');
  };

  const handleAddAccion = async (data: AccionCreateRequest) => {
    if (!numCaso || !casoDetalle) return;
    try {
      await casoService.createAccion(numCaso, data);
      // Refresh data
      const updated = await casoService.getById(numCaso);
      setCasoDetalle(updated);
    } catch (err) {
      console.error('Error adding accion', err);
      showConfirmationModal(false, 'Error al registrar la acción');
    }
  };

  const handleAddEncuentro = async (data: any) => {
    if (!numCaso || !casoDetalle) return;
    try {
      await casoService.createEncuentro(numCaso, data);
      // Refresh data
      const updated = await casoService.getById(numCaso);
      setCasoDetalle(updated);
    } catch (err) {
      console.error('Error adding encuentro', err);
      showConfirmationModal(false, 'Error al registrar el encuentro');
    }
  };

  if (loading) {
    return (
      <div className={`flex h-screen w-screen items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isDark ? 'border-red-900' : 'border-red-900'}`}></div>
      </div>
    );
  }

  if (error || !casoDetalle) {
    return (
      <div className={`flex h-screen w-screen flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Header title="Error" onMenuClick={handleMenuClick} />
        <div className="flex flex-1 items-center justify-center">
          <div className={`text-center p-8 rounded-lg shadow-md border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <p className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-red-600'}`}>
              {error || 'Caso no encontrado'}
            </p>
            <button
              onClick={() => navigate('/casos')}
              className="px-6 py-2 bg-red-900 text-white rounded hover:bg-red-950 transition-colors"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { caso, beneficiarios, acciones, encuentros, documentos } = casoDetalle;

  const asignados = casoDetalle.asignados || [];
  const supervisores = casoDetalle.supervisores || [];
  const pruebas = casoDetalle.pruebas || [];

  return (
    <div className={`flex w-screen h-screen overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      <div className={`flex-1 flex flex-col w-full min-w-0 ${isDark ? 'bg-gray-900' : ''}`}>
        <Header title={`CASO ${caso.numCaso}`} onMenuClick={handleMenuClick} />

        <main className={`flex-1 overflow-y-auto py-6 px-8 md:px-10 lg:px-16 xl:px-20 pb-20 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="w-full space-y-6">
            {/* Top Bar with Back & Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate('/casos')}
                className={`flex items-center hover:text-red-900 transition-colors font-medium ${isDark ? 'text-white' : 'text-gray-600'
                  }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Volver
              </button>
              <div className="flex gap-2 items-center">
                {/* Botón Eliminar Caso (Solo Coordinador) */}
                {user?.tipoUsuario === 'COORDINADOR' && (
                  <button
                    onClick={async () => {
                      if (window.confirm('¿Está seguro de que desea eliminar este caso? Esta acción no se puede deshacer.')) {
                        try {
                          if (caso.numCaso) {
                            await casoService.delete(caso.numCaso);
                            navigate('/casos');
                          }
                        } catch (e) {
                          console.error(e);
                          showConfirmationModal(false, 'Error al eliminar el caso');
                        }
                      }
                    }}
                    className="px-3 py-1.5 bg-red-900 text-white rounded-lg hover:bg-red-950 font-medium transition-colors flex items-center gap-2 text-sm"
                    title="Eliminar Caso Permanentemente"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span className="hidden sm:inline">Eliminar</span>
                  </button>
                )}

                {/* Botón Exportar Reporte Caso */}
                <button
                  onClick={() => caso.numCaso && reporteService.downloadReporteCaso(caso.numCaso)}
                  className="px-3 py-1.5 bg-red-900 text-white rounded-lg hover:bg-red-950 font-medium transition-colors flex items-center gap-2 text-sm"
                  title="Descargar Reporte del Caso"
                >
                  <FontAwesomeIcon icon={faFileExcel} />
                  <span className="hidden sm:inline">Exportar</span>
                </button>

                {/* Selector de Estatus (Coordinador / Profesor) */}
                {(user?.tipoUsuario === 'COORDINADOR' || user?.tipoUsuario === 'PROFESOR') ? (
                  <select
                    value={caso.estatus}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      if (!caso.numCaso) return;
                      try {
                        await casoService.updateEstatus(caso.numCaso, newStatus);
                        await handleRefresh();
                      } catch (err) {
                        console.error(err);
                        showConfirmationModal(false, 'Error al cambiar el estatus');
                      }
                    }}
                    className={`px-4 py-1.5 rounded text-sm font-semibold border outline-none cursor-pointer bg-white text-gray-900 border-gray-300`}
                    style={{
                      color: caso.estatus === 'ABIERTO' 
                        ? '#16a34a' // green-600
                        : caso.estatus === 'EN TRÁMITE'
                        ? '#2563eb' // blue-600
                        : caso.estatus === 'EN PAUSA'
                        ? '#ca8a04' // yellow-600
                        : '#6b7280' // gray-500
                    }}
                  >
                    <option value="ABIERTO" style={{ backgroundColor: '#ffffff', color: '#16a34a' }}>ABIERTO</option>
                    <option value="EN TRÁMITE" style={{ backgroundColor: '#ffffff', color: '#2563eb' }}>EN TRÁMITE</option>
                    <option value="EN PAUSA" style={{ backgroundColor: '#ffffff', color: '#ca8a04' }}>EN PAUSA</option>
                    <option value="CERRADO" style={{ backgroundColor: '#ffffff', color: '#6b7280' }}>CERRADO</option>
                  </select>
                ) : (
                  <span
                    className={`px-4 py-1 rounded-full text-sm font-semibold border ${caso.estatus === 'ABIERTO'
                      ? isDark
                        ? 'bg-green-900/50 text-green-300 border-green-700'
                        : 'bg-green-100 text-green-800 border-green-200'
                      : isDark
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                  >
                    {caso.estatus}
                  </span>
                )}
              </div>
            </div>

            {/* Header Card */}
            <div
              className={`rounded-xl shadow-sm border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <h1
                    className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                    {nombreSolicitante}
                  </h1>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-500'}`}>
                    Solicitante (CI: {caso.cedula})
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-semibold text-right ${isDark ? 'text-white' : 'text-red-900'
                      }`}
                  >
                    {materiaNombre}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-500'}`}>
                    Materia
                  </div>
                </div>
              </div>

              {/* Información del Solicitante Expandida */}
              {solicitante && (
                <div
                  className={`rounded-lg p-4 mb-6 border ${isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-100'
                    }`}
                >
                  <h3
                    className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-white' : 'text-gray-400'
                      }`}
                  >
                    Datos del Solicitante
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className={`block text-xs ${isDark ? 'text-white' : 'text-gray-500'}`}>
                        Teléfono
                      </span>
                      <span
                        className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                      >
                        {solicitante.telfCelular || solicitante.telfCasa || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className={`block text-xs ${isDark ? 'text-white' : 'text-gray-500'}`}>
                        Correo
                      </span>
                      <span
                        className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}
                        title={solicitante.email}
                      >
                        {solicitante.email || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className={`block text-xs ${isDark ? 'text-white' : 'text-gray-500'}`}>
                        Edad / Estado Civil
                      </span>
                      <span
                        className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                      >
                        {calculateAge(solicitante.fechaNacimiento)} años, {solicitante.estadoCivil}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'
                  }`}
              >
                <div>
                  <span
                    className={`block text-xs uppercase tracking-wide ${isDark ? 'text-white' : 'text-gray-500'}`}
                  >
                    Fecha Recepción
                  </span>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(caso.fechaRecepcion).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span
                    className={`block text-xs uppercase tracking-wide ${isDark ? 'text-white' : 'text-gray-500'}`}
                  >
                    Trámite
                  </span>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {caso.tramite}
                  </span>
                </div>
                <div>
                  <span
                    className={`block text-xs uppercase tracking-wide ${isDark ? 'text-white' : 'text-gray-500'}`}
                  >
                    Asignado a
                  </span>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {caso.username || 'Sin asignar'}
                  </span>
                </div>
                <div>
                  <span
                    className={`block text-xs uppercase tracking-wide ${isDark ? 'text-white' : 'text-gray-500'}`}
                  >
                    Término
                  </span>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {caso.termino}
                  </span>
                </div>
              </div>

              {(caso.nombreTribunal || caso.codCasoTribunal) && (
                <div
                  className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span
                        className={`block text-xs uppercase tracking-wide ${isDark ? 'text-white' : 'text-gray-500'}`}
                      >
                        Tribunal
                      </span>
                      <span
                        className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                      >
                        {caso.nombreTribunal || 'No asignado'}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`block text-xs uppercase tracking-wide ${isDark ? 'text-white' : 'text-gray-500'}`}
                      >
                        N° Expediente / Causa
                      </span>
                      <span
                        className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                      >
                        {caso.codCasoTribunal || 'No registrado'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {[
                  { id: 'general', label: 'General' },
                  { id: 'beneficiarios', label: 'Beneficiarios' },
                  { id: 'historial', label: 'Historial' },
                  { id: 'responsables', label: 'Responsables' },
                  { id: 'folios', label: 'Folios de Expediente' },
                  { id: 'pruebas', label: 'Archivos (Pruebas)' },
                  ...(caso.codCasoTribunal ? [{ id: 'documentos', label: 'Documentos' }] : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                                py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors
                                ${activeTab === tab.id
                        ? isDark
                          ? 'border-red-900 text-white'
                          : 'border-red-900 text-red-900'
                        : isDark
                          ? 'border-transparent text-white hover:text-white hover:border-red-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                            `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div
              className={`rounded-xl shadow-sm border min-h-[400px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
            >
              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3
                      className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      Síntesis del Caso
                    </h3>
                    <button
                      onClick={openEditModal}
                      className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${isDark
                        ? 'text-white border-red-900 hover:bg-gray-700'
                        : 'text-red-900 border-red-900 hover:bg-red-50'
                        }`}
                    >
                      Editar Informacion
                    </button>
                  </div>
                  <p
                    className={`whitespace-pre-line leading-relaxed p-4 rounded-lg border ${isDark
                      ? 'text-white bg-gray-700/50 border-gray-700'
                      : 'text-gray-700 bg-gray-50 border-gray-100'
                      }`}
                  >
                    {caso.sintesis || 'No hay síntesis registrada.'}
                  </p>

                  <div className="mt-6">
                    <h3
                      className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      Información de Tribunal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className={`p-3 rounded border ${isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-100'
                          }`}
                      >
                        <div className={`text-xs ${isDark ? 'text-white' : 'text-gray-500'}`}>
                          Tribunal
                        </div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {caso.nombreTribunal || 'N/A'}
                        </div>
                      </div>
                      <div
                        className={`p-3 rounded border ${isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-100'
                          }`}
                      >
                        <div className={`text-xs ${isDark ? 'text-white' : 'text-gray-500'}`}>
                          Causa / Expediente
                        </div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {caso.codCasoTribunal || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BENEFICIARIES TAB */}
              {activeTab === 'beneficiarios' && (
                <div className="p-6">
                  <div className="mb-4 flex justify-between items-center">
                    <h3
                      className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      Beneficiarios ({beneficiarios?.length || 0})
                    </h3>
                    <Button
                      onClick={() => setIsAddBeneficiarioModalOpen(true)}
                      variant="primary"
                      size="sm"
                    >
                      <Plus size={16} className="mr-2" /> Agregar
                    </Button>
                  </div>
                  {!beneficiarios || beneficiarios.length === 0 ? (
                    <p className={`italic ${isDark ? 'text-white' : 'text-gray-500'}`}>
                      No hay beneficiarios registrados.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table
                        className={`min-w-full divide-y ${isDark ? 'divide-red-800/50' : 'divide-gray-200'
                          }`}
                      >
                        <thead className={isDark ? 'bg-gray-700/50' : 'bg-gray-50'}>
                          <tr>
                            <th
                              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-500'
                                }`}
                            >
                              Cédula
                            </th>
                            <th
                              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-500'
                                }`}
                            >
                              Parentesco
                            </th>
                            <th
                              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-500'
                                }`}
                            >
                              Tipo
                            </th>
                            <th
                              className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-500'
                                }`}
                            >
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          className={
                            isDark
                              ? 'divide-y divide-red-800/50'
                              : 'bg-white divide-y divide-gray-200'
                          }
                        >
                          {beneficiarios.map((ben) => (
                            <tr key={ben.cedula}>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                              >
                                {ben.cedula}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-500'}`}
                              >
                                {ben.parentesco}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-500'}`}
                              >
                                {ben.tipoBeneficiario}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <button
                                  onClick={() => handleEditBeneficiario(ben.cedula)}
                                  className={`transition-colors ${isDark
                                    ? 'text-gray-400 hover:text-white'
                                    : 'text-gray-400 hover:text-red-900'
                                    }`}
                                  title="Editar información del beneficiario"
                                >
                                  <Pencil size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* HISTORIAL TAB */}
              {activeTab === 'historial' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Línea de Tiempo del Caso
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsAddEncuentroModalOpen(true)}
                        variant="secondary"
                        size="sm"
                      >
                        <Plus size={16} className="mr-2" /> Registrar Cita
                      </Button>
                      <Button
                        onClick={() => setIsAddAccionModalOpen(true)}
                        variant="primary"
                        size="sm"
                      >
                        <Plus size={16} className="mr-2" /> Registrar Acción
                      </Button>
                    </div>
                  </div>

                  {(() => {
                    // Combinar todas las actividades en un solo array
                    const timeline: Array<{
                      id: string;
                      type: 'accion' | 'encuentro' | 'cita-programada' | 'inicio';
                      fecha: Date;
                      titulo: string;
                      descripcion?: string;
                      observacion?: string;
                      // Campos adicionales para acciones
                      idAccion?: number;
                      fechaEjecucion?: string;
                      username?: string;
                      // Campos adicionales para encuentros
                      idEncuentro?: number;
                      fechaAtencion?: string;
                      fechaProxima?: string;
                      encuentroOriginal?: number; // ID del encuentro original si es una cita programada
                    }> = [];

                    // Agregar acciones
                    if (acciones && acciones.length > 0) {
                      acciones.forEach((acc) => {
                        timeline.push({
                          id: `accion-${acc.idAccion}`,
                          type: 'accion',
                          fecha: parseLocalDate(acc.fechaRegistro),
                          titulo: acc.titulo,
                          descripcion: acc.descripcion,
                          // Datos adicionales de la acción
                          idAccion: acc.idAccion,
                          fechaEjecucion: acc.fechaEjecucion,
                          username: acc.username,
                        });
                      });
                    }

                    // Agregar encuentros
                    if (encuentros && encuentros.length > 0) {
                      encuentros.forEach((enc) => {
                        // Agregar el encuentro realizado
                        timeline.push({
                          id: `encuentro-${enc.idEncuentro}`,
                          type: 'encuentro',
                          fecha: parseLocalDate(enc.fechaAtencion),
                          titulo: enc.orientacion,
                          observacion: enc.observacion,
                          // Datos adicionales del encuentro
                          idEncuentro: enc.idEncuentro,
                          fechaAtencion: enc.fechaAtencion,
                          fechaProxima: enc.fechaProxima,
                        });
                        
                        // Si tiene fecha próxima, crear un evento separado para la cita programada
                        if (enc.fechaProxima) {
                          timeline.push({
                            id: `cita-programada-${enc.idEncuentro}`,
                            type: 'cita-programada',
                            fecha: parseLocalDate(enc.fechaProxima),
                            titulo: `Cita Programada: ${enc.orientacion}`,
                            observacion: `Cita programada como seguimiento del encuentro del ${parseLocalDate(enc.fechaAtencion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                            // Datos adicionales
                            idEncuentro: enc.idEncuentro,
                            fechaAtencion: enc.fechaProxima, // Usar fechaProxima como fechaAtencion para el dashboard
                            fechaProxima: undefined,
                            encuentroOriginal: enc.idEncuentro,
                          });
                        }
                      });
                    }

                    // Agregar evento inicial del caso
                    timeline.push({
                      id: 'inicio-caso',
                      type: 'inicio',
                      fecha: new Date(caso.fechaRecepcion),
                      titulo: 'Caso Registrado',
                      descripcion: `Caso ${caso.numCaso} ingresado al sistema`,
                    });

                    // Ordenar por fecha (más reciente primero)
                    timeline.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

                    // Si no hay eventos, mostrar mensaje
                    if (timeline.length === 0) {
                      return (
                        <p
                          className={`italic text-center py-12 ${isDark ? 'text-white' : 'text-gray-500'}`}
                        >
                          No hay eventos registrados en el historial.
                        </p>
                      );
                    }

                    return (
                      <div className="relative w-full">
                        {/* Línea vertical */}
                        <div
                          className={`absolute left-8 top-0 bottom-0 w-0.5 ${isDark
                            ? 'bg-white'
                            : 'bg-gradient-to-b from-red-900 via-red-600 to-gray-300'
                            }`}
                        ></div>

                        {/* Eventos de la línea de tiempo */}
                        <div className="space-y-6 w-full">
                          {timeline.map((evento, index) => {
                            const isLast = index === timeline.length - 1;

                            // Colores y estilos según tipo
                            const typeStyles: Record<string, any> = {
                              accion: {
                                bgColor: isDark ? 'bg-gray-800' : 'bg-red-900',
                                borderColor: isDark ? 'border-green-700' : 'border-green-200',
                                textColor: isDark ? 'text-green-400' : 'text-green-700',
                                badgeBg: isDark ? 'bg-green-300' : 'bg-green-100',
                                badgeText: isDark ? 'text-green-900' : 'text-green-800',
                                label: 'Acción Legal',
                              },
                              encuentro: {
                                bgColor: isDark ? 'bg-gray-800' : 'bg-red-900',
                                borderColor: isDark ? 'border-blue-700' : 'border-blue-200',
                                textColor: isDark ? 'text-blue-400' : 'text-blue-700',
                                badgeBg: isDark ? 'bg-blue-300' : 'bg-blue-100',
                                badgeText: isDark ? 'text-blue-900' : 'text-blue-800',
                                label: 'Encuentro / Cita',
                              },
                              'cita-programada': {
                                bgColor: isDark ? 'bg-gray-800' : 'bg-red-900',
                                borderColor: isDark ? 'border-purple-700' : 'border-purple-200',
                                textColor: isDark ? 'text-purple-400' : 'text-purple-700',
                                badgeBg: isDark ? 'bg-purple-300' : 'bg-purple-100',
                                badgeText: isDark ? 'text-purple-900' : 'text-purple-800',
                                label: 'Cita Programada',
                              },
                              inicio: {
                                bgColor: isDark ? 'bg-gray-800' : 'bg-red-900',
                                borderColor: isDark ? 'border-red-900' : 'border-red-200',
                                textColor: isDark ? 'text-white' : 'text-red-900',
                                badgeBg: isDark ? 'bg-gray-300' : 'bg-gray-100',
                                badgeText: isDark ? 'text-gray-900' : 'text-gray-800',
                                label: 'Inicio del Caso',
                              },
                            };

                            const style = typeStyles[evento.type];

                            return (
                              <div key={evento.id} className="relative w-full pl-20 pb-6">
                                {/* Círculo en la línea */}
                                <div
                                  className={`absolute top-12 w-8 h-8 left-4 rounded-full 
                                  ${style.bgColor} border-4 ${isDark ? 'border-white' : 'border-white'} shadow-lg flex items-center 
                                  justify-center z-10 transition-all`}
                                ></div>

                                {/* Tarjeta de contenido */}
                                <div
                                  onClick={() => {
                                    setSelectedEvento(evento);
                                    setIsEventoModalOpen(true);
                                  }}
                                  className={`w-full rounded-lg shadow-md border-l-4 ${style.borderColor} p-5 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer ${isDark 
                                    ? evento.type === 'encuentro' 
                                      ? 'bg-gray-700/30 border-2 border-blue-700' 
                                      : 'bg-gray-700/30 border border-gray-700/50'
                                    : 'bg-white'
                                    } ${isLast ? 'opacity-80' : ''}`}
                                >
                                  {/* Header */}
                                  <div className="flex justify-between items-start mb-3">
                                    <span
                                      className={`text-xs font-bold ${style.badgeBg} ${style.badgeText} px-3 py-1 rounded-full uppercase tracking-wide`}
                                    >
                                      {style.label}
                                    </span>
                                    <span
                                      className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-500'}`}
                                    >
                                      {evento.fecha.toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                      })}
                                    </span>
                                  </div>

                                  {/* Título */}
                                  <div className="mb-2">
                                    <h4 className={`font-bold text-lg ${style.textColor} inline`}>
                                      {evento.titulo}
                                    </h4>
                                  </div>

                                  {/* Descripción */}
                                  {evento.descripcion && (
                                    <p
                                      className={`text-sm leading-relaxed ${isDark ? 'text-white' : 'text-gray-700'}`}
                                    >
                                      {evento.descripcion}
                                    </p>
                                  )}

                                  {/* Observación */}
                                  {evento.observacion && (
                                    <div
                                      className={`mt-3 rounded p-3 border ${isDark
                                        ? 'bg-gray-700/50 border-gray-700'
                                        : 'bg-gray-50 border-gray-200'
                                        }`}
                                    >
                                      <p
                                        className={`text-xs uppercase font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-500'}`}
                                      >
                                        Observación:
                                      </p>
                                      <p
                                        className={`text-sm ${isDark ? 'text-white' : 'text-gray-700'}`}
                                      >
                                        {evento.observacion}
                                      </p>
                                    </div>
                                  )}

                                  {/* Indicador de click */}
                                  <div className="mt-4 text-right">
                                    <span
                                      className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-500'}`}
                                    >
                                      Click para ver más detalles →
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* RESPONSABLES TAB */}
              {activeTab === 'responsables' && (
                <div className="p-6 space-y-8">
                  {/* Section: Supervisors */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Supervisores (Profesores)</h3>
                      {canAssign && (
                        <Button size="sm" variant="primary" onClick={() => setIsAssignSupervisorModalOpen(true)} className="bg-blue-900 border-blue-900 hover:bg-blue-800">
                          <Plus size={16} className="mr-2" /> Asignar Supervisor
                        </Button>
                      )}
                    </div>

                    {!supervisores || supervisores.length === 0 ? (
                      <p className={`text-center py-4 border border-dashed rounded-lg ${isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
                        No hay supervisores asignados.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {supervisores.map((sup, idx) => (
                          <div key={`${sup.username}-${idx}`} className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>{sup.nombre}</h4>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-blue-700'} font-mono`}>{sup.username}</p>
                              </div>
                              {canAssign && (
                                <button
                                  onClick={() => setUnassignSupervisorData({ isOpen: true, username: sup.username, termino: sup.termino, nombre: sup.nombre })}
                                  className={`transition-colors ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}
                                  title="Desasignar Supervisor"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                            </div>
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-800 text-blue-200' : 'bg-white text-blue-800 border border-blue-200'}`}>
                                {sup.termino}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <hr className={`${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

                  {/* Section: Students */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Estudiantes Asignados</h3>
                      {canAssign && (
                        <Button size="sm" variant="primary" onClick={() => setIsAssignModalOpen(true)}>
                          <Plus size={16} className="mr-2" /> Asignar Estudiante
                        </Button>
                      )}
                    </div>

                    {!asignados || asignados.length === 0 ? (
                      <p className={`text-center py-8 ${isDark ? 'text-white' : 'text-gray-500'}`}>No hay estudiantes asignados.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {asignados.map((asig, idx) => (
                          <div key={`${asig.username}-${idx}`} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{asig.nombre}</h4>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} font-mono`}>{asig.username}</p>
                              </div>
                              {canAssign && (
                                <button
                                  onClick={() => setUnassignData({ isOpen: true, username: asig.username, termino: asig.termino, nombre: asig.nombre })}
                                  className={`transition-colors ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-600'}`}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                            </div>
                            <div className="mt-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                                {asig.termino}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FOLIOS TAB */}
              {activeTab === 'folios' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Expediente Físico</h3>
                    <Button size="sm" variant="primary" onClick={() => setIsAddDocModalOpen(true)}>
                      <Plus size={16} className="mr-2" /> Añadir Folio
                    </Button>
                  </div>

                  {!documentos || documentos.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-white' : 'text-gray-500'} ${isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-200'} border border-dashed rounded-lg`}>
                      No hay folios físicos registrados.
                    </p>
                  ) : (
                    <ul className="space-y-4">
                      {documentos.map((doc, idx) => (
                        <li key={idx} className={`p-4 rounded-lg border flex gap-4 ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className={`p-3 rounded-lg h-fit ${isDark ? 'bg-red-900/50 text-red-800' : 'bg-red-100 text-red-700'}`}>
                            <FontAwesomeIcon icon={faFolderOpen} size="lg" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{doc.titulo || 'Sin título'}</h4>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{doc.observacion}</p>
                            <div className={`mt-2 flex gap-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span>Folios: {doc.folioIni} - {doc.folioFin}</span>
                              <span>Registrado: {new Date(doc.fechaRegistro).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* PRUEBAS TAB */}
              {activeTab === 'pruebas' && (
                <div className="p-6">
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Archivos Digitales</h3>

                  <UniversalUploader
                    onUploadComplete={async (data, originalName) => {
                      if (numCaso) {
                        try {
                          await casoService.createPrueba(numCaso, {
                            fecha: new Date().toISOString().split('T')[0],
                            documento: data.url,
                            titulo: `${originalName} (${data.format})`,
                            observacion: 'Subido desde el detalle del caso',
                            username: user?.username || 'Desconocido'
                          });
                          await handleRefresh();
                        } catch (err) {
                          console.error("Upload save error", err);
                        }
                      }
                    }}
                  />

                  <div className="mt-8 space-y-3">
                    {pruebas.length === 0 ? (
                      <p className={`italic ${isDark ? 'text-white' : 'text-gray-500'}`}>No hay archivos digitales asociados.</p>
                    ) : (
                      pruebas.map(prueba => {
                        // Determinar icono basado en el titulo o extension
                        let fileIcon = faFileAlt;
                        const lowerTitle = prueba.titulo.toLowerCase();
                        if (lowerTitle.includes('(pdf)') || lowerTitle.includes('.pdf')) fileIcon = faFilePdf;
                        else if (lowerTitle.includes('(doc)') || lowerTitle.includes('docx') || lowerTitle.includes('.doc')) fileIcon = faFileWord;
                        else if (lowerTitle.includes('(xls)') || lowerTitle.includes('xlsx') || lowerTitle.includes('.xls')) fileIcon = faFileExcel;
                        else if (lowerTitle.includes('(jpg)') || lowerTitle.includes('(png)') || lowerTitle.includes('(jpeg)') || lowerTitle.includes('image')) fileIcon = faFileImage;

                        return (
                          <div key={prueba.idPrueba} className={`flex items-center justify-between p-3 border rounded-lg ${isDark ? 'border-gray-700 bg-gray-700/50 hover:bg-red-950/50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                                <FontAwesomeIcon icon={fileIcon} />
                              </div>
                              <div>
                                <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{prueba.titulo}</p>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {new Date(prueba.fecha).toLocaleDateString()} - {prueba.observacion}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <a
                                href={prueba.documento}
                                target="_blank"
                                rel="noreferrer"
                                className={`text-xs px-3 py-1 rounded hover:opacity-80 transition-opacity ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}
                              >
                                Ver
                              </a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documentos' && caso.codCasoTribunal && (
                <div className="p-6">
                  <div className="mb-4">
                    <h3
                      className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      Documentos del Expediente en Tribunal
                    </h3>
                  </div>
                  {!documentos || documentos.length === 0 ? (
                    <p className={`italic ${isDark ? 'text-white' : 'text-gray-500'}`}>
                      No hay documentos cargados.
                    </p>
                  ) : (
                    <ul
                      className={`divide-y border rounded-lg overflow-hidden ${isDark
                        ? 'divide-red-800/50 border-gray-700'
                        : 'divide-gray-200 border-gray-200'
                        }`}
                    >
                      {documentos.map((doc) => (
                        <li
                          key={doc.idDocumento}
                          className={`p-4 flex items-center justify-between transition-colors ${isDark ? 'bg-gray-700/50 hover:bg-red-950/50' : 'bg-white hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-red-50 text-red-700'
                                }`}
                            >
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p
                                className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                              >
                                {doc.titulo}
                              </p>
                              <div
                                className={`flex gap-2 text-xs mt-1 ${isDark ? 'text-white' : 'text-gray-500'}`}
                              >
                                <span>
                                  Registrado: {new Date(doc.fechaRegistro).toLocaleDateString()}
                                </span>
                                {doc.folioIni && (
                                  <span>
                                    Folios: {doc.folioIni} - {doc.folioFin}
                                  </span>
                                )}
                              </div>
                              {doc.observacion && (
                                <p
                                  className={`text-xs mt-1 italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                                >
                                  "{doc.observacion}"
                                </p>
                              )}
                            </div>
                          </div>
                          {/* Action buttons could go here */}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div >

      {/* EDIT BENEFICIARIO MODAL */}
      < Modal
        isOpen={isEditBeneficiarioModalOpen}
        onClose={() => setIsEditBeneficiarioModalOpen(false)
        }
        title={`Editar Información de Beneficiario${editingBeneficiario ? `: ${editingBeneficiario.nombre}` : ''}`}
      >
        <div className="p-0">
          <div className="p-0">
            {editingBeneficiario && (
              <div className="flex flex-col gap-4">
                {/*  Relationship Form Section - Only shown here */}
                <div className="px-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parentesco
                    </label>
                    <CustomSelect
                      options={[
                        { value: '', label: 'Seleccione...' },
                        { value: 'Hijo', label: 'Hijo/a' },
                        { value: 'Padre', label: 'Padre/Madre' },
                        { value: 'Esposo', label: 'Esposo/a' },
                        { value: 'Hermano', label: 'Hermano/a' },
                        { value: 'Otro', label: 'Otro' },
                      ]}
                      value={editingRelacion.parentesco}
                      onChange={(val) =>
                        setEditingRelacion({ ...editingRelacion, parentesco: String(val) })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Beneficiario
                    </label>
                    <CustomSelect
                      options={[
                        { value: 'Directo', label: 'Directo' },
                        { value: 'Indirecto', label: 'Indirecto' },
                      ]}
                      value={editingRelacion.tipoBeneficiario}
                      onChange={(val) =>
                        setEditingRelacion({ ...editingRelacion, tipoBeneficiario: String(val) })
                      }
                    />
                  </div>
                </div>

                <div className="pb-2">
                  <SolicitanteForm
                    initialData={editingBeneficiario as any}
                    formMode="edit"
                    onSuccess={async (updatedSolicitante) => {
                      // 1. SolicitanteForm already updated the personal info via solicitanteService.update
                      // 2. Now we update the relationship info via casoService
                      if (numCaso && updatedSolicitante.cedula) {
                        try {
                          await casoService.updateBeneficiario(numCaso, updatedSolicitante.cedula, {
                            tipoBeneficiario: editingRelacion.tipoBeneficiario,
                            parentesco: editingRelacion.parentesco,
                          });
                          handleEditBeneficiarioSuccess();
                        } catch (err) {
                          console.error('Error updating relationship', err);
                          showConfirmationModal(
                            false,
                            'Datos personales guardados, pero hubo un error actualizando la relación con el caso.'
                          );
                        }
                      }
                    }}
                    onCancel={() => setIsEditBeneficiarioModalOpen(false)}
                    isModal={true}
                    simplifiedMode={true} // Solo datos mínimos obligatorios
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal >

      <AddAccionModal
        isOpen={isAddAccionModalOpen}
        onClose={() => setIsAddAccionModalOpen(false)}
        onSuccess={handleAddAccion}
        defaultUsername={casoDetalle.caso.username}
      />

      <AddEncuentroModal
        isOpen={isAddEncuentroModalOpen}
        onClose={() => setIsAddEncuentroModalOpen(false)}
        onSuccess={handleAddEncuentro}
        defaultUsername={casoDetalle.caso.username}
      />

      <AddDocumentoModal
        isOpen={isAddDocModalOpen}
        onClose={() => setIsAddDocModalOpen(false)}
        currentCasoId={numCaso || ''}
        onSuccess={handleRefresh}
      />

      <AssignStudentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        numCaso={numCaso || ''}
        onAssignSuccess={() => {
          handleRefresh();
          setActiveTab('responsables');
        }}
      />

      <ConfirmationModal
        isOpen={unassignData.isOpen}
        onClose={() => setUnassignData(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleUnassignConfirm}
        title="Desasignar Estudiante"
        message={`¿Seguro que desea remover a ${unassignData.nombre} del caso?`}
        confirmText="Sí, Desasignar"
        variant="danger"
        isLoading={unassignLoading}
      />

      <ConfirmationModal
        isOpen={unassignSupervisorData.isOpen}
        onClose={() => setUnassignSupervisorData(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleUnassignSupervisorConfirm}
        title="Desasignar Supervisor"
        message={`¿Seguro que desea remover al supervisor ${unassignSupervisorData.nombre} del caso?`}
        confirmText="Sí, Desasignar"
        variant="danger"
        isLoading={unassignSupervisorLoading}
      />

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Información del Caso"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Síntesis</label>
            <textarea
              className="w-full border rounded-lg p-2 focus:ring-red-900 focus:border-red-900"
              rows={4}
              value={editFormData.sintesis || ''}
              onChange={(e) => setEditFormData({ ...editFormData, sintesis: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tribunal Asignado
              </label>
              <CustomSelect
                options={[
                  { value: '', label: 'Sin Asignar' },
                  ...tribunales.map((t) => ({ value: t.idTribunal, label: t.nombreTribunal })),
                ]}
                value={editFormData.idTribunal || ''}
                onChange={(val) =>
                  setEditFormData({ ...editFormData, idTribunal: val ? Number(val) : undefined })
                }
                placeholder="Seleccione tribunal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N° Expediente / Causa
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring-red-900 focus:border-red-900"
                value={editFormData.codCasoTribunal || ''}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, codCasoTribunal: e.target.value })
                }
                placeholder="Ej: ABC-123456"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button onClick={() => setIsEditModalOpen(false)} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleUpdate} variant="primary">
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddBeneficiarioModalOpen}
        onClose={() => {
          setIsAddBeneficiarioModalOpen(false);
          setShowSolicitanteForm(false);
          setFoundPerson(null);
          setCedulaSearch('');
          setSearchError('');
        }}
        title="Agregar Beneficiario"
      >
        <div className={!showSolicitanteForm ? 'p-6 space-y-4' : ''}>
          {!showSolicitanteForm ? (
            <>
              {/* Search Section */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar por Cédula"
                  className="flex-1 border p-2 rounded focus:ring-red-900 focus:border-red-900 outline-none"
                  value={cedulaSearch}
                  onChange={(e) => setCedulaSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPerson()}
                />
                <Button onClick={handleSearchPerson} variant="primary">
                  <Search size={18} />
                </Button>
              </div>

              {searchError && (
                <div className="text-red-500 text-sm flex justify-between items-center text-center p-2 bg-red-50 rounded border border-red-100">
                  <span>{searchError}</span>
                  <Button
                    onClick={() => setShowSolicitanteForm(true)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <UserPlus size={16} className="mr-1" /> Registrar Nuevo
                  </Button>
                </div>
              )}

              {/* Found Person & Form */}
              {foundPerson && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 shadow-sm animate-fade-in">
                  <p className="font-semibold text-green-900 mb-2">
                    Persona encontrada: {foundPerson.nombre} ({foundPerson.cedula})
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Parentesco con solicitante
                      </label>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Seleccione...' },
                          { value: 'Hijo', label: 'Hijo/a' },
                          { value: 'Padre', label: 'Padre/Madre' },
                          { value: 'Esposo', label: 'Esposo/a' },
                          { value: 'Hermano', label: 'Hermano/a' },
                          { value: 'Otro', label: 'Otro' },
                        ]}
                        value={newBenParentesco}
                        onChange={(val) => setNewBenParentesco(val)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Beneficiario
                      </label>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Seleccione...' },
                          { value: 'Directo', label: 'Directo' },
                          { value: 'Indirecto', label: 'Indirecto' },
                        ]}
                        value={newBenTipo}
                        onChange={(val) => setNewBenTipo(val)}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleAddBeneficiarioClick}
                      disabled={!newBenParentesco || !newBenTipo}
                      variant="primary"
                    >
                      Agregar al Caso
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Create New Person Form */
            <div>
              <div className="flex justify-between items-center mb-0 p-4 border-b bg-gray-50">
                <h4 className="font-semibold text-gray-800">Registrar Nueva Persona</h4>
                <button
                  onClick={() => setShowSolicitanteForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Volver
                </button>
              </div>
              <div className="p-0">
                <SolicitanteForm
                  onSuccess={handleNewPersonSuccess}
                  onCancel={() => setShowSolicitanteForm(false)}
                  isModal={true}
                  simplifiedMode={true}
                  formMode="create"
                  initialData={{ cedula: cedulaSearch }}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Detalles del Evento */}
      <Modal
        isOpen={isEventoModalOpen}
        onClose={() => setIsEventoModalOpen(false)}
        title="Detalles del Evento"
      >
        {selectedEvento && (
          <div className="p-6 space-y-6">
            {/* Tipo de evento */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span
                  className={`inline-block px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide ${selectedEvento.type === 'accion'
                    ? 'bg-green-50 text-green-700'
                    : selectedEvento.type === 'encuentro'
                      ? 'bg-blue-50 text-blue-700'
                      : selectedEvento.type === 'cita-programada'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-red-50 text-red-900'
                    }`}
                >
                  {selectedEvento.type === 'accion'
                    ? 'Acción Legal'
                    : selectedEvento.type === 'encuentro'
                      ? 'Encuentro / Cita'
                      : selectedEvento.type === 'cita-programada'
                      ? 'Cita Programada'
                      : 'Inicio del Caso'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 font-medium">Fecha</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedEvento.fecha.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Título */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Título
              </h3>
              <p className="text-xl font-bold text-gray-900">{selectedEvento.titulo}</p>
            </div>

            {/* Descripción */}
            {selectedEvento.descripcion && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Descripción
                </h3>
                <p className="text-base text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {selectedEvento.descripcion}
                </p>
              </div>
            )}

            {/* Observación */}
            {selectedEvento.observacion && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Observación
                </h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-base text-gray-700 leading-relaxed">
                    {selectedEvento.observacion}
                  </p>
                </div>
              </div>
            )}

            {/* Información adicional según tipo */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {selectedEvento.type === 'accion' && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">ID Acción</p>
                    <p className="text-sm font-medium text-gray-900">{selectedEvento.idAccion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Registrado por
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedEvento.username || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Fecha de ejecución
                    </p>
                    {selectedEvento.fechaEjecucion ? (
                      <p className="text-sm font-medium text-green-700 bg-green-50 px-3 py-2 rounded inline-block">
                        Ejecutada el{' '}
                        {selectedEvento.fechaEjecucion ? parseLocalDate(selectedEvento.fechaEjecucion).toLocaleDateString('es-ES') : 'N/A'}
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-orange-700 bg-orange-50 px-3 py-2 rounded inline-block">
                        Acción No Ejecutada
                      </p>
                    )}
                  </div>
                </>
              )}

              {(selectedEvento.type === 'encuentro' || selectedEvento.type === 'cita-programada') && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      ID Encuentro
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedEvento.idEncuentro}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Tipo de Encuentro
                    </p>
                    {selectedEvento.fechaProxima ? (
                      <p className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded inline-block">
                        Cita Programada
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded inline-block">
                        Encuentro Realizado
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Fecha de Atención
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {parseLocalDate(selectedEvento.fechaAtencion).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {selectedEvento.type === 'cita-programada' && selectedEvento.fechaAtencion && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Fecha de la Cita Programada
                      </p>
                      <p className="text-sm font-medium text-purple-700 bg-purple-50 px-3 py-2 rounded inline-block">
                        {parseLocalDate(selectedEvento.fechaAtencion).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  {selectedEvento.type === 'encuentro' && selectedEvento.fechaProxima && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Próxima Cita Programada
                      </p>
                      <p className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded inline-block">
                        {parseLocalDate(selectedEvento.fechaProxima).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Caso N°</p>
                <p className="text-sm font-medium text-red-900">{numCaso}</p>
              </div>
            </div>

            {/* Botón de cerrar */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setIsEventoModalOpen(false)} variant="secondary">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
      {/* Assign Supervisor Modal */}
      {
        numCaso && (
          <AssignSupervisorModal
            isOpen={isAssignSupervisorModalOpen}
            onClose={() => setIsAssignSupervisorModalOpen(false)}
            numCaso={numCaso}
            onAssignSuccess={handleRefresh}
          />
        )
      }

      {/* Modal de confirmación */}
      {confirmationModal.isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className={`relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-slide-up-modal ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  confirmationModal.success 
                    ? (isDark ? 'bg-green-900/30' : 'bg-green-100')
                    : (isDark ? 'bg-red-900/30' : 'bg-red-100')
                }`}>
                  {confirmationModal.success ? (
                    <CheckCircle className={`w-10 h-10 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  ) : (
                    <XCircle className={`w-10 h-10 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  )}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {confirmationModal.success ? '¡Éxito!' : 'Error'}
                </h3>
                <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {confirmationModal.message}
                </p>
                <button
                  onClick={closeConfirmationModal}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    confirmationModal.success
                      ? isDark 
                        ? 'bg-green-900 hover:bg-green-950 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                      : isDark
                        ? 'bg-red-900 hover:bg-red-950 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div >
  );
}

export default CasoDetalle;
