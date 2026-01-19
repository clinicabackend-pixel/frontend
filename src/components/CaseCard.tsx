import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faIdCard } from '@fortawesome/free-solid-svg-icons';

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
  // Función para determinar el color del badge
  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'EN PROGRESO':
      case 'ACTIVO':
      case 'ABIERTO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CERRADO':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REVISIÓN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Parse chips from "Category > Subcategory" string
  const chips = materia.split('>').map(s => s.trim()).filter(Boolean);

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-lg border border-gray-200 border-l-4 border-l-red-900 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col h-full relative"
    >



      {/* Status Pill (Moved to top right in visual hierarchy, but positioned via flex in header or absolute? 
            Req says "Coloca la Etiqueta de Estado ... en la esquina superior derecha".
            The menu is usually extreme top right. I'll put status next to name or just below, 
            OR absolute top right and move menu? 
            Let's put Status absolute top right, and Menu below it? Or Menu top right, Status top left?
            Req: "Coloca la Etiqueta de Estado (ej. 'Abierto' en verde) en la esquina superior derecha de la tarjeta"
            Req: "Acciones: Añade un icono de menú ... en la esquina inferior o superior derecha"
            I'll put Status top-right, and Menu bottom-right to avoid clutter/conflict.
        */}

      {/* Re-structuring based on strict reqs: 
          Header: Name Left, Status Right.
          Subtitle: Case ID below Name.
      */}
      <div className="flex justify-between items-start w-full mb-1">
        <div className="flex-1 pr-2">
          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-0.5 line-clamp-1">
            {nombre}
          </h3>
          <span className="text-xs text-gray-500 font-mono block">
            {numCaso}
          </span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(estatus)} whitespace-nowrap`}>
          {estatus}
        </span>
      </div>

      {/* Body: Chips */}
      <div className="flex flex-wrap gap-2 mt-3 mb-3">
        {chips.map((chip, idx) => (
          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
            {chip}
          </span>
        ))}
      </div>

      {/* Body: Description Excerpt */}
      <div className="flex-1 mb-4">
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
          {sintesis || <span className="italic text-gray-400">Sin descripción disponible.</span>}
        </p>
      </div>

      {/* Footer: Cedula & Date */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Cédula">
            <FontAwesomeIcon icon={faIdCard} className="text-red-900" />
            <span className="text-gray-600">{cedula}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Fecha de Recepción">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-red-900" />
            <span className="text-gray-600">{formatFecha(fecha)}</span>
          </div>
        </div>


      </div>
    </div>
  );
}

export default CaseCard;
