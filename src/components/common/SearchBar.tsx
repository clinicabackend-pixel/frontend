import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    isDark?: boolean;
}

const SearchBar = ({ value, onChange, placeholder = "Buscar...", className = "", isDark = false }: SearchBarProps) => {
    return (
        <div className={`relative w-full ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className={isDark ? 'text-gray-400' : 'text-gray-400'} />
            </div>
            <input
                type="text"
                className={`block w-full h-10 pl-10 pr-3 py-2 border rounded-lg sm:text-sm transition-all ${
                    isDark
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:bg-gray-800 focus:ring-1 focus:ring-red-900 focus:border-red-900'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-red-900 focus:border-red-900'
                }`}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default SearchBar;
