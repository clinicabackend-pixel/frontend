import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Moon, Sun } from 'lucide-react';
import LogoDerecho from '../assets/LogoDerecho.png';
import LogoFondNegro from '../assets/LogoFondNegro.png';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

function Header({ title, onMenuClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  
  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <header className={`relative w-full min-h-16 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 shadow-sm`}>
      {/* Botón de menú (izquierda) - Solo visible en móvil */}
      <button
        onClick={handleMenuClick}
        className={`w-8 h-8 md:hidden flex items-center justify-center rounded transition-colors shrink-0 ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
        aria-label="Menú"
      >
        <FontAwesomeIcon icon={faBars} className="text-xl" />
      </button>

      {/* Título central - Responsive */}
      <h1 className={`flex-1 text-center px-2 text-xs sm:text-sm md:text-lg lg:text-xl font-bold tracking-wide uppercase truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <span className="block sm:inline">{title}</span>
      </h1>

      {/* Theme Toggle y Logo DERECHO (derecha) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Theme Toggle Button */}
        <button
          onClick={() => {
            const newTheme = isDark ? 'light' : 'dark';
            setTheme(newTheme);
          }}
          className={`h-8 w-8 sm:h-10 sm:w-10 rounded-md border bg-transparent transition-colors flex items-center justify-center shrink-0 ${
            isDark 
              ? 'border-white/30 hover:bg-white/10 text-white' 
              : 'border-gray-900 hover:bg-gray-100 text-gray-900'
          }`}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Toggle theme"
          type="button"
        >
          {!isDark ? (
            <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>
        {/* Logo - Oculto en pantallas muy pequeñas */}
        <img
          src={isDark ? LogoFondNegro : LogoDerecho}
          alt="Logo Derecho"
          className="hidden sm:block h-8 sm:h-10 w-auto object-contain cursor-pointer hover:scale-105 transition-transform duration-200 shrink-0"
          onClick={() => navigate('/home')}
        />
      </div>
    </header>
  );
}

export default Header;
