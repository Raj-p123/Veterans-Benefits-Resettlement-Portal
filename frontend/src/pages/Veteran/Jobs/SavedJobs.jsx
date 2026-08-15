import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobService from '../../../services/jobService';
import {
  Bookmark,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Trash2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import './MyJobApplications.css';

export const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await jobService.getSavedJobs();
      if (res.success) {
        setSavedJobs(res.data.jobs || []);
      }
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
      setError('Unable to load saved jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleUnsave = async (jobId) => {
    try {
      await jobService.unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((j) => (j._id || j.jobId) !== jobId));
    } catch (err) {
      console.error('Failed to remove saved job:', err);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Best in Industry';
    const toLakhs = (val) => `${(val / 100000).toFixed(1)} LPA`;
    if (min && max) return `₹${toLakhs(min)} - ₹${toLakhs(max)}`;
    if (min) return `₹${toLakhs(min)}+`;
    return `Up to ₹${toLakhs(max)}`;
  };

  return (
    <div className="my-job-apps-page">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Bookmarked Defense Opportunities
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            Your saved jobs for quick review, preparation, and application.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b' }}>Loading bookmarked opportunities...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" style={{ textAlign: 'center', padding: '2rem' }}>
            {error}
          </div>
        ) : savedJobs.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              padding: '4rem 2rem',
              borderRadius: '0.75rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <Bookmark size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              No Saved Jobs
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              You haven't bookmarked any jobs yet. Browse defense career postings and click the bookmark icon to save them.
            </p>
            <Link to="/jobs" className="btn btn-primary">
              Browse Job Catalog
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {savedJobs.map((job) => (
              <div
                key={job._id || job.jobId}
                style={{
                  background: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                    <Link to={`/jobs/${job.jobId || job._id}`}>{job.title}</Link>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    <Building2 size={15} />
                    <span>{job.employer?.companyName || 'Defense Corporate'}</span>
                    <span style={{ color: '#94a3b8' }}>•</span>
                    <MapPin size={15} />
                    <span>{job.city}, {job.state}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                    <span>{job.employmentType.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                    <span>•</span>
                    <span>{job.experienceMin}+ Yrs Exp</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleUnsave(job._id || job.jobId)}
                    className="btn btn-outline"
                    style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '0.5rem 0.75rem' }}
                    title="Remove from saved"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                  <Link to={`/jobs/${job.jobId || job._id}`} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                    View & Apply <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
