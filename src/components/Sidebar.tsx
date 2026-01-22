import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faRightFromBracket,
  faChartPie,
  faUsers,
  faBriefcase,
  faCalendarAlt,
  faFileLines,
  faUserGear,
  faScaleBalanced,
  faTags
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean; // For mobile
  onClose: () => void; // For mobile
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-3 font-medium rounded-lg transition-all duration-300 group relative ${isActive
      ? isDark
        ? 'bg-red-900/30 text-white border-l-2 border-red-900'
        : 'bg-red-50 text-red-900'
      : isDark
        ? 'text-white hover:bg-gray-700 hover:border-l-2 hover:border-red-900/50'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    } ${isCollapsed ? 'justify-center text-2xl' : 'text-base'}`;

  // Helper to render the tooltip when collapsed
  const Tooltip = ({ text }: { text: string }) => {
    if (!isCollapsed) return null;

    return (
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-sm">
        {text}
        {/* Arrow */}
        <div className="absolute top-1/2 right-full -translate-y-1/2 -mr-1 border-4 border-transparent border-r-gray-800"></div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out shadow-sm group
              ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          border-r
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className="flex flex-col h-full relative">

          {/* Header / Logo */}
          <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} ${isDark ? 'border-gray-700' : 'border-gray-100'} border-b transition-all duration-300`}>

            {/* Desktop Toggle (Collapsed: Icon is the button) */}
            {isCollapsed ? (
              <button
                onClick={toggleSidebar}
                className={`hidden md:flex text-2xl hover:scale-110 transition-transform duration-200 focus:outline-none ${isDark ? 'text-white' : 'text-red-900'}`}
                title="Expandir"
              >
                <FontAwesomeIcon icon={faScaleBalanced} />
              </button>
            ) : (
              <button
                onClick={toggleSidebar}
                className="hidden md:flex items-center justify-between w-full cursor-pointer hover:scale-105 transition-transform duration-200"
                title="Contraer"
              >
                <h1 className={`text-xl font-serif font-bold tracking-wide truncate ${isDark ? 'text-white' : 'text-red-900'}`}>
                  Clínica Jurídica
                </h1>
                <div className={`hover:scale-110 transition-transform duration-200 ml-2 ${isDark ? 'text-white' : 'text-red-900'}`}>
                  <FontAwesomeIcon icon={faScaleBalanced} />
                </div>
              </button>
            )}

            {/* Mobile Logo Fallback (if needed) or just Close Button */}
            {/* Note: In mobile 'isCollapsed' is typically false initially or managed differently. The Sidebar is either Open (overlay) or Closed. 
                 The 'toggleSidebar' logic is for Desktop state. Mobile uses 'onClose'. */}

            <button
              onClick={onClose}
              className={`md:hidden focus:outline-none ml-auto ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-6 scrollbar-thin">

            {/* Group: PRINCIPAL */}
            <div>
              {!isCollapsed && (
                <p className={`px-4 text-sm font-semibold uppercase tracking-wider mb-2 transition-opacity duration-300 ${isDark ? 'text-gray-300' : 'text-gray-400'}`}>
                  Principal
                </p>
              )}
              {isCollapsed && <div className="h-4"></div>} {/* Spacer for collapsed mode alignment */}

              <ul className="space-y-1">
                <li>
                  <NavLink to="/home" className={navLinkClasses} onClick={() => isOpen && onClose()}>
                    <FontAwesomeIcon icon={faChartPie} className={`${isCollapsed ? 'text-2xl' : 'text-xl'}`} />
                    {!isCollapsed && <span className="truncate">Dashboard</span>}
                    <Tooltip text="Dashboard" />
                  </NavLink>
                </li>
              </ul>
            </div>

            {/* Group: OPERACIONES */}
            <div>
              {!isCollapsed && (
                <p className={`px-4 text-sm font-semibold uppercase tracking-wider mb-2 transition-opacity duration-300 ${isDark ? 'text-gray-300' : 'text-gray-400'}`}>
                  Operaciones
                </p>
              )}
              <ul className="space-y-1">
                <li>
                  <NavLink to="/solicitantes" className={navLinkClasses} onClick={() => isOpen && onClose()}>
                    <FontAwesomeIcon icon={faUsers} className={`${isCollapsed ? 'text-2xl' : 'text-xl'}`} />
                    {!isCollapsed && <span className="truncate">Solicitantes</span>}
                    <Tooltip text="Solicitantes" />
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/casos" className={navLinkClasses} onClick={() => isOpen && onClose()}>
                    <FontAwesomeIcon icon={faBriefcase} className={`${isCollapsed ? 'text-2xl' : 'text-xl'}`} />
                    {!isCollapsed && <span className="truncate">Casos</span>}
                    <Tooltip text="Casos" />
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/agenda" className={navLinkClasses} onClick={() => isOpen && onClose()}>
                    <FontAwesomeIcon icon={faCalendarAlt} className={`${isCollapsed ? 'text-2xl' : 'text-xl'}`} />
                    {!isCollapsed && <span className="truncate">Agenda</span>}
                    <Tooltip text="Agenda" />
                  </NavLink>
                </li>
              </ul>
            </div>

            {/* Group: REPORTES - Visible para todos los usuarios */}
            <div>
              {!isCollapsed && (
                <p className={`px-4 text-sm font-semibold uppercase tracking-wider mb-2 transition-opacity duration-300 ${isDark ? 'text-gray-300' : 'text-gray-400'}`}>
                  Reportes
                </p>
              )}
              {isCollapsed && <div className="h-4"></div>} {/* Spacer for collapsed mode alignment */}
              <ul className="space-y-1">
                <li>
                  <NavLink to="/reportes" className={navLinkClasses} onClick={() => isOpen && onClose()}>
                    <FontAwesomeIcon icon={faFileLines} className={`${isCollapsed ? 'text-2xl' : 'text-xl'}`} />
                    {!isCollapsed && <span className="truncate">Reportes</span>}
                    <Tooltip text="Reportes" />
                  </NavLink>
                </li>
              </ul>
            </div>

            {/* Group: SISTEMA - Solo visible para COORDINADOR y ADMINISTRADOR */}
            {(user?.tipoUsuario === 'COORDINADOR' || user?.tipoUsuario === 'ADMINISTRADOR') && (
              <div>
                {!isCollapsed && (
                  <p className={`px-4 text-sm font-semibold uppercase tracking-wider mb-2 transition-opacity duration-300 ${isDark ? 'text-gray-300' : 'text-gray-400'}`}>
                    Sistema
                  </p>
                )}
                <ul className="space-y-1">
                  <li>
                    <NavLink to="/catalogos" className={navLinkClasses} onClick={() => isOpen && onClose()}>
                      <FontAwesomeIcon icon={faTags} className={`${isCollapsed ? '' : 'w-5 text-center'}`} />
                      {!isCollapsed && <span className="truncate">Catálogos</span>}
                      <Tooltip text="Catálogos" />
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/usuarios" className={navLinkClasses} onClick={() => isOpen && onClose()}>
                      <FontAwesomeIcon icon={faUserGear} className={`${isCollapsed ? 'text-2xl' : 'text-xl'}`} />
                      {!isCollapsed && <span className="truncate">Usuarios</span>}
                      <Tooltip text="Usuarios" />
                    </NavLink>
                  </li>
                </ul>
              </div>
            )}
          </nav>

          {/* User Info (Bottom) */}
          <div className={`p-4 border-t ${isDark ? 'border-red-800' : 'border-gray-100'} ${isCollapsed ? 'hidden' : 'block'}`}>
            <p className={`font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{user?.nombre || 'Usuario'}</p>
            <p className={`text-xs truncate capitalize ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
              {user?.tipoUsuario ? user.tipoUsuario.toLowerCase() : 'Rol desconocido'}
            </p>
          </div>

          {/* Footer / Logout */}
          <div className={`p-4 ${isCollapsed ? 'border-t-0' : 'border-t'} ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-3 py-3 font-medium rounded-lg transition-colors group relative ${isCollapsed ? 'justify-center text-2xl' : 'text-base'} ${isDark
                ? 'text-white hover:bg-gray-700 hover:text-red-400'
                : 'text-gray-600 hover:text-red-700 hover:bg-red-50'
                }`}
            >
              <FontAwesomeIcon icon={faRightFromBracket} className={isCollapsed ? 'text-2xl' : 'text-xl'} />
              {!isCollapsed && <span className="truncate">Cerrar Sesión</span>}
              <Tooltip text="Cerrar Sesión" />
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}

export default Sidebar;
