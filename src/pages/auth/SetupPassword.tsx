import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const SetupPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se proporcionó un token válido.",
                confirmButtonColor: "#7f1d1d",
            }).then(() => {
                navigate("/login");
            });
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            Swal.fire("Error", "Las contraseñas no coinciden", "error");
            return;
        }

        if (password.length < 6) {
            Swal.fire("Error", "La contraseña debe tener al menos 6 caracteres", "error");
            return;
        }

        setLoading(true);
        try {
            await axios.post("http://localhost:8080/api/auth/setup-password", {
                token: token,
                contrasena: password
            });

            Swal.fire({
                icon: "success",
                title: "¡Éxito!",
                text: "Tu contraseña ha sido configurada correctamente.",
                confirmButtonColor: "#7f1d1d",
            }).then(() => {
                navigate("/login");
            });

        } catch (error: any) {
            const msg = error.response?.data || "Ocurrió un error al establecer la contraseña.";
            Swal.fire("Error", msg, "error");
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-red-900 mb-6 text-center">Configurar Contraseña</h1>
                <p className="text-gray-600 mb-6 text-sm text-center">
                    Ingresa tu nueva contraseña para acceder al Sistema de Clínica Jurídica.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-900 focus:border-red-900"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-900 focus:border-red-900"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-900 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-900 disabled:opacity-50"
                    >
                        {loading ? "Guardando..." : "Establecer Contraseña"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetupPassword;
