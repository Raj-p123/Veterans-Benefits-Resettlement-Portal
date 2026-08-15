import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import employerService from '../../../services/employerService';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Shield,
  Sparkles,
  Save,
  Send,
  ChevronLeft,
  AlertCircle,
  Plus,
  Trash2,
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

const INDUSTRIES = [
  'Defense & Aerospace',
  'Defense Manufacturing',
  'Ammunition & Drone Systems',
  'Heavy Engineering & Artillery',
  'Tactical Vehicles & Maritime',
  'Cybersecurity & Intelligence',
  'Security & Facility Management',
  'Logistics & Supply Chain',
  'Information Technology',
  'Other',
];

export const CreateJob = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    industry: 'Defense & Aerospace',
    location: '',
    city: '',
    state: '',
    country: 'India',
    employmentType: 'FULL_TIME',
    workMode: 'ONSITE',
    salaryMin: 800000,
    salaryMax: 1500000,
    experienceMin: 5,
    experienceMax: 20,
    education: 'Graduate / Indian Armed Forces Defense Certified',
    requiredSkills: 'Security Operations, Risk Assessment, Team Leadership',
    preferredSkills: 'Electronic Surveillance, First Aid, VIP Protection',
    responsibilities:
      'Manage security and surveillance protocols across manufacturing sites.\nCoordinate quick reaction teams (QRT) and emergency response drills.\nLiaise with civil police and defense liaison units.',
    requirements:
      'Minimum 5 years of military service with exemplary discharge character.\nStrong commanding presence and crisis decision-making ability.',
    benefits:
      'Executive healthcare plan covering family\nAnnual corporate bonus\nTransport and relocation allowance',
    openings: 2,
    applicationDeadline: '',
    status: 'ACTIVE',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (statusOverride) => {
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        status: statusOverride || formData.status,
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

      const res = await employerService.createJob(payload);
      if (res.success) {
        alert('Job posted successfully!');
        navigate('/employer/jobs');
      }
    } catch (err) {
      console.error('Failed to create job:', err);
      setError(err.response?.data?.message || 'Failed to post job. Please review required fields.');
    } finally {
      setSubmitting(false);
    }
  };

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
              Create Defense Resettlement Opportunity
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Post specialized openings targeting disciplined veterans, ex-servicemen, and retiring defense personnel.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFormSubmit('ACTIVE');
            }}
          >
            {/* 1. Basic Details */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <Briefcase size={18} /> Basic Opportunity Information
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
                  placeholder="e.g. Chief Security & Asset Protection Officer"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Industry Sector *
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

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
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Role Description & Overview *
                </label>
                <textarea
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Provide an executive summary of this defense leadership or technical role..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* 2. Location & Work Mode */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <MapPin size={18} /> Location & Work Mode
              </h2>

              <div className="form-grid-3">
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
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Pune"
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
                    placeholder="e.g. Maharashtra"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Specific Facility / Plant Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Chakan Industrial Area, Pune"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Latitude (Optional GPS)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    placeholder="e.g. 20.2961 (Auto-filled if blank)"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Longitude (Optional GPS)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    placeholder="e.g. 85.8245 (Auto-filled if blank)"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Compensation & Experience */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <DollarSign size={18} /> Compensation & Experience Criteria
              </h2>

              <div className="form-grid-2">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Minimum Salary (INR / Annum)
                  </label>
                  <input
                    type="number"
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    min={0}
                    step={50000}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Maximum Salary (INR / Annum)
                  </label>
                  <input
                    type="number"
                    name="salaryMax"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    min={0}
                    step={50000}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Minimum Military / Technical Service (Years)
                  </label>
                  <input
                    type="number"
                    name="experienceMin"
                    value={formData.experienceMin}
                    onChange={handleChange}
                    min={0}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Maximum Military Service (Years)
                  </label>
                  <input
                    type="number"
                    name="experienceMax"
                    value={formData.experienceMax}
                    onChange={handleChange}
                    min={0}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>

            {/* 4. Skills & Responsibilities */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <Sparkles size={18} /> Skills & Detailed Requirements
              </h2>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Required Skills (Comma separated) *
                </label>
                <input
                  type="text"
                  name="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={handleChange}
                  placeholder="e.g. Drone Operations, UAV Flight Testing, Telemetry, Avionics"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Preferred Skills / Additional Certifications (Comma separated)
                </label>
                <input
                  type="text"
                  name="preferredSkills"
                  value={formData.preferredSkills}
                  onChange={handleChange}
                  placeholder="e.g. IAF RPA Operator Certificate, VIP Close Protection"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Key Responsibilities (One per line)
                </label>
                <textarea
                  rows={4}
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Candidate Qualifications & Defense Background (One per line)
                </label>
                <textarea
                  rows={3}
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Benefits & Allowances (One per line)
                </label>
                <textarea
                  rows={3}
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* 5. Openings & Deadline */}
            <div className="job-form-section">
              <h2 className="job-form-section-title">
                <Shield size={18} /> Openings & Application Deadline
              </h2>

              <div className="form-grid-2">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Number of Open Positions *
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

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => handleFormSubmit('DRAFT')}
                className="btn btn-secondary"
                disabled={submitting}
              >
                <Save size={16} /> Save as Draft
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={16} /> {submitting ? 'Publishing...' : 'Publish Job Opportunity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;
