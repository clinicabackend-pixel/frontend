import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUserTie, faSearch } from '@fortawesome/free-solid-svg-icons';
import profesorService, { type ProfesorInfo } from '../services/profesorService';
import casoService from '../services/casoService';
import { useAuth } from '../context/AuthContext';

interface AssignSupervisorModalProps {
    isOpen: boolean;
    onClose: () => void;
    numCaso: string;
    onAssignSuccess: () => void;
}

const AssignSupervisorModal = ({ isOpen, onClose, numCaso, onAssignSuccess }: AssignSupervisorModalProps) => {
    const { user } = useAuth(); // Get current user
    const [isVisible, setIsVisible] = useState(false);
    const [profesors, setProfesors] = useState<ProfesorInfo[]>([]);
    const [filteredProfesors, setFilteredProfesors] = useState<ProfesorInfo[]>([]);
    const [searchText, setSearchText] = useState('');
    const [selectedProfesor, setSelectedProfesor] = useState<ProfesorInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setIsVisible(true));
            loadProfesors();
            setSearchText('');
            setSelectedProfesor(null);
            setError(null);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    const loadProfesors = async () => {
        setLoading(true);
        try {
            const data = await profesorService.getAllProfesores();
            setProfesors(data);
            setFilteredProfesors(data);
        } catch (err) {
            console.error("Error loading profesors", err);
            setError("No se pudieron cargar los profesores.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let currentList = profesors;

        // Si es PROFESOR, solo puede asignarse a sí mismo
        if (user?.tipoUsuario === 'PROFESOR') {
            currentList = currentList.filter(p => p.username === user.username);
        }

        if (!searchText) {
            setFilteredProfesors(currentList);
        } else {
            const lower = searchText.toLowerCase();
            const filtered = currentList.filter(p =>
                (p.nombre?.toLowerCase() || '').includes(lower) ||
                (p.apellido?.toLowerCase() || '').includes(lower) ||
                (p.cedula?.toLowerCase() || '').includes(lower) ||
                (p.username?.toLowerCase() || '').includes(lower)
            );
            setFilteredProfesors(filtered);
        }
    }, [searchText, profesors, user]);

    const handleAssign = async () => {
        if (!selectedProfesor || !selectedProfesor.termino) return;
        setAssigning(true);
        setError(null);
        try {
            await casoService.assignSupervisor(numCaso, {
                username: selectedProfesor.username,
                termino: selectedProfesor.termino
            });
            onAssignSuccess();
            handleClose();
        } catch (err: any) {
            console.error("Error assigning supervisor", err);
            const msg = err.response?.data || "";
            if (typeof msg === 'string' && (msg.includes("Llave duplicada") || msg.includes("duplicate key"))) {
                setError("Este profesor ya está supervisando este caso en el período indicado.");
            } else {
                setError(typeof msg === 'string' ? msg : "Ocurrió un error al asignar el supervisor.");
            }
            setAssigning(false);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>
            <div className={`relative w-full max-w-lg bg-white rounded-xl shadow-2xl transform transition-all duration-300 flex flex-col max-h-[85vh] overflow-hidden ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>

                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-900">
                            <FontAwesomeIcon icon={faUserTie} className="text-lg" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Asignar Supervisor</h3>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-hidden flex flex-col bg-white">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-900 rounded-lg text-sm flex items-center">
                            <span className="font-medium mr-2">Error:</span> {error}
                        </div>
                    )}
                    <p className="text-gray-500 text-sm mb-5">Seleccione el profesor para supervisar el caso <span className="font-semibold text-gray-700">{numCaso}</span>.</p>

                    <div className="relative mb-4 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400 group-focus-within:text-blue-900 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all text-gray-900 placeholder-gray-400"
                            placeholder="Buscar profesor..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg bg-white scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full mb-3"></div>
                                <span className="text-sm">Cargando lista...</span>
                            </div>
                        ) : filteredProfesors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                                <p>No se encontraron profesores.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {filteredProfesors.map((profesor) => {
                                    const isSelected = selectedProfesor?.username === profesor.username && selectedProfesor?.termino === profesor.termino;
                                    return (
                                        <li
                                            key={`${profesor.username}-${profesor.termino}`}
                                            onClick={() => setSelectedProfesor(profesor)}
                                            className="group p-3 cursor-pointer transition-all hover:bg-gray-50 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-blue-900 border-blue-900' : 'border-gray-300 group-hover:border-blue-900'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-sm font-bold transition-colors ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                                                            {profesor.nombre} {profesor.apellido || ''}
                                                        </p>
                                                        {profesor.termino && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                                {profesor.termino}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                                                        {profesor.username}
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

                <div className="px-6 py-5 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={handleClose} disabled={assigning} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors focus:outline-none disabled:opacity-50">
                        Cancelar
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedProfesor || assigning}
                        className="px-5 py-2.5 rounded-lg bg-blue-900 text-white font-medium text-sm shadow-md hover:bg-blue-800 hover:shadow-lg transition-all focus:outline-none disabled:opacity-50 disabled:shadow-none"
                    >
                        {assigning ? 'Asignando...' : 'Confirmar Asignación'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignSupervisorModal;
