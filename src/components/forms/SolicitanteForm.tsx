import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { faEdit, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../common/Button';
import type { SolicitanteRequest, Estado, Municipio, Parroquia, EstadoCivil, NivelEducativoResponse } from '../../types'; // Importando todo desde el index
import solicitanteService from '../../services/solicitanteService';
import catalogoService from '../../services/catalogoService';
import CustomSelect from '../common/CustomSelect';
import CustomDatePicker from '../common/CustomDatePicker';
import CustomInput from '../common/CustomInput';

const initialFormData: SolicitanteRequest = {
    nombre: '',
    cedula: '',
    sexo: '',
    idEstadoCivil: 0,
    fechaNacimiento: '',
    concubinato: false,
    nacionalidad: '',
    telfCasa: '',
    telfCelular: '',
    email: '',
    idParroquia: 0,
};

interface SolicitanteFormProps {
    initialData?: Partial<SolicitanteRequest>;
    onSuccess?: (data: any) => void;
    onCancel?: () => void;
    isModal?: boolean;
    simplifiedMode?: boolean;
    formMode?: 'create' | 'edit' | 'view';
    allowEditCedula?: boolean;
}

export default function SolicitanteForm({
    initialData,
    onSuccess,
    onCancel,
    isModal = false,
    simplifiedMode = false,
    formMode = 'view',
    allowEditCedula = false
}: SolicitanteFormProps) {
    const [formData, setFormData] = useState<SolicitanteRequest>({
        ...initialFormData,
        ...initialData,
    });

    // Edit Mode State
    // Prioritize formMode for initial state
    const [isEditing, setIsEditing] = useState(
        formMode === 'create' ||
        formMode === 'edit' ||
        (!initialData?.cedula && formMode !== 'view')
    );
    const [saving, setSaving] = useState(false);

    // Estados para catálogos de ubicación
    const [estados, setEstados] = useState<Estado[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [parroquias, setParroquias] = useState<Parroquia[]>([]);
    const [estadosCiviles, setEstadosCiviles] = useState<EstadoCivil[]>([]);
    const [nivelesEducativos, setNivelesEducativos] = useState<NivelEducativoResponse[]>([]);

    const [selectedEstado, setSelectedEstado] = useState<number>(0);
    const [selectedMunicipio, setSelectedMunicipio] = useState<number>(0);
    const [selectedParroquia, setSelectedParroquia] = useState<number>(0);

    // Duplicate Error State for Modal
    const [duplicateError, setDuplicateError] = useState<any>(null);

    // Cargar Catálogos al montar (Preloading)
    useEffect(() => {
        const loadCatalogos = async () => {
            try {
                const [
                    estadosData,
                    municipiosData,
                    parroquiasData,
                    estadosCivilesData,
                    nivelesEducativosData
                ] = await Promise.all([
                    catalogoService.getEstados(),
                    catalogoService.getAllMunicipios(),
                    catalogoService.getAllParroquias(),
                    catalogoService.getEstadosCiviles(),
                    catalogoService.getNivelesEducativos()
                ]);

                setEstados(estadosData);
                setMunicipios(municipiosData);
                setParroquias(parroquiasData);
                setEstadosCiviles(estadosCivilesData);
                setNivelesEducativos(nivelesEducativosData);
            } catch (error) {
                console.error("Error al cargar catálogos", error);
            }
        };

        loadCatalogos();
    }, []);

    const handleEstadoChange = (idEstado: number) => {
        setSelectedEstado(idEstado);
        setSelectedMunicipio(0);
        setSelectedParroquia(0);
        // Ya no necesitamos limpiar estados de municipios/parroquias porque filtramos en render
    };

    const handleMunicipioChange = (idMunicipio: number) => {
        setSelectedMunicipio(idMunicipio);
        setSelectedParroquia(0);
    };

    // Filtros derivados
    const filteredMunicipios = municipios.filter(m => m.idEstado === selectedEstado);
    const filteredParroquias = parroquias.filter(p => p.idMunicipio === selectedMunicipio);

    const handleParroquiaChange = (idParroquia: number) => {
        setSelectedParroquia(idParroquia);
        setFormData(prev => ({
            ...prev,
            idParroquia: idParroquia
        }));
    };

    // Si initialData cambia (ej: se prellena cedula), actualizar form
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));

            // Si estamos en modo 'view' y llega data, aseguramos no-edición.
            // Si estamos en 'create' o 'edit', mantenemos el estado de edición activo.
            if (formMode === 'view' && initialData.cedula) {
                setIsEditing(false);
            }
        }
    }, [initialData, formMode]);

    // Validación para campos que no deben tener números
    const validateTextOnly = (value: string): boolean => {
        return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(value);
    };

    // Validación para números enteros positivos
    const validatePositiveInteger = (value: string): boolean => {
        return /^\d*$/.test(value) && parseInt(value || '0') >= 0;
    };

    // Validación solo para dígitos (permite cadenas vacías)
    const validateNumericOnly = (value: string): boolean => {
        return /^\d*$/.test(value);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        // e.target can be from CustomInput which uses similar event structure
        const { name, value } = e.target;

        // Campos que solo deben aceptar letras (sin números)
        const textOnlyFields = ['nombre'];

        // Campos numéricos (enteros positivos sin decimales)
        const numericFields: string[] = [];

        // Campos que solo aceptan dígitos (como cédula)
        const digitOnlyFields = ['cedula'];

        // Validar campos de solo texto
        if (textOnlyFields.includes(name) && !validateTextOnly(value)) {
            return; // No actualizar si tiene números
        }

        // Validar campos numéricos
        if (numericFields.includes(name) && !validatePositiveInteger(value)) {
            return; // No actualizar si no es entero positivo
        }

        // Validar campos que solo aceptan dígitos
        if (digitOnlyFields.includes(name) && !validateNumericOnly(value)) {
            return; // No actualizar si contiene caracteres no numéricos
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Sanitize payload: convert 0 or empty string to undefined
            const payload: any = { ...formData };
            Object.keys(payload).forEach((key) => {
                const value = payload[key];
                if (typeof value === 'string' && value.trim() === '') {
                    payload[key] = undefined;
                } else if (typeof value === 'number' && value === 0) {
                    payload[key] = undefined;
                }
            });

            console.log('Enviando datos del solicitante:', payload);
            let result;

            if (initialData && initialData.cedula && formMode !== 'create') {
                // Update existing
                result = await solicitanteService.update(initialData.cedula, payload);
                console.log('Solicitante actualizado:', result);
                setIsEditing(false); // Go back to read-only after save
                alert('Solicitante actualizado exitosamente');
            } else {
                // Create new
                result = await solicitanteService.create(payload);
                console.log('Solicitante registrado:', result);
            }

            if (onSuccess) {
                // If backend returns a simple string (message), return our payload so the UI has the data.
                // If it returns an object (the saved entity), use that.
                const finalData = (typeof result === 'object' && result !== null) ? result : payload;
                onSuccess(finalData);
            }
        } catch (error: any) {
            console.error('Error al registrar/actualizar solicitante:', error);
            const status = error.response?.status;
            const data = error.response?.data;

            if (status === 409 && data && (typeof data === 'object')) {
                // Backend returned existing resource info - it might be wrapped in 'data' field of ApiResponse
                // Our GlobalExceptionHandler returns ApiResponse with 'data' field containing the object
                // So we might need data.data or just data depending on structure.
                // Based on GlobalExceptionHandler: ApiResponse("...", object) -> json: { status, message, data: object }
                const duplicateData = data.data || data;
                setDuplicateError(duplicateData);
            } else if (status === 409) {
                alert(data?.message || 'Ya existe un solicitante con esa cédula.');
            } else {
                alert('Error al registrar el solicitante. Por favor verifique los datos.');
            }
        } finally {
            setSaving(false);
        }
    };

    // Helper for conditional required
    const isStrict = !simplifiedMode;

    return (
        <form onSubmit={handleSubmit} className={isModal ? "p-6 md:p-8" : "bg-white rounded-lg shadow-lg p-6 md:p-8 relative"}>
            {/* Datos personales */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-red-900">
                    {/* Título dinámico: Nuevo solo si modo create O no hay data existente (data vacía) */}
                    {(formMode === 'create' || (!initialData?.cedula && !initialData?.nombre)) ? 'Nuevo Solicitante' : 'Datos del Solicitante'}
                </h2>

                {formMode !== 'create' && !isEditing && initialData && (
                    <Button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        variant="secondary"
                        icon={faEdit}
                    >
                        Editar
                    </Button>
                )}

                {onCancel && isModal && (
                    <div className="-mr-2">
                        {/* Close button for modal usually handled by modal header, but if we need generic close inside form: */}
                        {/* Using ghost variants or just keeping it simple */}
                    </div>
                )}
            </div>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Identificación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* C.I */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            C.I <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="cedula"
                            value={formData.cedula}
                            onChange={handleInputChange}
                            placeholder="Ej: 12345678"
                            maxLength={8}
                            pattern="\d+"
                            title="Ingrese solo números"
                            disabled={!isEditing || ((!!initialData?.cedula && formMode !== 'create') && !allowEditCedula)}
                            className={`w-full px-4 h-11 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900 focus:border-transparent ${(!isEditing || ((!!initialData?.cedula && formMode !== 'create') && !allowEditCedula)) ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
                            required
                        />
                    </div>

                    {/* Nombres y apellidos */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Nombres y apellidos <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className={`w-full px-4 h-11 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900 focus:border-transparent ${!isEditing ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}`}
                            required
                        />
                    </div>



                    {/* Sexo */}
                    <div>
                        <CustomSelect
                            label="Sexo"
                            value={formData.sexo}
                            options={[
                                { value: 'Masculino', label: 'Masculino' },
                                { value: 'Femenino', label: 'Femenino' }
                            ]}
                            onChange={(val) => setFormData(prev => ({ ...prev, sexo: String(val) }))}
                            required
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Estado civil */}
                    <div>
                        <CustomSelect
                            label="Estado civil"
                            value={formData.idEstadoCivil}
                            options={estadosCiviles.map(ec => ({ value: ec.idEstadoCivil, label: ec.nombreEstadoCivil }))}
                            onChange={(val) => setFormData(prev => ({ ...prev, idEstadoCivil: Number(val) }))}
                            required={isStrict}
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Fecha nacimiento */}
                    <div>
                        <CustomDatePicker
                            label={<span>Fecha nacimiento {isStrict && <span className="text-red-500">*</span>}</span>}
                            value={formData.fechaNacimiento}
                            onChange={(val) => setFormData(prev => ({ ...prev, fechaNacimiento: val }))}
                            required={isStrict}
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Concubinato */}
                    <div>
                        <CustomSelect
                            label="¿Vive en concubinato?"
                            value={formData.concubinato ? 'Si' : 'No'}
                            options={[
                                { value: 'Si', label: 'Sí' },
                                { value: 'No', label: 'No' },
                            ]}
                            onChange={(val) => setFormData(prev => ({ ...prev, concubinato: val === 'Si' }))}
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Nacionalidad */}
                    <div>
                        <CustomSelect
                            label={<span>Nacionalidad {isStrict && <span className="text-red-500">*</span>}</span>}
                            value={formData.nacionalidad}
                            options={[
                                { value: 'Venezolano', label: 'Venezolano' },
                                { value: 'Extranjero', label: 'Extranjero' }
                            ]}
                            onChange={(val) => setFormData(prev => ({ ...prev, nacionalidad: String(val) }))}
                            required={isStrict}
                            disabled={!isEditing}
                        />
                    </div>



                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Nivel Educativo */}
                    <div>
                        <CustomSelect
                            label="Nivel Educativo (Opcional)"
                            value={formData.idNivel || ''}
                            options={nivelesEducativos
                                .filter(n => n.estatus === 'ACTIVO')
                                .map(n => ({ value: n.id, label: n.nombre }))}
                            onChange={(val) => setFormData(prev => ({ ...prev, idNivel: Number(val) }))}
                            disabled={!isEditing}
                        />
                    </div>
                </div>
            </section>

            {/* Datos de contacto y residencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Datos de contacto */}
                <section>
                    <h2 className="text-lg font-semibold text-red-900 border-b border-red-100 pb-2 mb-4">Datos de contacto</h2>
                    <div className="space-y-3">
                        <div>
                            <CustomInput
                                label="Teléfono local"
                                type="tel"
                                name="telfCasa"
                                value={formData.telfCasa}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                            />
                        </div>

                        <div>
                            <CustomInput
                                label={<span>Teléfono Personal {isStrict && <span className="text-red-500">*</span>}</span>}
                                type="tel"
                                name="telfCelular"
                                value={formData.telfCelular}
                                onChange={handleInputChange}
                                required={isStrict}
                                disabled={!isEditing}
                            />
                        </div>

                        <div>
                            <CustomInput
                                label="Correo electrónico"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                                title="Ingrese un correo electrónico válido"
                                disabled={!isEditing}
                            />
                        </div>
                    </div>
                </section>

                {/* Datos de residencia */}
                <section>
                    <h2 className="text-lg font-semibold text-red-900 border-b border-red-100 pb-2 mb-4">Datos de residencia</h2>
                    <div className="space-y-3">

                        {/* Selectores de Ubicación en Cascada */}
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <CustomSelect
                                    label={<span>Estado {isStrict && <span className="text-red-500">*</span>}</span>}
                                    value={selectedEstado || ''}
                                    options={estados.map(e => ({ value: e.idEstado, label: e.nombreEstado }))}
                                    onChange={(val) => handleEstadoChange(Number(val))}
                                    required={isStrict}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div>
                                <CustomSelect
                                    label={<span>Municipio {isStrict && <span className="text-red-500">*</span>}</span>}
                                    value={selectedMunicipio || ''}
                                    options={filteredMunicipios.map(m => ({ value: m.idMunicipio, label: m.nombreMunicipio }))}
                                    onChange={(val) => handleMunicipioChange(Number(val))}
                                    disabled={!isEditing}
                                    required={isStrict}
                                />
                            </div>

                            <div>
                                <CustomSelect
                                    label={<span>Parroquia {isStrict && <span className="text-red-500">*</span>}</span>}
                                    value={selectedParroquia || ''}
                                    options={filteredParroquias.map(p => ({ value: p.idParroquia, label: p.nombreParroquia }))}
                                    onChange={(val) => handleParroquiaChange(Number(val))}
                                    disabled={!isEditing}
                                    required={isStrict}
                                />
                            </div>
                        </div>

                    </div>
                </section>
            </div>

            {/* Botón de enviar */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                {onCancel && (
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="secondary"
                        icon={faTimes}
                    >
                        {isEditing ? 'Cancelar' : 'Cerrar'}
                    </Button>
                )}

                {isEditing && (
                    <Button
                        type="submit"
                        disabled={saving}
                        isLoading={saving}
                        variant="primary"
                        icon={faSave}
                    >
                        Guardar
                    </Button>
                )}
            </div>

            {/* DUPLICATE USER MODAL */}
            {duplicateError && createPortal(
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-slide-up-modal">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
                                <span className="p-2 bg-red-100 rounded-full">
                                    <FontAwesomeIcon icon={faTimes} className="text-red-600" />
                                </span>
                                Usuario ya registrado
                            </h3>
                            <button onClick={() => setDuplicateError(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
                            <p className="text-orange-700">
                                La cédula <strong>{duplicateError.cedula}</strong> ya se encuentra registrada en el sistema.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm text-gray-600">Pertenece a:</p>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-800 font-bold shrink-0">
                                    {(duplicateError.nombre || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{duplicateError.nombre} {duplicateError.apellido || ''}</p>
                                    <p className="text-xs text-gray-500">{duplicateError.email || 'Sin correo'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={() => setDuplicateError(null)}
                                variant="secondary"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </form>
    );
}
