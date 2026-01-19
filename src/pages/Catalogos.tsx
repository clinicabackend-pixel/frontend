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
import type {
    TipoViviendaResponse
} from '../types/catalogo';

type CatalogType = 'NIVEL_EDUCATIVO' | 'CONDICION_LABORAL' | 'CONDICION_ACTIVIDAD' | 'VIVIENDA';

export function Catalogos() {
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
            fetchCatalogData();
        } catch (error) {
            console.error("Error updating status:", error);
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
                <div className="w-full md:w-64 bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                            <FontAwesomeIcon icon={faTags} className="text-red-900" />
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
                                        ? 'bg-red-50 text-red-900 border border-red-100 shadow-xs'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <FontAwesomeIcon icon={tab.icon} className={`w-5 ${activeTab === tab.id ? 'text-red-700' : 'text-gray-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[500px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">
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
                            <Loader text="Cargando catálogo..." />
                        ) : (
                            <>
                                {activeTab === 'VIVIENDA' ? (
                                    <div className="space-y-6">
                                        {housingData.map(type => (
                                            <div key={type.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faLayerGroup} className="text-gray-400" />
                                                        <h3 className="font-semibold text-gray-800">{type.nombre}</h3>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={faPlus}
                                                        onClick={() => {
                                                            setSelectedParentId(type.id);
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        Agregar Categoría
                                                    </Button>
                                                </div>
                                                <ul className="divide-y divide-gray-100">
                                                    {type.categorias.length > 0 ? type.categorias.map(cat => (
                                                        <li key={cat.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                            <span className="text-sm text-gray-700">{cat.descripcion}</span>
                                                            <StatusToggle
                                                                isActive={cat.estatus === 'ACTIVO'}
                                                                onClick={() => handleToggleStatus({ ...cat, estatus: cat.estatus || 'ACTIVO' }, type.id)}
                                                            />
                                                        </li>
                                                    )) : (
                                                        <li className="px-4 py-3 text-sm text-gray-400 italic">No hay categorías registradas.</li>
                                                    )}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {items.length > 0 ? items.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-24">#{item.id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nombre}</td>
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
                                                        <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 italic">
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
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-2">
                        Ingrese el nombre para el nuevo registro en <strong>{tabs.find(t => t.id === activeTab)?.label}</strong>.
                    </p>
                    <CustomInput
                        name="itemName"
                        label="Nombre / Descripción"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Ej. Primaria Completa"
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
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
