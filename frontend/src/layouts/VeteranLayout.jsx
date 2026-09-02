import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Award,
  FileCheck2,
  Briefcase,
  Bookmark,
  FileText,
  Bell,
  User,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Search,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { ROUTES } from '../constants/index.js';
import NotificationBell from '../components/NotificationBell/NotificationBell.jsx';
import NotificationToastContainer from '../components/NotificationToast/NotificationToast.jsx';
import './VeteranLayout.css';

export const VeteranLayout = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Desktop sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  // Profile dropdown menu state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  const profileDropdownRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Handle outside clicks to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle ESC key to close mobile drawer & dropdowns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/schemes?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const getUserInitials = () => {
    if (!user?.name) return 'V';
    const parts = user.name.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  };

  // Structured navigation groups
  const navigationGroups = [
    {
      groupTitle: 'MAIN',
      items: [
        { label: 'Dashboard', path: ROUTES.VETERAN_DASHBOARD, icon: LayoutDashboard, exact: true },
        { label: 'Benefits & Schemes', path: ROUTES.SCHEMES, icon: Award },
        { label: 'My Applications', path: ROUTES.VETERAN_APPLICATIONS, icon: FileCheck2 },
      ],
    },
    {
      groupTitle: 'CAREER',
      items: [
        { label: 'Job Opportunities', path: ROUTES.JOBS, icon: Briefcase },
        { label: 'Saved Jobs', path: ROUTES.VETERAN_SAVED_JOBS, icon: Bookmark },
      ],
    },
    {
      groupTitle: 'ACCOUNT',
      items: [
        { label: 'Documents', path: ROUTES.VETERAN_DOCUMENTS, icon: FileText },
        {
          label: 'Notifications',
          path: '/veteran/notifications',
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : null,
        },
        { label: 'Profile', path: ROUTES.VETERAN_PROFILE, icon: User },
      ],
    },
    {
      groupTitle: 'SUPPORT',
      items: [
        { label: 'Help & Support', path: ROUTES.CONTACT, icon: HelpCircle },
      ],
    },
  ];

  return (
    <div className={`veteran-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* ==================================================================
          1. DESKTOP COLLAPSIBLE SIDEBAR
          ================================================================== */}
      <aside className="veteran-sidebar" aria-label="Veteran navigation sidebar">
        {/* Top Branding */}
        <div className="veteran-sidebar-header">
          <Link to={ROUTES.VETERAN_DASHBOARD} className="veteran-brand-link">
            <div className="veteran-brand-icon">
              <Shield size={20} strokeWidth={2.4} />
            </div>
            {!sidebarCollapsed && (
              <div className="veteran-brand-text">
                <span className="veteran-brand-title">VBR PORTAL</span>
                <span className="veteran-brand-subtitle">Veterans Benefits & Resettlement</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            className="veteran-sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Categorized Navigation List */}
        <nav className="veteran-sidebar-nav">
          {navigationGroups.map((group) => (
            <div key={group.groupTitle} className="veteran-nav-group">
              {!sidebarCollapsed && (
                <div className="veteran-nav-group-title">{group.groupTitle}</div>
              )}
              <ul className="veteran-nav-list">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) =>
                          `veteran-nav-link ${isActive ? 'active' : ''}`
                        }
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon size={18} className="veteran-nav-icon" />
                        {!sidebarCollapsed && (
                          <span className="veteran-nav-label">{item.label}</span>
                        )}
                        {!sidebarCollapsed && item.badge && (
                          <span className="veteran-nav-badge">{item.badge}</span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom Logout */}
        <div className="veteran-sidebar-footer">
          <button
            type="button"
            className="veteran-nav-link veteran-logout-btn"
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
            aria-label="Logout"
          >
            <LogOut size={18} className="veteran-nav-icon" />
            {!sidebarCollapsed && <span className="veteran-nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ==================================================================
          2. MOBILE DRAWER OVERLAY (< 992px)
          ================================================================== */}
      {mobileDrawerOpen && (
        <div
          className="veteran-mobile-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`veteran-mobile-drawer ${mobileDrawerOpen ? 'drawer-open' : ''}`}
        aria-label="Mobile navigation drawer"
      >
        <div className="veteran-mobile-drawer-header">
          <Link
            to={ROUTES.VETERAN_DASHBOARD}
            className="veteran-brand-link"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div className="veteran-brand-icon">
              <Shield size={20} strokeWidth={2.4} />
            </div>
            <div className="veteran-brand-text">
              <span className="veteran-brand-title">VBR PORTAL</span>
              <span className="veteran-brand-subtitle">Veterans Benefits & Resettlement</span>
            </div>
          </Link>
          <button
            type="button"
            className="veteran-mobile-drawer-close"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="veteran-mobile-nav">
          {navigationGroups.map((group) => (
            <div key={group.groupTitle} className="veteran-nav-group">
              <div className="veteran-nav-group-title">{group.groupTitle}</div>
              <ul className="veteran-nav-list">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) =>
                          `veteran-nav-link ${isActive ? 'active' : ''}`
                        }
                        onClick={() => setMobileDrawerOpen(false)}
                      >
                        <Icon size={18} className="veteran-nav-icon" />
                        <span className="veteran-nav-label">{item.label}</span>
                        {item.badge && <span className="veteran-nav-badge">{item.badge}</span>}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="veteran-mobile-footer">
          <button
            type="button"
            className="veteran-nav-link veteran-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} className="veteran-nav-icon" />
            <span className="veteran-nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* ==================================================================
          3. MAIN CONTENT SHELL (STICKY TOPBAR + CANVAS)
          ================================================================== */}
      <div className="veteran-main-wrapper">
        {/* Sticky Top Header */}
        <header className="veteran-topbar" role="banner">
          <div className="veteran-topbar-left">
            {/* Mobile Menu Button */}
            <button
              type="button"
              className="veteran-mobile-toggle"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              aria-label="Toggle navigation drawer"
              aria-expanded={mobileDrawerOpen}
            >
              {mobileDrawerOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Center Search Bar */}
            <form className="veteran-search-form" onSubmit={handleSearchSubmit} role="search">
              <Search size={16} className="veteran-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="veteran-search-input"
                placeholder="Search benefits, jobs, schemes..."
                aria-label="Search benefits, jobs, schemes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="veteran-topbar-right">
            {/* Notification Bell with Badge */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="veteran-profile-container" ref={profileDropdownRef}>
              <button
                type="button"
                className="veteran-profile-pill"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="User profile menu"
                aria-expanded={profileDropdownOpen}
              >
                <div className="veteran-avatar">{getUserInitials()}</div>
                <div className="veteran-profile-text">
                  <span className="veteran-profile-name">
                    {user?.name?.split(' ')[0] || user?.name || 'Veteran'}
                  </span>
                  <span className="veteran-profile-role">Veteran</span>
                </div>
                <ChevronDown size={14} className="veteran-dropdown-chevron" aria-hidden="true" />
              </button>

              {profileDropdownOpen && (
                <div className="veteran-dropdown-card" role="menu">
                  <div className="veteran-dropdown-user-info">
                    <strong>{user?.name || 'Veteran Member'}</strong>
                    <small>{user?.email}</small>
                  </div>

                  <div className="veteran-dropdown-divider" />

                  <Link
                    to={ROUTES.VETERAN_PROFILE}
                    className="veteran-dropdown-item"
                    role="menuitem"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <User size={15} />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to={ROUTES.VETERAN_PROFILE}
                    className="veteran-dropdown-item"
                    role="menuitem"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings size={15} />
                    <span>Account Settings</span>
                  </Link>

                  <Link
                    to="/veteran/notifications"
                    className="veteran-dropdown-item"
                    role="menuitem"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Bell size={15} />
                    <span>Notifications</span>
                  </Link>

                  <div className="veteran-dropdown-divider" />

                  <button
                    type="button"
                    className="veteran-dropdown-item text-danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="veteran-content-canvas" id="main-content">
          <div className="veteran-content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Real-Time Notification Toasts */}
      <NotificationToastContainer />
    </div>
  );
};

export default VeteranLayout;
