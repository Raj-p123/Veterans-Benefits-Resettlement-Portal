import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Award,
  Briefcase,
  Info,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROUTES, getAuthenticatedHomeRoute } from '../../constants/index.js';
import Button from '../Button/Button.jsx';
import NotificationBell from '../NotificationBell/NotificationBell.jsx';
import './Navbar.css';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
    setMobileMenuOpen(false);
  };

  const authenticatedHome = user?.role ? getAuthenticatedHomeRoute(user.role) : ROUTES.HOME;

  return (
    <header className="public-navbar-header">
      <div className="public-navbar-container">
        {/* Left: Brand Logo */}
        <Link
          to={isAuthenticated ? authenticatedHome : ROUTES.HOME}
          className="public-brand-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="public-brand-icon">
            <Shield size={20} strokeWidth={2.5} />
          </div>
          <div className="public-brand-text">
            <span className="public-brand-title">VBR PORTAL</span>
          </div>
        </Link>

        {/* Center/Right Desktop Navigation */}
        <nav className="public-desktop-nav">
          <ul className="public-nav-list">
            <li>
              <NavLink to={ROUTES.HOME} className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to={ROUTES.SCHEMES} className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
                Benefits & Schemes
              </NavLink>
            </li>
            <li>
              <NavLink to={ROUTES.JOBS} className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
                Jobs
              </NavLink>
            </li>
            <li>
              <NavLink to={ROUTES.ABOUT} className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
                About
              </NavLink>
            </li>
            <li>
              <NavLink to={ROUTES.CONTACT} className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
                Contact
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Right Auth Action Buttons */}
        <div className="public-auth-actions">
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <NotificationBell />
              <Link to={authenticatedHome}>
                <Button variant="primary" size="sm" icon={LayoutDashboard}>
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" icon={LogOut} onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="public-mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="public-mobile-dropdown">
          <ul className="public-mobile-nav-list">
            <li>
              <NavLink
                to={ROUTES.HOME}
                className={({ isActive }) => `public-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to={ROUTES.SCHEMES}
                className={({ isActive }) => `public-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Benefits & Schemes
              </NavLink>
            </li>
            <li>
              <NavLink
                to={ROUTES.JOBS}
                className={({ isActive }) => `public-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Jobs
              </NavLink>
            </li>
            <li>
              <NavLink
                to={ROUTES.ABOUT}
                className={({ isActive }) => `public-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </NavLink>
            </li>
            <li>
              <NavLink
                to={ROUTES.CONTACT}
                className={({ isActive }) => `public-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </NavLink>
            </li>
          </ul>

          <div className="public-mobile-auth-row">
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <Link to={authenticatedHome} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" fullWidth icon={LayoutDashboard}>
                    Dashboard
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" fullWidth icon={LogOut} onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <Link to={ROUTES.LOGIN} style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" fullWidth>
                    Login
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER} style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" fullWidth>
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
