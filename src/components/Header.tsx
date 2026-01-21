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
        <header className={`relative w-full h-16 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-3 md:px-6 shadow-sm`}>
      {/* Botón de menú (izquierda) */}
      <button
        onClick={handleMenuClick}
        className={`w-8 h-8 md:hidden flex items-center justify-center rounded transition-colors ${isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
        aria-label="Menú"
      >
        <FontAwesomeIcon icon={faBars} className="text-xl" />
      </button>

      {/* Título central */}
      <h1 className={`absolute left-1/2 transform -translate-x-1/2 text-lg md:text-xl font-bold tracking-wide uppercase ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h1>

      {/* Theme Toggle y Logo DERECHO (derecha) */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Theme Toggle Button */}
        <button
          onClick={() => {
            const newTheme = isDark ? 'light' : 'dark';
            setTheme(newTheme);
          }}
          className={`h-10 w-10 rounded-md border bg-transparent transition-colors flex items-center justify-center ${
            isDark 
              ? 'border-white/30 hover:bg-white/10 text-white' 
              : 'border-gray-900 hover:bg-gray-100 text-gray-900'
          }`}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Toggle theme"
          type="button"
        >
          {!isDark ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
        <img
          src={isDark ? LogoFondNegro : LogoDerecho}
          alt="Logo Derecho"
          className="h-10 w-auto object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
          onClick={() => navigate('/home')}
        />
      </div>
    </header>
  );
}

export default Header;
