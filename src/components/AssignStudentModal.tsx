import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUserPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import estudianteService, { type EstudianteInfo } from '../services/estudianteService';
import casoService from '../services/casoService';
// import { useTheme } from '../context/ThemeContext'; // Theme context less relevant if forcing specific colors, but keeping for dark mode logic if needed essentially

interface AssignStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    numCaso: string;
    onAssignSuccess: () => void;
}

const AssignStudentModal = ({ isOpen, onClose, numCaso, onAssignSuccess }: AssignStudentModalProps) => {
    // Ensuring we start with a fresh state when opening
    const [isVisible, setIsVisible] = useState(false);

    // Data State
    const [students, setStudents] = useState<EstudianteInfo[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<EstudianteInfo[]>([]);
    const [searchText, setSearchText] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<EstudianteInfo[]>([]);

    // Status State
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle Entry Animation and Data Loading
    useEffect(() => {
        if (isOpen) {
            // Trigger animation
            requestAnimationFrame(() => setIsVisible(true));
            loadStudents();
            // Reset fields
            setSearchText('');
            setSelectedStudents([]);
            setError(null);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await estudianteService.getActiveStudents();
            setStudents(data);
            setFilteredStudents(data);
        } catch (err) {
            console.error("Error loading students", err);
            setError("No se pudieron cargar los estudiantes activos.");
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        if (!searchText) {
            setFilteredStudents(students);
        } else {
            const lowerQuery = searchText.toLowerCase();
            const filtered = students.filter(s =>
                (s.nombre?.toLowerCase() || '').includes(lowerQuery) ||
                (s.apellido?.toLowerCase() || '').includes(lowerQuery) ||
                (s.cedula?.toLowerCase() || '').includes(lowerQuery) ||
                (s.username?.toLowerCase() || '').includes(lowerQuery)
            );
            setFilteredStudents(filtered);
        }
    }, [searchText, students]);

    const toggleStudent = (student: EstudianteInfo) => {
        if (selectedStudents.find(s => s.username === student.username)) {
            setSelectedStudents(selectedStudents.filter(s => s.username !== student.username));
        } else {
            setSelectedStudents([...selectedStudents, student]);
        }
    };

    const handleAssign = async () => {
        if (selectedStudents.length === 0) return;
        setAssigning(true);
        setError(null);
        try {
            for (const student of selectedStudents) {
                if (!student.termino) continue;
                await casoService.assignStudent(numCaso, {
                    username: student.username,
                    termino: student.termino
                });
            }
            onAssignSuccess();
            handleClose();
        } catch (err: any) {
            console.error("Error assigning students", err);
            const msg = err.response?.data || "";
            if (typeof msg === 'string' && (msg.includes("Llave duplicada") || msg.includes("duplicate key") || msg.includes("casos_asignados_pkey"))) {
                setError("Uno o más estudiantes seleccionados ya están asignados a este caso en el período actual.");
            } else {
                setError(typeof msg === 'string' ? msg : "Ocurrió un error al asignar los estudiantes.");
            }
            setAssigning(false);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div
                className={`relative w-full max-w-lg bg-white rounded-xl shadow-2xl transform transition-all duration-300 flex flex-col max-h-[85vh] overflow-hidden ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
            >

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-900">
                            <FontAwesomeIcon icon={faUserPlus} className="text-lg" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Asignar Estudiantes
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 overflow-hidden flex flex-col bg-white">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-900 rounded-lg text-sm flex items-center">
                            <span className="font-medium mr-2">Error:</span> {error}
                        </div>
                    )}

                    <p className="text-gray-500 text-sm mb-5">
                        Seleccione los estudiantes para asignar al caso <span className="font-semibold text-gray-700">{numCaso}</span>.
                    </p>

                    {/* Search Bar */}
                    <div className="relative mb-4 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400 group-focus-within:text-red-900 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all text-gray-900 placeholder-gray-400"
                            placeholder="Buscar por nombre o cédula..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    {/* Counter */}
                    <div className="mb-3 flex justify-between items-end">
                        <span className="text-red-900 font-bold text-sm">
                            {selectedStudents.length} estudiante(s) seleccionado(s)
                        </span>
                    </div>

                    {/* Students List */}
                    <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg bg-white scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <div className="animate-spin w-8 h-8 border-4 border-red-900 border-t-transparent rounded-full mb-3"></div>
                                <span className="text-sm">Cargando lista...</span>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                                <p>No se encontraron estudiantes.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {filteredStudents.map((student) => {
                                    const isSelected = selectedStudents.some(s => s.username === student.username);
                                    return (
                                        <li
                                            key={student.username}
                                            onClick={() => toggleStudent(student)}
                                            className="group p-3 cursor-pointer transition-all hover:bg-gray-50 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Checkbox */}
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${isSelected
                                                    ? 'bg-red-900 border-red-900'
                                                    : 'border-gray-300 group-hover:border-red-900'
                                                    }`}>
                                                    {isSelected && (
                                                        <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 20 20">
                                                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                                        </svg>
                                                    )}
                                                </div>

                                                {/* Text Info */}
                                                <div>
                                                    <p className={`text-sm font-bold transition-colors ${isSelected ? 'text-red-900' : 'text-gray-800'}`}>
                                                        {student.nombre} {student.apellido || ''}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                                                        {student.cedula}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        disabled={assigning}
                        className="px-5 py-2.5 rounded-lg border border-red-900 text-red-900 font-medium text-sm hover:bg-red-50 transition-colors focus:outline-none disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={selectedStudents.length === 0 || assigning}
                        className="px-5 py-2.5 rounded-lg bg-red-900 text-white font-medium text-sm shadow-md hover:bg-red-800 hover:shadow-lg transition-all focus:outline-none disabled:opacity-50 disabled:shadow-none translate-y-0 active:translate-y-0.5"
                    >
                        {assigning ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Asignando...
                            </span>
                        ) : 'Confirmar Asignación'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AssignStudentModal;
