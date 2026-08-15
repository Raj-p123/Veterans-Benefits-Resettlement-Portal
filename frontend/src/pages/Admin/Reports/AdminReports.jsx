import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Users,
  Building2,
  Award,
  Briefcase,
  FileText,
  ShieldCheck,
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';
import './AdminReports.css';

export const AdminReports = () => {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for CSV Exports
  const [dateFilter, setDateFilter] = useState('ALL');
  const [downloadingReport, setDownloadingReport] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getReportsSummary();
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Error fetching reports summary:', err);
      setError(err.message || 'Failed to load reports metadata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDownloadCsv = async (reportType, filename) => {
    setDownloadingReport(reportType);
    try {
      await adminService.downloadReportCsv(reportType, {
        range: dateFilter !== 'ALL' ? dateFilter : undefined,
      });
    } catch (err) {
      console.error('Export error:', err);
      alert(err.message || 'Failed to download CSV report');
    } finally {
      setDownloadingReport(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="lg" text="Compiling data warehouse reports metadata..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorMessage message={error} onRetry={fetchSummary} />
      </div>
    );
  }

  const reportsList = [
    {
      id: 'veterans',
      title: 'Veterans Military Directory',
      description: 'Comprehensive roster of registered defense veterans, ranks, service credentials, verification statuses, and contact details.',
      count: summary?.veterans || 0,
      icon: Users,
      badge: 'Demographics',
      filename: 'veterans_military_directory.csv',
    },
    {
      id: 'employers',
      title: 'Corporate Employers Register',
      description: 'Directory of verified corporate employers, industry categories, headquarters locations, contact liaisons, and active postings.',
      count: summary?.employers || 0,
      icon: Building2,
      badge: 'Corporates',
      filename: 'corporate_employers_directory.csv',
    },
    {
      id: 'schemes',
      title: 'Welfare Schemes & Grants Master',
      description: 'Catalog of active and archived welfare schemes, official issuing authorities, target states, and application metrics.',
      count: summary?.schemes || 0,
      icon: Award,
      badge: 'Welfare',
      filename: 'welfare_schemes_master.csv',
    },
    {
      id: 'jobs',
      title: 'Corporate Job Openings Master',
      description: 'Complete audit log of all defense employment listings, salary ranges, required military qualifications, and applicant counts.',
      count: summary?.jobs || 0,
      icon: Briefcase,
      badge: 'Employment',
      filename: 'corporate_jobs_master.csv',
    },
    {
      id: 'scheme-applications',
      title: 'Scheme Claims & Disbursals Audit',
      description: 'Full transaction ledger of welfare claims, applicant veterans, scrutiny statuses, DBT bank account submissions, and timestamps.',
      count: summary?.schemeApplications || 0,
      icon: FileText,
      badge: 'Claims & DBT',
      filename: 'scheme_applications_disbursals.csv',
    },
    {
      id: 'job-applications',
      title: 'Job Candidate Applications & Hires',
      description: 'Audit log of all job applications, veteran candidates, AI match scores, corporate review statuses, and final selections.',
      count: summary?.jobApplications || 0,
      icon: Briefcase,
      badge: 'Recruitment',
      filename: 'job_candidate_applications.csv',
    },
    {
      id: 'verifications',
      title: 'Administrative Verification Scrutiny Logs',
      description: 'Chronological security audit trail of all verification approvals, rejections, administrator remarks, and IP addresses.',
      count: summary?.auditLogs || 0,
      icon: ShieldCheck,
      badge: 'Governance',
      filename: 'verification_audit_logs.csv',
    },
  ];

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Official Reports & CSV Export Engine</h1>
          <p>
            Generate and export departmental audit spreadsheets, compliance records, and structured database archives.
          </p>
        </div>

        <div className="analytics-range-selector">
          <Filter size={16} color="var(--color-slate-400)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-600)' }}>
            Date Scope:
          </span>
          <select
            className="admin-select"
            style={{ padding: '0.25rem 1.75rem 0.25rem 0.5rem', fontSize: '0.75rem' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="ALL">All Historical Records</option>
            <option value="30d">Last 30 Days Only</option>
            <option value="90d">Last 90 Days Only</option>
            <option value="year">Current Calendar Year</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="reports-grid">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          const isDownloading = downloadingReport === rep.id;

          return (
            <div key={rep.id} className="report-card">
              <div className="report-card-top">
                <div className="report-icon-wrap">
                  <Icon size={22} color="#2563eb" />
                </div>
                <Badge variant="neutral">{rep.badge}</Badge>
              </div>

              <div className="report-card-content">
                <h3 className="report-title">{rep.title}</h3>
                <p className="report-desc">{rep.description}</p>
              </div>

              <div className="report-card-footer">
                <div className="report-stat">
                  <span className="report-stat-num">{rep.count}</span>
                  <span className="report-stat-label">Total Records</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  loading={isDownloading}
                  onClick={() => handleDownloadCsv(rep.id, rep.filename)}
                >
                  Export CSV
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminReports;
