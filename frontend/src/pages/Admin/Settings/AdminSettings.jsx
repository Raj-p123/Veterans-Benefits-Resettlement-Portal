import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  KeyRound,
  User,
  Save,
  CheckCircle,
  AlertCircle,
  Server,
  Activity,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';
import './AdminSettings.css';

export const AdminSettings = () => {
  const { user: authUser, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile Edit Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getProfile();
      setProfile(res.data.admin);
      setName(res.data.admin.name || '');
      setPhone(res.data.admin.phone || '');
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setError(null);
    setProfileLoading(true);
    try {
      const res = await adminService.updateProfile({ name, phone });
      setProfile(res.data.admin);
      if (updateUser) updateUser(res.data.admin);
      setProfileSuccess('Administrator profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await adminService.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Administrator password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="lg" text="Loading administrative settings..." />
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Administrator Account & Security Settings</h1>
          <p>
            Configure administrative profile credentials, update encryption passwords, and inspect deployment environment status.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Column: Profile & Security Forms */}
        <div className="settings-col">
          {/* Card: Profile Details */}
          <div className="settings-card">
            <h3 className="settings-card-title">
              <User size={18} /> Administrator Profile
            </h3>

            {profileSuccess && (
              <div className="settings-alert-success">
                <CheckCircle size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}
            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="admin-form-group">
                <label className="admin-form-label">Official Full Name:</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Official Email Address (Immutable):</label>
                <input
                  type="email"
                  className="admin-form-input"
                  value={profile?.email || ''}
                  disabled
                />
                <span className="form-help-text">Government portal login identifier.</span>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Contact Phone Number:</label>
                <input
                  type="tel"
                  className="admin-form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button type="submit" variant="primary" size="sm" loading={profileLoading} icon={Save}>
                  Save Profile Details
                </Button>
              </div>
            </form>
          </div>

          {/* Card: Password Change */}
          <div className="settings-card">
            <h3 className="settings-card-title">
              <KeyRound size={18} /> Update Security Password
            </h3>

            {passwordSuccess && (
              <div className="settings-alert-success">
                <CheckCircle size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="settings-alert-error">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="admin-form-group">
                <label className="admin-form-label">Current Administrator Password:</label>
                <input
                  type="password"
                  className="admin-form-input"
                  placeholder="Enter current password..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="admin-form-group">
                  <label className="admin-form-label">New Password:</label>
                  <input
                    type="password"
                    className="admin-form-input"
                    placeholder="Min 8 characters..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Confirm New Password:</label>
                  <input
                    type="password"
                    className="admin-form-input"
                    placeholder="Repeat new password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button type="submit" variant="primary" size="sm" loading={passwordLoading} icon={KeyRound}>
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: System & Security Badges */}
        <div className="settings-col">
          {/* Card: System Health & Environment */}
          <div className="settings-card">
            <h3 className="settings-card-title">
              <Server size={18} /> System Environment Status
            </h3>

            <div className="dossier-info-list">
              <div className="dossier-info-row">
                <span className="dossier-label">Core System Version</span>
                <span className="dossier-value">v8.0.0 (Phase 8 Production)</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Database Cluster</span>
                <span className="dossier-value">
                  <Badge variant="success">MongoDB Atlas Connected</Badge>
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Socket.IO Synchronization</span>
                <span className="dossier-value">
                  <Badge variant="success">Active (Room: role:ADMIN)</Badge>
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Cloudinary Vault Storage</span>
                <span className="dossier-value">
                  <Badge variant="success">SSL Secured</Badge>
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Access Control Security</span>
                <span className="dossier-value">JWT Bearer + RBAC (SUPER ADMIN)</span>
              </div>
            </div>
          </div>

          {/* Card: Administrative Governance Rules */}
          <div className="settings-card">
            <h3 className="settings-card-title">
              <Shield size={18} /> Security Governance Rules
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-slate-700)' }}>
              <div className="security-rule-item">
                <CheckCircle size={16} color="#16a34a" />
                <span>All sensitive verifications and status changes are permanently recorded in the immutable audit trail.</span>
              </div>
              <div className="security-rule-item">
                <CheckCircle size={16} color="#16a34a" />
                <span>Direct impersonation of veteran and employer accounts is forbidden by system protocol.</span>
              </div>
              <div className="security-rule-item">
                <CheckCircle size={16} color="#16a34a" />
                <span>Administrator account self-deactivation safeguard is actively enforced.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
