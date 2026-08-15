import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import employerService from '../../../services/employerService';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Shield,
  Sparkles,
  Save,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import './CreateJob.css';

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

const WORK_MODES = [
  { value: 'ONSITE', label: 'Onsite' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];

const JOB_STATUS = [
  { value: 'ACTIVE', label: 'Active (Public)' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CLOSED', label: 'Closed' },
];

export const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    industry: '',
    location: '',
    city: '',
    state: '',
    employmentType: 'FULL_TIME',
    workMode: 'ONSITE',
    salaryMin: 0,
    salaryMax: 0,
    experienceMin: 0,
    experienceMax: 30,
    education: '',
    requiredSkills: '',
    preferredSkills: '',
    responsibilities: '',
    requirements: '',
    benefits: '',
    openings: 1,
    applicationDeadline: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await employerService.getEmployerJobById(id);
        if (res.success && res.data.job) {
          const j = res.data.job;
          setFormData({
            title: j.title || '',
            description: j.description || '',
            industry: j.industry || '',
            location: j.location || '',
            city: j.city || '',
            state: j.state || '',
            latitude: j.latitude || '',
            longitude: j.longitude || '',
            employmentType: j.employmentType || 'FULL_TIME',
            workMode: j.workMode || 'ONSITE',
            salaryMin: j.salaryMin || 0,
            salaryMax: j.salaryMax || 0,
            experienceMin: j.experienceMin || 0,
            experienceMax: j.experienceMax || 30,
            education: j.education || '',
            requiredSkills: (j.requiredSkills || []).join(', '),
            preferredSkills: (j.preferredSkills || []).join(', '),
            responsibilities: (j.responsibilities || []).join('\n'),
            requirements: (j.requirements || []).join('\n'),
            benefits: (j.benefits || []).join('\n'),
            openings: j.openings || 1,
            applicationDeadline: j.applicationDeadline
              ? new Date(j.applicationDeadline).toISOString().split('T')[0]
              : '',
            status: j.status || 'ACTIVE',
          });
        }
      } catch (err) {
        console.error('Error fetching job for edit:', err);
        setError('Job record not found or access denied.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        salaryMin: Number(formData.salaryMin),
        salaryMax: Number(formData.salaryMax),
        experienceMin: Number(formData.experienceMin),
        experienceMax: Number(formData.experienceMax),
        openings: Number(formData.openings),
        applicationDeadline: formData.applicationDeadline ? formData.applicationDeadline : null,
        requiredSkills: formData.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        preferredSkills: formData.preferredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        responsibilities: formData.responsibilities
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        requirements: formData.requirements
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        benefits: formData.benefits
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const res = await employerService.updateJob(id, payload);
      if (res.success) {
        alert('Job updated successfully!');
        navigate('/employer/jobs');
      }
    } catch (err) {
      console.error('Failed to update job:', err);
      setError(err.response?.data?.message || 'Failed to update job.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-job-page">
        <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b' }}>Loading opportunity details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-job-page">
      <div className="container" style={{ maxWidth: '880px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/employer/jobs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <ChevronLeft size={18} /> Back to Job Management
          </Link>
        </div>

        <div className="job-form-card">
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Edit Job Opportunity
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Modify role requirements, salary parameters, or vacancy status.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <Briefcase size={18} /> Job Details
              </h2>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-grid-3">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Employment Type *
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Work Mode *
                  </label>
                  <select
                    name="workMode"
                    value={formData.workMode}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {WORK_MODES.map((wm) => (
                      <option key={wm.value} value={wm.value}>
                        {wm.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Posting Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {JOB_STATUS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Role Description *
                </label>
                <textarea
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* Location & Map Coordinates */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <MapPin size={18} /> Location & Map Coordinates
              </h2>

              <div className="form-grid-3">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Facility / Address
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Latitude (GPS)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    placeholder="e.g. 20.2961"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Longitude (GPS)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    placeholder="e.g. 85.8245"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>

            {/* Compensation & Experience */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <DollarSign size={18} /> Compensation & Service Experience
              </h2>

              <div className="form-grid-2">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Salary Min (INR / Annum)
                  </label>
                  <input
                    type="number"
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Salary Max (INR / Annum)
                  </label>
                  <input
                    type="number"
                    name="salaryMax"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Min Service Years
                  </label>
                  <input
                    type="number"
                    name="experienceMin"
                    value={formData.experienceMin}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Open Positions
                  </label>
                  <input
                    type="number"
                    name="openings"
                    value={formData.openings}
                    onChange={handleChange}
                    min={1}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <Link to="/employer/jobs" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={16} /> {submitting ? 'Saving Changes...' : 'Save Job Updates'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJob;
