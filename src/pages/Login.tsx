import LogoDerecho from '../assets/LogoDerecho.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

function Login() {
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
    <div className="flex w-screen h-screen overflow-hidden bg-white">
      {/* LEFT SIDE: Authentication Form (40%) */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center px-8 md:px-16 lg:px-20 bg-white shadow-xl z-10">

        {/* Header Section */}
        <div className="w-full max-w-md mb-10 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              className="w-32 md:w-40 object-contain"
              src={LogoDerecho}
              alt="Logo Clínica Jurídica"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-red-900 mb-2">
            Clínica Jurídica
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Acceso Institucional
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="w-full max-w-md mb-6 bg-red-50 border-l-4 border-red-900 p-4 rounded-r-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full max-w-md space-y-6">

          {/* Username Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Usuario</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-900/50">
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <input
                type="text"
                placeholder="Ingrese su usuario"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all text-gray-800 placeholder-gray-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-900/50">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <input
                type="password"
                placeholder="Ingrese su contraseña"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all text-gray-800 placeholder-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-red-900 hover:bg-red-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-900 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
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
