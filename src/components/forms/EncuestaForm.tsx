
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faSpinner, faEdit } from '@fortawesome/free-solid-svg-icons';
import solicitanteService from '../../services/solicitanteService';
import catalogoService from '../../services/catalogoService';
import CustomSelect from '../common/CustomSelect';
import CustomInput from '../common/CustomInput';
import CustomCheckbox from '../common/CustomCheckbox';
import Button from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import type { DatosEncuestaRequest, EncuestaFamiliaDto, EncuestaViviendaDto } from '../../types/encuesta';
import type { TipoViviendaResponse, CondicionLaboralResponse, CondicionActividadResponse } from '../../types';

interface EncuestaFormProps {
    cedula: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function EncuestaForm({ cedula, onSuccess, onCancel }: EncuestaFormProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Default to read-only

    // Catalogos
    const [tiposVivienda, setTiposVivienda] = useState<TipoViviendaResponse[]>([]);
    const [condicionesLaborales, setCondicionesLaborales] = useState<CondicionLaboralResponse[]>([]);
    const [condicionesActividad, setCondicionesActividad] = useState<CondicionActividadResponse[]>([]);

    // Form Data
    const [idCondicion, setIdCondicion] = useState<number | undefined>(undefined);
    const [idCondicionActividad, setIdCondicionActividad] = useState<number | undefined>(undefined);

    const [familia, setFamilia] = useState<EncuestaFamiliaDto>({
        cantPersonas: 0,
        cantEstudiando: 0,
        ingresoMes: 0,
        jefeFamilia: true,
        cantSinTrabajo: 0,
        cantNinos: 0,
        cantTrabaja: 0,
        idNivelEduJefe: 0, // Need catalog for this? Assuming simple input or catalog
        tiempoEstudio: ''
    });

    const [vivienda, setVivienda] = useState<EncuestaViviendaDto>({
        cantHabitaciones: 0,
        cantBanos: 0
    });

    // Selected Characteristics: Map<idTipo, Set<idCategoria>> or similar
    // Flattened: list of objects
    const [selectedChars, setSelectedChars] = useState<{ idTipoCat: number, idCatVivienda: number }[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // 1. Load Catalogs
                const [viviendasData, condLabData, condActData] = await Promise.all([
                    catalogoService.getViviendas(),
                    catalogoService.getCondicionesLaborales(),
                    catalogoService.getCondicionesActividad()
                ]);

                setTiposVivienda(viviendasData);
                setCondicionesLaborales(condLabData);
                setCondicionesActividad(condActData);

                // 2. Load Existing Survey Data
                const surveyData = await solicitanteService.getEncuestaEdicion(cedula);

                if (surveyData.familia) setFamilia(surveyData.familia);
                if (surveyData.vivienda) setVivienda(surveyData.vivienda);
                if (surveyData.caracteristicas) setSelectedChars(surveyData.caracteristicas);
                if (surveyData.idCondicion) setIdCondicion(surveyData.idCondicion);
                if (surveyData.idCondicionActividad) setIdCondicionActividad(surveyData.idCondicionActividad);

            } catch (error) {
                console.error("Error loading survey data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [cedula]);

    const handleFamiliaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalVal: any = value;

        if (type === 'number') finalVal = Number(value);
        if (type === 'checkbox') finalVal = (e.target as HTMLInputElement).checked;

        setFamilia(prev => ({ ...prev, [name]: finalVal }));
    };

    const handleViviendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVivienda(prev => ({ ...prev, [name]: Number(value) }));
    };

    const toggleCharacteristic = (idTipo: number, idCat: number, nombreTipo: string) => {
        setSelectedChars(prev => {
            const isArtefactos = nombreTipo.toLowerCase().includes('artefactos') || nombreTipo.toLowerCase().includes('electro');

            // If it's NOT Artefactos, first remove any existing selection for this idTipo
            let newSelection = isArtefactos ? [...prev] : prev.filter(p => p.idTipoCat !== idTipo);

            const exists = newSelection.find(p => p.idTipoCat === idTipo && p.idCatVivienda === idCat);

            if (exists) {
                // Determine if we should allow toggling off in single-select mode. 
                // Usually yes, user can uncheck.
                return newSelection.filter(p => !(p.idTipoCat === idTipo && p.idCatVivienda === idCat));
            } else {
                return [...newSelection, { idTipoCat: idTipo, idCatVivienda: idCat }];
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: DatosEncuestaRequest = {
                familia,
                vivienda,
                caracteristicas: selectedChars,
                idCondicion,
                idCondicionActividad
            };
            await solicitanteService.saveEncuesta(cedula, payload);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error saving survey", error);
            alert("Error al guardar la encuesta");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={`p-8 text-center ${isDark ? 'text-white' : 'text-black'}`}><FontAwesomeIcon icon={faSpinner} spin size="2x" /> Cargando encuesta...</div>;

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Encuesta Socioeconómica</h2>
                {!isEditing && (
                    <Button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        variant="secondary"
                        icon={faEdit}
                    >
                        Editar
                    </Button>
                )}
            </div>

            <section className="mb-8">
                <h3 className="text-lg font-semibold text-red-900 border-b border-red-100 pb-2 mb-4">Datos Laborales del Solicitante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <CustomSelect
                                label="Condición Laboral"
                                value={idCondicion || ''}
                                options={condicionesLaborales.map(c => ({ value: c.id, label: c.nombre }))}
                                onChange={(val) => {
                                    setIdCondicion(Number(val));
                                    // Reset condicion actividad if not 'Sin trabajo'? Usually safer to keep user intent or clear it.
                                    // For now just hide it.
                                }}
                                placeholder="Seleccione..."
                                disabled={!isEditing}
                            />
                        </div>

                        {/* Show Condición Actividad ONLY if Condición Laboral is 'Sin trabajo' (or similar) */}
                        {(() => {
                            const selectedCond = condicionesLaborales.find(c => c.id === idCondicion);
                            // Check for "Sin trabajo" case-insensitive or by ID if known. ID is safer but text is more robust to DB reseeds if IDs change.
                            // Assuming typical naming.
                            const isSinTrabajo = selectedCond?.nombre.toLowerCase().includes('sin trabajo')
                                || selectedCond?.nombre.toLowerCase().includes('desempleado');

                            if (isSinTrabajo) {
                                return (
                                    <div>
                                        <CustomSelect
                                            label="Condición de Actividad"
                                            value={idCondicionActividad || ''}
                                            options={condicionesActividad.map(c => ({ value: c.id, label: c.nombre }))}
                                            onChange={(val) => setIdCondicionActividad(Number(val))}
                                            placeholder="Seleccione..."
                                            disabled={!isEditing}
                                        />
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            </section>

            {/* FAMILIA */}
            <section className="mb-8">
                <h3 className="text-lg font-semibold text-red-900 border-b border-red-100 pb-2 mb-4">Datos del Grupo Familiar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <CustomInput
                            label="Cant. Personas"
                            type="number"
                            name="cantPersonas"
                            value={familia.cantPersonas ?? ''}
                            onChange={(e: any) => handleFamiliaChange(e)}
                            disabled={!isEditing}
                        />
                    </div>
                    <div>
                        <CustomInput
                            label="Cant. Niños"
                            type="number"
                            name="cantNinos"
                            value={familia.cantNinos ?? ''}
                            onChange={(e: any) => handleFamiliaChange(e)}
                            disabled={!isEditing}
                        />
                    </div>
                    <div>
                        <CustomInput
                            label="Ingreso Mensual"
                            type="number"
                            name="ingresoMes"
                            value={familia.ingresoMes ?? ''}
                            onChange={(e: any) => handleFamiliaChange(e)}
                            disabled={!isEditing}
                            step={0.01}
                        />
                    </div>
                    <div>
                        <CustomInput
                            label="Cant. Estudiando"
                            type="number"
                            name="cantEstudiando"
                            value={familia.cantEstudiando ?? ''}
                            onChange={(e: any) => handleFamiliaChange(e)}
                            disabled={!isEditing}
                        />
                    </div>
                    <div>
                        <CustomInput
                            label="Cant. Trabaja"
                            type="number"
                            name="cantTrabaja"
                            value={familia.cantTrabaja ?? ''}
                            onChange={(e: any) => handleFamiliaChange(e)}
                            disabled={!isEditing}
                        />
                    </div>
                    <div>
                        <CustomInput
                            label="Cant. Sin Trabajo"
                            type="number"
                            name="cantSinTrabajo"
                            value={familia.cantSinTrabajo ?? ''}
                            onChange={(e: any) => handleFamiliaChange(e)}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="flex items-center mt-6">
                        <CustomCheckbox
                            label="¿Es Jefe de Familia?"
                            name="jefeFamilia"
                            checked={familia.jefeFamilia}
                            onChange={(checked) => setFamilia(prev => ({ ...prev, jefeFamilia: checked }))}
                            disabled={!isEditing}
                        />
                    </div>
                </div>
            </section>

            {/* VIVIENDA BASICA */}
            <section className="mb-8">
                <h3 className="text-lg font-semibold text-red-900 border-b border-red-100 pb-2 mb-4">Datos Básicos de la Vivienda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <CustomInput
                            label="Cant. Habitaciones"
                            type="number"
                            name="cantHabitaciones"
                            value={vivienda.cantHabitaciones ?? ''}
                            onChange={(e: any) => handleViviendaChange(e)}
                            disabled={!isEditing}
                        />
                    </div>
                    <div>
                        <CustomInput
                            label="Cant. Baños"
                            type="number"
                            name="cantBanos"
                            value={vivienda.cantBanos ?? ''}
                            onChange={(e: any) => handleViviendaChange(e)}
                            disabled={!isEditing}
                        />
                    </div>
                </div>
            </section>

            {/* CARACTERISTICAS VIVIENDA (DYNAMIC CHECKLIST) */}
            <section className="mb-8">
                <h3 className="text-lg font-semibold text-red-900 border-b border-red-100 pb-2 mb-4">Características de la Vivienda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tiposVivienda.map(tipo => (
                        <div key={tipo.id} className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-700 mb-3">{tipo.nombre}</h4>
                            <div className="space-y-2">
                                {tipo.categorias.map(cat => {
                                    const isChecked = selectedChars.some(sc => sc.idTipoCat === tipo.id && sc.idCatVivienda === cat.id);
                                    return (
                                        <div key={`${tipo.id} -${cat.id} `} className="flex items-start">
                                            <CustomCheckbox
                                                label={cat.descripcion}
                                                checked={isChecked}
                                                onChange={() => !isEditing ? {} : toggleCharacteristic(tipo.id, cat.id, tipo.nombre)}
                                                disabled={!isEditing}
                                                className="py-1" // Add padding for better spacing in list
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

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
                        isLoading={saving}
                        variant="primary"
                        icon={faSave}
                        className="flex items-center"
                    >
                        {saving ? 'Guardando...' : 'Guardar Encuesta'}
                    </Button>
                )}
            </div>
        </form>
    );
}
