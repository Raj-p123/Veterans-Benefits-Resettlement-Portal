import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROUTES } from '../constants/index.js';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner.jsx';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" message="Checking permissions..." />
      </div>
    );
  }

  const userRole = (user?.role || '').toUpperCase().trim();
  const normalizedAllowed = allowedRoles.map((r) => String(r).toUpperCase().trim());

  if (!user || !normalizedAllowed.includes(userRole)) {
    return <Navigate to={ROUTES.ACCESS_DENIED} replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
