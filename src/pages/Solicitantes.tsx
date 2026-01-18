import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { faPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import MainLayout from '../components/layout/MainLayout';
import SolicitanteForm from '../components/forms/SolicitanteForm';
import EncuestaForm from '../components/forms/EncuestaForm';
import SolicitanteCard from '../components/SolicitanteCard';
import Pagination from '../components/common/Pagination';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import ViewToggle from '../components/common/ViewToggle';
import CustomSelect from '../components/common/CustomSelect';
import Switch from '../components/common/Switch';
import Modal from '../components/common/Modal';
import SolicitanteRow from '../components/SolicitanteRow';
import solicitanteService from '../services/solicitanteService';
import type { SolicitanteResponse } from '../types/solicitante';
import Loader from '../components/common/Loader';

function Solicitantes() {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);

    // Edit Modal State
    const [showEditForm, setShowEditForm] = useState(false);

    // Encuesta Modal State
    const [showEncuesta, setShowEncuesta] = useState(false);
    const [selectedSolicitante, setSelectedSolicitante] = useState<SolicitanteResponse | null>(null);

    // Data State
    const [solicitantes, setSolicitantes] = useState<SolicitanteResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    const [filterActiveCases, setFilterActiveCases] = useState(false);
    const [filterRole, setFilterRole] = useState('TODOS');

    // Pagination & View Mode
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOption, setSortOption] = useState<string>('nombre_asc');
    const itemsPerPage = 8;


    const fetchSolicitantes = async () => {
        setLoading(true);
        try {
            const data = await solicitanteService.getAll(filterActiveCases, filterRole);
            setSolicitantes(data);
        } catch (error) {
            console.error('Error cargando solicitantes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!showForm && !showEncuesta && !showEditForm) {
            fetchSolicitantes();
        }
    }, [showForm, showEncuesta, showEditForm, filterActiveCases, filterRole]);

    const handleSuccess = (data: any) => {
        console.log('Registro exitoso:', data);
        alert('Solicitante registrado exitosamente');
        setShowForm(false);
    };

    const handleEncuestaClick = (solicitante: SolicitanteResponse) => {
        setSelectedSolicitante(solicitante);
        setShowEncuesta(true);
    };

    const handleEncuestaClose = () => {
        setShowEncuesta(false);
        setSelectedSolicitante(null);
    };

    const handleEditClick = (solicitante: SolicitanteResponse) => {
        setSelectedSolicitante(solicitante);
        setShowEditForm(true);
    };

    const handleEditClose = () => {
        setShowEditForm(false);
        setSelectedSolicitante(null);
    };

    const handleCardClick = (solicitante: SolicitanteResponse) => {
        navigate(`/solicitantes/${solicitante.cedula}`);
    };

    const filteredSolicitantes = solicitantes.filter(s => {
        if (!searchText) return true;
        const term = searchText.toLowerCase();
        const nombreCompleto = `${s.nombre} ${s.apellido || ''}`.toLowerCase();
        return nombreCompleto.includes(term) || s.cedula.includes(term);
    });

    // Sorting Logic
    const sortedSolicitantes = [...filteredSolicitantes].sort((a, b) => {
        if (sortOption === 'nombre_asc') {
            return (a.nombre || '').localeCompare(b.nombre || '');
        } else if (sortOption === 'nombre_desc') {
            return (b.nombre || '').localeCompare(a.nombre || '');
        } else if (sortOption === 'cedula_asc') {
            return a.cedula.localeCompare(b.cedula);
        } else if (sortOption === 'cedula_desc') {
            return b.cedula.localeCompare(a.cedula);
        }
        return 0;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedSolicitantes.slice(indexOfFirstItem, indexOfLastItem);

    const sortOptions = [
        { value: 'nombre_asc', label: 'Nombre (A-Z)' },
        { value: 'nombre_desc', label: 'Nombre (Z-A)' },
        { value: 'cedula_asc', label: 'Cédula (Asc)' },
        { value: 'cedula_desc', label: 'Cédula (Desc)' }
    ];

    const roleOptions = [
        { value: 'TODOS', label: 'Todos' },
        { value: 'SOLICITANTE', label: 'Solicitante' },
        { value: 'BENEFICIARIO', label: 'Beneficiario' }
    ];

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText]);

    return (
        <MainLayout title="GESTIÓN DE SOLICITANTES Y BENEFICIARIOS">
            <div className="max-w-7xl mx-auto w-full">

                {showForm ? (
                    // FORMULARIO DE REGISTRO
                    <div className="animate-fade-in-up">
                        <Button
                            variant="ghost"
                            onClick={() => setShowForm(false)}
                            className="mb-6 pl-0 hover:bg-transparent hover:text-red-900 text-gray-600"
                            icon={faArrowLeft}
                        >
                            Volver a la lista
                        </Button>
                        <div className="bg-white/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl p-6 md:p-8">
                            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Nuevo Solicitante</h2>
                            <SolicitanteForm onSuccess={handleSuccess} formMode='create' />
                        </div>
                    </div>
                ) : (
                    // LISTA DE SOLICITANTES
                    <>
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            {/* Buscador */}
                            {/* Buscador y Switch */}
                            <div className="flex flex-col xl:flex-row items-center gap-4 flex-1 min-w-0">
                                <div className="w-full xl:w-80">
                                    <SearchBar
                                        value={searchText}
                                        onChange={setSearchText}
                                        placeholder="Buscar por nombre o cédula..."
                                    />
                                </div>
                                <Switch
                                    checked={filterActiveCases}
                                    onChange={setFilterActiveCases}
                                    label="Solo con casos activos"
                                />
                            </div>

                            {/* Filter Role */}
                            <div className="w-48">
                                <CustomSelect
                                    value={filterRole}
                                    options={roleOptions}
                                    onChange={setFilterRole}
                                    placeholder="Filtrar por tipo..."
                                />
                            </div>

                            {/* Sorting */}
                            <div className="w-48">
                                <CustomSelect
                                    value={sortOption}
                                    options={sortOptions}
                                    onChange={setSortOption}
                                    placeholder="Ordenar por..."
                                />
                            </div>

                            {/* View Mode Toggle */}
                            <div className="hidden md:flex">
                                <ViewToggle
                                    viewMode={viewMode}
                                    onToggle={setViewMode}
                                />
                            </div>

                            {/* Botón Nuevo */}
                            <Button
                                variant="primary"
                                onClick={() => setShowForm(true)}
                                icon={faPlus}
                                className="w-full md:w-auto shadow-md"
                            >
                                Nuevo Solicitante
                            </Button>
                        </div>

                        {/* Grid/List de Resultados */}
                        {loading ? (
                            <Loader text="Cargando solicitantes..." />
                        ) : (
                            <>
                                {filteredSolicitantes.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                                        <p className="text-gray-500 text-lg">No se encontraron solicitantes.</p>
                                        {searchText && (
                                            <Button
                                                variant="link"
                                                onClick={() => setSearchText('')}
                                                className="mt-2"
                                            >
                                                Limpiar búsqueda
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        {viewMode === 'grid' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {currentItems.map((sol) => (
                                                    <SolicitanteCard
                                                        key={sol.cedula}
                                                        solicitante={sol}
                                                        onClick={() => handleCardClick(sol)}
                                                        onEncuestaClick={() => handleEncuestaClick(sol)}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Civil</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {currentItems.map((sol) => (
                                                            <SolicitanteRow
                                                                key={sol.cedula}
                                                                solicitante={sol}
                                                                onClick={() => handleCardClick(sol)}
                                                                onEncuestaClick={handleEncuestaClick}
                                                                onEditClick={() => handleEditClick(sol)}
                                                            />
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Pagination Controls */}
                                        <Pagination
                                            currentPage={currentPage}
                                            itemsPerPage={itemsPerPage}
                                            totalItems={sortedSolicitantes.length}
                                            onPageChange={handlePageChange}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* MODAL ENCUESTA */}
                {showEncuesta && selectedSolicitante && (
                    <Modal
                        isOpen={showEncuesta}
                        onClose={handleEncuestaClose}
                        title={`Encuesta Socioeconómica - ${selectedSolicitante.nombre} ${selectedSolicitante.apellido || ''} (C.I: ${selectedSolicitante.cedula})`}
                    >
                        <EncuestaForm
                            cedula={selectedSolicitante.cedula}
                            onSuccess={() => {
                                alert("Encuesta guardada con éxito");
                                handleEncuestaClose();
                            }}
                            onCancel={handleEncuestaClose}
                        />
                    </Modal>
                )}

                {/* MODAL EDITAR SOLICITANTE */}
                {showEditForm && selectedSolicitante && (
                    <Modal
                        isOpen={showEditForm}
                        onClose={handleEditClose}
                        title={`Editar Solicitante - ${selectedSolicitante.nombre} ${selectedSolicitante.apellido || ''}`}
                    >
                        <SolicitanteForm
                            initialData={selectedSolicitante}
                            onSuccess={(data) => {
                                handleSuccess(data);
                                handleEditClose();
                            }}
                            onCancel={handleEditClose}
                            isModal={true}
                            formMode="view"
                        />
                    </Modal>
                )}
            </div>
        </MainLayout>
    );
}

export default Solicitantes;
