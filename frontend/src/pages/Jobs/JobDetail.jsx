import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import jobService from '../../services/jobService';
import jobApplicationService from '../../services/jobApplicationService';
import documentService from '../../services/documentService';
import JobLocationMap from '../../components/Map/JobLocationMap';
import {
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Bookmark,
  Share2,
  ChevronLeft,
  Shield,
  FileText,
  Send,
  AlertCircle,
  ExternalLink,
  Check,
} from 'lucide-react';
import './JobDetail.css';

export const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Apply Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [vaultDocuments, setVaultDocuments] = useState([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(null);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await jobService.getJobById(id);
        if (res.success) {
          setJob(res.data.job);
          setIsSaved(res.data.job.isSaved || false);
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Job record not found or no longer active.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetail();
  }, [id]);

  const handleOpenApplyModal = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'VETERAN') {
      alert('Only registered Veterans can apply for defense resettlement postings.');
      return;
    }

    try {
      // Load veteran documents from Phase 3 vault
      const docRes = await documentService.getDocuments();
      if (docRes.success) {
        const docs = docRes.data.documents || [];
        setVaultDocuments(docs);
        if (docs.length > 0) {
          setSelectedResumeId(docs[0]._id || docs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load veteran documents:', err);
    }

    setShowApplyModal(true);
  };

  const handleToggleBookmark = async () => {
    if (!user || user.role !== 'VETERAN') {
      alert('Please log in as a registered Veteran to bookmark opportunities.');
      return;
    }

    try {
      if (isSaved) {
        await jobService.unsaveJob(job._id);
        setIsSaved(false);
      } else {
        await jobService.saveJob(job._id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleSubmitJobApplication = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setApplyError(null);

      let resumeDoc = null;
      if (selectedResumeId) {
        const found = vaultDocuments.find(
          (d) => (d._id || d.id) === selectedResumeId
        );
        if (found) {
          resumeDoc = {
            document: found._id || found.id,
            documentName: found.documentName,
            fileUrl: found.fileUrl,
          };
        }
      }

      const payload = {
        coverLetter,
        resumeDocument: resumeDoc,
      };

      const res = await jobApplicationService.applyForJob(job._id, payload);
      if (res.success) {
        setApplySuccess(res.data);
        setJob((prev) => ({
          ...prev,
          existingApplication: res.data.application,
        }));
      }
    } catch (err) {
      console.error('Job application submission error:', err);
      setApplyError(
        err.response?.data?.message ||
          'Failed to submit application. Please verify your profile and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Best in Defense Industry';
    const toLakhs = (val) => `${(val / 100000).toFixed(1)} LPA`;
    if (min && max) return `₹${toLakhs(min)} - ₹${toLakhs(max)}`;
    if (min) return `₹${toLakhs(min)}+`;
    return `Up to ₹${toLakhs(max)}`;
  };

  if (loading) {
    return (
      <div className="job-detail-page">
        <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
          <p style={{ color: '#64748b' }}>Loading opportunity details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-detail-page">
        <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
          <div className="alert alert-danger" style={{ padding: '2rem' }}>
            <AlertCircle size={40} style={{ margin: '0 auto 1rem', color: '#dc2626' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{error}</h2>
            <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
              This job posting may have expired or been deactivated by the recruiting employer.
            </p>
            <Link to="/jobs" className="btn btn-primary">
              <ChevronLeft size={16} /> Back to Job Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/jobs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <ChevronLeft size={18} /> Back to All Opportunities
          </Link>
        </div>

        {/* Top Header Card */}
        <div className="job-detail-header-card">
          <div className="job-detail-top-row">
            <div className="job-detail-title-group">
              <div className="job-detail-logo">
                {job.employer?.companyName ? job.employer.companyName.charAt(0) : 'D'}
              </div>
              <div>
                <h1 className="job-detail-title">{job.title}</h1>
                <div className="job-detail-company">
                  <Building2 size={18} />
                  <span>{job.employer?.companyName}</span>
                  {job.employer?.verificationStatus === 'VERIFIED' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: '#f0fdf4',
                        color: '#16a34a',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <CheckCircle2 size={13} /> Verified Corporate Partner
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="job-detail-actions">
              {user?.role === 'VETERAN' && (
                <button
                  onClick={handleToggleBookmark}
                  className={`btn ${isSaved ? 'btn-secondary' : 'btn-outline'}`}
                  title={isSaved ? 'Saved to Bookmarks' : 'Save Job'}
                >
                  <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              )}

              {job.existingApplication ? (
                <Link
                  to={`/veteran/job-applications/${job.existingApplication.applicationId || job.existingApplication._id}`}
                  className="btn btn-primary"
                  style={{ background: '#16a34a', borderColor: '#16a34a' }}
                >
                  <Check size={18} /> View Applied Status
                </Link>
              ) : user?.role === 'VETERAN' ? (
                <button onClick={handleOpenApplyModal} className="btn btn-primary">
                  <Send size={18} /> Apply for Position
                </button>
              ) : !user ? (
                <Link to="/login" className="btn btn-primary">
                  Login to Apply
                </Link>
              ) : null}
            </div>
          </div>

          {/* Meta Grid */}
          <div className="job-detail-meta-grid">
            <div className="meta-box">
              <span className="meta-box-label">Location</span>
              <span className="meta-box-val">
                <MapPin size={16} className="text-muted" />
                {job.city ? `${job.city}, ${job.state}` : job.location}
              </span>
            </div>

            <div className="meta-box">
              <span className="meta-box-label">Work Mode</span>
              <span className="meta-box-val">{job.workMode}</span>
            </div>

            <div className="meta-box">
              <span className="meta-box-label">Employment Type</span>
              <span className="meta-box-val">{job.employmentType.replace('_', ' ')}</span>
            </div>

            <div className="meta-box">
              <span className="meta-box-label">Salary Package</span>
              <span className="meta-box-val">{formatSalary(job.salaryMin, job.salaryMax)}</span>
            </div>

            <div className="meta-box">
              <span className="meta-box-label">Experience Required</span>
              <span className="meta-box-val">{job.experienceMin}+ Years</span>
            </div>

            <div className="meta-box">
              <span className="meta-box-label">Application Deadline</span>
              <span className="meta-box-val">
                <Calendar size={16} className="text-muted" />
                {job.applicationDeadline
                  ? new Date(job.applicationDeadline).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Open Until Filled'}
              </span>
            </div>
          </div>

          {/* Veteran Profile Match Breakdown */}
          {job.matchDetails && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    background: '#f0fdf4',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Sparkles size={18} />
                  {job.matchDetails.matchPercentage}% Military Match Score
                </div>
                <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                  {job.matchDetails.matchedFactors?.slice(0, 2).join(' • ')}
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Calculated via Portal Resettlement Engine
              </span>
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="job-detail-layout">
          {/* Main Specifications */}
          <main>
            {/* Job Description */}
            <div className="job-detail-section">
              <h2 className="section-heading">
                <Briefcase size={20} /> Role Overview
              </h2>
              <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#334155', whiteSpace: 'pre-line' }}>
                {job.description}
              </p>
            </div>

            {/* Key Responsibilities */}
            {(job.responsibilities || []).length > 0 && (
              <div className="job-detail-section">
                <h2 className="section-heading">
                  <CheckCircle2 size={20} /> Key Responsibilities
                </h2>
                <ul className="bullet-list">
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} className="bullet-item">
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements & Military Background */}
            {(job.requirements || []).length > 0 && (
              <div className="job-detail-section">
                <h2 className="section-heading">
                  <Shield size={20} /> Candidate Qualifications & Defense Background
                </h2>
                <ul className="bullet-list">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="bullet-item">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Skills */}
            <div className="job-detail-section">
              <h2 className="section-heading">
                <Sparkles size={20} /> Required Technical & Defense Skills
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {(job.requiredSkills || []).map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      padding: '0.4rem 0.875rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {(job.preferredSkills || []).length > 0 && (
                <>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>
                    Preferred Additional Certifications
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {job.preferredSkills.map((pskill, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                        }}
                      >
                        {pskill}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Compensation & Benefits */}
            {(job.benefits || []).length > 0 && (
              <div className="job-detail-section">
                <h2 className="section-heading">
                  <DollarSign size={20} /> Benefits & Allowances
                </h2>
                <ul className="bullet-list">
                  {job.benefits.map((benefit, i) => (
                    <li key={i} className="bullet-item">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactive Job Location & Deployment Map */}
            <JobLocationMap
              city={job.city}
              state={job.state}
              location={job.location}
              workMode={job.workMode}
              latitude={job.latitude}
              longitude={job.longitude}
            />
          </main>

          {/* Right Sidebar */}
          <aside>
            {/* About Employer */}
            <div className="job-detail-section">
              <h2 className="section-heading">About Employer</h2>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                  {job.employer?.companyName}
                </h3>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{job.employer?.industry}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                {job.employer?.companyDescription}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Company Size:</span>
                  <strong style={{ color: '#0f172a' }}>{job.employer?.companySize || '500+'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Location:</span>
                  <strong style={{ color: '#0f172a' }}>{job.employer?.city}, {job.employer?.state}</strong>
                </div>
                {job.employer?.website && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Website:</span>
                    <a
                      href={job.employer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      Visit Portal <ExternalLink size={13} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Summary Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '1.5rem',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
                Opportunity Overview
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Job ID:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{job.jobId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Open Positions:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{job.openings} Openings</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Total Applicants:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{job.applicantCount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: job.status === 'ACTIVE' ? '#16a34a' : '#ea580c',
                    }}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="modal-overlay">
          <div className="apply-modal-box">
            {applySuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#f0fdf4',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Application Submitted!
                </h2>
                <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Your application for <strong>{job.title}</strong> has been transmitted directly to the{' '}
                  <strong>{job.employer?.companyName}</strong> recruitment team.
                </p>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontWeight: 700,
                    color: '#0f2438',
                    marginBottom: '1.75rem',
                  }}
                >
                  Application Tracking ID: {applySuccess.applicationId}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <Link
                    to={`/veteran/job-applications/${applySuccess.applicationId}`}
                    className="btn btn-primary"
                  >
                    Track Application Status
                  </Link>
                  <button onClick={() => setShowApplyModal(false)} className="btn btn-secondary">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                      Apply for Position
                    </h2>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {job.title} • {job.employer?.companyName}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowApplyModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    &times;
                  </button>
                </div>

                {applyError && (
                  <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {applyError}
                  </div>
                )}

                <form onSubmit={handleSubmitJobApplication}>
                  {/* Select Resume / Certificate from Vault */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#334155', marginBottom: '0.5rem' }}>
                      Attach Resume / Military Record from Document Vault
                    </label>
                    {vaultDocuments.length === 0 ? (
                      <div
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          padding: '0.875rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          color: '#b45309',
                        }}
                      >
                        No documents found in your Document Vault.{' '}
                        <Link to="/veteran/documents" target="_blank" style={{ fontWeight: 700, textDecoration: 'underline' }}>
                          Upload your resume in Documents Vault
                        </Link>{' '}
                        or proceed with your verified service profile.
                      </div>
                    ) : (
                      <select
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                      >
                        {vaultDocuments.map((doc) => (
                          <option key={doc._id || doc.id} value={doc._id || doc.id}>
                            {doc.documentName} ({doc.documentType})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Cover Letter */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#334155', marginBottom: '0.5rem' }}>
                      Statement of Suitability / Cover Note (Optional)
                    </label>
                    <textarea
                      rows={4}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Highlight your key defense appointments, technical specializations, or security leadership experience..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  {/* Declaration Note */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '0.875rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.8125rem',
                      color: '#64748b',
                      marginBottom: '1.5rem',
                    }}
                  >
                    By submitting, your verified service profile details (Rank, Service Branch, Service Duration, Education, and Skills) will be securely shared with {job.employer?.companyName} for recruitment evaluation.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="btn btn-secondary"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting Application...' : 'Confirm & Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
