import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  GraduationCap,
  Award,
  Briefcase,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { veteranService } from '../../../services/veteranService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import PageContainer from '../../../components/PageContainer/PageContainer.jsx';
import Button from '../../../components/Button/Button.jsx';
import Input from '../../../components/Input/Input.jsx';
import Badge from '../../../components/Badge/Badge.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import './Profile.css';

export const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile and Completion State
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState({
    percentage: 0,
    completedSections: [],
    remainingSections: [],
  });

  // Local Skill Input
  const [newSkill, setNewSkill] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    personalInformation: {
      fullName: '',
      dob: '',
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    serviceInformation: {
      serviceBranch: 'Army',
      rank: '',
      serviceNumber: '',
      dateOfJoining: '',
      dateOfDischarge: '',
      yearsOfService: 0,
      serviceStatus: 'Retired',
      lastPosting: '',
      primaryMilitaryRole: '',
      secondaryMilitaryRoles: [],
    },
    education: [],
    skills: [],
    certifications: [],
    jobPreferences: {
      preferredJobLocation: [],
      preferredStates: [],
      preferredIndustries: [],
      preferredEmploymentType: ['Full-time'],
      expectedSalaryRange: { min: 0, max: 0, currency: 'INR' },
      willingToRelocate: false,
      remoteWorkPreference: false,
    },
  });

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await veteranService.getProfile();
      if (data && data.profile) {
        setProfile(data.profile);
        setCompletion(data.completion || { percentage: 0, completedSections: [], remainingSections: [] });

        // Populate Form State
        const p = data.profile;
        setFormData({
          personalInformation: {
            fullName: p.personalInformation?.fullName || user?.name || '',
            dob: p.personalInformation?.dob ? p.personalInformation.dob.split('T')[0] : '',
            gender: p.personalInformation?.gender || 'Male',
            phone: p.personalInformation?.phone || user?.phone || '',
            email: p.personalInformation?.email || user?.email || '',
            address: p.personalInformation?.address || '',
            city: p.personalInformation?.city || '',
            state: p.personalInformation?.state || '',
            pincode: p.personalInformation?.pincode || '',
            country: p.personalInformation?.country || 'India',
          },
          serviceInformation: {
            serviceBranch: p.serviceInformation?.serviceBranch || 'Army',
            rank: p.serviceInformation?.rank || '',
            serviceNumber: p.serviceInformation?.serviceNumber || '',
            dateOfJoining: p.serviceInformation?.dateOfJoining ? p.serviceInformation.dateOfJoining.split('T')[0] : '',
            dateOfDischarge: p.serviceInformation?.dateOfDischarge ? p.serviceInformation.dateOfDischarge.split('T')[0] : '',
            yearsOfService: p.serviceInformation?.yearsOfService || 0,
            serviceStatus: p.serviceInformation?.serviceStatus || 'Retired',
            lastPosting: p.serviceInformation?.lastPosting || '',
            primaryMilitaryRole: p.serviceInformation?.primaryMilitaryRole || '',
            secondaryMilitaryRoles: p.serviceInformation?.secondaryMilitaryRoles || [],
          },
          education: p.education || [],
          skills: p.skills || [],
          certifications: p.certifications
            ? p.certifications.map((c) => ({
                ...c,
                issueDate: c.issueDate ? c.issueDate.split('T')[0] : '',
                expiryDate: c.expiryDate ? c.expiryDate.split('T')[0] : '',
              }))
            : [],
          jobPreferences: {
            preferredJobLocation: p.jobPreferences?.preferredJobLocation || [],
            preferredStates: p.jobPreferences?.preferredStates || [],
            preferredIndustries: p.jobPreferences?.preferredIndustries || [],
            preferredEmploymentType: p.jobPreferences?.preferredEmploymentType || ['Full-time'],
            expectedSalaryRange: p.jobPreferences?.expectedSalaryRange || { min: 0, max: 0, currency: 'INR' },
            willingToRelocate: !!p.jobPreferences?.willingToRelocate,
            remoteWorkPreference: !!p.jobPreferences?.remoteWorkPreference,
          },
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load veteran profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle Nested Form Changes
  const handlePersonalChange = (e) => {
    setFormData({
      ...formData,
      personalInformation: { ...formData.personalInformation, [e.target.name]: e.target.value },
    });
  };

  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    const updatedService = { ...formData.serviceInformation, [name]: value };

    // Auto calculate years of service if dates change
    if (name === 'dateOfJoining' || name === 'dateOfDischarge') {
      const join = name === 'dateOfJoining' ? new Date(value) : new Date(updatedService.dateOfJoining);
      const discharge = name === 'dateOfDischarge' ? new Date(value) : new Date(updatedService.dateOfDischarge);

      if (!isNaN(join) && !isNaN(discharge) && discharge >= join) {
        const diffYears = ((discharge - join) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
        updatedService.yearsOfService = Math.max(parseFloat(diffYears), 0);
      }
    }

    setFormData({
      ...formData,
      serviceInformation: updatedService,
    });
  };

  // Education Handlers
  const handleAddEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        { qualification: '', institution: '', fieldOfStudy: '', year: new Date().getFullYear(), gradeOrPercentage: '' },
      ],
    });
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...formData.education];
    updated[index][field] = value;
    setFormData({ ...formData, education: updated });
  };

  const handleRemoveEducation = (index) => {
    const updated = formData.education.filter((_, i) => i !== index);
    setFormData({ ...formData, education: updated });
  };

  // Skill Handlers
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (formData.skills.includes(newSkill.trim())) {
      setNewSkill('');
      return;
    }
    setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skillToRemove) });
  };

  // Certification Handlers
  const handleAddCert = () => {
    setFormData({
      ...formData,
      certifications: [
        ...formData.certifications,
        { name: '', issuingOrganization: '', issueDate: '', expiryDate: '', credentialId: '' },
      ],
    });
  };

  const handleCertChange = (index, field, value) => {
    const updated = [...formData.certifications];
    updated[index][field] = value;
    setFormData({ ...formData, certifications: updated });
  };

  const handleRemoveCert = (index) => {
    const updated = formData.certifications.filter((_, i) => i !== index);
    setFormData({ ...formData, certifications: updated });
  };

  // Preferences Handlers
  const handlePrefChange = (field, value) => {
    setFormData({
      ...formData,
      jobPreferences: { ...formData.jobPreferences, [field]: value },
    });
  };

  // Save Profile Form
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validations
    if (formData.serviceInformation.dateOfJoining && formData.serviceInformation.dateOfDischarge) {
      if (new Date(formData.serviceInformation.dateOfDischarge) < new Date(formData.serviceInformation.dateOfJoining)) {
        setError('Service discharge/retirement date cannot precede joining date.');
        return;
      }
    }

    setSaving(true);
    try {
      const data = await veteranService.updateProfile(formData);
      if (data && data.profile) {
        setProfile(data.profile);
        setCompletion(data.completion || completion);
        setIsEditing(false);
        setSuccessMsg('Veteran profile updated successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(err.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" message="Loading your veteran profile records..." />
      </div>
    );
  }

  return (
    <PageContainer width="wide">
      <div className="profile-page-wrapper">
        {/* Profile Header & Completion Hero */}
        <div className="profile-hero-card">
          <div className="profile-hero-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ color: '#ffffff', fontSize: '2rem' }}>
                  {profile?.personalInformation?.fullName || user?.name}
                </h1>
                <Badge variant={profile?.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>
                  {profile?.verificationStatus || 'PENDING'}
                </Badge>
              </div>
              <div className="profile-veteran-badge">
                <span style={{ color: 'var(--color-accent-400)', fontWeight: 700 }}>
                  ID: {profile?.veteranId || 'Generating...'}
                </span>
                <span>•</span>
                <span>{profile?.serviceInformation?.serviceBranch || 'Armed Forces'}</span>
                <span>•</span>
                <span>{profile?.serviceInformation?.rank || 'Ex-Serviceman'}</span>
              </div>
            </div>

            <div>
              {!isEditing ? (
                <Button
                  variant="accent"
                  size="md"
                  icon={Edit3}
                  onClick={() => {
                    setIsEditing(true);
                    setSuccessMsg('');
                  }}
                >
                  Edit Profile
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="ghost" size="md" icon={X} onClick={() => setIsEditing(false)} style={{ color: '#fff' }}>
                    Cancel
                  </Button>
                  <Button variant="accent" size="md" icon={Save} loading={saving} onClick={handleSaveProfile}>
                    Save All Changes
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Completion Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600 }}>
              <span>Profile Readiness Score</span>
              <span style={{ color: 'var(--color-accent-400)', fontWeight: 800 }}>{completion.percentage}% Complete</span>
            </div>
            <div className="completion-bar-container">
              <div className="completion-bar-fill" style={{ width: `${completion.percentage}%` }} />
            </div>

            <div className="completion-sections-grid">
              <div>
                <div className="completion-col-title" style={{ color: '#86efac' }}>
                  <CheckCircle2 size={14} /> Completed Sections ({completion.completedSections?.length || 0})
                </div>
                <ul className="completed-list">
                  {completion.completedSections?.length > 0 ? (
                    completion.completedSections.map((sec, i) => <li key={i}>✓ {sec}</li>)
                  ) : (
                    <li style={{ color: '#94a3b8' }}>No sections completed yet</li>
                  )}
                </ul>
              </div>

              <div>
                <div className="completion-col-title" style={{ color: '#fde047' }}>
                  <AlertCircle size={14} /> Remaining for 100% ({completion.remainingSections?.length || 0})
                </div>
                <ul className="remaining-list">
                  {completion.remainingSections?.length > 0 ? (
                    completion.remainingSections.map((sec, i) => <li key={i}>○ {sec}</li>)
                  ) : (
                    <li style={{ color: '#86efac' }}>★ All sections fully completed!</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        <ErrorMessage message={error} />
        {successMsg && (
          <div style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <User size={16} /> Personal Information
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'service' ? 'active' : ''}`}
            onClick={() => setActiveTab('service')}
          >
            <Shield size={16} /> Military Service Record
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'education' ? 'active' : ''}`}
            onClick={() => setActiveTab('education')}
          >
            <GraduationCap size={16} /> Education ({formData.education?.length || 0})
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <Award size={16} /> Skills & Certifications
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Briefcase size={16} /> Career & Job Preferences
          </button>
        </div>

        {/* 1. PERSONAL INFORMATION TAB */}
        {activeTab === 'personal' && (
          <div className="profile-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <User size={20} color="var(--color-primary-800)" />
                Personal Details & Contact
              </h2>
            </div>

            {isEditing ? (
              <div>
                <div className="form-grid-2">
                  <Input
                    label="Full Name"
                    name="fullName"
                    value={formData.personalInformation.fullName}
                    onChange={handlePersonalChange}
                    placeholder="e.g. Subedar Major Rajesh Kumar"
                    required
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    name="dob"
                    value={formData.personalInformation.dob}
                    onChange={handlePersonalChange}
                  />
                </div>

                <div className="form-grid-3">
                  <Input
                    label="Gender"
                    name="gender"
                    as="select"
                    value={formData.personalInformation.gender}
                    onChange={handlePersonalChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </Input>
                  <Input
                    label="Contact Phone"
                    name="phone"
                    value={formData.personalInformation.phone}
                    onChange={handlePersonalChange}
                    placeholder="+91 98765 43210"
                    required
                  />
                  <Input
                    label="Email Address (Synced)"
                    type="email"
                    name="email"
                    value={formData.personalInformation.email}
                    disabled
                    helperText="Email is bound to your authentication identity"
                  />
                </div>

                <Input
                  label="Residential Address"
                  name="address"
                  value={formData.personalInformation.address}
                  onChange={handlePersonalChange}
                  placeholder="House/Plot No., Street, Sector/Locality"
                />

                <div className="form-grid-3">
                  <Input
                    label="City / District"
                    name="city"
                    value={formData.personalInformation.city}
                    onChange={handlePersonalChange}
                    placeholder="e.g. Pune"
                  />
                  <Input
                    label="State / Province"
                    name="state"
                    value={formData.personalInformation.state}
                    onChange={handlePersonalChange}
                    placeholder="e.g. Maharashtra"
                  />
                  <Input
                    label="PIN / Postal Code"
                    name="pincode"
                    value={formData.personalInformation.pincode}
                    onChange={handlePersonalChange}
                    placeholder="e.g. 411001"
                  />
                </div>
              </div>
            ) : (
              <div className="details-grid">
                <div className="detail-block">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{profile?.personalInformation?.fullName || 'Not specified'}</span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Date of Birth</span>
                  <span className="detail-value">
                    {profile?.personalInformation?.dob ? new Date(profile.personalInformation.dob).toLocaleDateString() : 'Not specified'}
                  </span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Gender</span>
                  <span className="detail-value">{profile?.personalInformation?.gender || 'Not specified'}</span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{profile?.personalInformation?.phone || 'Not specified'}</span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{profile?.personalInformation?.email || user?.email}</span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">
                    {profile?.personalInformation?.address
                      ? `${profile.personalInformation.address}, ${profile.personalInformation.city || ''}, ${profile.personalInformation.state || ''} - ${profile.personalInformation.pincode || ''}`
                      : 'Address not yet provided'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. MILITARY SERVICE RECORD TAB */}
        {activeTab === 'service' && (
          <div className="profile-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <Shield size={20} color="var(--color-primary-800)" />
                Military Service & Defense Records
              </h2>
            </div>

            {isEditing ? (
              <div>
                <div className="form-grid-3">
                  <Input
                    label="Service Branch"
                    name="serviceBranch"
                    as="select"
                    value={formData.serviceInformation.serviceBranch}
                    onChange={handleServiceChange}
                    required
                  >
                    <option value="Army">Army</option>
                    <option value="Navy">Navy</option>
                    <option value="Air Force">Air Force</option>
                    <option value="Coast Guard">Coast Guard</option>
                    <option value="Other">Other</option>
                  </Input>
                  <Input
                    label="Rank / Substantive Rank"
                    name="rank"
                    value={formData.serviceInformation.rank}
                    onChange={handleServiceChange}
                    placeholder="e.g. Subedar Major / Wing Commander"
                    required
                  />
                  <Input
                    label="Service / Army Number"
                    name="serviceNumber"
                    value={formData.serviceInformation.serviceNumber}
                    onChange={handleServiceChange}
                    placeholder="e.g. JC-123456K"
                    required
                  />
                </div>

                <div className="form-grid-3">
                  <Input
                    label="Date of Joining / Attestation"
                    type="date"
                    name="dateOfJoining"
                    value={formData.serviceInformation.dateOfJoining}
                    onChange={handleServiceChange}
                    required
                  />
                  <Input
                    label="Date of Discharge / Retirement"
                    type="date"
                    name="dateOfDischarge"
                    value={formData.serviceInformation.dateOfDischarge}
                    onChange={handleServiceChange}
                    required
                  />
                  <Input
                    label="Years of Service"
                    type="number"
                    name="yearsOfService"
                    value={formData.serviceInformation.yearsOfService}
                    onChange={handleServiceChange}
                    helperText="Calculated automatically from service dates"
                  />
                </div>

                <div className="form-grid-3">
                  <Input
                    label="Service Status"
                    name="serviceStatus"
                    as="select"
                    value={formData.serviceInformation.serviceStatus}
                    onChange={handleServiceChange}
                  >
                    <option value="Retired">Retired</option>
                    <option value="Discharged">Discharged</option>
                    <option value="Released">Released</option>
                    <option value="Other">Other</option>
                  </Input>
                  <Input
                    label="Last Posting / Unit Station"
                    name="lastPosting"
                    value={formData.serviceInformation.lastPosting}
                    onChange={handleServiceChange}
                    placeholder="e.g. Northern Command Headquarters"
                  />
                  <Input
                    label="Primary Military Trade / Role"
                    name="primaryMilitaryRole"
                    value={formData.serviceInformation.primaryMilitaryRole}
                    onChange={handleServiceChange}
                    placeholder="e.g. Signals / Tactical Logistics"
                  />
                </div>
              </div>
            ) : (
              <div className="details-grid">
                <div className="detail-block">
                  <span className="detail-label">Service Branch</span>
                  <span className="detail-value">{profile?.serviceInformation?.serviceBranch || 'Not specified'}</span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Rank</span>
                  <span className="detail-value">{profile?.serviceInformation?.rank || 'Not specified'}</span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Service Number</span>
                  <span className="detail-value">{profile?.serviceInformation?.serviceNumber || 'Not specified'}</span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Joining Date</span>
                  <span className="detail-value">
                    {profile?.serviceInformation?.dateOfJoining
                      ? new Date(profile.serviceInformation.dateOfJoining).toLocaleDateString()
                      : 'Not specified'}
                  </span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Discharge Date</span>
                  <span className="detail-value">
                    {profile?.serviceInformation?.dateOfDischarge
                      ? new Date(profile.serviceInformation.dateOfDischarge).toLocaleDateString()
                      : 'Not specified'}
                  </span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Total Service</span>
                  <span className="detail-value">{profile?.serviceInformation?.yearsOfService || 0} Years</span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Service Status</span>
                  <span className="detail-value">{profile?.serviceInformation?.serviceStatus || 'Retired'}</span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Last Posting</span>
                  <span className="detail-value">{profile?.serviceInformation?.lastPosting || 'Not specified'}</span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Primary Role</span>
                  <span className="detail-value">{profile?.serviceInformation?.primaryMilitaryRole || 'Not specified'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. EDUCATION HISTORY TAB */}
        {activeTab === 'education' && (
          <div className="profile-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <GraduationCap size={20} color="var(--color-primary-800)" />
                Academic & Technical Education
              </h2>
              {isEditing && (
                <Button variant="secondary" size="sm" icon={Plus} onClick={handleAddEducation}>
                  Add Qualification
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="dynamic-items-container">
                {formData.education?.length === 0 && (
                  <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    No educational entries added yet. Click "Add Qualification" above to record your degrees, diplomas, or trade certificates.
                  </p>
                )}
                {formData.education?.map((item, index) => (
                  <div key={index} className="dynamic-item-row">
                    <div className="dynamic-item-header">
                      <span className="dynamic-item-count">Qualification #{index + 1}</span>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleRemoveEducation(index)}
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="form-grid-2">
                      <Input
                        label="Degree / Qualification"
                        value={item.qualification}
                        onChange={(e) => handleEducationChange(index, 'qualification', e.target.value)}
                        placeholder="e.g. B.Tech / Diploma in Telecommunication / 12th"
                        required
                      />
                      <Input
                        label="Institution / University / Board"
                        value={item.institution}
                        onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                        placeholder="e.g. Army School of Mechanical Engineering"
                        required
                      />
                    </div>

                    <div className="form-grid-3">
                      <Input
                        label="Field of Study / Specialization"
                        value={item.fieldOfStudy}
                        onChange={(e) => handleEducationChange(index, 'fieldOfStudy', e.target.value)}
                        placeholder="e.g. Electrical & Radar Systems"
                      />
                      <Input
                        label="Passing Year"
                        type="number"
                        value={item.year}
                        onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                        placeholder="e.g. 2018"
                      />
                      <Input
                        label="Grade / Percentage / CGPA"
                        value={item.gradeOrPercentage}
                        onChange={(e) => handleEducationChange(index, 'gradeOrPercentage', e.target.value)}
                        placeholder="e.g. 78% or First Class"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {profile?.education?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {profile.education.map((edu, i) => (
                      <div key={i} style={{ padding: '1rem', backgroundColor: 'var(--color-slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-main)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-primary-900)' }}>{edu.qualification}</strong>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-slate-600)' }}>Year: {edu.year || 'N/A'}</span>
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                          {edu.institution} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ''}
                        </div>
                        {edu.gradeOrPercentage && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '4px' }}>
                            Score: {edu.gradeOrPercentage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    No academic records currently added to your profile. Click "Edit Profile" to add qualifications.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. SKILLS & CERTIFICATIONS TAB */}
        {activeTab === 'skills' && (
          <div className="profile-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <Award size={20} color="var(--color-primary-800)" />
                Skills & Technical Certifications
              </h2>
            </div>

            {/* Skills Tags Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-900)', marginBottom: '0.5rem' }}>
                Competencies & Practical Skills
              </h3>

              <div className="skill-tags-wrapper">
                {formData.skills?.map((skill, i) => (
                  <span key={i} className="skill-tag">
                    <span>{skill}</span>
                    {isEditing && (
                      <button
                        type="button"
                        className="skill-tag-remove"
                        onClick={() => handleRemoveSkill(skill)}
                        aria-label={`Remove skill ${skill}`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
                {(!formData.skills || formData.skills.length === 0) && (
                  <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                    No skills listed.
                  </span>
                )}
              </div>

              {isEditing && (
                <div className="skill-input-row">
                  <Input
                    placeholder="Enter skill (e.g. Logistics, Cyber Defense, Team Command)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button variant="secondary" size="md" onClick={handleAddSkill}>
                    Add Skill
                  </Button>
                </div>
              )}
            </div>

            {/* Certifications Section */}
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                  Professional Certifications
                </h3>
                {isEditing && (
                  <Button variant="secondary" size="sm" icon={Plus} onClick={handleAddCert}>
                    Add Certification
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="dynamic-items-container">
                  {formData.certifications?.map((cert, index) => (
                    <div key={index} className="dynamic-item-row">
                      <div className="dynamic-item-header">
                        <span className="dynamic-item-count">Certification #{index + 1}</span>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleRemoveCert(index)}
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="form-grid-2">
                        <Input
                          label="Certification Name"
                          value={cert.name}
                          onChange={(e) => handleCertChange(index, 'name', e.target.value)}
                          placeholder="e.g. Certified Information Security Manager (CISM)"
                          required
                        />
                        <Input
                          label="Issuing Organization"
                          value={cert.issuingOrganization}
                          onChange={(e) => handleCertChange(index, 'issuingOrganization', e.target.value)}
                          placeholder="e.g. ISACA / Military Institute"
                          required
                        />
                      </div>

                      <div className="form-grid-3">
                        <Input
                          label="Issue Date"
                          type="date"
                          value={cert.issueDate}
                          onChange={(e) => handleCertChange(index, 'issueDate', e.target.value)}
                        />
                        <Input
                          label="Expiry Date (if applicable)"
                          type="date"
                          value={cert.expiryDate}
                          onChange={(e) => handleCertChange(index, 'expiryDate', e.target.value)}
                        />
                        <Input
                          label="Credential / License ID"
                          value={cert.credentialId}
                          onChange={(e) => handleCertChange(index, 'credentialId', e.target.value)}
                          placeholder="e.g. CERT-998811"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {profile?.certifications?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {profile.certifications.map((c, i) => (
                        <div key={i} style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-main)' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-primary-900)' }}>{c.name}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                            Issued by: {c.issuingOrganization} {c.credentialId ? `(ID: ${c.credentialId})` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      No formal certifications logged yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. JOB PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <div className="profile-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <Briefcase size={20} color="var(--color-primary-800)" />
                Post-Service Employment & Career Preferences
              </h2>
            </div>

            {isEditing ? (
              <div>
                <div className="form-grid-2">
                  <Input
                    label="Preferred Work Locations (Cities, comma separated)"
                    value={formData.jobPreferences.preferredJobLocation?.join(', ')}
                    onChange={(e) =>
                      handlePrefChange(
                        'preferredJobLocation',
                        e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder="e.g. Bengaluru, Hyderabad, Pune, NCR"
                  />
                  <Input
                    label="Target Industries (comma separated)"
                    value={formData.jobPreferences.preferredIndustries?.join(', ')}
                    onChange={(e) =>
                      handlePrefChange(
                        'preferredIndustries',
                        e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder="e.g. Defense Tech, Aerospace, Corporate Security, Supply Chain"
                  />
                </div>

                <div className="form-grid-2">
                  <Input
                    label="Expected Minimum Annual Salary (INR)"
                    type="number"
                    value={formData.jobPreferences.expectedSalaryRange?.min || ''}
                    onChange={(e) =>
                      handlePrefChange('expectedSalaryRange', {
                        ...formData.jobPreferences.expectedSalaryRange,
                        min: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g. 800000"
                  />
                  <Input
                    label="Expected Maximum Annual Salary (INR)"
                    type="number"
                    value={formData.jobPreferences.expectedSalaryRange?.max || ''}
                    onChange={(e) =>
                      handlePrefChange('expectedSalaryRange', {
                        ...formData.jobPreferences.expectedSalaryRange,
                        max: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g. 1500000"
                  />
                </div>

                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formData.jobPreferences.willingToRelocate}
                      onChange={(e) => handlePrefChange('willingToRelocate', e.target.checked)}
                    />
                    Willing to Relocate to another city/state
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formData.jobPreferences.remoteWorkPreference}
                      onChange={(e) => handlePrefChange('remoteWorkPreference', e.target.checked)}
                    />
                    Open to Hybrid / Remote work opportunities
                  </label>
                </div>
              </div>
            ) : (
              <div className="details-grid">
                <div className="detail-block">
                  <span className="detail-label">Preferred Locations</span>
                  <span className="detail-value">
                    {profile?.jobPreferences?.preferredJobLocation?.join(', ') || 'Flexible / Anywhere in India'}
                  </span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Target Industries</span>
                  <span className="detail-value">
                    {profile?.jobPreferences?.preferredIndustries?.join(', ') || 'All Openings'}
                  </span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Salary Range</span>
                  <span className="detail-value">
                    {profile?.jobPreferences?.expectedSalaryRange?.min
                      ? `₹${profile.jobPreferences.expectedSalaryRange.min.toLocaleString()} - ₹${profile.jobPreferences.expectedSalaryRange.max.toLocaleString()} / year`
                      : 'Negotiable'}
                  </span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Relocation</span>
                  <span className="detail-value">
                    {profile?.jobPreferences?.willingToRelocate ? 'Yes (Open to relocation)' : 'No (Local only)'}
                  </span>
                </div>
                <div className="detail-block">
                  <span className="detail-label">Remote / Hybrid</span>
                  <span className="detail-value">
                    {profile?.jobPreferences?.remoteWorkPreference ? 'Open to Remote/Hybrid' : 'Onsite'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sticky Action Footer when in Edit Mode */}
        {isEditing && (
          <div className="profile-actions-bar">
            <Button variant="ghost" size="md" icon={X} onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="md" icon={Save} loading={saving} onClick={handleSaveProfile}>
              Save Profile Changes
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Profile;
