import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import CustomDatePicker from '../common/CustomDatePicker';
import EstudianteManager from '../forms/EstudianteManager';
import estudianteService, { type EstudianteInfo } from '../../services/estudianteService';

interface EncuentroCreateRequest {
  fechaAtencion: string;
  fechaProxima?: string;
  orientacion: string;
  observacion?: string;
  username: string;
  atendidos: string[];
}

interface AddEncuentroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: EncuentroCreateRequest) => Promise<void>;
  defaultUsername?: string;
}

export default function AddEncuentroModal({
  isOpen,
  onClose,
  onSuccess,
  defaultUsername = '',
}: AddEncuentroModalProps) {
  const [orientacion, setOrientacion] = useState('');
  const [observacion, setObservacion] = useState('');
  const [fechaAtencion, setFechaAtencion] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [tieneFechaProxima, setTieneFechaProxima] = useState(false);
  const [fechaProxima, setFechaProxima] = useState('');
  const [currentUser, setCurrentUser] = useState(defaultUsername);
  const [loading, setLoading] = useState(false);
  
  // Atendidos state
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<EstudianteInfo[]>([]);

  useEffect(() => {
    // Load Students
    const loadStudents = async () => {
      try {
        const students = await estudianteService.getActiveStudents();
        setAvailableStudents(students);
      } catch (e) {
        console.error('Error loading students', e);
      }
    };
    loadStudents();

    if (isOpen) {
      // Try to get logged in user from localStorage if not provided
      const storedUser = localStorage.getItem('user');
      let uName = defaultUsername;
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          uName = parsed.username || parsed.sub || defaultUsername;
        } catch (e) {
          uName = defaultUsername;
        }
      }
      setCurrentUser(uName);
      // Pre-select current user if not empty
      if (uName) setSelectedUsernames([uName]);
      else setSelectedUsernames([]);
    }
  }, [isOpen, defaultUsername]);

  const handleSubmit = async () => {
    if (!orientacion || !fechaAtencion) return;
    
    // Validar que si quiere programar próxima cita, la fecha esté completa
    if (tieneFechaProxima && !fechaProxima) {
      alert('Por favor selecciona la fecha de la próxima cita');
      return;
    }

    setLoading(true);
    try {
      await onSuccess({
        orientacion,
        observacion: observacion || undefined,
        fechaAtencion,
        fechaProxima: tieneFechaProxima && fechaProxima ? fechaProxima : undefined,
        username: currentUser,
        atendidos: selectedUsernames,
      });
      // Reset and close
      setOrientacion('');
      setObservacion('');
      setFechaAtencion(new Date().toISOString().split('T')[0]);
      setTieneFechaProxima(false);
      setFechaProxima('');
      setSelectedUsernames([]);
      onClose();
    } catch (error) {
      console.error('Error creating encounter', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Encuentro / Cita">
      <div className="p-6 space-y-4">
        {/* Fecha de Atención */}
        <div>
          <CustomDatePicker
            label="Fecha de Atención *"
            value={fechaAtencion}
            onChange={setFechaAtencion}
            required
          />
        </div>

        {/* Orientación (Título del Encuentro) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Orientación / Motivo de la Cita *
          </label>
          <input
            type="text"
            className="w-full border rounded-lg p-2 focus:ring-red-900 focus:border-red-900"
            value={orientacion}
            onChange={(e) => setOrientacion(e.target.value)}
            placeholder="Ej: Primera Consulta"
          />
        </div>

        {/* Observación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
          <textarea
            className="w-full border rounded-lg p-2 focus:ring-red-900 focus:border-red-900"
            rows={4}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Detalles sobre la reunión, temas tratados, acuerdos..."
          />
        </div>

        {/* Atendidos */}
        <div>
          <EstudianteManager
            activeStudents={availableStudents}
            selectedUsernames={selectedUsernames}
            onSelectionChange={setSelectedUsernames}
          />
        </div>

        {/* Fecha Próxima (Opcional) */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="tieneFechaProxima"
              checked={tieneFechaProxima}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setTieneFechaProxima(isChecked);
                // Si marca el checkbox y la fecha está vacía, poner fecha de mañana por defecto
                if (isChecked && !fechaProxima) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setFechaProxima(tomorrow.toISOString().split('T')[0]);
                }
              }}
              className="w-4 h-4 text-red-900 border-gray-300 rounded focus:ring-red-900"
            />
            <label htmlFor="tieneFechaProxima" className="text-sm font-medium text-gray-700">
              Programar próxima cita
            </label>
          </div>

          {tieneFechaProxima && (
            <div>
              <CustomDatePicker
                label="Fecha de Próxima Cita *"
                value={fechaProxima}
                onChange={setFechaProxima}
                required
                min={new Date().toISOString().split('T')[0]} // Min today
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta fecha se guardará para programar el seguimiento del caso
              </p>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="pt-4 flex justify-end gap-2">
          <Button onClick={handleClose} variant="secondary" disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={
              loading ||
              !orientacion ||
              !fechaAtencion ||
              (tieneFechaProxima && !fechaProxima)
            }
          >
            {loading ? 'Guardando...' : 'Guardar Encuentro'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

