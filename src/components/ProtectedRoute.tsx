import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Loader from './common/Loader';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (isLoading) {
        return <Loader fullScreen text="Verificando sesión..." isDark={isDark} />;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
