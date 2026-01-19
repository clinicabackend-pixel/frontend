import LogoDerecho from '../assets/LogoDerecho.png';
import LogoFondNegro from '../assets/LogoFondNegro.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

function Login() {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Actualizar isDark cuando cambia el theme
  useEffect(() => {
    if (theme === 'dark') {
      setIsDark(true);
    } else if (theme === 'light') {
      setIsDark(false);
    } else {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
    }
  }, [theme]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      await login({ username, password });
      // Navigation handled by useEffect
    } catch (err: any) {
      console.error('Error en login:', err);
      const mensajeError = err.response?.data?.message || 'Usuario o contraseña incorrectos';
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative flex w-screen h-screen overflow-hidden ${isDark ? 'bg-red-900' : 'bg-white'}`}>
      {/* Theme Toggle - Bottom Right Corner */}
      <div className="absolute bottom-6 right-6 z-20">
        <button
          onClick={() => {
            const newTheme = isDark ? 'light' : 'dark';
            setTheme(newTheme);
          }}
          className="h-12 w-12 rounded-md border border-white/30 bg-transparent hover:bg-white/10 text-white transition-colors flex items-center justify-center"
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Toggle theme"
          type="button"
        >
          {isDark ? (
            <Sun className="h-6 w-6" />
          ) : (
            <Moon className="h-6 w-6" />
          )}
        </button>
      </div>
      {/* LEFT SIDE: Authentication Form (40%) */}
      <div className={`w-full lg:w-[40%] flex flex-col justify-center items-center px-8 md:px-16 lg:px-20 ${isDark ? 'bg-red-900' : 'bg-white'} shadow-xl z-10`}>

        {/* Header Section */}
        <div className="w-full max-w-md mb-10 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              className="w-56 md:w-72 lg:w-80 object-contain"
              src={isDark ? LogoFondNegro : LogoDerecho}
              alt="Logo Clínica Jurídica"
            />
          </div>
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-2 ${isDark ? 'text-white' : 'text-red-900'}`}>
            Clínica Jurídica
          </h1>
          <p className={`text-base md:text-lg lg:text-xl ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            Acceso Institucional
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`w-full max-w-md mb-6 px-4 py-3 rounded border ${isDark ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-50 border-red-400 text-red-700'} border-l-4 ${isDark ? 'border-red-700' : 'border-red-900'}`}>
            <div className="flex">
              <div className="ml-3">
                <p className={`text-base md:text-lg font-medium ${isDark ? 'text-red-200' : 'text-red-700'}`}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full max-w-md space-y-6">

          {/* Username Input */}
          <div className="relative">
            <label className={`block text-base md:text-lg font-medium mb-2 ml-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Usuario</label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDark ? 'text-white/50' : 'text-red-900/50'}`}>
                <FontAwesomeIcon icon={faEnvelope} className="text-lg" />
              </div>
              <input
                type="text"
                placeholder="Ingrese su usuario"
                className={`w-full pl-12 pr-5 py-4 text-lg rounded-lg border-2 text-white placeholder-white focus:outline-none focus:ring-0 transition-all ${
                  isDark 
                    ? 'bg-red-900/80 border-red-700 focus:border-red-600' 
                    : 'bg-red-900 border-red-800 focus:border-red-700'
                }`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="relative">
            <label className={`block text-base md:text-lg font-medium mb-2 ml-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Contraseña</label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDark ? 'text-white/50' : 'text-red-900/50'}`}>
                <FontAwesomeIcon icon={faLock} className="text-lg" />
              </div>
              <input
                type="password"
                placeholder="Ingrese su contraseña"
                className={`w-full pl-12 pr-5 py-4 text-lg rounded-lg border-2 text-white placeholder-white focus:outline-none focus:ring-0 transition-all ${
                  isDark 
                    ? 'bg-red-900/80 border-red-700 focus:border-red-600' 
                    : 'bg-red-900 border-red-800 focus:border-red-700'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-4 text-lg md:text-xl text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed mt-4 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validando...
              </span>
            ) : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            &copy; 2026 Clínica Jurídica. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Background Image (60%) */}
      <div className="hidden lg:block lg:w-[60%] relative">
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80"
          alt="Office Background"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-red-900/90 to-black/80 flex flex-col justify-end p-16">
          <div className="max-w-xl text-white">
            <h2 className="text-4xl font-serif font-bold mb-4 leading-tight">
              Experiencia y Compromiso Social
            </h2>
            <p className="text-lg text-gray-200 font-light">
              Plataforma de gestión integral para la atención de casos y servicios legales comunitarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
