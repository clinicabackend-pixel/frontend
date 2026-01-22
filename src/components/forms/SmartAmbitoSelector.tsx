import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { type AmbitoLegal } from '../../types';

interface SmartAmbitoSelectorProps {
    data: AmbitoLegal[]; // The full tree
    value?: number; // Selected Ambito ID (comAmbLegal)
    onChange: (ambitoId: number, materiaId: number) => void;
    disabled?: boolean;
}

interface SearchableItem {
    id: number;
    label: string;
    materiaId: number;
    materiaLabel: string;
    breadcrumb: string; // "Civil > Personas"
}

export default function SmartAmbitoSelector({ data, value, onChange, disabled }: SmartAmbitoSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Flatten the tree into searchable items
    const items = useMemo(() => {
        const result: SearchableItem[] = [];

        data.forEach((materia: AmbitoLegal) => {
            if (materia.children) {
                materia.children.forEach((categoria: AmbitoLegal) => {
                    const catLabel = categoria.descripcion.startsWith("Sin ") ? "" : categoria.descripcion;

                    if (categoria.children) {
                        categoria.children.forEach((sub: AmbitoLegal) => {
                            const subLabel = sub.descripcion.startsWith("Sin ") ? "" : sub.descripcion;

                            // Build path string for display
                            const parts = [materia.descripcion, catLabel, subLabel].filter(Boolean);
                            const path = parts.join(" > ");

                            if (sub.children) {
                                sub.children.forEach((ambito: AmbitoLegal) => {
                                    result.push({
                                        id: ambito.id,
                                        label: ambito.descripcion,
                                        materiaId: materia.id,
                                        materiaLabel: materia.descripcion,
                                        breadcrumb: path
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });
        return result;
    }, [data]);

    // Derived state for the selected item display
    const selectedItem = useMemo(() => items.find(i => i.id === value), [items, value]);

    // Filter items
    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        const lower = searchTerm.toLowerCase();
        return items.filter(i =>
            i.label.toLowerCase().includes(lower) ||
            i.materiaLabel.toLowerCase().includes(lower) ||
            i.breadcrumb.toLowerCase().includes(lower)
        );
    }, [items, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item: SearchableItem) => {
        onChange(item.id, item.materiaId);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
                Ámbito Legal
            </label>

            {/* Main Trigger / Search Input container */}
            <div
                className={`
                    relative bg-white border rounded-lg transition-all duration-200
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:border-red-900'}
                    ${isOpen ? 'ring-2 ring-red-900 border-transparent z-20' : 'border-gray-300'}
                `}
            >
                {/* When an item is selected and we are NOT searching, show the selection display */}
                {selectedItem && !isOpen && (
                    <div
                        onClick={() => { if (!disabled) setIsOpen(true); }}
                        className="px-4 py-3 cursor-pointer flex justify-between items-center group"
                    >
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="font-medium text-gray-900 truncate w-full">{selectedItem.label}</span>
                            <span className="text-xs text-red-900 font-medium truncate w-full">{selectedItem.breadcrumb}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-red-900 transition-colors" />
                    </div>
                )}

                {/* When searching OR no item selected, show input */}
                {(!selectedItem || isOpen) && (
                    <div className="relative flex items-center px-3">
                        <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            disabled={disabled}
                            placeholder={selectedItem ? "Cambiar ámbito..." : "Buscar ámbito (ej: Divorcio)..."}
                            className={`w-full py-3 outline-none text-gray-700 bg-transparent placeholder-gray-400 ${disabled ? 'cursor-not-allowed' : ''}`}
                        />
                        {/* If open but no search text, show chevron to indicate dropdown */}
                        {isOpen && !searchTerm && <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {
                isOpen && !disabled && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 animate-fade-in px-1.5 py-1.5">
                        {filteredItems.length === 0 ? (
                            <div className="p-4 text-gray-500 text-center text-sm rounded-md">
                                No se encontraron coincidencias para "{searchTerm}"
                            </div>
                        ) : (
                            filteredItems.map((item, index) => {
                                const isFirst = index === 0;
                                const isLast = index === filteredItems.length - 1;
                                const isSelected = item.id === value;
                                
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelect(item)}
                                        className={`
                                            w-full text-left px-4 py-2 hover:bg-red-50 transition-colors flex justify-between items-start group
                                            ${isFirst ? 'rounded-t-md' : ''}
                                            ${isLast ? 'rounded-b-md' : ''}
                                            ${isSelected ? 'bg-red-50' : ''}
                                        `}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium truncate ${isSelected ? 'text-red-900' : 'text-gray-800'}`}>
                                                {item.label}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate group-hover:text-red-800">
                                                {item.breadcrumb}
                                            </div>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-red-900 mt-1 ml-2 shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                )
            }
        </div >
    );
}
