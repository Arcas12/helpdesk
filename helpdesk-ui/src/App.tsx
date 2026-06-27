import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage     from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TicketsPage   from './pages/Tickets/TicketsPage';
import UsersPage     from './pages/Users/UsersPage';
import Layout        from './components/Layout';

// ══════════════════════════════════════════════════════════════
// RUTA PROTEGIDA
// Si el usuario no está autenticado → redirige a /login
// Si está autenticado pero no tiene el rol requerido → 403
// ══════════════════════════════════════════════════════════════
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ══════════════════════════════════════════════════════════════
// RUTAS DE LA APLICACIÓN
// ══════════════════════════════════════════════════════════════
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Si ya está logueado y va a /login, lo manda al dashboard */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Rutas protegidas — requieren estar autenticado */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="tickets" element={<TicketsPage />} />

        {/* Solo el Administrador puede ver la gestión de usuarios */}
        <Route path="users" element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <UsersPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Cualquier ruta desconocida va al dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
