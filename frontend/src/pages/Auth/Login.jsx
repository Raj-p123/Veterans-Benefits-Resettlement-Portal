import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Shield, Mail, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROUTES, getAuthenticatedHomeRoute } from '../../constants/index.js';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx';
import './Auth.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract full intended destination, ensuring it is permitted for the user's role
  const getIntendedDestination = (userRole) => {
    const fromState = location.state?.from;
    if (!fromState) return null;

    let path = typeof fromState === 'string' ? fromState : fromState.pathname;
    if (!path || path === ROUTES.HOME || path === ROUTES.LOGIN || path === ROUTES.REGISTER || path === ROUTES.ACCESS_DENIED) {
      return null;
    }

    const search = typeof fromState === 'object' ? (fromState.search || '') : '';
    const fullPath = `${path}${search}`;
    const role = String(userRole || '').toUpperCase().trim();

    // Prevent cross-role redirect loops or 403 access-denied
    if (role === 'EMPLOYER') {
      if (path.startsWith('/admin') || path.startsWith('/veteran')) {
        return null; // Fall back to employer dashboard
      }
    } else if (role === 'VETERAN') {
      if (path.startsWith('/admin') || path.startsWith('/employer')) {
        return null; // Fall back to veteran dashboard
      }
    } else if (role === 'ADMIN') {
      if (path.startsWith('/employer') || path.startsWith('/veteran')) {
        return null; // Fall back to admin dashboard
      }
    }

    return fullPath;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      const userRole = loggedInUser?.role;
      const intendedDestination = getIntendedDestination(userRole);
      const defaultDashboard = getAuthenticatedHomeRoute(userRole);

      // Navigate to intended valid destination or role default dashboard
      navigate(intendedDestination || defaultDashboard, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasIntendedDestination = Boolean(getIntendedDestination());

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <Shield size={24} />
          </div>
          <h1 className="auth-title">Sign In to Portal</h1>
          <p className="auth-subtitle">
            Enter your credentials to access your secure services dashboard
          </p>
        </div>

        {/* Informative notice if redirected from protected section */}
        {hasIntendedDestination && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#071B3A',
              marginBottom: '1.25rem',
              lineHeight: 1.4,
            }}
          >
            <Sparkles size={14} color="#146EF5" style={{ flexShrink: 0 }} />
            <span>Sign in to access verified welfare schemes, jobs, and portal services.</span>
          </div>
        )}

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            icon={Mail}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            icon={Lock}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={LogIn}
            style={{ marginTop: '0.5rem' }}
          >
            Authenticate & Sign In
          </Button>
        </form>

        <div className="auth-footer-text">
          Don't have an account yet?{' '}
          <Link to={ROUTES.REGISTER}>
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
