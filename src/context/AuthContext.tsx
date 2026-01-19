import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService, type LoginCredentials, type User } from '../services/authService';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const user = await authService.getCurrentUser();
                    setUser(user);
                    // Guardar username en localStorage para compatibilidad con otros componentes
                    if (user?.username) {
                        localStorage.setItem('username', user.username);
                    }
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Session validation failed:', error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const { jwt } = await authService.login(credentials);
            localStorage.setItem('token', jwt);
            const user = await authService.getCurrentUser();
            setUser(user);
            // Guardar username en localStorage para compatibilidad con otros componentes
            if (user?.username) {
                localStorage.setItem('username', user.username);
            }
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
