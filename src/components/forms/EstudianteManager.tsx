import { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Users, Check } from 'lucide-react';
import type { EstudianteInfo } from '../../services/estudianteService';

interface EstudianteManagerProps {
    activeStudents: EstudianteInfo[];
    selectedUsernames: string[];
    onSelectionChange: (usernames: string[]) => void;
}

export default function EstudianteManager({ activeStudents, selectedUsernames, onSelectionChange }: EstudianteManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [checkedCandidates, setCheckedCandidates] = useState<string[]>([]); // Usernames

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];

        const lowerSearch = searchTerm.toLowerCase();
        return activeStudents.filter(s => {
            // Exclude already selected ones
            if (selectedUsernames.includes(s.username)) return false;

            const fullName = `${s.nombre} ${s.apellido || ''}`.toLowerCase();
            return fullName.includes(lowerSearch) ||
                s.cedula.includes(lowerSearch) ||
                s.username.toLowerCase().includes(lowerSearch);
        }).slice(0, 50);
    }, [activeStudents, searchTerm, selectedUsernames]);

    const handleToggleCandidate = (username: string) => {
        setCheckedCandidates(prev =>
            prev.includes(username)
                ? prev.filter(u => u !== username)
                : [...prev, username]
        );
    };

    const handleAddSelected = () => {
        // Add checked candidates (which are usernames) to the selected list
        onSelectionChange([...selectedUsernames, ...checkedCandidates]);
        setCheckedCandidates([]);
        setSearchTerm('');
    };

    const handleRemove = (username: string) => {
        onSelectionChange(selectedUsernames.filter(u => u !== username));
    };

    const handleSelectAllFiltered = () => {
        const newUsernames = filteredStudents.map(s => s.username);
        const merged = Array.from(new Set([...checkedCandidates, ...newUsernames]));
        setCheckedCandidates(merged);
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={20} />
                Gestionar Estudiantes
            </h3>

            {/* Search and Filter Section */}
            <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-1">Buscar Estudiantes</label>
                <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nombre, cédula o usuario..."
                            className="w-full pl-9 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-red-900 focus:outline-none bg-white"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                </div>

                {/* Candidate List (Filtered) */}
                {searchTerm && (
                    <div className="bg-white border rounded-md shadow-sm overflow-hidden animate-fade-in">
                        <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase">Resultados ({filteredStudents.length})</span>
                            {filteredStudents.length > 0 && (
                                <button
                                    onClick={handleSelectAllFiltered}
                                    className="text-xs text-red-900 hover:underline font-medium"
                                >
                                    Seleccionar Todos
                                </button>
                            )}
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {filteredStudents.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    No se encontraron estudiantes disponibles.
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="p-3 w-10"></th>
                                            <th className="p-3">Nombre</th>
                                            <th className="p-3">Info</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredStudents.map(student => {
                                            const isChecked = checkedCandidates.includes(student.username);
                                            return (
                                                <tr
                                                    key={student.username}
                                                    className={`hover:bg-red-50 transition-colors cursor-pointer ${isChecked ? 'bg-red-50/50' : ''}`}
                                                    onClick={() => handleToggleCandidate(student.username)}
                                                >
                                                    <td className="p-3 text-center">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-red-900 border-red-900' : 'border-gray-300 bg-white'}`}>
                                                            {isChecked && <Check size={12} className="text-white" />}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-medium text-gray-800">
                                                        {student.nombre} {student.apellido || ''}
                                                    </td>
                                                    <td className="p-3 text-gray-500 text-xs text-right">
                                                        <span className="font-mono text-gray-600">@{student.username}</span>
                                                        <br />
                                                        <span className="text-gray-400 text-[10px]">{student.cedula}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {checkedCandidates.length > 0 && (
                            <div className="p-3 border-t bg-gray-50 flex justify-end">
                                <button
                                    onClick={handleAddSelected}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-950 transition-colors shadow-sm text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Agregar {checkedCandidates.length} Seleccionados
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Selected List */}
            <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
                    <Check size={18} className="text-green-600" />
                    Estudiantes Asignados <span className="text-sm font-normal text-gray-500">({selectedUsernames.length})</span>
                </h4>

                {selectedUsernames.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Users className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-500">No hay estudiantes asignados.</p>
                        <p className="text-xs text-gray-400 mt-1">Busque arriba para agregar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedUsernames.map((username) => {
                            const st = activeStudents.find(s => s.username === username);
                            // Fallback if student not found (e.g. inactive)
                            const fullName = st ? `${st.nombre} ${st.apellido || ''}` : username;

                            return (
                                <div key={username} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200 group hover:border-red-200 transition-all">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-900 text-xs font-bold border border-red-100 shrink-0">
                                            {st?.nombre ? st.nombre.charAt(0) : '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-800 truncate">{fullName}</p>
                                            <p className="text-xs text-gray-500 truncate">{st ? st.cedula : 'Cédula N/A'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(username)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Remover"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
