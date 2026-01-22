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
import casoService from '../services/casoService';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [casosActivos, setCasosActivos] = useState<number>(0);
  const [pendientesRevision, setPendientesRevision] = useState<number>(0);
  const [cerradosEsteMes, setCerradosEsteMes] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [citasSemana, setCitasSemana] = useState<{ fecha: Date; count: number }[]>([]);
  const [loadingCitas, setLoadingCitas] = useState<boolean>(true);
  const [accionesPendientes, setAccionesPendientes] = useState<Array<{
    idAccion: number;
    numCaso: string;
    titulo: string;
    descripcion?: string;
    fechaRegistro: string;
    nombreSolicitante?: string;
  }>>([]);
  const [loadingAccionesPendientes, setLoadingAccionesPendientes] = useState<boolean>(true);
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

  // Obtener username del usuario usando useMemo para evitar recálculos innecesarios
  const username = user?.username || localStorage.getItem('username') || '';

  // Cargar estadísticas de casos
  useEffect(() => {
    // Evitar ejecución si el usuario aún no está cargado
    if (!user && !username) {
      return;
    }

    const loadCaseStats = async () => {
      // PROFESOR, ADMINISTRADOR y COORDINADOR pueden ver todos los casos (no filtrar por username)
      // ALUMNO/ESTUDIANTE solo ve sus casos asignados (filtrar por username)
      const puedeVerTodosLosCasos = user?.tipo === 'COORDINADOR' || user?.tipo === 'ADMINISTRADOR' || user?.tipo === 'PROFESOR';
      const currentUsername = user?.username || username;
      const userFilter = (currentUsername && !puedeVerTodosLosCasos) ? currentUsername : undefined;

      if (!currentUsername && !puedeVerTodosLosCasos) {
        setLoadingStats(false);
        return;
      }

      setLoadingStats(true);
      try {
        // Obtener todos los casos del usuario (sin filtro de estatus para obtener todos)
        // Si es Coordinador/Administrador/Profesor, no pasar userFilter para ver todos los casos
        // Si es Alumno/Estudiante, pasar userFilter para ver solo sus casos asignados
        const todosCasos = await casoService.getAll(undefined, userFilter, undefined);

        // Casos activos (estatus = 'ABIERTO')
        const activos = todosCasos.filter(caso => caso.estatus === 'ABIERTO');
        setCasosActivos(activos.length);

        // Pendientes revisión (estatus = 'EN TRÁMITE' o casos sin acciones recientes)
        // Por ahora usaremos 'EN TRÁMITE' como pendientes de revisión
        const pendientes = todosCasos.filter(caso =>
          caso.estatus === 'EN TRÁMITE' || caso.estatus === 'EN PAUSA'
        );
        setPendientesRevision(pendientes.length);

        // Cerrados este mes
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const cerrados = todosCasos.filter(caso => {
          if (caso.estatus !== 'CERRADO') return false;
          if (!caso.fechaRecepcion) return false;

          // Si el caso tiene fecha de cierre, usar esa, sino usar fecha de recepción como aproximación
          const fechaCaso = new Date(caso.fechaRecepcion);
          return fechaCaso >= inicioMes && fechaCaso <= ahora;
        });
        setCerradosEsteMes(cerrados.length);
      } catch (error) {
        // Error silencioso - las estadísticas simplemente no se actualizarán
      } finally {
        setLoadingStats(false);
      }
    };

    loadCaseStats();
  }, [username, user]); // Agregar 'user' a las dependencias para que se ejecute cuando cambie

  // Cargar citas agendadas de los próximos 7 días
  useEffect(() => {
    if (!user && !username) {
      return;
    }

    const loadCitasSemana = async () => {
      setLoadingCitas(true);
      try {
        const puedeVerTodosLosCasos = user?.tipo === 'COORDINADOR' || user?.tipo === 'ADMINISTRADOR' || user?.tipo === 'PROFESOR';
        const currentUsername = user?.username || username;
        const userFilter = (currentUsername && !puedeVerTodosLosCasos) ? currentUsername : undefined;

        if (!currentUsername && !puedeVerTodosLosCasos) {
          setLoadingCitas(false);
          setCitasSemana([]);
          return;
        }

        // Calcular fechas de los próximos 7 días (desde hoy hasta 7 días adelante)
        const ahora = new Date();
        ahora.setHours(0, 0, 0, 0); // Normalizar a inicio del día
        const fechasSemana: Date[] = [];
        const citasPorDia: { fecha: Date; count: number }[] = [];

        // Inicializar array con los próximos 7 días (incluyendo hoy)
        for (let i = 0; i < 7; i++) {
          const fecha = new Date(ahora);
          fecha.setDate(ahora.getDate() + i);
          fecha.setHours(0, 0, 0, 0);
          fechasSemana.push(fecha);
          citasPorDia.push({ fecha, count: 0 });
        }

        // Calcular rango de fechas para filtrar encuentros
        const fechaInicio = new Date(ahora);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = new Date(ahora);
        fechaFin.setDate(ahora.getDate() + 6);
        fechaFin.setHours(23, 59, 59, 999);

        // Obtener todos los casos del usuario
        const todosCasos = await casoService.getAll(undefined, userFilter, undefined);

        // Función auxiliar para comparar fechas por día (ignorando horas)
        const esMismoDia = (fecha1: Date, fecha2: Date): boolean => {
          return fecha1.getFullYear() === fecha2.getFullYear() &&
            fecha1.getMonth() === fecha2.getMonth() &&
            fecha1.getDate() === fecha2.getDate();
        };

        // Función para verificar si una fecha está en el rango de los próximos 7 días
        const estaEnRango = (fecha: Date): boolean => {
          return fecha >= fechaInicio && fecha <= fechaFin;
        };

        // Obtener encuentros de todos los casos (procesar en lotes)
        const tamanoLote = 20;
        const casosAProcesar = todosCasos.slice(0, 100); // Procesar hasta 100 casos

        for (let i = 0; i < casosAProcesar.length; i += tamanoLote) {
          const lote = casosAProcesar.slice(i, i + tamanoLote);

          const promesas = lote.map(async (caso) => {
            try {
              const casoDetalle = await casoService.getById(caso.numCaso);
              return casoDetalle.encuentros || [];
            } catch (error) {
              return [];
            }
          });

          const resultados = await Promise.all(promesas);
          resultados.forEach((encuentros) => {
            // Procesar encuentros: contar fechaAtencion y fechaProxima si están en los próximos 7 días
            encuentros.forEach((encuentro: any) => {
              // Función helper para procesar una fecha
              const procesarFecha = (fechaString: string) => {
                if (!fechaString) return;

                let fechaEncuentro: Date | null = null;
                const partes = fechaString.split('-');
                if (partes.length === 3) {
                  const año = parseInt(partes[0], 10);
                  const mes = parseInt(partes[1], 10) - 1;
                  const dia = parseInt(partes[2], 10);
                  fechaEncuentro = new Date(año, mes, dia);
                } else {
                  fechaEncuentro = new Date(fechaString);
                }

                if (fechaEncuentro && !isNaN(fechaEncuentro.getTime()) && estaEnRango(fechaEncuentro)) {
                  // Buscar el día correspondiente en la semana
                  const indiceDia = citasPorDia.findIndex(item =>
                    esMismoDia(item.fecha, fechaEncuentro!)
                  );

                  if (indiceDia >= 0) {
                    citasPorDia[indiceDia].count++;
                  }
                }
              };

              // Contar fechaAtencion si está en los próximos 7 días
              if (encuentro.fechaAtencion) {
                procesarFecha(encuentro.fechaAtencion);
              }

              // Contar fechaProxima si está en los próximos 7 días (citas programadas)
              if (encuentro.fechaProxima) {
                procesarFecha(encuentro.fechaProxima);
              }
            });
          });
        }

        setCitasSemana(citasPorDia);
      } catch (error) {
        console.error('Error cargando citas:', error);
        setCitasSemana([]);
      } finally {
        setLoadingCitas(false);
      }
    };

    loadCitasSemana();
  }, [username, user]);

  // Cargar acciones pendientes
  useEffect(() => {
    if (!user && !username) {
      return;
    }

    const loadAccionesPendientes = async () => {
      setLoadingAccionesPendientes(true);
      try {
        const puedeVerTodosLosCasos = user?.tipoUsuario === 'COORDINADOR' || user?.tipoUsuario === 'ADMINISTRADOR' || user?.tipoUsuario === 'PROFESOR';
        const currentUsername = user?.username || username;
        const userFilter = (currentUsername && !puedeVerTodosLosCasos) ? currentUsername : undefined;

        if (!currentUsername && !puedeVerTodosLosCasos) {
          setLoadingAccionesPendientes(false);
          setAccionesPendientes([]);
          return;
        }

        // Obtener todos los casos del usuario
        const todosCasos = await casoService.getAll(undefined, userFilter, undefined);

        // Obtener acciones pendientes de todos los casos
        const acciones: Array<{
          idAccion: number;
          numCaso: string;
          titulo: string;
          descripcion?: string;
          fechaRegistro: string;
          nombreSolicitante?: string;
        }> = [];

        // Procesar casos en lotes para mejorar rendimiento
        const tamanoLote = 20;
        const casosAProcesar = todosCasos.slice(0, 50); // Limitar a 50 casos para mejor rendimiento

        for (let i = 0; i < casosAProcesar.length; i += tamanoLote) {
          const lote = casosAProcesar.slice(i, i + tamanoLote);

          const promesas = lote.map(async (caso) => {
            try {
              const casoDetalle = await casoService.getById(caso.numCaso);
              // Filtrar solo acciones pendientes (sin fechaEjecucion o fechaEjecucion vacía)
              const accionesPendientes = (casoDetalle.acciones || []).filter((accion: any) =>
                !accion.fechaEjecucion || accion.fechaEjecucion.trim() === ''
              );

              return accionesPendientes.map((accion: any) => ({
                idAccion: accion.idAccion,
                numCaso: caso.numCaso,
                titulo: accion.titulo,
                descripcion: accion.descripcion,
                fechaRegistro: accion.fechaRegistro,
                nombreSolicitante: caso.nombreSolicitante || ''
              }));
            } catch (error) {
              console.error(`Error cargando caso ${caso.numCaso}:`, error);
              return [];
            }
          });

          const resultados = await Promise.all(promesas);
          resultados.forEach(accionesCaso => {
            acciones.push(...accionesCaso);
          });
        }

        // Ordenar por fecha de registro (más recientes primero) y limitar a 4
        acciones.sort((a, b) => {
          const fechaA = new Date(a.fechaRegistro);
          const fechaB = new Date(b.fechaRegistro);
          return fechaB.getTime() - fechaA.getTime();
        });

        setAccionesPendientes(acciones.slice(0, 4)); // Solo mostrar las 4 más recientes
      } catch (error) {
        console.error('Error cargando acciones pendientes:', error);
        setAccionesPendientes([]);
      } finally {
        setLoadingAccionesPendientes(false);
      }
    };

    loadAccionesPendientes();
  }, [username, user]);

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
          onClick={() => navigate('/registro-caso')} // Navigate to RegistroCaso page
          className="bg-red-900 hover:bg-red-950 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
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
          <div className={`${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow`}>
            <div className={`w-12 h-12 ${isDark ? 'bg-red-800/70 text-white' : 'bg-red-50 text-red-900'} rounded-full flex items-center justify-center text-xl mb-3`}>
              <FontAwesomeIcon icon={faBriefcase} />
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {loadingStats ? '...' : casosActivos}
            </h3>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-500'}`}>Mis Casos Activos</p>
          </div>
          {/* Card 2 */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow`}>
            <div className={`w-12 h-12 ${isDark ? 'bg-yellow-800/70 text-yellow-100' : 'bg-yellow-50 text-yellow-600'} rounded-full flex items-center justify-center text-xl mb-3`}>
              <FontAwesomeIcon icon={faClock} />
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {loadingStats ? '...' : pendientesRevision}
            </h3>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-500'}`}>Pendientes Revisión</p>
          </div>
          {/* Card 3 */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow`}>
            <div className={`w-12 h-12 ${isDark ? 'bg-green-800/70 text-green-100' : 'bg-green-50 text-green-600'} rounded-full flex items-center justify-center text-xl mb-3`}>
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {loadingStats ? '...' : cerradosEsteMes}
            </h3>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-500'}`}>Cerrados este mes</p>
          </div>
        </div>

        {/* WIDGET B: Accesos Rápidos (1 columna) */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border flex flex-col justify-between`}>
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Accesos Rápidos</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/solicitantes?mode=create')}
              className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-all duration-200 group ${isDark
                ? 'hover:bg-red-900/50 text-white border border-transparent hover:border-red-900/50'
                : 'hover:bg-red-50 text-gray-700 hover:text-red-900 border border-transparent hover:border-red-100'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${isDark
                ? 'bg-red-900/70 group-hover:bg-red-900 text-white group-hover:scale-110'
                : 'bg-red-100 group-hover:bg-red-200 text-red-900 group-hover:scale-110'
                }`}>
                <FontAwesomeIcon icon={faUserPlus} className="text-base" />
              </div>
              <span className="font-medium text-sm">Registrar Solicitante</span>
            </button>
            <button
              onClick={() => navigate('/casos')}
              className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-all duration-200 group ${isDark
                ? 'hover:bg-red-900/50 text-white border border-transparent hover:border-red-900/50'
                : 'hover:bg-red-50 text-gray-700 hover:text-red-900 border border-transparent hover:border-red-100'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${isDark
                ? 'bg-red-900/70 group-hover:bg-red-900 text-white group-hover:scale-110'
                : 'bg-red-100 group-hover:bg-red-200 text-red-900 group-hover:scale-110'
                }`}>
                <FontAwesomeIcon icon={faSearch} className="text-base" />
              </div>
              <span className="font-medium text-sm">Buscar Caso</span>
            </button>
            <button
              onClick={() => navigate('/agenda')}
              className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-all duration-200 group ${isDark
                ? 'hover:bg-red-900/50 text-white border border-transparent hover:border-red-900/50'
                : 'hover:bg-red-50 text-gray-700 hover:text-red-900 border border-transparent hover:border-red-100'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${isDark
                ? 'bg-red-900/70 group-hover:bg-red-900 text-white group-hover:scale-110'
                : 'bg-red-100 group-hover:bg-red-200 text-red-900 group-hover:scale-110'
                }`}>
                <FontAwesomeIcon icon={faCalendarAlt} className="text-base" />
              </div>
              <span className="font-medium text-sm">Ver Agenda</span>
            </button>
          </div>
        </div>

        {/* WIDGET C: Acciones Pendientes (1 columna - Row Span 2) */}
        <div className={`md:col-span-1 md:row-span-2 ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-100'} rounded-xl shadow-sm border overflow-hidden flex flex-col h-full`}>
          <div className={`p-5 border-b ${isDark ? 'border-gray-700 bg-red-900/70' : 'border-gray-100 bg-gray-50/50'}`}>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Acciones Pendientes</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
            {loadingAccionesPendientes ? (
              <div className="flex justify-center items-center h-32">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-red-900' : 'border-red-900'}`}></div>
              </div>
            ) : accionesPendientes.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <p className="text-sm">No hay acciones pendientes</p>
              </div>
            ) : (
              accionesPendientes.map((accion, index) => {
                // Función helper para parsear fechas locales
                const parseLocalDate = (dateString: string): Date => {
                  const partes = dateString.split('-');
                  if (partes.length === 3) {
                    const año = parseInt(partes[0], 10);
                    const mes = parseInt(partes[1], 10) - 1;
                    const dia = parseInt(partes[2], 10);
                    return new Date(año, mes, dia);
                  }
                  return new Date(dateString);
                };

                const fechaRegistro = parseLocalDate(accion.fechaRegistro);


                const fechaCorta = fechaRegistro.toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short'
                });

                // Colores alternados para diferenciar acciones
                const colores = [
                  { border: isDark ? 'border-orange-500' : 'border-orange-400', bg: isDark ? 'bg-orange-900/30' : 'bg-orange-50/30', text: isDark ? 'text-orange-200' : 'text-orange-600' },
                  { border: isDark ? 'border-yellow-500' : 'border-yellow-400', bg: isDark ? 'bg-yellow-900/30' : 'bg-yellow-50/30', text: isDark ? 'text-yellow-200' : 'text-yellow-600' },
                  { border: isDark ? 'border-red-500' : 'border-red-400', bg: isDark ? 'bg-red-900/30' : 'bg-red-50/30', text: isDark ? 'text-red-200' : 'text-red-600' },
                  { border: isDark ? 'border-blue-500' : 'border-blue-400', bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50/30', text: isDark ? 'text-blue-200' : 'text-blue-600' },
                ];
                const color = colores[index % colores.length];

                return (
                  <div
                    key={`${accion.numCaso}-${accion.idAccion}`}
                    onClick={() => navigate(`/casos/${accion.numCaso}`)}
                    className={`pl-4 border-l-4 ${color.border} p-3 rounded-r-lg ${color.bg} cursor-pointer hover:opacity-80 transition-opacity`}
                  >
                    <p className={`text-xs font-bold mb-1 ${color.text} uppercase`}>{fechaCorta}</p>
                    <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{accion.titulo}</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Caso {accion.numCaso}{accion.nombreSolicitante ? ` - ${accion.nombreSolicitante}` : ''}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          <div className={`p-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} text-center`}>
            <button
              onClick={() => navigate('/agenda')}
              className={`text-xs font-semibold transition-colors ${isDark ? 'text-white hover:text-gray-200' : 'text-red-900 hover:text-red-700'}`}
            >
              Ver toda la agenda
            </button>
          </div>
        </div>

        {/* WIDGET D: Gráfico de Citas Agendadas - Próximos 7 Días */}
        <div className={`md:col-span-2 lg:col-span-3 ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-100'} p-6 rounded-xl shadow-sm border`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Citas Agendadas - Próximos 7 Días</h3>
          </div>

          {/* Gráfico de Barras */}
          {loadingCitas ? (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-red-900' : 'border-red-900'} mb-2`}></div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Cargando citas...</p>
              </div>
            </div>
          ) : citasSemana.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay citas agendadas para los próximos 7 días</p>
            </div>
          ) : (
            <div className="w-full">
              <div className="w-full h-48 flex items-end justify-between px-4 gap-2">
                {citasSemana.map((item, i) => {
                  const { fecha, count } = item;
                  const maxCitas = Math.max(...citasSemana.map(c => c.count), 1);
                  const height = maxCitas > 0 ? (count / maxCitas) * 100 : 0;

                  // Formatear fecha: día y mes
                  const diaDelMes = fecha.getDate();
                  const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
                  const fechaCompleta = fecha.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });

                  // Detectar si es hoy
                  const ahora = new Date();
                  ahora.setHours(0, 0, 0, 0);
                  const esHoy = fecha.toDateString() === ahora.toDateString();

                  // Determinar si es el día con más citas
                  const esMaximo = count === maxCitas && count > 0;

                  return (
                    <div key={i} className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                      {/* Número de citas encima de la barra */}
                      <div className={`text-xs font-semibold ${count > 0 ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
                        {count}
                      </div>

                      {/* Contenedor de la barra */}
                      <div className={`relative w-full ${isDark ? 'bg-gray-700/30' : 'bg-gray-100'} rounded-t-lg overflow-hidden h-40 flex items-end`}>
                        <div
                          style={{
                            height: `${height}%`,
                            minHeight: count > 0 ? '20px' : '0'
                          }}
                          className={`w-full rounded-t-lg transition-all duration-300 ${count > 0
                            ? esMaximo
                              ? esHoy
                                ? isDark ? 'bg-red-500' : 'bg-red-700'
                                : isDark ? 'bg-red-600' : 'bg-red-800'
                              : esHoy
                                ? isDark ? 'bg-red-700/80' : 'bg-red-600'
                                : isDark ? 'bg-red-800/70 group-hover:bg-red-800' : 'bg-red-400 group-hover:bg-red-500'
                            : ''
                            }`}
                          title={`${fechaCompleta}: ${count} cita${count !== 1 ? 's' : ''}`}
                        ></div>
                      </div>

                      {/* Etiqueta de fecha */}
                      <div className="flex flex-col items-center mt-1">
                        <span className={`text-xs font-medium ${esHoy ? (isDark ? 'font-bold text-white' : 'font-bold text-red-900') : (isDark ? 'text-white' : 'text-gray-700')}`}>
                          {diaDelMes} {mes}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </MainLayout>
  );
}

export default Home;
