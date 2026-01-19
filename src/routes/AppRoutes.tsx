import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Home from '../pages/Home';
import Casos from '../pages/Casos';
import CasoDetalle from '../pages/CasoDetalle';
import Solicitantes from '../pages/Solicitantes';
import RegistroCaso from '../pages/RegistroCaso';
import SolicitanteDetalle from '../pages/SolicitanteDetalle';
import UsuariosPage from '../pages/Usuarios';
import Reportes from '../pages/Reportes';
import SetupPassword from '../pages/auth/SetupPassword';
import Catalogos from '../pages/Catalogos';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/setup-password" element={<SetupPassword />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/casos" element={<Casos />} />
                <Route path="/casos/:numCaso" element={<CasoDetalle />} />
                <Route path="/solicitantes" element={<Solicitantes />} />
                <Route path="/solicitantes/:id" element={<SolicitanteDetalle />} />
                <Route path="/registro-caso" element={<RegistroCaso />} />
                <Route path="/usuarios" element={<UsuariosPage />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/catalogos" element={<Catalogos />} />
            </Route>
        </Routes>
    );
}
