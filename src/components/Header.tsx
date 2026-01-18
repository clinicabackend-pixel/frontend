import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import LogoDerecho from '../assets/LogoDerecho.png';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

function Header({ title, onMenuClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <header className="relative w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 shadow-sm">
      {/* Botón de menú (izquierda) */}
      <button
        onClick={handleMenuClick}
        className="w-8 h-8 md:hidden flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-gray-600"
        aria-label="Menú"
      >
        <FontAwesomeIcon icon={faBars} className="text-xl" />
      </button>

      {/* Título central */}
      <h1 className="absolute left-1/2 transform -translate-x-1/2 text-lg md:text-xl font-bold text-gray-900 tracking-wide uppercase">
        {title}
      </h1>

      {/* Logo (derecha) */}
      <div className="flex items-center">
        <img
          src={LogoDerecho}
          alt="Logo Derecho"
          className="h-10 w-auto object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
          onClick={() => navigate('/home')}
        />
      </div>
    </header>
  );
}

export default Header;
