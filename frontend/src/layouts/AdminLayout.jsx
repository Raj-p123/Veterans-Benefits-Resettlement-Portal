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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { adminService } from '../services/adminService.js';
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

  // Structured government navigation groups
  const navigationGroups = [
    {
      groupTitle: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: 'REGISTRATION & VERIFICATION',
      items: [
        { label: 'Veterans', path: ROUTES.ADMIN_VETERANS, icon: Users },
        { label: 'Employers', path: ROUTES.ADMIN_EMPLOYERS, icon: Building2 },
        { label: 'Documents Vault', path: ROUTES.ADMIN_DOCUMENTS, icon: FileCheck2 },
      ],
    },
    {
      groupTitle: 'SERVICES & WELFARE',
      items: [
        { label: 'Welfare Schemes', path: ROUTES.ADMIN_SCHEMES, icon: Award },
        { label: 'Scheme Applications', path: ROUTES.ADMIN_SCHEME_APPLICATIONS, icon: FileText },
        { label: 'Job Moderation', path: ROUTES.ADMIN_JOBS, icon: Briefcase },
        { label: 'Job Applications', path: ROUTES.ADMIN_JOB_APPLICATIONS, icon: Briefcase },
      ],
    },
    {
      groupTitle: 'GOVERNANCE & AUDIT',
      items: [
        { label: 'Portal Users', path: ROUTES.ADMIN_USERS, icon: Users },
        { label: 'Reports & Export', path: ROUTES.ADMIN_REPORTS, icon: FileSpreadsheet },
        { label: 'Analytics & KPIs', path: ROUTES.ADMIN_ANALYTICS, icon: BarChart3 },
        { label: 'Audit Trail', path: ROUTES.ADMIN_AUDIT_LOGS, icon: ShieldAlert },
      ],
    },
    {
      groupTitle: 'ADMINISTRATION',
      items: [
        { label: 'Notifications', path: ROUTES.ADMIN_NOTIFICATIONS, icon: Bell },
        { label: 'System Settings', path: ROUTES.ADMIN_SETTINGS, icon: Settings },
      ],
    },
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
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Government Institutional Sidebar */}
      <aside className={`admin-sidebar ${mobileDrawerOpen ? 'drawer-open' : ''}`} aria-label="Administrative Navigation">
        {/* Sidebar Header with Institutional Branding */}
        <div className="admin-sidebar-header">
          <Link to={ROUTES.ADMIN_DASHBOARD} className="admin-brand-link">
            <div className="admin-brand-icon">
              <Shield size={20} strokeWidth={2.4} />
            </div>
            {!sidebarCollapsed && (
              <div className="admin-brand-text">
                <span className="admin-brand-title">VBR PORTAL</span>
                <span className="admin-brand-subtitle">Veterans Benefits & Resettlement</span>
              </div>
            )}
          </Link>
          <button
            type="button"
            className="admin-sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Sidebar Nav with Section Headings */}
        <nav className="admin-sidebar-nav">
          {navigationGroups.map((group) => (
            <div key={group.groupTitle} className="admin-nav-group">
              {!sidebarCollapsed && (
                <div className="admin-nav-group-title">{group.groupTitle}</div>
              )}
              <ul className="admin-nav-list">
                {group.items.map((item) => {
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
                        <Icon size={17} className="admin-nav-icon" aria-hidden="true" />
                        {!sidebarCollapsed && <span className="admin-nav-label">{item.label}</span>}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-nav-link admin-logout-btn"
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={17} className="admin-nav-icon" aria-hidden="true" />
            {!sidebarCollapsed && <span className="admin-nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        {/* Top Government Institutional Header */}
        <header className="admin-topbar" role="banner">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              aria-label="Toggle navigation drawer"
            >
              {mobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Global Search with Live Dropdown */}
            <div className="admin-search-container" ref={searchContainerRef}>
              <div className="admin-search-input-wrapper">
                <Search size={16} className="admin-search-icon" aria-hidden="true" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search Veterans, Employers, Schemes, Jobs, Applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults && totalResultsCount > 0) setSearchDropdownOpen(true);
                  }}
                  aria-label="Global portal search"
                />
                {searchLoading && <span className="admin-search-spinner" aria-hidden="true" />}
              </div>

              {/* Search Results Dropdown */}
              {searchDropdownOpen && searchResults && (
                <div className="admin-search-dropdown" role="region" aria-label="Search results">
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
            {/* View Public Portal Link */}
            <Link to={ROUTES.HOME} className="admin-portal-link" target="_blank" title="Open Public Portal">
              <span>View Portal</span>
              <ExternalLink size={13} aria-hidden="true" />
            </Link>

            <div className="admin-topbar-divider" aria-hidden="true" />

            {/* Notification Bell */}
            <NotificationBell />

            <div className="admin-topbar-divider" aria-hidden="true" />

            {/* Admin Profile Dropdown */}
            <div className="admin-profile-menu-container" ref={profileDropdownRef}>
              <button
                type="button"
                className="admin-profile-pill"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
                aria-label="Administrator account menu"
              >
                <div className="admin-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="admin-user-info-text">
                  <span className="admin-name">{user?.name || 'Administrator'}</span>
                  <span className="admin-role-badge">SUPER ADMIN</span>
                </div>
                <ChevronDown size={13} className="admin-dropdown-chevron" aria-hidden="true" />
              </button>

              {profileDropdownOpen && (
                <div className="admin-profile-dropdown" role="menu">
                  <div className="admin-profile-dropdown-header">
                    <strong>{user?.name || 'Central Administrator'}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <hr className="admin-divider" />
                  <Link
                    to={ROUTES.ADMIN_SETTINGS}
                    className="admin-dropdown-item"
                    role="menuitem"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings size={15} />
                    <span>System Settings</span>
                  </Link>
                  <Link
                    to={ROUTES.ADMIN_AUDIT_LOGS}
                    className="admin-dropdown-item"
                    role="menuitem"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <ShieldAlert size={15} />
                    <span>Audit Trail</span>
                  </Link>
                  <hr className="admin-divider" />
                  <button
                    type="button"
                    className="admin-dropdown-item admin-dropdown-logout"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="admin-content-canvas" id="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
