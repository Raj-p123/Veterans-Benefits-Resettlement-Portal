import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROUTES, ROLE_DASHBOARD_MAP } from '../../constants/index.js';
import Button from '../../components/Button/Button.jsx';
import './Errors.css';

export const AccessDenied = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const userDashboard = user?.role ? (ROLE_DASHBOARD_MAP[user.role] || ROUTES.HOME) : ROUTES.HOME;

  return (
    <div className="error-page-wrapper">
      <div className="error-page-card">
        <div className="error-icon-box error-icon-403">
          <ShieldX size={32} />
        </div>

        <div className="error-code">HTTP 403 Forbidden</div>
        <h1 className="error-title">Access Denied</h1>

        <p className="error-message">
          You do not have the required role-based permissions to view this resource.
          {isAuthenticated && user && (
            <span>
              {' '}Your account is currently registered under the <strong>{user.role}</strong> role.
            </span>
          )}
        </p>

        <div className="error-actions">
          {isAuthenticated ? (
            <Link to={userDashboard}>
              <Button variant="primary" icon={LayoutDashboard}>
                Go to My Dashboard
              </Button>
            </Link>
          ) : (
            <Link to={ROUTES.LOGIN}>
              <Button variant="primary">
                Sign In with Appropriate Role
              </Button>
            </Link>
          )}

          <Link to={ROUTES.HOME}>
            <Button variant="secondary" icon={Home}>
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
