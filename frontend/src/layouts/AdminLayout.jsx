import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Award,
  Briefcase,
  FileText,
  FileCheck2,
  FileSpreadsheet,
  BarChart3,
  ShieldAlert,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ExternalLink,
  ChevronDown,
  User,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { adminService } from '../services/adminService.js';
import { socketService } from '../services/socketService.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { ROUTES } from '../constants/index.js';
import NotificationBell from '../components/NotificationBell/NotificationBell.jsx';
import Badge from '../components/Badge/Badge.jsx';
import './AdminLayout.css';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Close drawer on route navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
    setSearchDropdownOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await adminService.globalSearch(searchQuery.trim());
        setSearchResults(res.data);
        setSearchDropdownOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const navItems = [
    { label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { label: 'Veterans', path: ROUTES.ADMIN_VETERANS, icon: Users },
    { label: 'Employers', path: ROUTES.ADMIN_EMPLOYERS, icon: Building2 },
    { label: 'Welfare Schemes', path: ROUTES.ADMIN_SCHEMES, icon: Award },
    { label: 'Job Moderation', path: ROUTES.ADMIN_JOBS, icon: Briefcase },
    { label: 'Scheme Applications', path: ROUTES.ADMIN_SCHEME_APPLICATIONS, icon: FileText },
    { label: 'Job Applications', path: ROUTES.ADMIN_JOB_APPLICATIONS, icon: Briefcase },
    { label: 'Documents Vault', path: ROUTES.ADMIN_DOCUMENTS, icon: FileCheck2 },
    { label: 'Portal Users', path: ROUTES.ADMIN_USERS, icon: Users },
    { label: 'Reports & Export', path: ROUTES.ADMIN_REPORTS, icon: FileSpreadsheet },
    { label: 'Analytics & KPIs', path: ROUTES.ADMIN_ANALYTICS, icon: BarChart3 },
    { label: 'Audit Trail', path: ROUTES.ADMIN_AUDIT_LOGS, icon: ShieldAlert },
    { label: 'Notifications', path: ROUTES.ADMIN_NOTIFICATIONS, icon: Bell },
    { label: 'System Settings', path: ROUTES.ADMIN_SETTINGS, icon: Settings },
  ];

  const totalResultsCount = searchResults
    ? (searchResults.veterans?.length || 0) +
      (searchResults.employers?.length || 0) +
      (searchResults.schemes?.length || 0) +
      (searchResults.jobs?.length || 0) +
      (searchResults.applications?.length || 0)
    : 0;

  return (
    <div className={`admin-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Backdrop */}
      {mobileDrawerOpen && (
        <div className="admin-mobile-backdrop" onClick={() => setMobileDrawerOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileDrawerOpen ? 'drawer-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="admin-sidebar-header">
          <Link to={ROUTES.ADMIN_DASHBOARD} className="admin-brand-link">
            <div className="admin-brand-icon">
              <Shield size={22} />
            </div>
            {!sidebarCollapsed && (
              <div className="admin-brand-text">
                <span className="admin-brand-title">Admin Console</span>
                <span className="admin-brand-subtitle">Gov Portal GovOS</span>
              </div>
            )}
          </Link>
          <button
            type="button"
            className="admin-sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="admin-sidebar-nav">
          <ul className="admin-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `admin-nav-link ${isActive ? 'active' : ''}`
                    }
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={19} className="admin-nav-icon" />
                    {!sidebarCollapsed && <span className="admin-nav-label">{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-nav-link admin-logout-btn"
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={19} className="admin-nav-icon" />
            {!sidebarCollapsed && <span className="admin-nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              aria-label="Toggle navigation drawer"
            >
              {mobileDrawerOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Global Search with Live Dropdown */}
            <div className="admin-search-container" ref={searchContainerRef}>
              <div className="admin-search-input-wrapper">
                <Search size={17} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search Veterans, Employers, Schemes, Jobs, Applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults && totalResultsCount > 0) setSearchDropdownOpen(true);
                  }}
                />
                {searchLoading && <span className="admin-search-spinner" />}
              </div>

              {/* Search Results Dropdown */}
              {searchDropdownOpen && searchResults && (
                <div className="admin-search-dropdown">
                  {totalResultsCount === 0 ? (
                    <div className="admin-search-empty">
                      No matching records found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="admin-search-groups">
                      {searchResults.veterans?.length > 0 && (
                        <div className="admin-search-group">
                          <div className="admin-search-group-title">Veterans</div>
                          {searchResults.veterans.map((v) => (
                            <Link
                              key={v.id}
                              to={v.url}
                              className="admin-search-item"
                              onClick={() => setSearchDropdownOpen(false)}
                            >
                              <div>
                                <strong>{v.title}</strong>
                                <small>{v.subtitle}</small>
                              </div>
                              <Badge variant={v.badge === 'VERIFIED' ? 'success' : 'warning'}>
                                {v.badge}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchResults.employers?.length > 0 && (
                        <div className="admin-search-group">
                          <div className="admin-search-group-title">Employers</div>
                          {searchResults.employers.map((e) => (
                            <Link
                              key={e.id}
                              to={e.url}
                              className="admin-search-item"
                              onClick={() => setSearchDropdownOpen(false)}
                            >
                              <div>
                                <strong>{e.title}</strong>
                                <small>{e.subtitle}</small>
                              </div>
                              <Badge variant={e.badge === 'VERIFIED' ? 'success' : 'warning'}>
                                {e.badge}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchResults.schemes?.length > 0 && (
                        <div className="admin-search-group">
                          <div className="admin-search-group-title">Welfare Schemes</div>
                          {searchResults.schemes.map((s) => (
                            <Link
                              key={s.id}
                              to={s.url}
                              className="admin-search-item"
                              onClick={() => setSearchDropdownOpen(false)}
                            >
                              <div>
                                <strong>{s.title}</strong>
                                <small>{s.subtitle}</small>
                              </div>
                              <Badge variant={s.badge === 'ACTIVE' ? 'success' : 'neutral'}>
                                {s.badge}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchResults.jobs?.length > 0 && (
                        <div className="admin-search-group">
                          <div className="admin-search-group-title">Job Postings</div>
                          {searchResults.jobs.map((j) => (
                            <Link
                              key={j.id}
                              to={j.url}
                              className="admin-search-item"
                              onClick={() => setSearchDropdownOpen(false)}
                            >
                              <div>
                                <strong>{j.title}</strong>
                                <small>{j.subtitle}</small>
                              </div>
                              <Badge variant={j.badge === 'ACTIVE' ? 'success' : 'neutral'}>
                                {j.badge}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchResults.applications?.length > 0 && (
                        <div className="admin-search-group">
                          <div className="admin-search-group-title">Applications</div>
                          {searchResults.applications.map((a) => (
                            <Link
                              key={a.id}
                              to={a.url}
                              className="admin-search-item"
                              onClick={() => setSearchDropdownOpen(false)}
                            >
                              <div>
                                <strong>{a.title}</strong>
                                <small>{a.subtitle}</small>
                              </div>
                              <Badge variant={a.badge === 'APPROVED' ? 'success' : 'info'}>
                                {a.badge}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Topbar Controls */}
          <div className="admin-topbar-right">
            {/* View Live Portal shortcut */}
            <Link to={ROUTES.HOME} className="admin-portal-link" target="_blank" title="Open Public Portal">
              <span>View Portal</span>
              <ExternalLink size={14} />
            </Link>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Admin Profile Dropdown */}
            <div className="admin-profile-menu-container" ref={profileDropdownRef}>
              <button
                type="button"
                className="admin-profile-pill"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
              >
                <div className="admin-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="admin-user-info-text">
                  <span className="admin-name">{user?.name || 'Administrator'}</span>
                  <span className="admin-role-badge">SUPER ADMIN</span>
                </div>
                <ChevronDown size={14} className="admin-dropdown-chevron" />
              </button>

              {profileDropdownOpen && (
                <div className="admin-profile-dropdown">
                  <div className="admin-profile-dropdown-header">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <hr className="admin-divider" />
                  <Link
                    to={ROUTES.ADMIN_SETTINGS}
                    className="admin-dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    to={ROUTES.ADMIN_AUDIT_LOGS}
                    className="admin-dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <ShieldAlert size={16} />
                    <span>Audit Trail</span>
                  </Link>
                  <hr className="admin-divider" />
                  <button
                    type="button"
                    className="admin-dropdown-item admin-dropdown-logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="admin-content-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
