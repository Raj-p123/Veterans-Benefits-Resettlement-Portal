import React, { useState } from 'react';
import { ShieldAlert, Users, Award, Briefcase, Activity, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../services/api.js';
import PageContainer from '../../components/PageContainer/PageContainer.jsx';
import Badge from '../../components/Badge/Badge.jsx';
import Button from '../../components/Button/Button.jsx';
import './Dashboard.css';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const handleTestAdminApi = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await authApi.testRole('admin');
      setTestResult({
        success: true,
        message: res.message || 'Admin authorized API call succeeded!',
        data: res.data,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Authorization failed',
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <PageContainer width="wide">
      <div className="dashboard-wrapper">
        {/* Banner */}
        <div className="dashboard-banner" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}>
          <div className="dashboard-user-info">
            <h1>System Administrator Control Console</h1>
            <div className="dashboard-user-meta">
              <span>Admin: {user?.name}</span>
              <span>•</span>
              <span>Email: {user?.email}</span>
              <span>•</span>
              <Badge variant="danger">ADMIN PRIVILEGE</Badge>
            </div>
          </div>
          <div>
            <Badge variant="success">System Core Online</Badge>
          </div>
        </div>

        {/* Phase Status Notice */}
        <div className="dashboard-phase-notice" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', borderColor: 'var(--color-danger-border)' }}>
          <div className="dashboard-phase-notice-icon" style={{ backgroundColor: 'var(--color-danger)' }}>
            <Lock size={22} />
          </div>
          <div className="dashboard-phase-text">
            <h4>Phase 2 Role-Protected Admin Environment</h4>
            <p>
              Only authenticated users with the <code>ADMIN</code> role can view this dashboard or invoke Admin API routes.
              Advanced User Management, Scheme Approvals, and Audit Logs will be implemented in subsequent phases.
            </p>
          </div>
        </div>

        {/* Live Admin Role API Verification Tool */}
        <div style={{ backgroundColor: '#fff', border: '1px solid var(--color-border-main)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary-900)', marginBottom: '0.5rem' }}>
            Live Role-Based API Authorization Check
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Verify that your JWT token contains valid Admin permissions by executing a test call to the protected endpoint <code>GET /api/auth/test/admin</code>.
          </p>
          <Button variant="primary" size="sm" onClick={handleTestAdminApi} loading={testLoading} icon={ShieldAlert}>
            Test Admin Authorization Route
          </Button>

          {testResult && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: testResult.success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', border: `1px solid ${testResult.success ? 'var(--color-success-border)' : 'var(--color-danger-border)'}` }}>
              <strong style={{ color: testResult.success ? 'var(--color-success)' : 'var(--color-danger)', display: 'block', marginBottom: '4px' }}>
                {testResult.success ? '✓ Authorization Verification Passed' : '✗ Authorization Verification Failed'}
              </strong>
              <div style={{ fontSize: '0.875rem', color: '#334155' }}>
                {testResult.message}
              </div>
            </div>
          )}
        </div>

        {/* Future Admin Modules */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-950)', marginBottom: '1rem' }}>
          Portal Governance & Administration Modules
        </h3>

        <div className="dashboard-cards-grid">
          <div className="dashboard-module-card">
            <div className="module-card-icon">
              <Users size={22} />
            </div>
            <h4 className="module-card-title">User Management & Moderation</h4>
            <p className="module-card-desc">
              Manage accounts, verify service IDs, toggle active statuses, and inspect user activity logs.
            </p>
            <span className="module-card-badge">Planned for Phase 3+</span>
          </div>

          <div className="dashboard-module-card">
            <div className="module-card-icon">
              <Award size={22} />
            </div>
            <h4 className="module-card-title">Welfare Scheme Management</h4>
            <p className="module-card-desc">
              Publish new central and state schemes, configure eligibility criteria, and disburse grants.
            </p>
            <span className="module-card-badge">Planned for Phase 3+</span>
          </div>

          <div className="dashboard-module-card">
            <div className="module-card-icon">
              <Activity size={22} />
            </div>
            <h4 className="module-card-title">System Metrics & Security Audit</h4>
            <p className="module-card-desc">
              Monitor active logins, API latency, registration throughput, and access control audit trails.
            </p>
            <span className="module-card-badge">Planned for Phase 3+</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AdminDashboard;
