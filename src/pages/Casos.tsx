import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faPlus } from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../components/layout/MainLayout';
import CaseCard from '../components/CaseCard';
import CasoRow from '../components/CasoRow';
import Button from '../components/common/Button';
import CustomSelect from '../components/common/CustomSelect'; // Importar CustomSelect
import Pagination from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import ViewToggle from '../components/common/ViewToggle';
import casoService from '../services/casoService';
import catalogoService from '../services/catalogoService';

import type { CasoSummary } from '../types/caso';
import type { AmbitoLegal, Semestre } from '../types/catalogo';

function CasosPage() {
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

  const buildHierarchyMap = (
    ambitos: AmbitoLegal[],
    map: Record<number, string> = {},
    parentPath: string = ''
  ) => {
    ambitos.forEach(ambito => {
      // Logic for "Sin Categoría/Subcategoría": 
      // If the description acts as a placeholder (starts with "Sin "), we might want to skip it in the path, 
      // BUT normally we just want the path. 
      // The backend code used strict checks. 
      // Let's implement a clean "Parent > Child" logic. 
      // If parentPath exists, append " > ".

      // Optional: Filter out "Sin ..." if you want cleaner UI, matching SmartAmbitoSelector style
      const label = ambito.descripcion.startsWith("Sin ") ? "" : ambito.descripcion;

      let currentPath = parentPath;
      if (label) {
        currentPath = parentPath ? `${parentPath} > ${label}` : label;
      }

      // Store the full path for this ID
      // If current label was empty (e.g. "Sin Categoría"), we might typically NOT show it as a leaf, 
      // but if this ID is referenced, we must show SOMETHING.
      // If "Sin Categoria" is the leaf, we probably want to show the parent path at least.
      map[ambito.id] = currentPath || ambito.descripcion; // Fallback to raw desc if path is empty

      if (ambito.children && ambito.children.length > 0) {
        buildHierarchyMap(ambito.children, map, currentPath);
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
          catalogoService.getSemestres()
        ]);
        setAmbitosLegales(buildHierarchyMap(ambitosData));
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
        const userFilter = onlyMyCases ? username : undefined;
        // Si el estatus es 'TODOS', mandamos undefined al service
        const statusFilter = selectedStatus === 'TODOS' ? undefined : selectedStatus;
        const terminoFilter = selectedSemestre === '' ? undefined : selectedSemestre;

        const data = await casoService.getAll(statusFilter, userFilter, terminoFilter);
        setCasos(data);
        setCurrentPage(1); // Reset page only when API data changes
      } catch (error) {
        console.error('Error al cargar casos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCasos();
  }, [selectedStatus, selectedSemestre, onlyMyCases, username]);

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
    ...semestres.map(s => ({ value: s.termino, label: s.nombre }))
  ];

  return (
    <MainLayout title="GESTIÓN DE CASOS">
      <div className="w-full mx-auto">

        {/* Controles de Filtros y Búsqueda */}
        <div className="bg-white p-4 border-b border-gray-200 mb-6">
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">

            {/* IZQUIERDA: Buscador */}
            <div className="w-full xl:w-1/3 min-w-[300px]">
              <SearchBar
                value={searchText}
                onChange={setSearchText}
                placeholder="Buscar por nombre, cédula o ID..."
              />
            </div>

            {/* CENTRO: Filtros (Agrupados) */}
            <div className="flex flex-wrap gap-2 items-center flex-1 justify-start xl:justify-start w-full">

              {/* View Toggle */}
              <div className="hidden md:block mr-2">
                <ViewToggle
                  viewMode={viewMode}
                  onToggle={setViewMode}
                />
              </div>

              {/* Ordenamiento */}
              <div className="w-40 md:w-48">
                <CustomSelect
                  value={sortOption}
                  options={sortOptions}
                  onChange={setSortOption}
                  placeholder="Ordenar por"
                />
              </div>

              {/* Semestre */}
              <div className="w-32 md:w-70">
                <CustomSelect
                  value={selectedSemestre}
                  options={semesterOptions}
                  onChange={setSelectedSemestre}
                  placeholder="Semestre"
                />
              </div>

              {/* Estatus */}
              <div className="w-32 md:w-40">
                <CustomSelect
                  value={selectedStatus}
                  options={statusOptions}
                  onChange={setSelectedStatus}
                  placeholder="Estatus"
                />
              </div>

              {/* Toggle Mis Casos (Opcional/Legacy Filter) */}
              <Button // Keeping this as a small filter toggle if needed, or removing if strictly adhering to "Search, Filters, Action". 
                // User didn't strictly say DELETE "Mis Casos", but grouped filters. I'll keep it as a filter button.
                variant={onlyMyCases ? 'secondary' : 'outline'}
                onClick={() => setOnlyMyCases(!onlyMyCases)}
                className="gap-2 px-3"
                title="Mis Casos"
              >
                <FontAwesomeIcon icon={faFilter} className={onlyMyCases ? "text-red-800" : "text-gray-400"} />
                <span className="hidden sm:inline">Mis Casos</span>
              </Button>
            </div>

            {/* DERECHA: Acción Principal */}
            <div className="w-full xl:w-auto flex justify-end">
              <Button
                variant="primary"
                onClick={() => navigate('/registro-caso')}
                className="bg-red-900 hover:bg-red-800 text-white font-medium px-6 py-2.5 rounded-md shadow-sm flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center"
              >
                <FontAwesomeIcon icon={faPlus} />
                Registrar Caso
              </Button>
            </div>

          </div>
        </div>

        {/* Resumen de Resultados */}
        {!loading && (
          <div className="mb-4 text-sm text-gray-600">
            Mostrando {casosActuales.length} de {casosOrdenados.length} casos encontrados
            {(selectedStatus !== 'TODOS' || selectedSemestre || onlyMyCases || searchText) &&
              <span className="ml-2 italic text-gray-500">(filtros activos)</span>
            }
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mb-4"></div>
              <p className="text-gray-600">Cargando casos...</p>
            </div>
          </div>
        ) : (
          <>
            {casosOrdenados.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No se encontraron casos con los criterios seleccionados.</p>
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
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caso</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Ver</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
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
