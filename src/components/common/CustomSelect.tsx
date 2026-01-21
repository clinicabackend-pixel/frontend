import { useState, useRef, useEffect } from 'react';

interface Option {
    value: string | number;
    label: string;
}

interface CustomSelectProps {
    label?: string | React.ReactNode;
    value: string | number;
    options: Option[];
    onChange: (value: any) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
}

export default function CustomSelect({
    label,
    value,
    options,
    onChange,
    placeholder = "Seleccionar",
    disabled = false,
    required = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Find the label for the current value
    const selectedOption = options.find(opt => opt.value === value);

    const toggleOpen = () => {
        if (disabled) return;

        if (!isOpen) {
            // Check available space before opening
            if (dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const minSpaceRequired = 250; // Aprox height of max-h-60 (15rem = 240px)

                if (spaceBelow < minSpaceRequired && rect.top > minSpaceRequired) {
                    setPlacement('top');
                } else {
                    setPlacement('bottom');
                }
            }
        }
        setIsOpen(!isOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue: string | number) => {
        if (!disabled) {
            onChange(optionValue);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-semibold mb-2">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <div
                onClick={toggleOpen}
                className={`
                    w-full px-4 h-11 bg-white border rounded-lg cursor-pointer flex justify-between items-center transition-all duration-200
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-red-900'}
                    ${isOpen ? 'ring-2 ring-red-900 border-transparent' : 'border-gray-300'}
                `}
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                {/* Chevron Icon */}
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>

            {/* Hidden Input for Form Submission Validation */}
            <input
                type="text"
                value={value || ''}
                onChange={() => { }}
                className="sr-only"
                required={required}
                tabIndex={-1}
            />

            {/* Dropdown Menu - Standard Absolute Positioning */}
            {isOpen && !disabled && (
                <div
                    className={`absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg ${placement === 'top'
                        ? 'bottom-full mb-1'
                        : 'top-full mt-1'
                        }`}
                    style={{ backgroundColor: '#ffffff' }}
                >
                    <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ backgroundColor: '#ffffff' }}>
                        {options.map((option, index) => (
                            <li
                                key={`${option.value}-${index}`}
                                onClick={() => handleSelect(option.value)}
                                className={`
                                    px-4 py-2 cursor-pointer transition-colors duration-150
                                    ${option.value === value ? 'bg-red-50 text-red-900 font-medium' : 'text-gray-900 hover:bg-gray-50'}
                                `}
                                style={{
                                    backgroundColor: option.value === value ? '#fef2f2' : '#ffffff',
                                    color: option.value === value ? '#991b1b' : '#111827'
                                }}
                            >
                                {option.label}
                            </li>
                        ))}
                        {options.length === 0 && (
                            <li className="px-4 py-2 text-gray-500 italic" style={{ backgroundColor: '#ffffff', color: '#6b7280' }}>No hay opciones disponibles</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
