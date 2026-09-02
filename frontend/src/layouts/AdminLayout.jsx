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

  // Structured government administration navigation items
  const adminNavItems = [
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
  ];

  const totalResultsCount = searchResults
    ? (searchResults.veterans?.length || 0) +
      (searchResults.employers?.length || 0) +
      (searchResults.schemes?.length || 0) +
      (searchResults.jobs?.length || 0) +
      (searchResults.applications?.length || 0)
    : 0;

  return (
    <div className={`admin-gov-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ==================================================================
          1. TOP HEADER (PROFESSIONAL DARK NAVY GOVERNMENT-STYLE HEADER)
          ================================================================== */}
      <header className="admin-gov-topbar" role="banner">
        <div className="admin-topbar-left">
          <button
            type="button"
            className="admin-mobile-toggle"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            aria-label="Toggle navigation drawer"
          >
            {mobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* VBR Portal Institutional Branding */}
          <Link to={ROUTES.ADMIN_DASHBOARD} className="admin-header-brand-link">
            <Shield size={24} className="admin-header-shield-icon" aria-hidden="true" />
            <div className="admin-header-titles">
              <span className="admin-brand-main">VBR PORTAL</span>
              <span className="admin-brand-sub">Veterans Benefits & Resettlement Portal</span>
              <span className="admin-brand-dept">Ministry of Defence, Government of India</span>
            </div>
          </Link>
        </div>

        {/* Global Search in Header */}
        <div className="admin-topbar-center">
          <div className="admin-search-container" ref={searchContainerRef}>
            <div className="admin-search-input-wrapper">
              <Search size={15} className="admin-search-icon" aria-hidden="true" />
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

            {/* Live Search Results Dropdown */}
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

        {/* Topbar Controls Right */}
        <div className="admin-topbar-right">
          {/* Go to Public Portal Link */}
          <Link
            to={ROUTES.HOME}
            className="admin-public-portal-link"
            target="_blank"
            title="Open Public Resettlement Portal"
          >
            <span>Go to Public Portal</span>
            <ExternalLink size={13} aria-hidden="true" />
          </Link>

          <div className="admin-topbar-sep" aria-hidden="true" />

          {/* Notifications Bell */}
          <NotificationBell />

          <div className="admin-topbar-sep" aria-hidden="true" />

          {/* Administrator Profile Pill */}
          <div className="admin-profile-container" ref={profileDropdownRef}>
            <button
              type="button"
              className="admin-gov-profile-pill"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              aria-expanded={profileDropdownOpen}
              aria-label="Administrator profile menu"
            >
              <div className="admin-gov-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="admin-gov-profile-details">
                <span className="admin-gov-name">{user?.name || 'Administrator'}</span>
                <span className="admin-gov-role">SUPER ADMIN</span>
              </div>
              <ChevronDown size={13} className="admin-chevron" aria-hidden="true" />
            </button>

            {profileDropdownOpen && (
              <div className="admin-profile-dropdown" role="menu">
                <div className="admin-profile-dropdown-header">
                  <strong>{user?.name || 'Central Administrator'}</strong>
                  <span>{user?.email}</span>
                </div>
                <hr className="admin-dropdown-divider" />
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
                <hr className="admin-dropdown-divider" />
                <button
                  type="button"
                  className="admin-dropdown-item admin-dropdown-logout"
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

      {/* ==================================================================
          2. MAIN BODY WRAPPER (FIXED SIDEBAR + MAIN CONTENT CANVAS)
          ================================================================== */}
      <div className="admin-gov-body">
        {/* Left Sidebar */}
        <aside
          className={`admin-gov-sidebar ${mobileDrawerOpen ? 'drawer-open' : ''}`}
          aria-label="Administrative Navigation"
        >
          <div className="admin-sidebar-top-row">
            {!sidebarCollapsed && <span className="admin-sidebar-nav-title">PORTAL NAVIGATION</span>}
            <button
              type="button"
              className="admin-collapse-toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          <nav className="admin-sidebar-nav-container">
            {/* ADMINISTRATION SECTION */}
            <div className="admin-nav-section">
              {!sidebarCollapsed && (
                <div className="admin-nav-section-title">ADMINISTRATION</div>
              )}
              <ul className="admin-nav-list">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `admin-sidebar-link ${isActive ? 'active' : ''}`
                        }
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon size={16} className="sidebar-link-icon" aria-hidden="true" />
                        {!sidebarCollapsed && (
                          <span className="sidebar-link-text">{item.label}</span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ACCOUNT SECTION */}
            <div className="admin-nav-section">
              {!sidebarCollapsed && (
                <div className="admin-nav-section-title">ACCOUNT</div>
              )}
              <ul className="admin-nav-list">
                <li>
                  <button
                    type="button"
                    className="admin-sidebar-link admin-sidebar-logout-link"
                    onClick={handleLogout}
                    title={sidebarCollapsed ? 'Logout' : undefined}
                  >
                    <LogOut size={16} className="sidebar-link-icon" aria-hidden="true" />
                    {!sidebarCollapsed && (
                      <span className="sidebar-link-text">Logout</span>
                    )}
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="admin-gov-content-area" id="admin-main-content">
          <Outlet />

          {/* Institutional Footer */}
          <footer className="admin-gov-footer" role="contentinfo">
            <div className="admin-footer-left">
              <span className="footer-brand">Veterans Benefits & Resettlement Portal (VBR Portal)</span>
              <span className="footer-sub">Central Administrative Management System • Resettlement & Welfare Operations</span>
            </div>
            <div className="admin-footer-right">
              <span className="footer-security-note">Confidential & Secure Internal Portal • Authorized Personnel Only</span>
              <div className="footer-links">
                <Link to={ROUTES.HOME} target="_blank">Public Portal</Link>
                <span className="footer-sep">•</span>
                <Link to={ROUTES.ABOUT}>About</Link>
                <span className="footer-sep">•</span>
                <Link to={ROUTES.CONTACT}>Help & Support</Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
