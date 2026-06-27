import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, LoginRequest } from '../types';
import { authService } from '../services/api';

// ══════════════════════════════════════════════════════════════
// AUTH CONTEXT
// Maneja el estado global del usuario autenticado.
// Cualquier componente puede saber quién está logueado
// y qué rol tiene, sin pasar props por todos los niveles.
// ══════════════════════════════════════════════════════════════

interface AuthContextType {
  user: AuthUser | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Al cargar la app, verificamos si hay sesión guardada en localStorage
  useEffect(() => {
    const token    = localStorage.getItem('token');
    const fullName = localStorage.getItem('fullName');
    const email    = localStorage.getItem('email');
    const role     = localStorage.getItem('role');

    if (token && fullName && email && role) {
      setUser({
        token,
        fullName,
        email,
        role: role as AuthUser['role']
      });
    }
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data);

    // Guardamos en localStorage para que persista al recargar la página
    localStorage.setItem('token',    response.token);
    localStorage.setItem('fullName', response.fullName);
    localStorage.setItem('email',    response.email);
    localStorage.setItem('role',     response.role);

    setUser({
      token:    response.token,
      fullName: response.fullName,
      email:    response.email,
      role:     response.role as AuthUser['role']
    });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
// En vez de: const ctx = useContext(AuthContext)
// Usamos:    const { user, login, logout } = useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
