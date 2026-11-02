import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Gavel from '../ui/Gavel';

const ProtectedRoute = ({ children, requiredUserType = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="boot" role="status" aria-label="Cargando SubastApp">
        <Gavel size={48} className="boot__gavel" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredUserType && user?.tipoUsuario !== requiredUserType) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
