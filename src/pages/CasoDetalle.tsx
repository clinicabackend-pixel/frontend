
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import CustomSelect from '../components/common/CustomSelect';
import UniversalUploader from '../components/common/UniversalUploader';
import SolicitanteForm from '../components/forms/SolicitanteForm';
import { useTheme } from '../context/ThemeContext';
import AssignStudentModal from '../components/AssignStudentModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import AddAccionModal from '../components/modals/AddAccionModal';
import AddEncuentroModal from '../components/modals/AddEncuentroModal';
import AddDocumentoModal from '../components/modals/AddDocumentoModal';

// Services - Default Imports
import casoService from '../services/casoService';

// Types
import type {
  CasoDetalleResponse,
  CasoUpdateDTO,
  BeneficiarioResponse,
  Tribunal,
  Solicitante
} from '../types/caso';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faTrash,
  faFilePdf,
  faFolderOpen,
  faFileExcel,
  faFileAlt,
  faFileWord,
  faFileImage
} from '@fortawesome/free-solid-svg-icons';
import {
  Briefcase,
  BookOpen,
  Users,
  Clock,
  FileText,
  Files,
  Plus,
  Pencil
} from 'lucide-react';

const CasoDetalle: React.FC = () => {
  const { numCaso } = useParams<{ numCaso: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // --- COMPONENT STATE ---

  // Main Data
  const [casoDetalle, setCasoDetalle] = useState<CasoDetalleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  // Auxiliary Data for Dropdowns/Forms
  const [tribunales, setTribunales] = useState<Tribunal[]>([]);
  const [nombreMateria, setNombreMateria] = useState('');

  // UI State
  const [activeTab, setActiveTab] = useState<'general' | 'beneficiarios' | 'responsables' | 'historial' | 'pruebas' | 'folios'>('historial');

  // Edit Case Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<CasoUpdateDTO>>({});

  // Beneficiario Management State
  const [isAddBeneficiarioModalOpen, setIsAddBeneficiarioModalOpen] = useState(false);
  const [showSolicitanteForm, setShowSolicitanteForm] = useState(false);
  const [cedulaSearch, setCedulaSearch] = useState('');
  const [searchError, setSearchError] = useState('');
  const [foundPerson, setFoundPerson] = useState<Solicitante | null>(null);
  const [newBenParentesco, setNewBenParentesco] = useState('');
  const [newBenTipo, setNewBenTipo] = useState('');

  // Edit Beneficiario State
  const [isEditBeneficiarioModalOpen, setIsEditBeneficiarioModalOpen] = useState(false);
  const [editingBeneficiario, setEditingBeneficiario] = useState<BeneficiarioResponse | null>(null);
  const [editingRelacion, setEditingRelacion] = useState({ parentesco: '', tipoBeneficiario: '' });

  // Student Assignment State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [unassignData, setUnassignData] = useState<{ isOpen: boolean; username: string; termino: string; nombre: string }>({
    isOpen: false,
    username: '',
    termino: '',
    nombre: ''
  });
  const [unassignLoading, setUnassignLoading] = useState(false);

  // Timeline/Action/Meeting State
  const [isAddAccionModalOpen, setIsAddAccionModalOpen] = useState(false);
  const [isAddEncuentroModalOpen, setIsAddEncuentroModalOpen] = useState(false);
  const [isEventoModalOpen, setIsEventoModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<any | null>(null);

  // Document/Folio State
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);

  // --- HELPERS ---

  const toggleRefresh = useCallback(() => {
    setRefreshTrigger(prev => !prev);
  }, []);

  const calculateAge = (birthDateString?: string): string => {
    if (!birthDateString) return 'N/A';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABIERTO': return 'bg-green-100 text-green-800 border-green-200';
      case 'CERRADO': return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canAssign = user?.tipoUsuario === 'ADMIN' || user?.tipoUsuario === 'SUPERVISOR';

  // --- EFFECTS ---

  useEffect(() => {
    const loadData = async () => {
      if (!numCaso) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch Case Details
        const data = await casoService.getById(numCaso);
        setCasoDetalle(data);

        // Fetch Catalogs
        const [tribunalesData, materiasData] = await Promise.all([
          casoService.getTribunales().catch(() => []), // Gracefully fail if endpoint missing
          casoService.getMaterias().catch(() => [])
        ]);
        setTribunales(tribunalesData);

        // Resolve Materia Name
        const mat = materiasData.find((m: any) => m.idMateria === data.caso.ambitoLegal);
        setNombreMateria(mat ? mat.nombreMateria : (data.caso.ambitoLegal?.toString() || ''));

      } catch (err: any) {
        console.error("Error loading case data:", err);
        setError(err.message || 'Error al cargar los detalles del caso.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [numCaso, refreshTrigger]);

  // Close Event Modal on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsEventoModalOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- HANDLERS ---

  // Export PDF
  const handleExportPdf = () => {
    if (numCaso) {
      console.log(numCaso);
    }
  };

  // Edit Case
  const openEditModal = () => {
    if (casoDetalle) {
      setEditFormData({
        sintesis: casoDetalle.caso.sintesis,
        idTribunal: casoDetalle.caso.idTribunal,
        codCasoTribunal: casoDetalle.caso.codCasoTribunal || ''
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdate = async () => {
    if (!numCaso) return;
    try {
      await casoService.update(numCaso, editFormData);
      setIsEditModalOpen(false);
      toggleRefresh();
    } catch (err) {
      console.error("Error updating case:", err);
      alert("Error al actualizar la información del caso.");
    }
  };

  // Beneficiarios
  const handleSearchPerson = async () => {
    if (!cedulaSearch) return;
    setSearchError('');
    setFoundPerson(null);
    try {
      const person = await casoService.getSolicitanteByCedula(cedulaSearch);
      setFoundPerson(person);
    } catch (err) {
      setSearchError('Persona no encontrada. Puede registrarla manualmente.');
    }
  };

  const handleNewPersonSuccess = (newPerson: Solicitante) => {
    setFoundPerson(newPerson);
    // Auto-fill and return to add mode
    setShowSolicitanteForm(false);
  };

  const handleAddBeneficiarioClick = async () => {
    if (!numCaso || !foundPerson || !newBenParentesco || !newBenTipo) return;
    try {
      await casoService.addBeneficiario(numCaso, {
        cedula: foundPerson.cedula,
        parentesco: newBenParentesco,
        tipoBeneficiario: newBenTipo
      });
      setIsAddBeneficiarioModalOpen(false);

      // Reset form
      setCedulaSearch('');
      setFoundPerson(null);
      setNewBenParentesco('');
      setNewBenTipo('');

      toggleRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al agregar beneficiario');
    }
  };

  const handleEditBeneficiario = (cedula: string) => {
    const ben = casoDetalle?.beneficiarios.find(b => b.cedula === cedula);
    if (ben) {
      setEditingBeneficiario(ben);
      setEditingRelacion({
        parentesco: ben.parentesco,
        tipoBeneficiario: ben.tipoBeneficiario
      });
      setIsEditBeneficiarioModalOpen(true);
    }
  };

  const handleEditBeneficiarioSuccess = () => {
    setIsEditBeneficiarioModalOpen(false);
    setEditingBeneficiario(null);
    toggleRefresh();
  };

  // Timeline
  const handleAddAccion = async (data: any) => {
    if (!numCaso) return;
    try {
      await casoService.createAccion(numCaso, data);
      setIsAddAccionModalOpen(false);
      toggleRefresh();
    } catch (err: any) {
      console.error("Error creating action:", err);
      alert(err.response?.data?.message || 'Error al registrar la acción');
    }
  };

  const handleAddEncuentro = async (data: any) => {
    if (!numCaso) return;
    try {
      await casoService.createEncuentro(numCaso, data);
      setIsAddEncuentroModalOpen(false);
      toggleRefresh();
    } catch (err: any) {
      console.error("Error creating encounter:", err);
      alert(err.response?.data?.message || 'Error al registrar el encuentro');
    }
  };

  // Student Unassign
  const handleUnassignConfirm = async () => {
    if (!numCaso) return;
    setUnassignLoading(true);
    try {
      await casoService.unassignStudent(numCaso, unassignData.username, unassignData.termino);
      setUnassignData(prev => ({ ...prev, isOpen: false }));
      toggleRefresh();
    } catch (err) {
      console.error("Error unassigning student:", err);
      alert("Error al desasignar el estudiante.");
    } finally {
      setUnassignLoading(false);
    }
  };


  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <MainLayout title="Cargando Caso...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !casoDetalle) {
    return (
      <MainLayout title="Error">
        <div className="text-center p-10 text-red-600">
          <p>{error || 'No se encontró el caso.'}</p>
          <Button variant="secondary" onClick={() => navigate('/casos')} className="mt-4">
            Volver a la lista
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { caso, solicitante, beneficiarios, acciones, encuentros, documentos, asignados } = casoDetalle;
  const pruebas = casoDetalle.pruebas || []; // Ensure proofs array exists

  return (
    <MainLayout title={`Caso #${caso.numCaso}`}>
      <main className={`min-h-screen pb-10 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>

        {/* HEADER SECTION */}
        <div className={`shadow-sm sticky top-0 z-10 ${isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-red-900">
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Atrás
                </Button>
                <div>
                  <h1 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Caso #{caso.numCaso}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(caso.estatus)}`}>
                      {caso.estatus}
                    </span>
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportPdf} title="Exportar a PDF">
                  <FontAwesomeIcon icon={faFileExcel} className="mr-2 text-green-600" /> Exportar
                </Button>
                {canAssign && (
                  <Button
                    variant="primary"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="bg-red-900 hover:bg-white hover:text-red-900 text-white border border-transparent hover:border-red-900 transition-colors"
                  >
                    <Users size={18} className="mr-2" /> Asignar Estudiantes
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: INFO CARDS */}
          <div className="lg:col-span-4 space-y-6">

            {/* Header Card (Solicitante Info) */}
            <div className={`rounded-xl shadow-sm border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-900 font-bold text-xl">
                    {solicitante?.nombre?.charAt(0)}{solicitante?.apellido?.charAt(0)}
                  </div>
                  <div>
                    <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {solicitante?.nombre} {solicitante?.apellido}
                    </h2>
                    <p className="text-sm text-gray-500">Solicitante</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Cédula</p>
                    <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{solicitante?.cedula}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Edad</p>
                    <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{calculateAge(solicitante?.fechaNacimiento)} años</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-gray-500 text-xs">Teléfono</p>
                  <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{solicitante?.telefono || 'N/A'}</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-500 text-xs">Correo</p>
                  <p className={`font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{solicitante?.correo || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Case Info Card */}
            <div className={`rounded-xl shadow-sm border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Briefcase size={18} className="text-red-900" /> Detalles del Caso
                </h3>
                <button onClick={openEditModal} className="text-gray-400 hover:text-red-900 transition-colors">
                  <Pencil size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Materia / Ámbito</p>
                  <p className="text-sm font-semibold text-gray-900 uppercase">{nombreMateria}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Síntesis</p>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {caso.sintesis || 'Sin síntesis registrada.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-500">Fecha Inicio</p>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                      {new Date(caso.fechaRecepcion).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tribunal</p>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                      {tribunales.find(t => t.idTribunal === caso.idTribunal)?.nombreTribunal || 'Sin asignar'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: TABS AND CONTENT */}
          <div className="lg:col-span-8">

            {/* Navigation Tabs */}
            <div className={`flex border-b mb-6 overflow-x-auto ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {[
                { id: 'historial', label: 'Historial', icon: Clock },
                { id: 'general', label: 'General', icon: FileText },
                { id: 'beneficiarios', label: 'Beneficiarios', icon: Users },
                { id: 'responsables', label: 'Responsables', icon: Users },
                { id: 'folios', label: 'Folios de Expediente', icon: Files },
                { id: 'pruebas', label: 'Archivos (Pruebas)', icon: BookOpen },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? isDark
                      ? 'border-red-500 text-red-500'
                      : 'border-blue-700 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            <div className={`rounded-xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>

              {/* 1. HISTORIAL (Timeline) */}
              {activeTab === 'historial' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Línea de Tiempo</h3>
                    <div className="flex gap-3">
                      <Button variant="ghost" size="sm" onClick={() => setIsAddEncuentroModalOpen(true)}>
                        <Plus size={16} className="mr-2" /> Registrar Cita
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setIsAddAccionModalOpen(true)}>
                        <Plus size={16} className="mr-2" /> Registrar Acción
                      </Button>
                    </div>
                  </div>

                  {/* Timeline Rendering Logic */}
                  {(() => {
                    const timeline: any[] = [];
                    acciones?.forEach(acc => timeline.push({ ...acc, type: 'accion', date: new Date(acc.fechaRegistro) }));
                    encuentros?.forEach(enc => timeline.push({ ...enc, type: 'encuentro', date: new Date(enc.fechaAtencion) }));
                    timeline.push({ type: 'inicio', date: new Date(caso.fechaRecepcion), titulo: 'Caso Registrado' });

                    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

                    if (timeline.length === 0) return <p className="text-center py-10 text-gray-500">No hay eventos registrados.</p>;

                    return (
                      <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-200">
                        {timeline.map((item, idx) => {
                          const isAccion = item.type === 'accion';
                          const isEncuentro = item.type === 'encuentro';
                          const isInicio = item.type === 'inicio';

                          return (
                            <div key={idx} className="relative animate-fade-in group cursor-pointer" onClick={() => {
                              if (!isInicio) {
                                setSelectedEvento({
                                  ...item,
                                  fecha: item.date,
                                  titulo: isAccion ? item.titulo : (isEncuentro ? item.orientacion : item.titulo),
                                  descripcion: isAccion ? item.descripcion : '',
                                  observacion: isEncuentro ? item.observacion : ''
                                });
                                setIsEventoModalOpen(true);
                              }
                            }}>
                              <div className={`absolute -left-[29px] w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 
                                   ${isAccion ? 'bg-green-500' : isEncuentro ? 'bg-blue-500' : 'bg-red-900'}
                                 `}></div>
                              <div className={`p-4 rounded-lg border transition-all hover:shadow-md
                                   ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-100 hover:border-gray-300'}
                                 `}>
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded
                                        ${isAccion ? 'bg-green-100 text-green-800' : isEncuentro ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-900'}
                                      `}>
                                    {isAccion ? 'Acción' : isEncuentro ? 'Cita' : 'Inicio'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {item.date.toLocaleDateString()}
                                  </span>
                                </div>
                                <h4 className={`font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                                  {isAccion ? item.titulo : isEncuentro ? item.orientacion : item.titulo}
                                </h4>
                                {(item.descripcion || item.observacion) && (
                                  <p className={`mt-2 text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {item.descripcion || item.observacion}
                                  </p>
                                )}
                                {!isInicio && (
                                  <div className="mt-2 text-right">
                                    <span className="text-xs text-blue-500 hover:underline">Ver detalles &rarr;</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 2. GENERAL */}
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Descripción Detallada</h3>
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                      {caso.sintesis || 'No hay descripción detallada disponible.'}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. BENEFICIARIOS */}
              {activeTab === 'beneficiarios' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Beneficiarios ({beneficiarios?.length || 0})</h3>
                    <Button size="sm" variant="primary" onClick={() => setIsAddBeneficiarioModalOpen(true)}>
                      <Plus size={16} className="mr-2" /> Agregar
                    </Button>
                  </div>

                  {!beneficiarios || beneficiarios.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay beneficiarios registrados.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        <thead className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parentesco</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-700 text-gray-300' : 'divide-gray-200 text-gray-800'}`}>
                          {beneficiarios.map((ben) => (
                            <tr key={ben.cedula}>
                              <td className="px-6 py-4 whitespace-nowrap">{ben.cedula}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{ben.parentesco}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{ben.tipoBeneficiario}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button onClick={() => handleEditBeneficiario(ben.cedula)} className="text-gray-400 hover:text-blue-600">
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

              {/* 4. RESPONSABLES */}
              {activeTab === 'responsables' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Responsables Asignados</h3>
                    {canAssign && (
                      <Button size="sm" variant="primary" onClick={() => setIsAssignModalOpen(true)} className="bg-red-900 text-white">
                        <Plus size={16} className="mr-2" /> Asignar Estudiante
                      </Button>
                    )}
                  </div>

                  {!asignados || asignados.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay estudiantes asignados.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {asignados.map((asig, idx) => (
                        <div key={`${asig.username}-${idx}`} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{asig.nombre}</h4>
                              <p className="text-sm text-gray-500 font-mono">{asig.username}</p>
                            </div>
                            {canAssign && (
                              <button
                                onClick={() => setUnassignData({ isOpen: true, username: asig.username, termino: asig.termino, nombre: asig.nombre })}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            )}
                          </div>
                          <div className="mt-3">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {asig.termino}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. FOLIOS (Physical Documents) */}
              {activeTab === 'folios' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Expediente Físico</h3>
                    <Button size="sm" variant="primary" onClick={() => setIsAddDocModalOpen(true)}>
                      <Plus size={16} className="mr-2" /> Añadir Folio
                    </Button>
                  </div>

                  {!documentos || documentos.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 bg-gray-50 border border-dashed rounded-lg">
                      No hay folios físicos registrados.
                    </p>
                  ) : (
                    <ul className="space-y-4">
                      {documentos.map((doc, idx) => (
                        <li key={idx} className={`p-4 rounded-lg border flex gap-4 ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="p-3 bg-red-100 text-red-700 rounded-lg h-fit">
                            <FontAwesomeIcon icon={faFolderOpen} size="lg" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{doc.titulo || 'Sin título'}</h4>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{doc.observacion}</p>
                            <div className="mt-2 flex gap-4 text-xs text-gray-500">
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

              {/* 6. PRUEBAS (Digital Files) */}
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
                          toggleRefresh();
                        } catch (err) {
                          console.error("Upload save error", err);
                        }
                      }
                    }}
                  />

                  <div className="mt-8 space-y-3">
                    {pruebas.length === 0 ? (
                      <p className="text-gray-500 italic">No hay archivos digitales asociados.</p>
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
                          <div key={prueba.idPrueba} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-50 text-blue-600 p-2 rounded">
                                <FontAwesomeIcon icon={fileIcon} />
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-gray-800">{prueba.titulo}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(prueba.fecha).toLocaleDateString()} - {prueba.observacion}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <a
                                href={prueba.documento}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                              >
                                Ver Archivo
                              </a>
                              <button
                                onClick={async () => {
                                  if (!window.confirm('¿Estás seguro de eliminar este archivo?')) return;
                                  try {
                                    if (!numCaso) return;
                                    await casoService.deletePrueba(numCaso, prueba.idPrueba);
                                    // Refresh data
                                    toggleRefresh();
                                  } catch (err) {
                                    console.error("Error deleting prueba:", err);
                                    alert("Error al eliminar el archivo");
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Eliminar archivo"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}

      {/* Edit Case Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Caso">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Síntesis</label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={editFormData.sintesis || ''}
              onChange={e => setEditFormData({ ...editFormData, sintesis: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tribunal</label>
              <CustomSelect
                options={[{ value: '', label: 'Sin Asignar' }, ...tribunales.map(t => ({ value: t.idTribunal, label: t.nombreTribunal }))]}
                value={editFormData.idTribunal || ''}
                onChange={val => setEditFormData({ ...editFormData, idTribunal: val ? Number(val) : undefined })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">N° Expediente</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={editFormData.codCasoTribunal || ''}
                onChange={e => setEditFormData({ ...editFormData, codCasoTribunal: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleUpdate}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Add Beneficiario Modal */}
      <Modal
        isOpen={isAddBeneficiarioModalOpen}
        onClose={() => setIsAddBeneficiarioModalOpen(false)}
        title="Agregar Beneficiario"
      >
        <div className="p-4 space-y-4">
          {!showSolicitanteForm ? (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar por cédula"
                  className="flex-1 border rounded p-2"
                  value={cedulaSearch}
                  onChange={e => setCedulaSearch(e.target.value)}
                />
                <Button onClick={handleSearchPerson}>Buscar</Button>
              </div>
              {searchError && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100 flex justify-between items-center">
                  {searchError}
                  <button onClick={() => setShowSolicitanteForm(true)} className="text-blue-600 underline text-xs">Registrar Nuevo</button>
                </div>
              )}
              {foundPerson && (
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <p className="font-bold text-green-800">{foundPerson.nombre} {foundPerson.apellido}</p>
                  <p className="text-sm text-green-700">C.I: {foundPerson.cedula}</p>
                  <div className="mt-3 space-y-2">
                    <CustomSelect
                      options={[
                        { value: '', label: 'Parentesco...' },
                        { value: 'Hijo', label: 'Hijo/a' },
                        { value: 'Padre', label: 'Padre/Madre' },
                        { value: 'Esposo', label: 'Esposo/a' },
                        { value: 'Hermano', label: 'Hermano/a' },
                        { value: 'Otro', label: 'Otro' },
                      ]}
                      value={newBenParentesco}
                      onChange={val => setNewBenParentesco(String(val))}
                      placeholder="Seleccione Parentesco"
                    />
                    <CustomSelect
                      options={[
                        { value: '', label: 'Tipo...' },
                        { value: 'Directo', label: 'Directo' },
                        { value: 'Indirecto', label: 'Indirecto' },
                      ]}
                      value={newBenTipo}
                      onChange={val => setNewBenTipo(String(val))}
                      placeholder="Seleccione Tipo"
                    />
                    <Button
                      variant="primary"
                      className="w-full mt-2"
                      disabled={!newBenParentesco || !newBenTipo}
                      onClick={handleAddBeneficiarioClick}
                    >
                      Agregar al Caso
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">Registrar Nueva Persona</h4>
                <button onClick={() => setShowSolicitanteForm(false)} className="text-gray-500 text-sm">Volver</button>
              </div>
              <SolicitanteForm
                onSuccess={handleNewPersonSuccess}
                onCancel={() => setShowSolicitanteForm(false)}
                isModal={true}
                simplifiedMode={true}
                formMode="create"
                initialData={{ cedula: cedulaSearch }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Beneficiario Modal */}
      <Modal isOpen={isEditBeneficiarioModalOpen} onClose={() => setIsEditBeneficiarioModalOpen(false)} title="Editar Relación">
        <div className="p-4 space-y-4">
          {editingBeneficiario && (
            <>
              <p className="font-bold mb-2">{editingBeneficiario.nombre ? editingBeneficiario.nombre : 'Sin nombre'}</p>
              <CustomSelect
                options={[
                  { value: 'Hijo', label: 'Hijo/a' },
                  { value: 'Padre', label: 'Padre/Madre' },
                  { value: 'Esposo', label: 'Esposo/a' },
                  { value: 'Hermano', label: 'Hermano/a' },
                  { value: 'Otro', label: 'Otro' },
                ]}
                value={editingRelacion.parentesco}
                onChange={val => setEditingRelacion({ ...editingRelacion, parentesco: String(val) })}
              />
              <CustomSelect
                options={[
                  { value: 'Directo', label: 'Directo' },
                  { value: 'Indirecto', label: 'Indirecto' },
                ]}
                value={editingRelacion.tipoBeneficiario}
                onChange={val => setEditingRelacion({ ...editingRelacion, tipoBeneficiario: String(val) })}
              />
              <div className="pt-2 flex justify-end">
                <Button variant="primary" onClick={async () => {
                  if (numCaso && editingBeneficiario.cedula) {
                    try {
                      await casoService.updateBeneficiario(numCaso, editingBeneficiario.cedula, editingRelacion);
                      handleEditBeneficiarioSuccess();
                    } catch (err) {
                      alert("Error al actualizar");
                    }
                  }
                }}>Guardar Cambios</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Auxiliary Modals */}
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
        onSuccess={toggleRefresh}
      />

      <AssignStudentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        numCaso={numCaso || ''}
        onAssignSuccess={() => {
          toggleRefresh();
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

      {/* Evento Detail Modal */}
      <Modal
        isOpen={isEventoModalOpen}
        onClose={() => setIsEventoModalOpen(false)}
        title="Detalle del Evento"
      >
        {selectedEvento && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold text-lg">{selectedEvento.titulo}</span>
              <span className="text-sm text-gray-500">{selectedEvento.date.toLocaleDateString()}</span>
            </div>
            {selectedEvento.descripcion && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 font-bold mb-1">Descripción</p>
                <p>{selectedEvento.descripcion}</p>
              </div>
            )}
            {selectedEvento.observacion && (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                <p className="text-sm text-yellow-800 font-bold mb-1">Observación</p>
                <p>{selectedEvento.observacion}</p>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsEventoModalOpen(false)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

    </MainLayout>
  );
};

export default CasoDetalle;
