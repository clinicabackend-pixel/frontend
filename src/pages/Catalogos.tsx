import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faTags,
    faGraduationCap,
    faBriefcase,
    faHouseUser,
    faCheckCircle,
    faLayerGroup,
    faGavel, // For Tribunales
    faCalendarAlt, // For Semestres
    faRing, // For Estado Civil
    faBuilding, // For Centros
    faBalanceScale, // For Ambitos Legales
    faFolder,
    faFolderOpen,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import CustomInput from '../components/common/CustomInput';
import catalogoService from '../services/catalogoService';
import Loader from '../components/common/Loader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type {
    TipoViviendaResponse,
    Estado,
    Municipio,
    Parroquia,
    AmbitoLegal
} from '../types/catalogo';

type CatalogType = 'NIVEL_EDUCATIVO' | 'CONDICION_LABORAL' | 'CONDICION_ACTIVIDAD' | 'VIVIENDA' | 'ESTADO_CIVIL' | 'TRIBUNAL' | 'SEMESTRE' | 'CENTRO' | 'AMBITO_LEGAL';

const TreeNode = ({ node, isDark, onAddChild }: { node: AmbitoLegal; isDark: boolean; onAddChild: (node: AmbitoLegal) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div key={`${node.tipo}-${node.id}`} className="ml-4 border-l pl-4 border-gray-300 dark:border-gray-700">
            <div className="flex items-center gap-2 py-2 group">
                <div
                    className="cursor-pointer"
                    onClick={() => hasChildren && setIsOpen(!isOpen)}
                >
                    {hasChildren ? (
                        <FontAwesomeIcon
                            icon={isOpen ? faFolderOpen : faFolder}
                            className="text-yellow-500"
                        />
                    ) : (
                        <FontAwesomeIcon
                            icon={node.tipo === 'AMBITO' ? faFileAlt : faFolder}
                            className={node.tipo === 'AMBITO' ? "text-gray-400" : "text-yellow-500"}
                        />
                    )}
                </div>

                <span
                    className={`text-sm cursor-pointer select-none ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                    onClick={() => hasChildren && setIsOpen(!isOpen)}
                >
                    <span className="text-xs font-bold mr-2 opacity-70">[{node.tipo}]</span>
                    {node.descripcion}
                </span>

                {node.tipo !== 'AMBITO' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddChild(node);
                        }}
                        className="ml-auto opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-blue-500 transition-opacity"
                        title="Agregar Sub-elemento"
                    >
                        <FontAwesomeIcon icon={faPlus} size="xs" />
                    </button>
                )}
            </div>
            {hasChildren && isOpen && (
                <div>
                    {node.children!.map(child => (
                        <TreeNode
                            key={`${child.tipo}-${child.id}`}
                            node={child}
                            isDark={isDark}
                            onAddChild={onAddChild}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export function Catalogos() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<CatalogType>('NIVEL_EDUCATIVO');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    // Specific Form State
    const [tribunalForm, setTribunalForm] = useState({ nombre: '', materia: '', instancia: '', ubicacion: '' });
    const [semestreForm, setSemestreForm] = useState({ termino: '', nombre: '', fechaInicio: '', fechaFin: '' });
    const [centroForm, setCentroForm] = useState({ nombre: '', abreviatura: '', idEstado: 0, idMunicipio: 0, idParroquia: 0 });

    // Geographic Data State
    const [estados, setEstados] = useState<Estado[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [parroquias, setParroquias] = useState<Parroquia[]>([]);

    useEffect(() => {
        if (activeTab === 'CENTRO' && showModal) {
            catalogoService.getEstados().then(setEstados).catch(console.error);
        }
    }, [activeTab, showModal]);

    useEffect(() => {
        if (centroForm.idEstado) {
            catalogoService.getMunicipios(centroForm.idEstado).then(setMunicipios).catch(console.error);
        } else {
            setMunicipios([]);
            setParroquias([]);
        }
    }, [centroForm.idEstado]);

    // For Legal Scope Tree
    const [ambitoData, setAmbitoData] = useState<AmbitoLegal[]>([]);
    const [selectedNode, setSelectedNode] = useState<{ id: number; tipo: string; nombre: string } | null>(null);

    useEffect(() => {
        if (centroForm.idMunicipio) {
            catalogoService.getParroquias(centroForm.idMunicipio).then(setParroquias).catch(console.error);
        } else {
            setParroquias([]);
        }
    }, [centroForm.idMunicipio]);

    // For Housing which has categories
    const [housingData, setHousingData] = useState<TipoViviendaResponse[]>([]);
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

    // Verificar permisos de acceso
    useEffect(() => {
        if (user && user.tipoUsuario !== 'COORDINADOR' && user.tipoUsuario !== 'ADMINISTRADOR') {
            navigate('/home');
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchCatalogData();
    }, [activeTab]);

    const fetchCatalogData = async () => {
        setLoading(true);
        try {
            let data;
            switch (activeTab) {
                case 'NIVEL_EDUCATIVO':
                    data = await catalogoService.getNivelesEducativos();
                    setItems(data);
                    break;
                case 'CONDICION_LABORAL':
                    data = await catalogoService.getCondicionesLaborales();
                    setItems(data);
                    break;
                case 'CONDICION_ACTIVIDAD':
                    data = await catalogoService.getCondicionesActividad();
                    setItems(data);
                    break;
                case 'VIVIENDA':
                    data = await catalogoService.getViviendas();
                    setHousingData(data);
                    setItems([]); // Handled differently
                    break;
                case 'ESTADO_CIVIL':
                    data = await catalogoService.getEstadosCiviles();
                    setItems(data);
                    break;
                case 'TRIBUNAL':
                    data = await catalogoService.getTribunales();
                    setItems(data);
                    break;
                case 'SEMESTRE':
                    data = await catalogoService.getSemestres();
                    setItems(data);
                    break;
                case 'CENTRO':
                    data = await catalogoService.getCentros();
                    setItems(data);
                    break;
                case 'AMBITO_LEGAL':
                    data = await catalogoService.getAmbitosLegales();
                    // AmbitoLegal service usually returns a flat list or tree? 
                    // If flat, we might need to process it, but let's assume the service/backend returns a tree or we structure it here.
                    // Based on types, it has 'children'.
                    setAmbitoData(data);
                    setItems([]); // Handled differently
                    break;
            }
        } catch (error) {
            console.error("Error fetching catalog:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newItemName.trim()) return;
        try {
            switch (activeTab) {
                case 'NIVEL_EDUCATIVO':
                    if (!newItemName.trim()) return;
                    await catalogoService.createNivelEducativo(newItemName);
                    break;
                case 'CONDICION_LABORAL':
                    if (!newItemName.trim()) return;
                    await catalogoService.createCondicionLaboral(newItemName);
                    break;
                case 'CONDICION_ACTIVIDAD':
                    if (!newItemName.trim()) return;
                    await catalogoService.createCondicionActividad(newItemName);
                    break;
                case 'VIVIENDA':
                    if (!newItemName.trim()) return;
                    if (selectedParentId) {
                        await catalogoService.createVivienda(selectedParentId, newItemName);
                    } else {
                        await catalogoService.createTipoVivienda(newItemName);
                    }
                    break;
                case 'ESTADO_CIVIL':
                    if (!newItemName.trim()) return;
                    await catalogoService.createEstadoCivil(newItemName);
                    break;
                case 'TRIBUNAL':
                    await catalogoService.createTribunal(tribunalForm);
                    break;
                case 'SEMESTRE':
                    await catalogoService.createSemestre(semestreForm);
                    break;
                case 'CENTRO':
                    await catalogoService.createCentro({
                        nombre: centroForm.nombre,
                        abreviatura: centroForm.abreviatura,
                        idParroquia: centroForm.idParroquia
                    });
                    break;
                case 'AMBITO_LEGAL':
                    if (!newItemName.trim()) return;
                    if (!selectedNode) {
                        // Level 1: Materia
                        await catalogoService.createMateria(newItemName);
                    } else if (selectedNode.tipo === 'MATERIA') {
                        // Level 2: Categoria
                        await catalogoService.createCategoria(newItemName, selectedNode.id);
                    } else if (selectedNode.tipo === 'CATEGORIA') {
                        // Level 3: Subcategoria
                        await catalogoService.createSubcategoria(newItemName, selectedNode.id);
                    } else if (selectedNode.tipo === 'SUBCATEGORIA') {
                        // Level 4: Ambito
                        await catalogoService.createAmbito(newItemName, selectedNode.id);
                    }
                    break;
            }
            setShowModal(false);
            setNewItemName('');
            setTribunalForm({ nombre: '', materia: '', instancia: '', ubicacion: '' });
            setSemestreForm({ termino: '', nombre: '', fechaInicio: '', fechaFin: '' });
            setCentroForm({ nombre: '', abreviatura: '', idEstado: 0, idMunicipio: 0, idParroquia: 0 });
            // Keep selectedNode or clear it? Better clear to avoid confusion.
            // setSelectedNode(null); 
            fetchCatalogData();
            alert('Elemento creado exitosamente');
        } catch (error) {
            console.error("Error creating item:", error);
            alert('Error al crear elemento');
        }
    };

    const handleToggleStatus = async (item: any, parentId?: number) => {
        const newStatus = item.estatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

        // Optimistic update: actualizar el estado local inmediatamente
        if (activeTab === 'VIVIENDA' && parentId) {
            setHousingData(prevData =>
                prevData.map(type =>
                    type.id === parentId
                        ? {
                            ...type,
                            categorias: type.categorias.map(cat =>
                                cat.id === item.id ? { ...cat, estatus: newStatus } : cat
                            )
                        }
                        : type
                )
            );
        } else {
            setItems(prevItems =>
                prevItems.map(prevItem =>
                    prevItem.id === item.id ? { ...prevItem, estatus: newStatus } : prevItem
                )
            );
        }

        try {
            switch (activeTab) {
                case 'NIVEL_EDUCATIVO':
                    await catalogoService.updateNivelEducativoStatus(item.id, newStatus);
                    break;
                case 'CONDICION_LABORAL':
                    await catalogoService.updateCondicionLaboralStatus(item.id, newStatus);
                    break;
                case 'CONDICION_ACTIVIDAD':
                    await catalogoService.updateCondicionActividadStatus(item.id, newStatus);
                    break;
                case 'VIVIENDA':
                    if (parentId) {
                        await catalogoService.updateCategoriaViviendaStatus(parentId, item.id, newStatus);
                    }
                    break;
                case 'ESTADO_CIVIL':
                    await catalogoService.updateEstadoCivilStatus(item.id, newStatus);
                    break;
                case 'TRIBUNAL':
                    await catalogoService.updateTribunalStatus(item.id, newStatus);
                    break;
            }
            // No recargamos los datos, ya actualizamos el estado local
        } catch (error) {
            console.error("Error updating status:", error);
            // Revertir el cambio optimista en caso de error
            if (activeTab === 'VIVIENDA' && parentId) {
                setHousingData(prevData =>
                    prevData.map(type =>
                        type.id === parentId
                            ? {
                                ...type,
                                categorias: type.categorias.map(cat =>
                                    cat.id === item.id ? { ...cat, estatus: item.estatus } : cat
                                )
                            }
                            : type
                    )
                );
            } else {
                setItems(prevItems =>
                    prevItems.map(prevItem =>
                        prevItem.id === item.id ? { ...prevItem, estatus: item.estatus } : prevItem
                    )
                );
            }
            alert('Error al actualizar estatus');
        }
    };

    const tabs = [
        { id: 'NIVEL_EDUCATIVO', label: 'Niveles Educativos', icon: faGraduationCap },
        { id: 'CONDICION_LABORAL', label: 'Cond. Laborales', icon: faBriefcase },
        { id: 'CONDICION_ACTIVIDAD', label: 'Cond. Actividad', icon: faCheckCircle },
        { id: 'VIVIENDA', label: 'Tipos de Vivienda', icon: faHouseUser },
        { id: 'ESTADO_CIVIL', label: 'Estado Civil', icon: faRing },
        { id: 'TRIBUNAL', label: 'Tribunales', icon: faGavel },
        { id: 'SEMESTRE', label: 'Semestres', icon: faCalendarAlt },
        { id: 'CENTRO', label: 'Centros / Sedes', icon: faBuilding },
        { id: 'AMBITO_LEGAL', label: 'Ámbito Legal', icon: faBalanceScale },
    ];

    return (
        <MainLayout title="GESTIÓN DE CATÁLOGOS">
            <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-6 animate-fade-in-up">

                {/* Sidebar / Tabs */}
                <div className={`w-full md:w-64 rounded-lg shadow-sm border h-fit ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`p-4 border-b rounded-t-lg ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
                        <h2 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                            <FontAwesomeIcon icon={faTags} className={isDark ? 'text-white' : 'text-red-900'} />
                            Catálogos
                        </h2>
                    </div>
                    <nav className="p-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as CatalogType)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors mb-1
                                    ${activeTab === tab.id
                                        ? isDark
                                            ? 'bg-gray-700 text-white border border-gray-700 shadow-xs'
                                            : 'bg-red-50 text-red-900 border border-red-100 shadow-xs'
                                        : isDark
                                            ? 'text-white hover:bg-gray-700 hover:text-white'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <FontAwesomeIcon icon={tab.icon} className={`w-5 ${activeTab === tab.id ? (isDark ? 'text-white' : 'text-red-700') : (isDark ? 'text-white' : 'text-gray-400')}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className={`flex-1 rounded-lg shadow-sm border min-h-[500px] flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        <Button
                            onClick={() => {
                                setSelectedParentId(null);
                                setShowModal(true);
                            }}
                            icon={faPlus}
                            variant="primary"
                            size="sm"
                        >
                            Nuevo Registro
                        </Button>
                    </div>

                    <div className="p-6 flex-1">
                        {loading ? (
                            <Loader text="Cargando catálogo..." isDark={isDark} />
                        ) : (
                            <>
                                {activeTab === 'VIVIENDA' ? (
                                    <div className="space-y-6">
                                        {housingData.map(type => (
                                            <div key={type.id} className={`border rounded-lg overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                                <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faLayerGroup} className={isDark ? 'text-gray-400' : 'text-gray-400'} />
                                                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{type.nombre}</h3>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={faPlus}
                                                        isDark={isDark}
                                                        onClick={() => {
                                                            setSelectedParentId(type.id);
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        Agregar Categoría
                                                    </Button>
                                                </div>
                                                <ul className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                                                    {type.categorias.length > 0 ? type.categorias.map(cat => (
                                                        <li key={cat.id} className={`px-4 py-3 flex justify-between items-center transition-colors ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                                                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{cat.descripcion}</span>
                                                            <StatusToggle
                                                                isActive={cat.estatus === 'ACTIVO'}
                                                                onClick={() => handleToggleStatus({ ...cat, estatus: cat.estatus || 'ACTIVO' }, type.id)}
                                                            />
                                                        </li>
                                                    )) : (
                                                        <li className={`px-4 py-3 text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>No hay categorías registradas.</li>
                                                    )}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                    // ...existing Housing code...
                                ) : activeTab === 'AMBITO_LEGAL' ? (
                                    <div className={`p-4 rounded-lg border overflow-x-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <div className="flex justify-between mb-4">
                                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Jerarquía del Sistema Legal</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                isDark={isDark}
                                                onClick={() => { setSelectedNode(null); setShowModal(true); }}
                                                icon={faPlus}
                                            >
                                                Nueva Materia (Raíz)
                                            </Button>
                                        </div>
                                        <div className="space-y-1">
                                            {ambitoData.map(node => (
                                                <TreeNode
                                                    key={`${node.tipo}-${node.id}`}
                                                    node={node}
                                                    isDark={isDark}
                                                    onAddChild={(n) => {
                                                        setSelectedNode({ id: n.id, tipo: n.tipo, nombre: n.descripcion });
                                                        setShowModal(true);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <table className={`min-w-full ${isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}`}>
                                            <thead className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                                                <tr>
                                                    {activeTab === 'SEMESTRE' ? (
                                                        <>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Término</th>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Nombre</th>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Inicio</th>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Fin</th>
                                                        </>
                                                    ) : activeTab === 'CENTRO' ? (
                                                        <>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>ID</th>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Nombre</th>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Parroquia (ID)</th>
                                                        </>
                                                    ) : activeTab === 'TRIBUNAL' ? (
                                                        <>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>ID</th>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Nombre</th>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Materia</th>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Ubicación</th>
                                                            <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Estatus</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>ID</th>
                                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Nombre</th>
                                                            <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Estatus</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className={isDark ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}>
                                                {items.length > 0 ? items.map((item) => (
                                                    <tr key={item.id || item.termino} className={isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                                                        {activeTab === 'SEMESTRE' ? (
                                                            <>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{item.termino}</td>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.nombre}</td>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{item.fechaInicio}</td>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{item.fechaFin}</td>
                                                            </>
                                                        ) : activeTab === 'CENTRO' ? (
                                                            <>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm w-24 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>#{item.idCentro}</td>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.nombreCentro}</td>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{item.idParroquia}</td>
                                                            </>
                                                        ) : activeTab === 'TRIBUNAL' ? (
                                                            <>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm w-24 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>#{item.id}</td>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.nombre}</td>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{item.materia}</td>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{item.ubicacion}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                    <div className="flex justify-end">
                                                                        <StatusToggle
                                                                            isActive={item.estatus === 'ACTIVO'}
                                                                            onClick={() => handleToggleStatus(item)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm w-24 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>#{item.id}</td>
                                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.nombre}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                    <div className="flex justify-end">
                                                                        <StatusToggle
                                                                            isActive={item.estatus === 'ACTIVO'}
                                                                            onClick={() => handleToggleStatus(item)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={activeTab === 'TRIBUNAL' ? 5 : activeTab === 'SEMESTRE' ? 4 : 3} className={`px-6 py-8 text-center text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            No hay registros disponibles.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Crear */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setNewItemName(''); setSelectedParentId(null); }}
                title={`Nuevo registro - ${activeTab === 'VIVIENDA' && selectedParentId ? 'Categoría' : 'Elemento'}`}
                isDark={isDark}
            >
                <div className="space-y-4">
                    <p className="text-sm mb-2 text-gray-700">
                        {activeTab === 'AMBITO_LEGAL' ? (
                            <span>
                                {selectedNode ? (
                                    <>Agregando sub-elemento a: <strong className="text-gray-900">{selectedNode.tipo} - {selectedNode.nombre}</strong></>
                                ) : (
                                    <>Creando nueva <strong className="text-gray-900">Materia (Raíz)</strong></>
                                )}
                            </span>
                        ) : (
                            <span>Ingrese los datos para el nuevo registro en <strong className="text-gray-900">{tabs.find(t => t.id === activeTab)?.label}</strong>.</span>
                        )}
                    </p>

                    {activeTab === 'TRIBUNAL' ? (
                        <>
                            <CustomInput
                                name="nombre"
                                label="Nombre del Tribunal"
                                value={tribunalForm.nombre}
                                onChange={(e) => setTribunalForm({ ...tribunalForm, nombre: e.target.value })}
                                placeholder="Ej. Tribunal Primero de Municipio"
                                isDark={isDark}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <CustomInput
                                    name="materia"
                                    label="Materia"
                                    value={tribunalForm.materia}
                                    onChange={(e) => setTribunalForm({ ...tribunalForm, materia: e.target.value })}
                                    placeholder="Ej. Civil, Penal"
                                    isDark={isDark}
                                />
                                <CustomInput
                                    name="instancia"
                                    label="Instancia"
                                    value={tribunalForm.instancia}
                                    onChange={(e) => setTribunalForm({ ...tribunalForm, instancia: e.target.value })}
                                    placeholder="Ej. Primera Instancia"
                                    isDark={isDark}
                                />
                            </div>
                            <CustomInput
                                name="ubicacion"
                                label="Ubicación"
                                value={tribunalForm.ubicacion}
                                onChange={(e) => setTribunalForm({ ...tribunalForm, ubicacion: e.target.value })}
                                placeholder="Ej. Palacio de Justicia, Piso 2"
                                isDark={isDark}
                            />
                        </>
                    ) : activeTab === 'SEMESTRE' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <CustomInput
                                    name="termino"
                                    label="Término (Código)"
                                    value={semestreForm.termino}
                                    onChange={(e) => setSemestreForm({ ...semestreForm, termino: e.target.value })}
                                    placeholder="Ej. 2024-01"
                                    isDark={isDark}
                                />
                                <CustomInput
                                    name="nombre"
                                    label="Nombre Descriptivo"
                                    value={semestreForm.nombre}
                                    onChange={(e) => setSemestreForm({ ...semestreForm, nombre: e.target.value })}
                                    placeholder="Ej. Primer Semestre 2024"
                                    isDark={isDark}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Fecha Inicio</label>
                                    <input
                                        type="date"
                                        className={`w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-red-500 focus:outline-none transition-colors ${isDark
                                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                            }`}
                                        value={semestreForm.fechaInicio}
                                        onChange={(e) => setSemestreForm({ ...semestreForm, fechaInicio: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Fecha Fin</label>
                                    <input
                                        type="date"
                                        className={`w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-red-500 focus:outline-none transition-colors ${isDark
                                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                            }`}
                                        value={semestreForm.fechaFin}
                                        onChange={(e) => setSemestreForm({ ...semestreForm, fechaFin: e.target.value })}
                                    />
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'CENTRO' ? (
                        <>
                            <CustomInput
                                name="nombre"
                                label="Nombre del Centro / Sede"
                                value={centroForm.nombre}
                                onChange={(e) => setCentroForm({ ...centroForm, nombre: e.target.value })}
                                placeholder="Ej. Sede Principal"
                                isDark={isDark}
                            />
                            <CustomInput
                                name="abreviatura"
                                label="Abreviatura"
                                value={centroForm.abreviatura}
                                onChange={(e) => setCentroForm({ ...centroForm, abreviatura: e.target.value })}
                                placeholder="Ej. SP"
                                isDark={isDark}
                            />
                            <div className="space-y-3">
                                <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ubicación Geográfica</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Estado</label>
                                        <select
                                            className="w-full p-2 rounded border bg-white dark:bg-gray-800"
                                            value={centroForm.idEstado}
                                            onChange={(e) => setCentroForm({ ...centroForm, idEstado: Number(e.target.value), idMunicipio: 0, idParroquia: 0 })}
                                        >
                                            <option value={0}>-- Seleccione --</option>
                                            {estados.map(e => <option key={e.idEstado} value={e.idEstado}>{e.nombreEstado}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Municipio</label>
                                        <select
                                            className="w-full p-2 rounded border bg-white dark:bg-gray-800"
                                            value={centroForm.idMunicipio}
                                            disabled={!centroForm.idEstado}
                                            onChange={(e) => setCentroForm({ ...centroForm, idMunicipio: Number(e.target.value), idParroquia: 0 })}
                                        >
                                            <option value={0}>-- Seleccione --</option>
                                            {municipios.map(m => <option key={m.idMunicipio} value={m.idMunicipio}>{m.nombreMunicipio}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Parroquia</label>
                                        <select
                                            className="w-full p-2 rounded border bg-white dark:bg-gray-800"
                                            value={centroForm.idParroquia}
                                            disabled={!centroForm.idMunicipio}
                                            onChange={(e) => setCentroForm({ ...centroForm, idParroquia: Number(e.target.value) })}
                                        >
                                            <option value={0}>-- Seleccione --</option>
                                            {parroquias.map(p => <option key={p.idParroquia} value={p.idParroquia}>{p.nombreParroquia}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <CustomInput
                            name="itemName"
                            label="Nombre / Descripción"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Ej. Nuevo Registro"
                            isDark={isDark}
                        />
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" isDark={isDark} onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreate}>Guardar</Button>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
}

function StatusToggle({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${isActive ? 'bg-green-500' : 'bg-gray-200'}`}
        >
            <span
                className={`${isActive ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
        </button>
    );
}

export default Catalogos;
