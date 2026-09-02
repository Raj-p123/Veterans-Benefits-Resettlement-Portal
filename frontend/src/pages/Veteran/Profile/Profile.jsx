import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  GraduationCap,
  Award,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import { veteranService } from '../../../services/veteranService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';

// Modular Sub-Components
import ProfileHero from './components/ProfileHero.jsx';
import ProfileReadiness from './components/ProfileReadiness.jsx';
import PersonalInfoTab from './components/PersonalInfoTab.jsx';
import MilitaryServiceTab from './components/MilitaryServiceTab.jsx';
import EducationTab from './components/EducationTab.jsx';
import SkillsTab from './components/SkillsTab.jsx';
import PreferencesTab from './components/PreferencesTab.jsx';

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
            willingToRelocate: Boolean(p.jobPreferences?.willingToRelocate),
            remoteWorkPreference: Boolean(p.jobPreferences?.remoteWorkPreference),
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
      <div className="profile-loading-container" role="status" aria-live="polite">
        <LoadingSpinner size="lg" text="Loading secure defense veteran profile..." />
      </div>
    );
  }

  return (
    <div className="veteran-profile-page">
      {/* ==================================================================
          1. PROFILE HERO SUMMARY CARD
          ================================================================== */}
      <ProfileHero
        profile={profile}
        user={user}
        isEditing={isEditing}
        saving={saving}
        onStartEdit={() => {
          setIsEditing(true);
          setSuccessMsg('');
        }}
        onCancelEdit={() => setIsEditing(false)}
        onSaveProfile={handleSaveProfile}
      />

      {/* ==================================================================
          2. PROFILE READINESS & COMPLETION SUMMARY
          ================================================================== */}
      <ProfileReadiness completion={completion} />

      {/* Feedback Alerts */}
      {error && <ErrorMessage message={error} />}

      {successMsg && (
        <div className="gov-success-alert" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ==================================================================
          3. PROFILE TABS NAVIGATION (5 DASHBOARD TABS)
          ================================================================== */}
      <div className="gov-profile-tabs-bar" role="tablist" aria-label="Profile Sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'personal'}
          className={`gov-profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <User size={15} aria-hidden="true" />
          <span>Personal Information</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'service'}
          className={`gov-profile-tab-btn ${activeTab === 'service' ? 'active' : ''}`}
          onClick={() => setActiveTab('service')}
        >
          <Shield size={15} aria-hidden="true" />
          <span>Military Service Record</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'education'}
          className={`gov-profile-tab-btn ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          <GraduationCap size={15} aria-hidden="true" />
          <span>Education ({formData.education?.length || 0})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'skills'}
          className={`gov-profile-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Award size={15} aria-hidden="true" />
          <span>Skills & Certifications</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'preferences'}
          className={`gov-profile-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Briefcase size={15} aria-hidden="true" />
          <span>Career & Job Preferences</span>
        </button>
      </div>

      {/* ==================================================================
          4. TAB CONTENT PANELS
          ================================================================== */}
      <div className="gov-tab-panel-container">
        {activeTab === 'personal' && (
          <PersonalInfoTab
            isEditing={isEditing}
            profile={profile}
            user={user}
            formData={formData}
            onChange={handlePersonalChange}
          />
        )}

        {activeTab === 'service' && (
          <MilitaryServiceTab
            isEditing={isEditing}
            profile={profile}
            formData={formData}
            onChange={handleServiceChange}
          />
        )}

        {activeTab === 'education' && (
          <EducationTab
            isEditing={isEditing}
            profile={profile}
            formData={formData}
            onAddEducation={handleAddEducation}
            onEducationChange={handleEducationChange}
            onRemoveEducation={handleRemoveEducation}
          />
        )}

        {activeTab === 'skills' && (
          <SkillsTab
            isEditing={isEditing}
            profile={profile}
            formData={formData}
            newSkill={newSkill}
            setNewSkill={setNewSkill}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            onAddCert={handleAddCert}
            onCertChange={handleCertChange}
            onRemoveCert={handleRemoveCert}
          />
        )}

        {activeTab === 'preferences' && (
          <PreferencesTab
            isEditing={isEditing}
            profile={profile}
            formData={formData}
            onPrefChange={handlePrefChange}
          />
        )}
      </div>

      {/* ==================================================================
          5. STICKY ACTIONS BAR (WHEN EDITING)
          ================================================================== */}
      {isEditing && (
        <div className="profile-sticky-actions-bar">
          <Button variant="outline" size="md" icon={X} onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Save}
            loading={saving}
            onClick={handleSaveProfile}
          >
            Save Profile Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default Profile;
