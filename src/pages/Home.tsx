import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBriefcase,
  faClock,
  faCheckCircle,
  faUserPlus,
  faSearch,
  faCalendarAlt,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Assuming useAuth provides the user object
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Actualizar isDark cuando cambia el theme
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

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <MainLayout title="DASHBOARD">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Buenos días, {user?.username || 'Usuario'}
          </h1>
          <p className={`capitalize mt-1 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            {currentDate}
          </p>
        </div>
        <button
          onClick={() => navigate('/casos?mode=create')} // Adjust logic to open create modal
          className={`${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-900 hover:bg-red-800'} text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium`}
        >
          <FontAwesomeIcon icon={faPlus} />
          Crear Nuevo Caso
        </button>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {/* WIDGET A: Resumen de Casos (2 columnas) */}
        <div className="md:col-span-2 lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className={`${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow`}>
            <div className={`w-12 h-12 ${isDark ? 'bg-red-800/70 text-white' : 'bg-red-50 text-red-900'} rounded-full flex items-center justify-center text-xl mb-3`}>
              <FontAwesomeIcon icon={faBriefcase} />
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>12</h3>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-500'}`}>Mis Casos Activos</p>
          </div>
          {/* Card 2 */}
          <div className={`${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow`}>
            <div className={`w-12 h-12 ${isDark ? 'bg-yellow-800/70 text-yellow-100' : 'bg-yellow-50 text-yellow-600'} rounded-full flex items-center justify-center text-xl mb-3`}>
              <FontAwesomeIcon icon={faClock} />
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>5</h3>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-500'}`}>Pendientes Revisión</p>
          </div>
          {/* Card 3 */}
          <div className={`${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow`}>
            <div className={`w-12 h-12 ${isDark ? 'bg-green-800/70 text-green-100' : 'bg-green-50 text-green-600'} rounded-full flex items-center justify-center text-xl mb-3`}>
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>8</h3>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-500'}`}>Cerrados este mes</p>
          </div>
        </div>

        {/* WIDGET B: Accesos Rápidos (1 columna) */}
        <div className={`${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border flex flex-col justify-between`}>
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Accesos Rápidos</h3>
          <div className="space-y-3">
            <button onClick={() => navigate('/solicitantes?mode=create')} className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors group ${
              isDark 
                ? 'hover:bg-red-800/50 text-gray-200 hover:text-white' 
                : 'hover:bg-red-50 text-gray-700 hover:text-red-900'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark 
                  ? 'bg-red-800/50 group-hover:bg-red-800 text-gray-300 group-hover:text-white' 
                  : 'bg-gray-100 group-hover:bg-red-100 text-gray-500 group-hover:text-red-900'
              }`}>
                <FontAwesomeIcon icon={faUserPlus} className="text-sm" />
              </div>
              <span className="font-medium text-sm">Registrar Solicitante</span>
            </button>
            <button onClick={() => navigate('/expedientes')} className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors group ${
              isDark 
                ? 'hover:bg-red-800/50 text-gray-200 hover:text-white' 
                : 'hover:bg-red-50 text-gray-700 hover:text-red-900'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark 
                  ? 'bg-red-800/50 group-hover:bg-red-800 text-gray-300 group-hover:text-white' 
                  : 'bg-gray-100 group-hover:bg-red-100 text-gray-500 group-hover:text-red-900'
              }`}>
                <FontAwesomeIcon icon={faSearch} className="text-sm" />
              </div>
              <span className="font-medium text-sm">Buscar Expediente</span>
            </button>
            <button onClick={() => navigate('/calendario')} className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors group ${
              isDark 
                ? 'hover:bg-red-800/50 text-gray-200 hover:text-white' 
                : 'hover:bg-red-50 text-gray-700 hover:text-red-900'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark 
                  ? 'bg-red-800/50 group-hover:bg-red-800 text-gray-300 group-hover:text-white' 
                  : 'bg-gray-100 group-hover:bg-red-100 text-gray-500 group-hover:text-red-900'
              }`}>
                <FontAwesomeIcon icon={faCalendarAlt} className="text-sm" />
              </div>
              <span className="font-medium text-sm">Ver Calendario</span>
            </button>
          </div>
        </div>

        {/* WIDGET C: Agenda / Notificaciones (1 columna - Row Span 2) */}
        <div className={`md:col-span-1 md:row-span-2 ${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-100'} rounded-xl shadow-sm border overflow-hidden flex flex-col h-full`}>
          <div className={`p-5 border-b ${isDark ? 'border-red-800 bg-red-900/70' : 'border-gray-100 bg-gray-50/50'}`}>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Próximos Vencimientos</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
            {/* Item Agenda 1 - Alta Prioridad */}
            <div className={`pl-4 border-l-4 border-red-500 p-3 rounded-r-lg ${isDark ? 'bg-red-900/70' : 'bg-red-50/30'}`}>
              <p className={`text-xs font-bold mb-1 ${isDark ? 'text-red-200' : 'text-red-600'}`}>MAÑANA, 09:00 AM</p>
              <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Audiencia Preliminar</h4>
              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Caso #2026-045 - Familia Gomez</p>
            </div>
            {/* Item Agenda 2 - Media Prioridad */}
            <div className={`pl-4 border-l-4 border-yellow-400 p-3 rounded-r-lg ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50/30'}`}>
              <p className={`text-xs font-bold mb-1 ${isDark ? 'text-yellow-200' : 'text-yellow-600'}`}>JUEVES 21, 02:00 PM</p>
              <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Entrega de Documentos</h4>
              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Caso #2026-089 - Sra. Martinez</p>
            </div>
            {/* Item Agenda 3 - Baja Prioridad */}
            <div className={`pl-4 border-l-4 border-blue-400 p-3 rounded-r-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50/30'}`}>
              <p className={`text-xs font-bold mb-1 ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>LUNES 25, 10:00 AM</p>
              <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Reunión de Equipo</h4>
              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Revisión mensual de casos</p>
            </div>
            {/* Item Agenda 4 */}
            <div className={`pl-4 border-l-4 p-3 rounded-r-lg ${isDark ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50'}`}>
              <p className={`text-xs font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>VIERNES 29</p>
              <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Cierre de Actas</h4>
              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Todos los expedientes</p>
            </div>
          </div>
          <div className={`p-3 border-t ${isDark ? 'border-red-800' : 'border-gray-100'} text-center`}>
            <button className={`text-xs font-semibold transition-colors ${isDark ? 'text-red-300 hover:text-red-200' : 'text-red-900 hover:text-red-700'}`}>
              Ver toda la agenda
            </button>
          </div>
        </div>

        {/* WIDGET D: Gráfico Placeholder (2 columnas - o 3) */}
        <div className={`md:col-span-2 lg:col-span-3 ${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Actividad Semanal</h3>
            <select className={`text-sm rounded-md px-2 py-1 border ${
              isDark 
                ? 'border-red-800 text-white bg-red-900' 
                : 'border-gray-300 text-gray-600 bg-gray-50'
            }`}>
              <option>Últimos 7 días</option>
              <option>Este mes</option>
            </select>
          </div>

          {/* Visual Placeholder for Chart */}
          <div className="w-full h-48 flex items-end justify-between px-4 gap-2">
            {[40, 65, 30, 80, 55, 90, 45].map((height, i) => (
              <div key={i} className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                <div className={`relative w-full ${isDark ? 'bg-red-800/50' : 'bg-gray-100'} rounded-t-lg overflow-hidden h-40 flex items-end`}>
                  <div
                    style={{ height: `${height}%` }}
                    className={`w-full ${i === 5 ? (isDark ? 'bg-red-600' : 'bg-red-900') : (isDark ? 'bg-red-700/50 group-hover:bg-red-700' : 'bg-red-200 group-hover:bg-red-300')} rounded-t-lg transition-all duration-300`}
                  ></div>
                </div>
                <span className={`text-xs ${i === 5 ? (isDark ? 'font-bold text-red-300' : 'font-bold text-red-900') : (isDark ? 'text-gray-400' : 'text-gray-400')}`}>
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}

export default Home;
