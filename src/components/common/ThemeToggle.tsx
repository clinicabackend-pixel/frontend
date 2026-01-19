import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="
                p-2 rounded-md border border-white/30
                bg-transparent
                text-white hover:bg-white/10
                transition-all duration-200 
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-red-900
                shadow-sm
            "
            aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        >
            <FontAwesomeIcon 
                icon={theme === 'light' ? faMoon : faSun} 
                className="text-lg"
            />
        </button>
    );
}
