import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import AssignStudentModal from './AssignStudentModal';
import { useAuth } from '../context/AuthContext';

interface CaseCardProps {
  numCaso: string;
  materia: string;
  cedula: string;
  nombre: string;
  fecha: string;
  estatus: string;
  sintesis?: string;
  onClick?: () => void;
  usuarios_asignados?: string[];
}

function CaseCard({ numCaso, materia, cedula, nombre, fecha, estatus, sintesis, onClick }: CaseCardProps) {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

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

  // Función para determinar el color del badge
  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'EN PROGRESO':
      case 'ACTIVO':
      case 'ABIERTO':
        return isDark ? 'bg-green-300 text-green-900' : 'bg-green-100 text-green-800';
      case 'CERRADO':
        return isDark ? 'bg-gray-300 text-gray-900' : 'bg-gray-100 text-gray-800';
      case 'PENDIENTE':
      case 'EN PAUSA':
        return isDark ? 'bg-yellow-300 text-yellow-900' : 'bg-yellow-100 text-yellow-800';
      case 'REVISIÓN':
        return isDark ? 'bg-blue-300 text-blue-900' : 'bg-blue-100 text-blue-800';
      default:
        return isDark ? 'bg-gray-300 text-gray-900' : 'bg-gray-100 text-gray-800';
    }
  };

  const formatFecha = (fechaStr: string) => {
    try {
      if (!fechaStr) return '';
      const [year, month, day] = fechaStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return fechaStr;
    }
  };

  const { user } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Determine if user can assign (Coordinator/Professor)
  const canAssign = user?.tipoUsuario === 'COORDINADOR' || user?.tipoUsuario === 'PROFESOR' || user?.tipoUsuario === 'ADMIN';

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setShowAssignModal(true);
  };

  return (
    <>
      <div
        onClick={onClick}
        className={`group cursor-pointer relative shadow-md hover:shadow-xl transition-all duration-300 h-[360px] w-full flex flex-col rounded-lg overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
      >
        {/* 1. Left Vertical Red Bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-3 group-hover:w-4 transition-all duration-300 ${isDark ? 'bg-red-900' : 'bg-red-900'
            }`}
        ></div>

        {/* Main Content Container */}
        <div className="pl-8 pr-6 pt-5 pb-4 flex flex-col h-full w-full">

          {/* 2. Top Right: Case Number */}
          <div className="flex justify-between items-start mb-1">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(estatus)} whitespace-nowrap self-start`}>
              {estatus}
            </span>
            <div className="flex flex-col items-end">
              <span
                className={`font-bold text-lg tracking-wide group-hover:scale-110 origin-right transition-all duration-300 ${isDark
                  ? 'text-white group-hover:text-red-800'
                  : 'text-gray-900 group-hover:text-red-900'
                  }`}
              >
                {numCaso}
              </span>
              {/* Assign Button */}
              {canAssign && (
                <button
                  onClick={handleAssignClick}
                  className={`mt-1 text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors z-10 ${isDark
                    ? 'text-red-900 hover:bg-red-950 hover:text-white shadow-sm'
                    : 'text-red-900 hover:bg-red-950 hover:text-white shadow-sm'
                    }`}
                  title="Asignar Estudiante"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  <span>Asignar</span>
                </button>
              )}
            </div>
          </div>


          {/* 3. Title: Name */}
          <div className="mb-2 flex items-center">
            <h2
              className={`text-xl font-bold leading-tight line-clamp-2 w-full ${isDark ? 'text-white' : 'text-gray-900'
                }`}
            >
              {nombre}
            </h2>
          </div>

          {/* Requirements: Materia (Ambito Legal) below name */}
          <div className="mb-3 flex items-center">
            <p
              className={`text-xs font-semibold uppercase tracking-wide line-clamp-1 ${isDark ? 'text-white' : 'text-red-700'
                }`}
            >
              {materia}
            </p>
          </div>

          {/* 4. Body: Synthesis */}
          <div className="flex-1 overflow-hidden relative flex flex-col justify-start py-2">
            <div className={`flex-1 px-2 py-1.5 rounded-md overflow-hidden ${isDark ? 'bg-gray-700/50 border border-red-900/30' : 'bg-gray-50 border border-gray-100'}`}>
              <p
                className={`text-sm leading-relaxed line-clamp-4 ${isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}
              >
                {sintesis || <span className={`italic ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>Sin síntesis disponible.</span>}
              </p>
            </div>
          </div>

          {/* Footer: Metadata */}
          <div
            className={`text-xs font-medium flex justify-between items-end border-t pt-2 mt-auto ${isDark ? 'text-gray-200 border-gray-700' : 'text-gray-400 border-gray-100'
              }`}
          >
            <div>
              <p className="mb-0.5">Cédula: {cedula}</p>
              <p>Fecha: {formatFecha(fecha)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal outside the card div to avoid layout issues */}
      <AssignStudentModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        numCaso={numCaso}
        onAssignSuccess={() => {
          // Optional: trigger a refresh or show toast
          setShowAssignModal(false);
        }}
      />
    </>
  );
}

export default CaseCard;
