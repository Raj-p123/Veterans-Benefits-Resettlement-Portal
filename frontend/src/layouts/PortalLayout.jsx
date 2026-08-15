import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Award,
  Briefcase,
  FileCheck2,
  Bookmark,
  FileText,
  Bell,
  User,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  X,
  PlusCircle,
  Users,
  Settings,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { ROUTES, ROLES, getAuthenticatedHomeRoute } from '../constants/index.js';
import NotificationBell from '../components/NotificationBell/NotificationBell.jsx';
import NotificationToastContainer from '../components/NotificationToast/NotificationToast.jsx';
import './PortalLayout.css';

export const PortalLayout = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Drawer state: DEFAULT CLOSED
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const drawerRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close drawer on route navigation
  useEffect(() => {
    setDrawerOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/schemes?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Role Checks
  const isVeteran = user?.role === ROLES.VETERAN;
  const isEmployer = user?.role === ROLES.EMPLOYER;
  const isAdmin = user?.role === ROLES.ADMIN;

  // Dynamic Role Home/Dashboard Route
  const authenticatedHomeRoute = getAuthenticatedHomeRoute(user?.role);

  const veteranNavItems = [
    { label: 'Dashboard', path: ROUTES.VETERAN_DASHBOARD, icon: LayoutDashboard },
    { label: 'Benefits & Schemes', path: ROUTES.SCHEMES, icon: Award },
    { label: 'Jobs', path: ROUTES.JOBS, icon: Briefcase },
    { label: 'My Applications', path: ROUTES.VETERAN_APPLICATIONS, icon: FileCheck2 },
    { label: 'Saved Jobs', path: ROUTES.VETERAN_SAVED_JOBS, icon: Bookmark },
    { label: 'Documents', path: ROUTES.VETERAN_DOCUMENTS, icon: FileText },
    { label: 'Notifications', path: '/veteran/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
    { label: 'Profile', path: ROUTES.VETERAN_PROFILE, icon: User },
  ];

  const employerNavItems = [
    { label: 'Dashboard', path: ROUTES.EMPLOYER_DASHBOARD, icon: LayoutDashboard },
    { label: 'My Jobs', path: ROUTES.EMPLOYER_JOBS, icon: Briefcase },
    { label: 'Applications', path: ROUTES.EMPLOYER_JOBS, icon: Users },
    { label: 'Company Profile', path: ROUTES.EMPLOYER_PROFILE, icon: User },
    { label: 'Notifications', path: '/employer/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
  ];

  const adminNavItems = [
    { label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { label: 'Veterans', path: ROUTES.ADMIN_VETERANS, icon: Users },
    { label: 'Employers', path: ROUTES.ADMIN_EMPLOYERS, icon: Briefcase },
    { label: 'Schemes', path: ROUTES.ADMIN_SCHEMES, icon: Award },
    { label: 'Jobs', path: ROUTES.ADMIN_JOBS, icon: Compass },
    { label: 'Applications', path: ROUTES.ADMIN_SCHEME_APPLICATIONS, icon: FileCheck2 },
    { label: 'Documents', path: ROUTES.ADMIN_DOCUMENTS, icon: FileText },
    { label: 'Reports', path: ROUTES.ADMIN_REPORTS, icon: FileText },
    { label: 'Analytics', path: ROUTES.ADMIN_ANALYTICS, icon: LayoutDashboard },
    { label: 'Audit Logs', path: ROUTES.ADMIN_AUDIT_LOGS, icon: Shield },
    { label: 'Settings', path: ROUTES.ADMIN_SETTINGS, icon: Settings },
  ];

  const publicNavItems = [
    { label: 'Home', path: ROUTES.HOME, icon: LayoutDashboard },
    { label: 'Benefits & Schemes', path: ROUTES.SCHEMES, icon: Award },
    { label: 'Jobs', path: ROUTES.JOBS, icon: Briefcase },
    { label: 'About', path: ROUTES.ABOUT, icon: Shield },
    { label: 'Contact', path: ROUTES.CONTACT, icon: HelpCircle },
  ];

  const navItems = isVeteran
    ? veteranNavItems
    : isEmployer
    ? employerNavItems
    : isAdmin
    ? adminNavItems
    : publicNavItems;

  const getUserInitials = () => {
    if (!user?.name) return 'V';
    const parts = user.name.trim().split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  };

  const getRoleDisplayName = () => {
    if (isVeteran) return 'Veteran';
    if (isEmployer) return 'Employer';
    if (isAdmin) return 'Administrator';
    return 'Guest';
  };

  const getProfilePath = () => {
    if (isVeteran) return ROUTES.VETERAN_PROFILE;
    if (isEmployer) return ROUTES.EMPLOYER_PROFILE;
    if (isAdmin) return ROUTES.ADMIN_SETTINGS;
    return ROUTES.LOGIN;
  };

  return (
    <div className="authenticated-portal-layout">
      {/* 1. Minimal Top Header */}
      <header className="portal-top-header">
        <div className="portal-header-left">
          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            className="portal-hamburger-btn"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={drawerOpen}
          >
            {drawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Portal Brand Link: Navigates to Authenticated Home/Dashboard */}
          <Link to={authenticatedHomeRoute} className="portal-brand-header-link">
            <div className="portal-header-brand-icon">
              <Shield size={18} strokeWidth={2.5} />
            </div>
            <span className="portal-header-brand-title">VBR Portal</span>
          </Link>
        </div>

        {/* Center Search Bar */}
        <div className="portal-header-center">
          <form className="portal-search-form" onSubmit={handleGlobalSearch}>
            <Search size={15} className="portal-search-icon" />
            <input
              type="text"
              className="portal-search-input"
              placeholder="Search benefits, jobs, schemes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right User Controls */}
        <div className="portal-header-right">
          {isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Pill & Dropdown */}
              <div className="portal-profile-menu-container" ref={profileMenuRef}>
                <button
                  type="button"
                  className="portal-profile-pill"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-label="User profile menu"
                  aria-expanded={profileDropdownOpen}
                >
                  <div className="portal-avatar">{getUserInitials()}</div>
                  <div className="portal-user-meta-text">
                    <span className="portal-user-name">{user.name?.split(' ')[0] || user.name}</span>
                    <span className="portal-user-role">{getRoleDisplayName()}</span>
                  </div>
                  <ChevronDown size={14} className="portal-dropdown-arrow" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="portal-dropdown-card">
                    <div className="portal-dropdown-user-info">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>

                    <div className="portal-dropdown-divider" />

                    <Link
                      to={authenticatedHomeRoute}
                      className="portal-dropdown-item"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <LayoutDashboard size={15} />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      to={getProfilePath()}
                      className="portal-dropdown-item"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <User size={15} />
                      <span>My Profile</span>
                    </Link>

                    {isVeteran && (
                      <>
                        <Link
                          to={ROUTES.VETERAN_APPLICATIONS}
                          className="portal-dropdown-item"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <FileCheck2 size={15} />
                          <span>My Applications</span>
                        </Link>
                        <Link
                          to={ROUTES.VETERAN_DOCUMENTS}
                          className="portal-dropdown-item"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <FileText size={15} />
                          <span>Documents Vault</span>
                        </Link>
                      </>
                    )}

                    <div className="portal-dropdown-divider" />

                    <button
                      type="button"
                      className="portal-dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="portal-guest-actions">
              <Link to={ROUTES.LOGIN} className="btn btn-sm btn-secondary">
                Login
              </Link>
              <Link to={ROUTES.REGISTER} className="btn btn-sm btn-primary">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 2. Slide-in Dark Navy Navigation Drawer */}
      <aside
        ref={drawerRef}
        className={`portal-slide-drawer ${drawerOpen ? 'drawer-visible' : ''}`}
        aria-hidden={!drawerOpen}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <Link to={authenticatedHomeRoute} className="drawer-brand-link" onClick={() => setDrawerOpen(false)}>
            <div className="drawer-brand-icon">
              <Shield size={18} strokeWidth={2.5} />
            </div>
            <span className="drawer-brand-title">VBR PORTAL</span>
          </Link>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="drawer-nav">
          <ul className="drawer-nav-list">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isExact =
                item.path === ROUTES.HOME ||
                item.path === ROUTES.VETERAN_DASHBOARD ||
                item.path === ROUTES.ADMIN_DASHBOARD ||
                item.path === ROUTES.EMPLOYER_DASHBOARD;
              return (
                <li key={idx} className="drawer-nav-item">
                  <NavLink
                    to={item.path}
                    end={isExact}
                    className={({ isActive }) =>
                      `drawer-nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Icon size={18} className="drawer-nav-icon" />
                    <span className="drawer-nav-label">{item.label}</span>
                    {item.badge && <span className="drawer-nav-badge">{item.badge}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Drawer Footer with Logout */}
        <div className="drawer-footer">
          {isAuthenticated && (
            <button type="button" className="drawer-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
          <div className="drawer-helpline">
            <span className="helpline-title">24/7 HELPLINE</span>
            <span className="helpline-number">1800-VET-PORTAL</span>
          </div>
        </div>
      </aside>

      {/* 3. Backdrop Overlay for Drawer */}
      {drawerOpen && (
        <div
          className="portal-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 4. Main Full-Width Portal Content Canvas */}
      <main className="portal-content-canvas">
        <div className="portal-content-inner">
          {children}
        </div>
      </main>

      {/* Global Real-Time Notification Toasts */}
      <NotificationToastContainer />
    </div>
  );
};

export default PortalLayout;
