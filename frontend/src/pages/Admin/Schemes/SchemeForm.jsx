import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { ROUTES } from '../../../constants/index.js';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';
import './SchemeForm.css';

const DEFAULT_DOCS = [
  'Service Certificate',
  'Discharge Certificate',
  'Identity Document',
];

const DEFAULT_FIELDS = [
  {
    name: 'bankAccountNumber',
    label: 'Direct Benefit Transfer (DBT) Bank Account Number',
    type: 'text',
    required: true,
    placeholder: 'e.g. 123456789012',
    helperText: 'Account must be held in the name of the applicant veteran.',
  },
  {
    name: 'bankIfsc',
    label: 'Bank IFSC Code',
    type: 'text',
    required: true,
    placeholder: 'e.g. SBIN0001234',
    helperText: '',
  },
  {
    name: 'bankName',
    label: 'Bank & Branch Name',
    type: 'text',
    required: true,
    placeholder: 'e.g. State Bank of India, Cantonment Branch',
    helperText: '',
  },
  {
    name: 'reasonForAssistance',
    label: 'Specific Purpose / Justification for Application',
    type: 'textarea',
    required: true,
    placeholder: 'Provide brief justification for this welfare grant application...',
    helperText: '',
  },
];

export const SchemeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [schemeId, setSchemeId] = useState('');
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pension');
  const [subCategory, setSubCategory] = useState('');
  const [officialSource, setOfficialSource] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [state, setState] = useState('All India');
  const [status, setStatus] = useState('ACTIVE');
  const [isFeatured, setIsFeatured] = useState(false);
  const [deadline, setDeadline] = useState('');

  // Complex Sub-arrays
  const [benefits, setBenefits] = useState(['']);
  const [applicationProcess, setApplicationProcess] = useState([
    'Verify eligibility criteria and assemble required documents.',
    'Complete the online application form on this portal.',
    'Attach verified documents from your personal Documents Vault.',
    'Submit the application and track progress in your Applications Dashboard.',
  ]);
  const [requiredDocuments, setRequiredDocuments] = useState(DEFAULT_DOCS);
  const [applicationFields, setApplicationFields] = useState(DEFAULT_FIELDS);

  // Eligibility Criteria
  const [eligibility, setEligibility] = useState({
    minimumAge: 0,
    maximumAge: 120,
    minimumServiceYears: 0,
    serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard', 'Other'],
    serviceStatuses: ['Retired', 'Discharged', 'Released', 'Other'],
    states: ['All India'],
  });

  useEffect(() => {
    if (isEdit) {
      const fetchScheme = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await adminService.getSchemeById(id);
          const s = res.data.scheme;
          setSchemeId(s.schemeId || '');
          setName(s.name || '');
          setShortDescription(s.shortDescription || '');
          setDescription(s.description || '');
          setCategory(s.category || 'Pension');
          setSubCategory(s.subCategory || '');
          setOfficialSource(s.officialSource || '');
          setOfficialWebsite(s.officialWebsite || '');
          setState(s.state || 'All India');
          setStatus(s.status || 'ACTIVE');
          setIsFeatured(Boolean(s.isFeatured));
          setDeadline(s.deadline ? new Date(s.deadline).toISOString().split('T')[0] : '');
          setBenefits(Array.isArray(s.benefits) && s.benefits.length > 0 ? s.benefits : ['']);
          setApplicationProcess(
            Array.isArray(s.applicationProcess) && s.applicationProcess.length > 0
              ? s.applicationProcess
              : ['']
          );
          setRequiredDocuments(
            Array.isArray(s.requiredDocuments) && s.requiredDocuments.length > 0
              ? s.requiredDocuments
              : DEFAULT_DOCS
          );
          setApplicationFields(
            Array.isArray(s.applicationFields) && s.applicationFields.length > 0
              ? s.applicationFields
              : DEFAULT_FIELDS
          );
          setEligibility({
            minimumAge: s.eligibility?.minimumAge ?? 0,
            maximumAge: s.eligibility?.maximumAge ?? 120,
            minimumServiceYears: s.eligibility?.minimumServiceYears ?? 0,
            serviceBranches: s.eligibility?.serviceBranches || ['Army', 'Navy', 'Air Force', 'Coast Guard', 'Other'],
            serviceStatuses: s.eligibility?.serviceStatuses || ['Retired', 'Discharged', 'Released', 'Other'],
            states: s.eligibility?.states || ['All India'],
          });
        } catch (err) {
          console.error('Error loading scheme:', err);
          setError(err.message || 'Failed to load scheme configuration');
        } finally {
          setLoading(false);
        }
      };
      fetchScheme();
    }
  }, [id, isEdit]);

  // Array Handlers for Benefits
  const handleAddBenefit = () => setBenefits([...benefits, '']);
  const handleBenefitChange = (index, value) => {
    const updated = [...benefits];
    updated[index] = value;
    setBenefits(updated);
  };
  const handleRemoveBenefit = (index) => {
    setBenefits(benefits.filter((_, idx) => idx !== index));
  };

  // Array Handlers for Process
  const handleAddProcess = () => setApplicationProcess([...applicationProcess, '']);
  const handleProcessChange = (index, value) => {
    const updated = [...applicationProcess];
    updated[index] = value;
    setApplicationProcess(updated);
  };
  const handleRemoveProcess = (index) => {
    setApplicationProcess(applicationProcess.filter((_, idx) => idx !== index));
  };

  // Array Handlers for Required Docs
  const handleAddDoc = () => setRequiredDocuments([...requiredDocuments, '']);
  const handleDocChange = (index, value) => {
    const updated = [...requiredDocuments];
    updated[index] = value;
    setRequiredDocuments(updated);
  };
  const handleRemoveDoc = (index) => {
    setRequiredDocuments(requiredDocuments.filter((_, idx) => idx !== index));
  };

  // Field Handlers for Form Fields
  const handleAddField = () => {
    setApplicationFields([
      ...applicationFields,
      { name: `field_${Date.now()}`, label: 'New Field', type: 'text', required: false, placeholder: '', helperText: '' },
    ]);
  };
  const handleFieldChange = (index, key, value) => {
    const updated = [...applicationFields];
    updated[index][key] = value;
    setApplicationFields(updated);
  };
  const handleRemoveField = (index) => {
    setApplicationFields(applicationFields.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !shortDescription.trim() || !description.trim() || !officialSource.trim() || !officialWebsite.trim()) {
      setError('Please fill in all mandatory fields (Name, Short Description, Full Description, Official Source, Website)');
      return;
    }

    const payload = {
      schemeId: schemeId.trim() || undefined,
      name: name.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      category,
      subCategory: subCategory.trim(),
      officialSource: officialSource.trim(),
      officialWebsite: officialWebsite.trim(),
      state,
      status,
      isFeatured,
      deadline: deadline ? new Date(deadline) : null,
      benefits: benefits.filter((b) => b.trim().length > 0),
      applicationProcess: applicationProcess.filter((p) => p.trim().length > 0),
      requiredDocuments: requiredDocuments.filter((d) => d.trim().length > 0),
      applicationFields,
      eligibility,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await adminService.updateScheme(id, payload);
      } else {
        await adminService.createScheme(payload);
      }
      navigate(ROUTES.ADMIN_SCHEMES);
    } catch (err) {
      console.error('Error saving scheme:', err);
      setError(err.message || 'Failed to save scheme');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="lg" text="Loading scheme details..." />
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <Link to={ROUTES.ADMIN_SCHEMES} className="veteran-back-link">
            <ArrowLeft size={16} /> Back to Schemes Directory
          </Link>
          <h1 className="admin-page-title" style={{ marginTop: '0.5rem' }}>
            {isEdit ? `Edit Scheme: ${name}` : 'Create New Welfare Scheme'}
          </h1>
          <p className="admin-page-subtitle">
            Configure welfare benefits, define eligibility thresholds, and design the veteran application form.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="scheme-form-grid">
        {/* Basic Scheme Information */}
        <div className="scheme-form-card">
          <h3 className="scheme-form-card-title">1. Basic Information & Classification</h3>

          <div className="form-grid-2">
            <div className="admin-form-group">
              <label className="admin-form-label">Scheme Identifier (Scheme ID):</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="e.g. KSB-PMRSS-2026 (Leave empty to auto-generate)"
                value={schemeId}
                onChange={(e) => setSchemeId(e.target.value)}
                disabled={isEdit}
              />
              <span className="form-help-text">Unique code identifier for department indexing.</span>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Scheme Name *:</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="e.g. Prime Minister's Scholarship Scheme for ESM"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid-3" style={{ marginTop: '1rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Welfare Category *:</label>
              <select
                className="admin-select"
                style={{ width: '100%' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Pension">Pension</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Housing">Housing</option>
                <option value="Education">Education</option>
                <option value="Financial Assistance">Financial Assistance</option>
                <option value="Family Welfare">Family Welfare</option>
                <option value="Employment">Employment</option>
                <option value="Skill Development">Skill Development</option>
                <option value="Resettlement">Resettlement</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Sub-Category:</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="e.g. Higher Technical Education"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Target State / Jurisdiction:</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="e.g. All India, Punjab, Maharashtra"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: '1rem' }}>
            <label className="admin-form-label">Short Summary (Max 300 characters) *:</label>
            <input
              type="text"
              className="admin-form-input"
              placeholder="Brief summary displayed on cards..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              maxLength={300}
              required
            />
          </div>

          <div className="admin-form-group" style={{ marginTop: '1rem' }}>
            <label className="admin-form-label">Full Comprehensive Description *:</label>
            <textarea
              className="admin-form-textarea"
              rows={4}
              placeholder="Detailed guidelines, objectives, and legal provisions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Official Authority & Legal Disclaimers */}
        <div className="scheme-form-card">
          <h3 className="scheme-form-card-title">2. Official Authority & Public Verification</h3>

          <div className="form-grid-2">
            <div className="admin-form-group">
              <label className="admin-form-label">Official Authority / Ministry *:</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="e.g. Kendriya Sainik Board, Ministry of Defence"
                value={officialSource}
                onChange={(e) => setOfficialSource(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Official Reference Website URL *:</label>
              <input
                type="url"
                className="admin-form-input"
                placeholder="https://ksb.gov.in"
                value={officialWebsite}
                onChange={(e) => setOfficialWebsite(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid-3" style={{ marginTop: '1rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Application Deadline:</label>
              <input
                type="date"
                className="admin-form-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Publish Status:</label>
              <select
                className="admin-select"
                style={{ width: '100%' }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE (Accepting Applications)</option>
                <option value="INACTIVE">INACTIVE (Hidden / Paused)</option>
              </select>
            </div>

            <div className="admin-form-group" style={{ justifyContent: 'center' }}>
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <span>Feature on Portal Home Page</span>
              </label>
            </div>
          </div>

          <div className="scheme-disclaimer-box">
            <HelpCircle size={18} color="#b45309" />
            <p>
              <strong>Official Integrity Notice:</strong> All welfare schemes published on this portal must link to authenticated government gazettes or department portals. Do not publish fabricated grants.
            </p>
          </div>
        </div>

        {/* Eligibility Engine Criteria */}
        <div className="scheme-form-card">
          <h3 className="scheme-form-card-title">3. Automated Eligibility Matching Engine</h3>

          <div className="form-grid-3">
            <div className="admin-form-group">
              <label className="admin-form-label">Minimum Age (Years):</label>
              <input
                type="number"
                className="admin-form-input"
                min={0}
                max={120}
                value={eligibility.minimumAge}
                onChange={(e) =>
                  setEligibility({ ...eligibility, minimumAge: Number(e.target.value) })
                }
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Maximum Age (Years):</label>
              <input
                type="number"
                className="admin-form-input"
                min={0}
                max={120}
                value={eligibility.maximumAge}
                onChange={(e) =>
                  setEligibility({ ...eligibility, maximumAge: Number(e.target.value) })
                }
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Minimum Military Service (Years):</label>
              <input
                type="number"
                className="admin-form-input"
                min={0}
                max={50}
                value={eligibility.minimumServiceYears}
                onChange={(e) =>
                  setEligibility({ ...eligibility, minimumServiceYears: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>

        {/* Benefits & Value Proposition */}
        <div className="scheme-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 className="scheme-form-card-title" style={{ margin: 0 }}>4. Key Entitlements & Financial Benefits</h3>
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddBenefit}>
              Add Benefit Point
            </Button>
          </div>

          <div className="scheme-dynamic-list">
            {benefits.map((b, idx) => (
              <div key={idx} className="scheme-dynamic-row">
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. ₹3,000 per month scholarship grant for eligible wards..."
                  value={b}
                  onChange={(e) => handleBenefitChange(idx, e.target.value)}
                />
                {benefits.length > 1 && (
                  <button type="button" className="scheme-delete-btn" onClick={() => handleRemoveBenefit(idx)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Required Documents Vault Check */}
        <div className="scheme-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 className="scheme-form-card-title" style={{ margin: 0 }}>5. Mandatory Supporting Documents</h3>
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddDoc}>
              Add Required Document
            </Button>
          </div>

          <div className="scheme-dynamic-list">
            {requiredDocuments.map((doc, idx) => (
              <div key={idx} className="scheme-dynamic-row">
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Discharge Certificate"
                  value={doc}
                  onChange={(e) => handleDocChange(idx, e.target.value)}
                />
                {requiredDocuments.length > 1 && (
                  <button type="button" className="scheme-delete-btn" onClick={() => handleRemoveDoc(idx)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Application Form Fields Builder */}
        <div className="scheme-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 className="scheme-form-card-title" style={{ margin: 0 }}>6. Application Form Questionnaire Builder</h3>
            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddField}>
              Add Custom Question
            </Button>
          </div>

          <div className="scheme-fields-builder">
            {applicationFields.map((field, idx) => (
              <div key={idx} className="scheme-field-card">
                <div className="form-grid-3">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Field Identifier (Name):</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={field.name}
                      onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Question / Field Label:</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={field.label}
                      onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Input Type:</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={field.type}
                      onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                    >
                      <option value="text">Single Line Text</option>
                      <option value="textarea">Multi-line Paragraph</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '0.5rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Placeholder / Example Text:</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={field.placeholder || ''}
                      onChange={(e) => handleFieldChange(idx, 'placeholder', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="admin-checkbox-label" style={{ marginTop: '1.25rem' }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                      />
                      <span>Mandatory Field</span>
                    </label>

                    <button
                      type="button"
                      className="scheme-delete-btn"
                      style={{ marginTop: '1.25rem' }}
                      onClick={() => handleRemoveField(idx)}
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions Bar */}
        <div className="scheme-form-actions">
          <Link to={ROUTES.ADMIN_SCHEMES}>
            <Button variant="secondary" size="md">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" size="md" type="submit" loading={submitting} icon={Save}>
            {isEdit ? 'Save Scheme Changes' : 'Publish Welfare Scheme'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SchemeForm;
