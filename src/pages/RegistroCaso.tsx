import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Button from '../components/common/Button';
import EstudianteManager from '../components/forms/EstudianteManager';

import MainLayout from '../components/layout/MainLayout';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import CustomSelect from '../components/common/CustomSelect';
import SmartAmbitoSelector from '../components/forms/SmartAmbitoSelector';
import SolicitanteForm from '../components/forms/SolicitanteForm';
import solicitanteService from '../services/solicitanteService';
import catalogoService from '../services/catalogoService';
import casoService from '../services/casoService';
import type { AmbitoLegal, Centro, BeneficiarioCreateRequest, CasoCreateRequest, CasoDetalleResponse } from '../types';
import BeneficiarioManager from '../components/forms/BeneficiarioManager';
import estudianteService, { type EstudianteInfo } from '../services/estudianteService';
import CustomDatePicker from '../components/common/CustomDatePicker';

// ⏰ CONFIGURACIÓN DE EXPIRACIÓN
const EXPIRATION_TIME_MS = 7 * 24 * 60 * 60 * 1000;

function RegistroCaso() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Solicitante Search & Verification State
  const [cedulaSearch, setCedulaSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [solicitante, setSolicitante] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State
  const [createdCase, setCreatedCase] = useState<CasoDetalleResponse | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Beneficiaries State
  const [beneficiarios, setBeneficiarios] = useState<BeneficiarioCreateRequest[]>([]);

  // Meeting Details State
  const [activeStudents, setActiveStudents] = useState<EstudianteInfo[]>([]);


  // Form Data with persistence
  const [formData, setFormData] = useLocalStorage('registro-caso-data', {
    sintesis: '',
    tramite: '', // Assuming tramite is string from existing code context
    idTribunal: undefined as number | undefined,
    idCentro: undefined as number | undefined,
    comAmbLegal: undefined as number | undefined,
    orientacion: 'ASESORÍA', // Default value
    fechaRecepcion: new Date().toISOString().split('T')[0], // Default to today
    estudiantesAtencion: [] as string[],
  }, { expirationTimeMs: EXPIRATION_TIME_MS });

  // Catalog States
  const [centros, setCentros] = useState<Centro[]>([]);
  const [ambitos, setAmbitos] = useState<AmbitoLegal[]>([]);

  // Load Catalogs
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [centrosData, ambitosData, estudiantesData] = await Promise.all([
          catalogoService.getCentros(),
          catalogoService.getAmbitosLegales(),
          estudianteService.getActiveStudents()
        ]);
        setCentros(centrosData);
        setAmbitos(ambitosData);
        setActiveStudents(estudiantesData);
      } catch (error) {
        console.error('Error cargando catálogos:', error);
        showNotification('Error al cargar datos del sistema', 'error');
      }
    };
    loadCatalogos();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleSearchSolicitante = async () => {
    if (!cedulaSearch.trim()) return;

    setIsSearching(true);
    setErrorMessage('');
    setSolicitante(null);

    try {
      const result = await solicitanteService.getByCedula(cedulaSearch);
      if (result) {
        setSolicitante(result);
        showNotification('Solicitante encontrado', 'success');
      }
    } catch (error: any) {
      // 404 is expected if not found
      if (error.response && error.response.status === 404) {
        setErrorMessage('Solicitante no encontrado. ¿Desea registrarlo?');
        setIsModalOpen(true);
      } else {
        console.error('Error buscando solicitante:', error);
        setErrorMessage('Error al buscar solicitante. Intente nuevamente.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSolicitanteCreated = (data: any) => {
    // SolicitanteForm already calls service.create, so data is the result (or formData if form is not updated to return result)
    // We assume data is the created solicitante object or compatible
    setSolicitante(data);
    setIsModalOpen(false);
    setCedulaSearch(data.cedula);
    showNotification('Solicitante registrado exitosamente', 'success');
  };

  const handleRegistroCaso = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    if (!solicitante) {
      showNotification('Debe seleccionar un solicitante', 'error');
      return;
    }

    if (!formData.idCentro || !formData.comAmbLegal || !formData.sintesis) {
      showNotification('Complete los campos obligatorios (*)', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const casoData: CasoCreateRequest = {
        sintesis: formData.sintesis,
        tramite: formData.tramite || 'ASESORÍA', // Fallback or validate
        cantBeneficiarios: beneficiarios.length,
        idTribunal: formData.idTribunal || undefined,
        // termino: calculated in backend
        idCentro: Number(formData.idCentro),
        cedula: solicitante.cedula,
        username: user?.username || '', // From auth context
        comAmbLegal: Number(formData.comAmbLegal),
        beneficiarios: beneficiarios,
        orientacion: formData.orientacion,
        estudiantesAtencion: formData.estudiantesAtencion
      };

      const result = await casoService.create(casoData);
      setCreatedCase(result);
      setIsSuccessModalOpen(true);

      // Clear local storage ONLY on success
      localStorage.removeItem('registro-caso-data');

    } catch (error: any) {
      console.error('Error al registrar caso:', error);
      const msg = error.response?.data?.message || "Error al registrar el caso";
      showNotification(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    navigate(`/casos/${createdCase?.caso.numCaso}`);
  };




  return (
    <MainLayout title="REGISTRO DE CASOS">
      <div className="max-w-5xl mx-auto">

        {/* 1. SECCIÓN DE SOLICITANTE */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="bg-red-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            Identificación del Solicitante
          </h2>

          <div className="flex gap-4 items-end max-w-2xl">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cédula de Identidad
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cedulaSearch}
                  onChange={(e) => setCedulaSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSolicitante()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 transition-all"
                  placeholder="Ej: V-12345678"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>
            <Button
              onClick={handleSearchSolicitante}
              disabled={isSearching}
              isLoading={isSearching}
              variant="primary"
              className="py-3 h-[50px]"
            >
              {isSearching ? 'Buscando...' : 'Verificar'}
            </Button>
          </div>

          {errorMessage && (
            <p className="mt-3 text-sm text-red-600 font-medium animate-pulse">{errorMessage}</p>
          )}

          {/* Resultado de búsqueda */}
          {solicitante && (
            <div className="mt-6 p-6 bg-green-50 border border-green-100 rounded-xl animate-fade-in relative group">
              <div className="absolute top-6 right-6">
                <Button
                  onClick={() => setSolicitante(null)}
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-900 hover:bg-green-100"
                >
                  Cambiar usuario
                </Button>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0 border-2 border-green-200">
                  <span className="text-green-700 font-bold text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Solicitante Verificado</h3>
                  <p className="text-green-700 font-semibold text-lg">{solicitante.nombre} {solicitante.apellido}</p>
                  <p className="text-gray-500 text-sm">C.I. {solicitante.cedula}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4 border-t border-green-200">
                {/* Columna 1: Contacto */}
                <div>
                  <h4 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    Datos de Contacto
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="text-gray-600">Teléfono Celular:</span>
                      <span className="font-medium text-gray-900">{solicitante.telfCelular || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="text-gray-600">Teléfono Local:</span>
                      <span className="font-medium text-gray-900">{solicitante.telfCasa || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="text-gray-600">Correo:</span>
                      <span className="font-medium text-gray-900">{solicitante.email || solicitante.correo || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Columna 2: Personal y Residencia */}
                <div>
                  <h4 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    Personal y Residencia
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="text-gray-600">Estado Civil:</span>
                      <span className="font-medium text-gray-900">{solicitante.estadoCivil || solicitante.nombreEstadoCivil || 'No registrado'}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="text-gray-600">Dirección:</span>
                      <span className="font-medium text-gray-900 truncate max-w-[200px]" title={[solicitante.estadoResidencia, solicitante.municipioResidencia, solicitante.parroquiaResidencia].filter(Boolean).join(' - ')}>
                        {[solicitante.estadoResidencia, solicitante.municipioResidencia, solicitante.parroquiaResidencia].filter(Boolean).join(' - ') || 'No registrada'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="text-gray-600">Nacionalidad:</span>
                      <span className="font-medium text-gray-900">{solicitante.nacionalidad || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2. DATOS DEL CASO - Solo visible si hay solicitante */}
        {solicitante && (
          <form onSubmit={handleRegistroCaso} className="space-y-8 animate-fade-in">
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-red-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Datos del Caso
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Centro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Centro de Atención *
                  </label>
                  <CustomSelect
                    options={centros.map(c => ({ value: c.idCentro, label: c.nombreCentro }))}
                    value={formData.idCentro || ''}
                    onChange={(val) => setFormData({ ...formData, idCentro: Number(val) })}
                    placeholder="Seleccione centro..."
                    required
                  />
                </div>

                {/* Fecha Recepción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Recepción
                  </label>
                  <CustomDatePicker
                    value={formData.fechaRecepcion}
                    onChange={(val) => setFormData({ ...formData, fechaRecepcion: val })}
                  />
                </div>

                {/* Trámite */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Trámite *
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'ASESORÍA', label: 'Asesoría' },
                      { value: 'CONCILIACIÓN Y MEDIACIÓN', label: 'Conciliación y Mediación' },
                      { value: 'REDACCIÓN DE DOCUMENTOS', label: 'Redacción de Documentos' }
                    ]}
                    value={formData.tramite}
                    onChange={(val) => setFormData({ ...formData, tramite: String(val) })}
                    placeholder="Seleccione trámite..."
                    required
                  />
                </div>

                {/* Selector Inteligente de Ámbito */}
                <div>
                  <SmartAmbitoSelector
                    data={ambitos}
                    value={formData.comAmbLegal || 0}
                    onChange={(id) => setFormData({ ...formData, comAmbLegal: id })}
                  />
                </div>

                {/* Síntesis */}
                <div className="h-full flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Síntesis de los Hechos *
                  </label>
                  <textarea
                    value={formData.sintesis}
                    onChange={(e) => setFormData({ ...formData, sintesis: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 min-h-[120px] flex-1 resize-none h-full"
                    placeholder="Describa brevemente..."
                    maxLength={500}
                    required
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formData.sintesis.length}/500
                  </div>
                </div>

                {/* Sub-sección Beneficiarios */}
                <div className="h-full flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beneficiarios
                  </label>
                  <div className="flex-1">
                    <BeneficiarioManager
                      beneficiarios={beneficiarios}
                      onBeneficiariosChange={setBeneficiarios}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. INFORMACIÓN DEL ENCUENTRO */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-red-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                Información del Encuentro
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Orientación */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orientación *
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 resize-none flex-1 min-h-[160px]"
                    value={formData.orientacion}
                    onChange={(e) => setFormData({ ...formData, orientacion: e.target.value })}
                    placeholder="Describa la orientación brindada..."
                    required
                  />
                </div>

                {/* Estudiantes en Atención */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full flex flex-col">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Estudiantes
                  </h3>

                  <EstudianteManager
                    activeStudents={activeStudents}
                    selectedUsernames={formData.estudiantesAtencion}
                    onSelectionChange={(usernames) => setFormData(prev => ({ ...prev, estudiantesAtencion: usernames }))}
                  />
                </div>
              </div>
            </section>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-4 pt-4 pb-12">
              <Button
                type="button"
                onClick={() => navigate('/casos')}
                variant="secondary"
                size="lg"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={faPlus}
                className="shadow-lg hover:shadow-red-900/20"
              >
                Registrar Caso
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Modal de Registro de Solicitante */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={solicitante ? "Datos del Solicitante" : "Registrar Nuevo Solicitante"}
      >
        <SolicitanteForm
          isModal={true}
          formMode="create"
          initialData={solicitante ? { ...solicitante } : { cedula: cedulaSearch }}
          onSuccess={handleSolicitanteCreated}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Modal de Éxito al Crear Caso */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={closeSuccessModal}
        title="¡Caso Creado Exitosamente!"
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Caso N° {createdCase?.caso.numCaso}
          </h3>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left text-sm space-y-2">
            <div className="flex justify-between border-b pb-2 cursor-pointer hover:bg-gray-100 transition-colors p-2 rounded">
              <span className="text-gray-600 font-medium">Solicitante:</span>
              <span className="text-gray-900 font-bold ml-2">
                {solicitante?.nombre || createdCase?.caso.cedula}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 cursor-pointer hover:bg-gray-100 transition-colors p-2 rounded">
              <span className="text-gray-600 font-medium">Trámite:</span>
              <span className="text-gray-900 ml-2">{createdCase?.caso.tramite}</span>
            </div>
            <div className="flex justify-between border-b pb-2 cursor-pointer hover:bg-gray-100 transition-colors p-2 rounded">
              <span className="text-gray-600 font-medium">Centro:</span>
              <span className="text-gray-900 ml-2">
                {centros.find(c => c.idCentro === createdCase?.caso.idCentro)?.nombreCentro || createdCase?.caso.idCentro}
              </span>
            </div>
            <div className="flex justify-between pt-1 cursor-pointer hover:bg-gray-100 transition-colors p-2 rounded">
              <span className="text-gray-600 font-medium">Fecha:</span>
              <span className="text-gray-900 ml-2">{createdCase?.caso.fechaRecepcion}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => navigate('/casos')}
              variant="secondary"
            >
              Volver a la lista
            </Button>
            <Button
              onClick={closeSuccessModal}
              variant="primary"
            >
              Ver Detalle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />
      )}
    </MainLayout>
  );
}

export default RegistroCaso;
