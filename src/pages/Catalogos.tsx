import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faTags,
    faGraduationCap,
    faBriefcase,
    faHouseUser,
    faCheckCircle,
    faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import CustomInput from '../components/common/CustomInput';
import catalogoService from '../services/catalogoService';
import Loader from '../components/common/Loader';
import { useTheme } from '../context/ThemeContext';
import type {
    TipoViviendaResponse
} from '../types/catalogo';

type CatalogType = 'NIVEL_EDUCATIVO' | 'CONDICION_LABORAL' | 'CONDICION_ACTIVIDAD' | 'VIVIENDA';

export function Catalogos() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<CatalogType>('NIVEL_EDUCATIVO');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    // For Housing which has categories
    const [housingData, setHousingData] = useState<TipoViviendaResponse[]>([]);
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

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
                    await catalogoService.createNivelEducativo(newItemName);
                    break;
                case 'CONDICION_LABORAL':
                    await catalogoService.createCondicionLaboral(newItemName);
                    break;
                case 'CONDICION_ACTIVIDAD':
                    await catalogoService.createCondicionActividad(newItemName);
                    break;
                case 'VIVIENDA':
                    if (selectedParentId) {
                        // Creating category under type
                        await catalogoService.createVivienda(selectedParentId, newItemName);
                    } else {
                        // Creating new Housing Type
                        await catalogoService.createTipoVivienda(newItemName);
                    }
                    break;
            }
            setShowModal(false);
            setNewItemName('');
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
                        // Correct params for backend: updateCategoriaViviendaStatus(idTipo, idCat, estatus)
                        // item.id is category ID. parentId is Type ID.
                        await catalogoService.updateCategoriaViviendaStatus(parentId, item.id, newStatus);
                    }
                    // Currently no endpoint to toggle status of Housing Type itself, assuming always active or handled differently?
                    // Checked service: updateCategoriaViviendaStatus exists. No updateTipoViviendaStatus.
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
    ];

    return (
        <MainLayout title="GESTIÓN DE CATÁLOGOS">
            <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-6 animate-fade-in-up">

                {/* Sidebar / Tabs */}
                <div className={`w-full md:w-64 rounded-lg shadow-sm border h-fit ${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'}`}>
                    <div className={`p-4 border-b rounded-t-lg ${isDark ? 'border-red-800/50 bg-red-950/30' : 'border-gray-100 bg-gray-50'}`}>
                        <h2 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                            <FontAwesomeIcon icon={faTags} className={isDark ? 'text-red-400' : 'text-red-900'} />
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
                                            ? 'bg-red-800/50 text-white border border-red-700 shadow-xs'
                                            : 'bg-red-50 text-red-900 border border-red-100 shadow-xs'
                                        : isDark
                                            ? 'text-gray-300 hover:bg-red-800/50 hover:text-white'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <FontAwesomeIcon icon={tab.icon} className={`w-5 ${activeTab === tab.id ? (isDark ? 'text-red-400' : 'text-red-700') : (isDark ? 'text-gray-400' : 'text-gray-400')}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className={`flex-1 rounded-lg shadow-sm border min-h-[500px] flex flex-col ${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'}`}>
                    <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-red-800/50' : 'border-gray-100'}`}>
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
                                            <div key={type.id} className={`border rounded-lg overflow-hidden ${isDark ? 'border-red-800/50' : 'border-gray-200'}`}>
                                                <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? 'bg-red-950/30 border-red-800/50' : 'bg-gray-50 border-gray-200'}`}>
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
                                                <ul className={isDark ? 'divide-y divide-red-800/50' : 'divide-y divide-gray-100'}>
                                                    {type.categorias.length > 0 ? type.categorias.map(cat => (
                                                        <li key={cat.id} className={`px-4 py-3 flex justify-between items-center transition-colors ${isDark ? 'hover:bg-red-950/30' : 'hover:bg-gray-50'}`}>
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
                                ) : (
                                    <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-[#630000] border-red-800/50' : 'bg-white border-gray-200'}`}>
                                        <table className={`min-w-full ${isDark ? 'divide-y divide-red-800/50' : 'divide-y divide-gray-200'}`}>
                                            <thead className={isDark ? 'bg-red-950/30' : 'bg-gray-50'}>
                                                <tr>
                                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>ID</th>
                                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Nombre</th>
                                                    <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Estatus</th>
                                                </tr>
                                            </thead>
                                            <tbody className={isDark ? 'bg-[#630000] divide-y divide-red-800/50' : 'bg-white divide-y divide-gray-200'}>
                                                {items.length > 0 ? items.map((item) => (
                                                    <tr key={item.id} className={isDark ? 'hover:bg-red-950/30' : 'hover:bg-gray-50'}>
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
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={3} className={`px-6 py-8 text-center text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                        Ingrese el nombre para el nuevo registro en <strong className="text-gray-900">{tabs.find(t => t.id === activeTab)?.label}</strong>.
                    </p>
                    <CustomInput
                        name="itemName"
                        label="Nombre / Descripción"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Ej. Primaria Completa"
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" isDark={isDark} onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreate} disabled={!newItemName.trim()}>Guardar</Button>
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
