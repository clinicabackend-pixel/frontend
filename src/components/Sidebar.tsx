import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { label: 'Casos', path: '/casos' },
  { label: 'Citas pendientes', path: '/opcion2' },
  { label: 'Indicadores', path: '/indicadores' },
  { label: 'Expedientes', path: '/expedientes' },
  { label: 'Registro de Casos', path: '/registro-caso' },
  { label: 'Solicitantes y Beneficiarios', path: '/solicitantes' },
  { label: 'Gestión de Usuarios', path: '/usuarios' },
  { label: 'Reportes e Indicadores', path: '/reportes' },
];

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    // Usar el logout del contexto para asegurar que el estado se actualice
    logout();

    // Cerrar el sidebar
    onClose();

    // Redirigir al login
    navigate('/');
  };

  return (
    <>
      {/* Overlay oscuro */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-linear-to-b from-red-900 to-red-950 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-white hover:bg-red-800 rounded p-2 transition-colors"
          aria-label="Cerrar menú"
        >
          <FontAwesomeIcon icon={faXmark} className="text-2xl" />
        </button>

        {/* Opciones del menú */}
        <nav className="mt-20 px-4 space-y-3 flex flex-col h-[calc(100%-5rem)]">
          {/* Opciones normales */}
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavigate(item.path)}
                className="w-full text-left text-lg px-6 py-3 text-white bg-red-800/50 hover:bg-red-700/70 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Botón Cerrar Sesión (al final) */}
          <div className="mt-auto pb-4">
            <button
              onClick={handleLogout}
              className="w-full text-left text-lg px-6 py-3 text-white bg-red-950 hover:bg-black/50 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg border border-red-800/50 flex items-center gap-3"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="text-xl" />
              Cerrar Sesión
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

export default Sidebar;
