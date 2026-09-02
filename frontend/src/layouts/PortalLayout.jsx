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

  // Responsive default: open on wide screens (>= 1200px), closed on smaller screens
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1200;
    }
    return true;
  });

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarRef = useRef(null);
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

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (window.innerWidth < 992) {
          setSidebarOpen(false);
        }
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer on route navigation
  useEffect(() => {
    if (window.innerWidth < 992) {
      setSidebarOpen(false);
    }
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
    <div className={`portal-app-root ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* 1. Left Collapsible Sidebar */}
      <aside
        ref={sidebarRef}
        className={`portal-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        aria-label="Portal Navigation"
      >
        {/* Sidebar Header with Brand & Close Button */}
        <div className="portal-sidebar-header">
          <Link
            to={authenticatedHomeRoute}
            className="portal-sidebar-brand"
            onClick={() => {
              if (window.innerWidth < 992) setSidebarOpen(false);
            }}
          >
            <div className="portal-sidebar-brand-icon">
              <Shield size={18} strokeWidth={2.5} />
            </div>
            <div className="portal-sidebar-brand-text">
              <span className="portal-sidebar-brand-title">VBR PORTAL</span>
              <span className="portal-sidebar-brand-sub">DEFENSE WELFARE</span>
            </div>
          </Link>

          <button
            type="button"
            className="portal-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Collapse navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="portal-sidebar-nav">
          <ul className="portal-sidebar-nav-list">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isExact =
                item.path === ROUTES.HOME ||
                item.path === ROUTES.VETERAN_DASHBOARD ||
                item.path === ROUTES.ADMIN_DASHBOARD ||
                item.path === ROUTES.EMPLOYER_DASHBOARD;
              return (
                <li key={idx} className="portal-sidebar-nav-item">
                  <NavLink
                    to={item.path}
                    end={isExact}
                    className={({ isActive }) =>
                      `portal-sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={() => {
                      if (window.innerWidth < 992) setSidebarOpen(false);
                    }}
                  >
                    <Icon size={18} className="portal-sidebar-nav-icon" />
                    <span className="portal-sidebar-nav-label">{item.label}</span>
                    {item.badge && <span className="portal-sidebar-nav-badge">{item.badge}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer with Logout */}
        {isAuthenticated && (
          <div className="portal-sidebar-footer">
            <button type="button" className="portal-sidebar-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Backdrop (< 992px) */}
      {sidebarOpen && (
        <div
          className="portal-mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Main Content Wrapper: Always takes remaining space with flex: 1; min-width: 0 */}
      <div className="portal-main-wrapper">
        {/* Sticky Top Header */}
        <header className="portal-top-header">
          <div className="portal-header-left">
            <button
              type="button"
              className="portal-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
              aria-expanded={sidebarOpen}
            >
              <Menu size={20} />
            </button>

            <Link to={authenticatedHomeRoute} className="portal-header-brand-link">
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
                <NotificationBell />

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

                  {/* Dropdown Card */}
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

        {/* Main Content Area */}
        <main className="portal-content-canvas" id="portal-main-content">
          <div className="portal-content-inner">
            {children}
          </div>
        </main>
      </div>

      {/* Global Real-Time Notification Toasts */}
      <NotificationToastContainer />
    </div>
  );
};

export default PortalLayout;
