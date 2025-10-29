import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredUserType = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0b0f 0%, #0f1419 50%, #0a1410 100%)',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        <div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(16, 185, 129, 0.3)', 
            borderTop: '4px solid #10b981', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
          }}></div>
          Cargando SubastaApp...
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
}

  // Si no está autenticado, redirige al landing page
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Si se requiere un tipo de usuario y no coincide, redirige a /unauthorized
  if (requiredUserType && user?.tipoUsuario !== requiredUserType) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si pasa todas las validaciones, renderiza los hijos
  return children;
};

export default ProtectedRoute;