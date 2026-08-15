import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Shield,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';

export const UsersList = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({ total: 0, veterans: 0, employers: 0, admins: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [isActive, setIsActive] = useState('ALL');

  // Deactivate / Activate modal state
  const [targetUser, setTargetUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers({
        page,
        limit: 10,
        search,
        role,
        isActive,
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
      setCounts(res.data.counts);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  }, [search, role, isActive]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleToggleStatus = async () => {
    if (!targetUser) return;
    const newStatus = !targetUser.isActive;

    // Frontend pre-check
    if (targetUser.id === currentAdmin?.id && !newStatus) {
      alert('Admin Safeguard: You cannot deactivate your own currently active administrator account.');
      setTargetUser(null);
      return;
    }

    setActionLoading(true);
    try {
      await adminService.updateUserStatus(targetUser.id, { isActive: newStatus });
      setTargetUser(null);
      fetchUsers(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to update account status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Portal User Management</h1>
          <p>
            Audit authenticated users, control login privileges, and activate or deactivate portal accounts with system safeguards.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-card">
        <div className="admin-filter-group">
          <div className="admin-input-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by Name, Email, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="admin-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ALL">All Roles ({counts.total})</option>
            <option value="VETERAN">Veterans ({counts.veterans})</option>
            <option value="EMPLOYER">Employers ({counts.employers})</option>
            <option value="ADMIN">Administrators ({counts.admins})</option>
          </select>

          <select className="admin-select" value={isActive} onChange={(e) => setIsActive(e.target.value)}>
            <option value="ALL">All Account States</option>
            <option value="true">Active ({counts.active})</option>
            <option value="false">Inactive / Suspended ({counts.inactive})</option>
          </select>
        </div>

        <div>
          <Badge variant="neutral">Total Accounts: {counts.total}</Badge>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner size="md" text="Loading user accounts..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorMessage message={error} onRetry={() => fetchUsers(pagination.page)} />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>
            No user accounts found matching criteria.
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact Info</th>
                  <th>Role</th>
                  <th>Verified Status</th>
                  <th>Account State</th>
                  <th>Last Login</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrentAdmin = u.id === currentAdmin?.id;
                  const lastLoginStr = u.lastLogin
                    ? new Date(u.lastLogin).toLocaleDateString() + ' ' + new Date(u.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Never';

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="admin-cell-title">{u.name}</span>
                          {isCurrentAdmin && (
                            <Badge variant="neutral" style={{ fontSize: '0.625rem' }}>
                              You
                            </Badge>
                          )}
                        </div>
                        <span className="admin-cell-sub">{u.email}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)' }}>
                          {u.phone || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            u.role === 'ADMIN'
                              ? 'danger'
                              : u.role === 'EMPLOYER'
                              ? 'warning'
                              : 'gold'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={u.isVerified ? 'success' : 'neutral'}>
                          {u.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          {lastLoginStr}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-row-actions" style={{ justifyContent: 'flex-end' }}>
                          {u.isActive ? (
                            <button
                              type="button"
                              className="admin-btn-action btn-reject"
                              disabled={isCurrentAdmin}
                              onClick={() => setTargetUser(u)}
                              title={isCurrentAdmin ? 'You cannot deactivate your own account' : 'Deactivate / Suspend Account'}
                            >
                              <UserX size={14} /> Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn-action btn-verify"
                              onClick={() => setTargetUser(u)}
                              title="Reactivate Account"
                            >
                              <UserCheck size={14} /> Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="admin-pagination-bar">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Users)
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {targetUser && (
        <div className="admin-modal-backdrop" onClick={() => setTargetUser(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {targetUser.isActive ? 'Deactivate User Account' : 'Reactivate User Account'}
              </h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setTargetUser(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={24} color={targetUser.isActive ? '#dc2626' : '#16a34a'} />
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-700)', marginBottom: '0.5rem' }}>
                    Are you sure you want to {targetUser.isActive ? 'deactivate' : 'reactivate'} the account for{' '}
                    <strong>{targetUser.name}</strong> ({targetUser.email})?
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                    {targetUser.isActive
                      ? 'The user will immediately be prevented from logging in to the portal until reactivated by an administrator.'
                      : 'The user will immediately regain portal login and access privileges.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setTargetUser(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={targetUser.isActive ? 'danger' : 'primary'}
                size="sm"
                onClick={handleToggleStatus}
                loading={actionLoading}
                icon={targetUser.isActive ? UserX : UserCheck}
              >
                Confirm {targetUser.isActive ? 'Deactivation' : 'Reactivation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
