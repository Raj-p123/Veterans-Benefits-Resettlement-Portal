import React, { useState, useEffect } from 'react';
import employerService from '../../services/employerService';
import {
  Building2,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Globe,
  User,
  Save,
  Check,
} from 'lucide-react';
import './EmployerProfile.css';

const COMPANY_SIZES = [
  '1-10 Employees',
  '11-50 Employees',
  '51-200 Employees',
  '201-500 Employees',
  '501-1000 Employees',
  '1000+ Employees',
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

export const EmployerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    employerId: '',
    companyName: '',
    companyDescription: '',
    industry: 'Defense & Aerospace',
    companySize: '51-200 Employees',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    verificationStatus: 'PENDING',
    contactPerson: {
      name: '',
      designation: '',
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await employerService.getProfile();
        if (res.success && res.data.employer) {
          const emp = res.data.employer;
          setFormData({
            employerId: emp.employerId || '',
            companyName: emp.companyName || '',
            companyDescription: emp.companyDescription || '',
            industry: emp.industry || 'Defense & Aerospace',
            companySize: emp.companySize || '51-200 Employees',
            website: emp.website || '',
            email: emp.email || '',
            phone: emp.phone || '',
            address: emp.address || '',
            city: emp.city || '',
            state: emp.state || '',
            country: emp.country || 'India',
            postalCode: emp.postalCode || '',
            verificationStatus: emp.verificationStatus || 'PENDING',
            contactPerson: {
              name: emp.contactPerson?.name || '',
              designation: emp.contactPerson?.designation || '',
              phone: emp.contactPerson?.phone || '',
              email: emp.contactPerson?.email || '',
            },
          });
        }
      } catch (err) {
        console.error('Failed to load employer profile:', err);
        setError('Failed to load company profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contactPerson.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await employerService.saveProfile(formData);
      if (res.success) {
        setSuccessMsg('Employer profile updated successfully!');
        if (res.data.employer?.employerId) {
          setFormData((prev) => ({
            ...prev,
            employerId: res.data.employer.employerId,
            verificationStatus: res.data.employer.verificationStatus,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err.response?.data?.message || 'Failed to update employer profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="employer-profile-page">
        <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b' }}>Loading corporate profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employer-profile-page">
      <div className="container" style={{ maxWidth: '880px' }}>
        <div className="employer-profile-card">
          <div className="employer-profile-header">
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                Employer & Corporate Partner Profile
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                Manage your defense corporate registration, contact officer information, and office locations.
              </p>
            </div>
            {formData.employerId && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>EMPLOYER ID</span>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f2438' }}>
                  {formData.employerId}
                </div>
              </div>
            )}
          </div>

          {/* Verification Status Banner */}
          <div
            className={`verification-status-banner ${formData.verificationStatus.toLowerCase()}`}
          >
            {formData.verificationStatus === 'VERIFIED' ? (
              <>
                <CheckCircle2 size={24} />
                <div>
                  <strong style={{ display: 'block' }}>Verified Corporate Defense Partner</strong>
                  <span style={{ fontSize: '0.85rem' }}>
                    Your organization is verified by Directorate General Resettlement (DGR). Your postings receive prioritized visibility.
                  </span>
                </div>
              </>
            ) : formData.verificationStatus === 'REJECTED' ? (
              <>
                <AlertCircle size={24} />
                <div>
                  <strong style={{ display: 'block' }}>Corporate Verification Incomplete</strong>
                  <span style={{ fontSize: '0.85rem' }}>
                    Please review your company details or contact the portal administrator for defense verification clearance.
                  </span>
                </div>
              </>
            ) : (
              <>
                <Clock size={24} />
                <div>
                  <strong style={{ display: 'block' }}>Corporate Verification Pending</strong>
                  <span style={{ fontSize: '0.85rem' }}>
                    Your corporate profile is under routine accreditation review. You can post and manage jobs during this period.
                  </span>
                </div>
              </>
            )}
          </div>

          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={18} /> {successMsg}
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Section 1: Company Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 className="form-section-title">
                <Building2 size={18} /> Company Information
              </h2>

              <div className="form-grid-2">
                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Company / Organization Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Tata Advanced Systems Limited"
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Industry Sector *
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Company Workforce Size
                  </label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    {COMPANY_SIZES.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Official Corporate Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.example.com"
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Company Overview & Defense Resettlement Commitment *
                </label>
                <textarea
                  rows={4}
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={handleChange}
                  required
                  placeholder="Describe your company's core defense/aerospace activities and veteran transition programs..."
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
            </div>

            {/* Section 2: Contact Person */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 className="form-section-title">
                <User size={18} /> Veteran Resettlement / Talent Acquisition Officer
              </h2>

              <div className="form-grid-2">
                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    name="contactPerson.name"
                    value={formData.contactPerson.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Col. Rajesh Verma (Retd.)"
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Designation *
                  </label>
                  <input
                    type="text"
                    name="contactPerson.designation"
                    value={formData.contactPerson.designation}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Head of Veteran Talent Acquisition"
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Official Recruitment Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="recruitment@company.com"
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Recruitment Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+919876543210"
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Headquarters Location */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 className="form-section-title">
                <MapPin size={18} /> Corporate Location & Facility Address
              </h2>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Registered Office / Plant Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Plot / Street / Industrial Area"
                  className="form-control"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-grid-3">
                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Pune"
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Maharashtra"
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="410501"
                    className="form-control"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving Profile...' : 'Save Corporate Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployerProfile;
