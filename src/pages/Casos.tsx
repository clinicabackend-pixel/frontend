import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faFilter, faPlus } from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../components/layout/MainLayout';
import CaseCard from '../components/CaseCard';
import CasoRow from '../components/CasoRow';
import Button from '../components/common/Button';
import CustomSelect from '../components/common/CustomSelect';
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import ViewToggle from '../components/common/ViewToggle';
import casoService from '../services/casoService';
import catalogoService from '../services/catalogoService';
import { reporteService } from '../services/reporteService';
import type { CasoSummary } from '../types/caso';
import type { AmbitoLegal, Semestre } from '../types/catalogo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function CasosPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const [casos, setCasos] = useState<CasoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<string>('fecha_desc'); // fecha_asc, fecha_desc, nombre_asc, nombre_desc

  // Catálogos
  const [ambitosLegales, setAmbitosLegales] = useState<Record<number, string>>({});
  const [semestres, setSemestres] = useState<Semestre[]>([]);

  // Filtros de API
  const [selectedStatus, setSelectedStatus] = useState<string>('ABIERTO');
  const [selectedSemestre, setSelectedSemestre] = useState<string>('');
  const [onlyMyCases, setOnlyMyCases] = useState<boolean>(true);

  // Ajustar onlyMyCases cuando el usuario se carga
  useEffect(() => {
    const esCoordinadorOAdmin = user?.tipo === 'COORDINADOR' || user?.tipo === 'ADMINISTRADOR';
    if (esCoordinadorOAdmin) {
      setOnlyMyCases(false); // COORDINADOR/ADMINISTRADOR ven todos los casos por defecto
    }
  }, [user]);

  const casosPerPage = 12;
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';

  const handleCasoClick = (numCaso: string) => {
    navigate(`/casos/${numCaso}`);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildAmbitoMap = (ambitos: AmbitoLegal[], map: Record<number, string> = {}) => {
    ambitos.forEach((ambito) => {
      map[ambito.id] = ambito.descripcion;
      if (ambito.children && ambito.children.length > 0) {
        buildAmbitoMap(ambito.children, map);
      }
    });
    return map;
  };

  // Cargar Catálogos Iniciales
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [ambitosData, semestresData] = await Promise.all([
          catalogoService.getAmbitosLegales(),
          catalogoService.getSemestres(),
        ]);
        setAmbitosLegales(buildAmbitoMap(ambitosData));
        setSemestres(semestresData);
      } catch (error) {
        console.error('Error cargando catálogos:', error);
      }
    };
    fetchCatalogos();
  }, []);

  // Cargar Casos cuando cambian los filtros
  useEffect(() => {
    const fetchCasos = async () => {
      setLoading(true);
      try {
        // Si el usuario es COORDINADOR o ADMINISTRADOR, siempre mostrar todos los casos
        // (ignorar el filtro onlyMyCases para estos roles)
        const esCoordinadorOAdmin = user?.tipo === 'COORDINADOR' || user?.tipo === 'ADMINISTRADOR';
        const userFilter = (onlyMyCases && !esCoordinadorOAdmin) ? username : undefined;
        // Si el estatus es 'TODOS', mandamos undefined al service
        const statusFilter = selectedStatus === 'TODOS' ? undefined : selectedStatus;
        const terminoFilter = selectedSemestre === '' ? undefined : selectedSemestre;

        console.log('Casos: Cargando casos con filtros:', {
          statusFilter,
          userFilter,
          terminoFilter,
          onlyMyCases,
          username,
          esCoordinadorOAdmin,
          userTipo: user?.tipo
        });

        const data = await casoService.getAll(statusFilter, userFilter, terminoFilter);
        console.log('Casos: Total casos obtenidos:', data.length);
        console.log('Casos: Primeros 3 casos:', data.slice(0, 3));
        setCasos(data);
        setCurrentPage(1); // Reset page only when API data changes
      } catch (error) {
        console.error('Error al cargar casos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCasos();
  }, [selectedStatus, selectedSemestre, onlyMyCases, username, user]);

  // Filtrado local por Buscador (Texto)
  const casosFiltrados = casos.filter((caso) => {
    if (!searchText) return true;
    const search = searchText.trim().toLowerCase();

    // Validaciones seguras contra nulos/undefined
    const matchNum = caso.numCaso?.toLowerCase().includes(search) || false;
    const matchNombre = caso.nombreSolicitante?.toLowerCase().includes(search) || false;
    const matchCedula = caso.cedula?.toLowerCase().includes(search) || false;
    const matchSintesis = caso.sintesis?.toLowerCase().includes(search) || false;

    // Búsqueda por Materia (resolviendo el ID con el mapa)
    const nombreMateria = ambitosLegales[caso.comAmbLegal] || '';
    const matchMateria = nombreMateria.toLowerCase().includes(search);

    return matchNum || matchNombre || matchCedula || matchSintesis || matchMateria;
  });

  // Ordenamiento
  const casosOrdenados = [...casosFiltrados].sort((a, b) => {
    if (sortOption === 'fecha_desc') {
      return new Date(b.fechaRecepcion).getTime() - new Date(a.fechaRecepcion).getTime();
    } else if (sortOption === 'fecha_asc') {
      return new Date(a.fechaRecepcion).getTime() - new Date(b.fechaRecepcion).getTime();
    } else if (sortOption === 'nombre_asc') {
      return (a.nombreSolicitante || '').localeCompare(b.nombreSolicitante || '');
    } else if (sortOption === 'nombre_desc') {
      return (b.nombreSolicitante || '').localeCompare(a.nombreSolicitante || '');
    }
    return 0;
  });


  const indexOfLastCaso = currentPage * casosPerPage;
  const indexOfFirstCaso = indexOfLastCaso - casosPerPage;
  const casosActuales = casosOrdenados.slice(indexOfFirstCaso, indexOfLastCaso);

  // Opciones para CustomSelect
  const statusOptions = [
    { value: 'ABIERTO', label: 'Abiertos' },
    { value: 'EN TRÁMITE', label: 'En Trámite' },
    { value: 'EN PAUSA', label: 'En Pausa' },
    { value: 'CERRADO', label: 'Cerrados' },
    { value: 'TODOS', label: 'Todos los Estatus' }
  ];

  const sortOptions = [
    { value: 'fecha_desc', label: 'Recientes primero' },
    { value: 'fecha_asc', label: 'Antiguos primero' },
    { value: 'nombre_asc', label: 'Solicitante (A-Z)' },
    { value: 'nombre_desc', label: 'Solicitante (Z-A)' }
  ];

  const semesterOptions = [
    { value: '', label: 'Todos los Semestres' },
    ...semestres.map((s) => ({ value: s.termino, label: s.nombre })),
  ];

  return (
    <MainLayout title="GESTIÓN DE CASOS">
      <div className="w-full mx-auto">
        {/* Controles de Filtros y Búsqueda */}
        <div className={`${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-sm mb-6 border`}>
          <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
            {/* Buscador de Texto */}
            <div className="w-full lg:w-64 xl:w-80">
              <SearchBar value={searchText} onChange={setSearchText} placeholder="Buscar..." />
            </div>

            {/* Filtros Dropdowns y Toggles */}
            <div className="flex flex-wrap gap-2 items-center justify-end">
              {/* View Toggle */}
              <div className="hidden lg:flex">
                <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
              </div>

              {/* Ordenamiento - CustomSelect */}
              <div className="w-36 xl:w-40">
                <CustomSelect
                  value={sortOption}
                  options={sortOptions}
                  onChange={setSortOption}
                  placeholder="Ordenar"
                />
              </div>

              {/* Filtro Semestre - CustomSelect */}
              <div className="w-36 xl:w-40">
                <CustomSelect
                  value={selectedSemestre}
                  options={semesterOptions}
                  onChange={setSelectedSemestre}
                  placeholder="Semestre"
                />
              </div>

              {/* Filtro Estatus - CustomSelect */}
              <div className="w-36 xl:w-40">
                <CustomSelect
                  value={selectedStatus}
                  options={statusOptions}
                  onChange={setSelectedStatus}
                  placeholder="Estatus"
                />
              </div>

              {/* Toggle Mis Casos */}
              <Button
                variant={onlyMyCases ? 'primary' : 'outline'}
                onClick={() => setOnlyMyCases(!onlyMyCases)}
                className="gap-1.5 px-3"
                icon={faFilter}
              >
                <span className="hidden xl:inline">{onlyMyCases ? 'Mis Casos' : 'Todos'}</span>
                <span className="xl:hidden">{onlyMyCases ? 'Míos' : 'Todo'}</span>
              </Button>

              {/* Botón Registrar Caso */}
              <Button
                variant="primary"
                onClick={() => navigate('/registro-caso')}
                className="gap-1.5 px-3"
                icon={faPlus}
              >
                <span className="hidden md:inline">Registrar</span>
              </Button>

              {/* Botón Exportar Reporte General */}
              <button
                onClick={() => reporteService.downloadReporteGeneral()}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
                title="Descargar Reporte General de Casos"
              >
                <FontAwesomeIcon icon={faFileExcel} />
                <span className="hidden xl:inline">Reporte</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de Resultados */}
        {!loading && (
          <div className={`mb-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Mostrando {casosActuales.length} de {casosOrdenados.length} casos encontrados
            {(selectedStatus !== 'TODOS' || selectedSemestre || onlyMyCases || searchText) && (
              <span className={`ml-2 italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>(filtros activos)</span>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-red-700' : 'border-red-900'} mb-4`}></div>
              <p className={isDark ? 'text-white' : 'text-black'}>Cargando casos...</p>
            </div>
          </div>
        ) : (
          <>
            {casosOrdenados.length === 0 ? (
              <div className={`text-center py-16 ${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-300'} rounded-lg border border-dashed`}>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-500'} text-lg`}>
                  No se encontraron casos con los criterios seleccionados.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchText('');
                    setSelectedStatus('TODOS');
                    setSelectedSemestre('');
                    setOnlyMyCases(false);
                    setSortOption('fecha_desc');
                  }}
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <>
                {viewMode === 'list' ? (
                  <div className={`${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'} shadow overflow-hidden sm:rounded-lg border`}>
                    <table className="min-w-full divide-y divide-border">
                      <thead className={isDark ? 'bg-red-950/30' : 'bg-gray-50'}>
                        <tr>
                          <th
                            scope="col"
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}
                          >
                            Caso
                          </th>
                          <th
                            scope="col"
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}
                          >
                            Solicitante
                          </th>
                          <th
                            scope="col"
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}
                          >
                            Materia
                          </th>
                          <th
                            scope="col"
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}
                          >
                            Fecha
                          </th>
                          <th
                            scope="col"
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}
                          >
                            Estatus
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Ver</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`${isDark ? 'bg-[#630000]' : 'bg-white'} divide-y divide-border`}>
                        {casosActuales.map((caso) => (
                          <CasoRow
                            key={caso.numCaso}
                            caso={caso}
                            materia={ambitosLegales[caso.comAmbLegal] || 'DESCONOCIDO'}
                            onClick={() => handleCasoClick(caso.numCaso)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    className="grid gap-6 mb-8"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
                  >
                    {casosActuales.map((caso) => (
                      <CaseCard
                        key={caso.numCaso}
                        numCaso={caso.numCaso}
                        cedula={caso.cedula}
                        nombre={caso.nombreSolicitante}
                        materia={ambitosLegales[caso.comAmbLegal] || 'DESCONOCIDO'}
                        sintesis={caso.sintesis}
                        fecha={caso.fechaRecepcion}
                        estatus={caso.estatus}
                        onClick={() => handleCasoClick(caso.numCaso)}
                        usuarios_asignados={[]}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              itemsPerPage={casosPerPage}
              totalItems={casosOrdenados.length}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default CasosPage;
