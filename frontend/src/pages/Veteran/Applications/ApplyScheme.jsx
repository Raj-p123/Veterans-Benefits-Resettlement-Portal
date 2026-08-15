import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  UploadCloud,
  Check,
  Building,
  User,
  Info,
  Clock,
} from 'lucide-react';
import { schemeService } from '../../../services/schemeService.js';
import { veteranService } from '../../../services/veteranService.js';
import { documentService } from '../../../services/documentService.js';
import { applicationService } from '../../../services/applicationService.js';
import PageContainer from '../../../components/PageContainer/PageContainer.jsx';
import Button from '../../../components/Button/Button.jsx';
import Input from '../../../components/Input/Input.jsx';
import Badge from '../../../components/Badge/Badge.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import './ApplyScheme.css';

export const ApplyScheme = () => {
  const { schemeId } = useParams();
  const navigate = useNavigate();

  // Wizard Step (1: Verify, 2: Form, 3: Documents, 4: Review, 5: Success)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Core Records
  const [scheme, setScheme] = useState(null);
  const [profile, setProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [userDocs, setUserDocs] = useState([]);
  const [eligibilityResult, setEligibilityResult] = useState(null);

  // Form & Document State
  const [formData, setFormData] = useState({});
  const [attachedDocs, setAttachedDocs] = useState([]);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Initialize Wizard
  useEffect(() => {
    const initializeApplication = async () => {
      setLoading(true);
      setError('');
      try {
        const [schemeData, profileData, docsData, appData] = await Promise.all([
          schemeService.getSchemeById(schemeId),
          veteranService.getProfile(),
          documentService.getDocuments(),
          applicationService.createApplication(schemeId),
        ]);

        if (schemeData && schemeData.scheme) {
          setScheme(schemeData.scheme);
        }

        if (profileData && profileData.profile) {
          setProfile(profileData.profile);
        }

        if (docsData && docsData.documents) {
          setUserDocs(docsData.documents);
        }

        if (appData && appData.application) {
          const app = appData.application;
          setApplication(app);
          setFormData(app.formData || {});
          setAttachedDocs(app.documents || []);
        }

        // Run smart eligibility check
        const elig = await schemeService.checkEligibility(schemeId).catch(() => null);
        if (elig) setEligibilityResult(elig);
      } catch (err) {
        setError(err.message || 'Failed to initialize scheme application');
      } finally {
        setLoading(false);
      }
    };

    if (schemeId) {
      initializeApplication();
    }
  }, [schemeId]);

  // Handle Dynamic Form Change
  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Save Draft API Call
  const handleSaveDraft = async () => {
    if (!application) return;
    setSavingDraft(true);
    setError('');
    try {
      const data = await applicationService.updateApplication(application.id || application._id, {
        formData,
        documents: attachedDocs,
      });
      if (data && data.application) {
        setApplication(data.application);
      }
    } catch (err) {
      setError(err.message || 'Failed to save application draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Document Selection Handler
  const handleAttachDocument = (reqDocType, userDocId) => {
    const docObj = userDocs.find((d) => (d.id || d._id) === userDocId);
    if (!docObj) {
      // Remove attached document for this type
      setAttachedDocs((prev) => prev.filter((d) => d.documentType.toLowerCase() !== reqDocType.toLowerCase()));
      return;
    }

    // Add or replace document for this type
    const newEntry = {
      documentType: reqDocType,
      document: docObj.id || docObj._id,
      documentName: docObj.documentName,
      fileUrl: docObj.fileUrl,
      mimeType: docObj.mimeType || '',
      fileSize: docObj.fileSize || 0,
    };

    setAttachedDocs((prev) => {
      const filtered = prev.filter((d) => d.documentType.toLowerCase() !== reqDocType.toLowerCase());
      return [...filtered, newEntry];
    });
  };

  // Step 2 Validation: Check required form fields
  const handleValidateStep2 = () => {
    if (Array.isArray(scheme?.applicationFields)) {
      for (const field of scheme.applicationFields) {
        if (field.required) {
          const val = formData[field.name];
          if (val === undefined || val === null || String(val).trim() === '') {
            setError(`Please provide a value for required field: "${field.label}"`);
            return;
          }
        }
      }
    }
    setError('');
    handleSaveDraft();
    setStep(3);
  };

  // Step 3 Validation: Check required documents attached
  const handleValidateStep3 = () => {
    if (Array.isArray(scheme?.requiredDocuments)) {
      const attachedTypes = attachedDocs.map((d) => d.documentType.trim().toLowerCase());
      const missing = [];

      for (const reqDoc of scheme.requiredDocuments) {
        if (!attachedTypes.includes(reqDoc.trim().toLowerCase())) {
          missing.push(reqDoc);
        }
      }

      if (missing.length > 0) {
        setError(`Please attach all required documents: ${missing.join(', ')}`);
        return;
      }
    }
    setError('');
    handleSaveDraft();
    setStep(4);
  };

  // Final Application Submission
  const handleSubmitApplication = async () => {
    if (!declarationAccepted) {
      setError('You must check the legal confirmation declaration box before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await applicationService.submitApplication(application.id || application._id, {
        formData,
        documents: attachedDocs,
        declarationAccepted: true,
      });

      if (res && res.application) {
        setSuccessInfo(res);
        setStep(5);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(err.message || 'Application submission failed. Please review your entries.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" message="Preparing application records & verifying eligibility..." />
      </div>
    );
  }

  if (error && !application) {
    return (
      <PageContainer width="regular">
        <div style={{ padding: '3rem 0' }}>
          <ErrorMessage message={error} />
          <Link to="/schemes">
            <Button variant="secondary" size="md" icon={ArrowLeft}>
              Back to Schemes Catalog
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  // STEP 5: SUCCESS CONFIRMATION VIEW
  if (step === 5) {
    const appId = successInfo?.applicationId || successInfo?.application?.applicationId;
    return (
      <PageContainer width="regular">
        <div className="apply-page-wrapper">
          <div className="application-success-box">
            <div className="success-icon-badge">
              <Check size={36} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-950)', marginBottom: '8px' }}>
              Application Submitted Successfully!
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
              Your application for <strong>{scheme?.name}</strong> has been officially logged in the system and routed for departmental scrutiny.
            </p>

            <div className="app-id-pill-highlight">
              Application ID: {appId}
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--color-slate-50)', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', textAlign: 'left', fontSize: '0.875rem', color: 'var(--color-slate-700)', lineHeight: 1.6 }}>
              <div>✓ Digital acknowledgment recorded at {new Date().toLocaleTimeString()}</div>
              <div>✓ Attached defense certificates linked to application record</div>
              <div>✓ Tracking timeline activated with milestone updates</div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to={`/veteran/applications/${appId}`}>
                <Button variant="accent" size="md" icon={Clock}>
                  Track Status & Timeline
                </Button>
              </Link>
              <Link to="/veteran/applications">
                <Button variant="secondary" size="md" icon={FileText}>
                  View All My Applications
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide">
      <div className="apply-page-wrapper">
        {/* Scheme Header Card */}
        <div className="apply-header-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge variant="gold">{scheme?.category}</Badge>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-slate-400)' }}>
              Draft ID: {application?.applicationId}
            </span>
          </div>
          <h1 className="apply-scheme-title">{scheme?.name}</h1>
          <div className="apply-scheme-meta">
            Authority: {scheme?.officialSource} • State: {scheme?.state || 'All India'}
          </div>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="stepper-progress-wrapper">
          <div className={`step-indicator-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
            <span className="step-label">Applicant Info</span>
          </div>
          <div className={`step-indicator-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
            <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
            <span className="step-label">Scheme Form</span>
          </div>
          <div className={`step-indicator-item ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
            <div className="step-circle">{step > 3 ? '✓' : '3'}</div>
            <span className="step-label">Documents</span>
          </div>
          <div className={`step-indicator-item ${step === 4 ? 'active' : ''}`}>
            <div className="step-circle">4</div>
            <span className="step-label">Review & Submit</span>
          </div>
        </div>

        <ErrorMessage message={error} />

        {/* ================= STEP 1: VERIFY PROFILE & ELIGIBILITY ================= */}
        {step === 1 && (
          <div className="step-content-card">
            <div className="step-card-header">
              <h2 className="step-card-title">
                <User size={22} color="var(--color-primary-800)" />
                Step 1: Verify Military Service Identity & Eligibility
              </h2>
              <p className="step-card-desc">
                Review your stored defense records. These details will be automatically certified with your submission.
              </p>
            </div>

            <div className="profile-summary-grid">
              <div className="summary-item-block">
                <span className="summary-label">Applicant Name</span>
                <span className="summary-value">{profile?.personalInformation?.fullName}</span>
              </div>
              <div className="summary-item-block">
                <span className="summary-label">Veteran ID</span>
                <span className="summary-value" style={{ color: 'var(--color-accent-600)', fontFamily: 'monospace' }}>
                  {profile?.veteranId}
                </span>
              </div>
              <div className="summary-item-block">
                <span className="summary-label">Service Branch</span>
                <span className="summary-value">{profile?.serviceInformation?.serviceBranch}</span>
              </div>
              <div className="summary-item-block">
                <span className="summary-label">Substantive Rank</span>
                <span className="summary-value">{profile?.serviceInformation?.rank || 'Ex-Serviceman'}</span>
              </div>
              <div className="summary-item-block">
                <span className="summary-label">Service / Army Number</span>
                <span className="summary-value">{profile?.serviceInformation?.serviceNumber || 'Not specified'}</span>
              </div>
              <div className="summary-item-block">
                <span className="summary-label">Length of Service</span>
                <span className="summary-value">{profile?.serviceInformation?.yearsOfService || 0} Years</span>
              </div>
              <div className="summary-item-block">
                <span className="summary-label">Service Status</span>
                <span className="summary-value">{profile?.serviceInformation?.serviceStatus || 'Retired'}</span>
              </div>
              <div className="summary-item-block">
                <span className="summary-label">Contact Phone</span>
                <span className="summary-value">{profile?.personalInformation?.phone}</span>
              </div>
              <div className="summary-item-block">
                <span className="summary-label">State Domicile</span>
                <span className="summary-value">{profile?.personalInformation?.state || 'Maharashtra'}</span>
              </div>
            </div>

            {/* Smart Eligibility Summary */}
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={18} /> Eligibility Pre-Screening Passed
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px' }}>
                  Your profile meets the service duration, rank, and branch requirements for this program.
                </div>
              </div>
              <Badge variant="success">
                {eligibilityResult?.matchPercentage || 100}% Portal Match
              </Badge>
            </div>

            <div className="wizard-nav-bar">
              <Link to={`/schemes/${schemeId}`}>
                <Button variant="ghost" size="md" icon={ArrowLeft}>
                  Cancel
                </Button>
              </Link>
              <Button variant="accent" size="md" icon={ArrowRight} onClick={() => setStep(2)}>
                Continue to Application Form
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DYNAMIC SCHEME FORM ================= */}
        {step === 2 && (
          <div className="step-content-card">
            <div className="step-card-header">
              <h2 className="step-card-title">
                <FileText size={22} color="var(--color-primary-800)" />
                Step 2: Specific Scheme Information & Requirements
              </h2>
              <p className="step-card-desc">
                Fill in the scheme-specific questions requested by {scheme?.officialSource}.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {scheme?.applicationFields?.map((field) => {
                const val = formData[field.name] ?? '';

                if (field.type === 'textarea') {
                  return (
                    <Input
                      key={field.name}
                      label={`${field.label} ${field.required ? '*' : ''}`}
                      as="textarea"
                      rows={3}
                      value={val}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      helperText={field.helperText}
                      required={field.required}
                    />
                  );
                }

                if (field.type === 'select') {
                  return (
                    <Input
                      key={field.name}
                      label={`${field.label} ${field.required ? '*' : ''}`}
                      as="select"
                      value={val}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      helperText={field.helperText}
                      required={field.required}
                    >
                      <option value="">-- Select Option --</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Input>
                  );
                }

                return (
                  <Input
                    key={field.name}
                    type={field.type || 'text'}
                    label={`${field.label} ${field.required ? '*' : ''}`}
                    value={val}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    helperText={field.helperText}
                    required={field.required}
                  />
                );
              })}
            </div>

            <div className="wizard-nav-bar">
              <Button variant="secondary" size="md" icon={ArrowLeft} onClick={() => setStep(1)}>
                Back
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="ghost" size="md" icon={Save} loading={savingDraft} onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button variant="accent" size="md" icon={ArrowRight} onClick={handleValidateStep2}>
                  Next: Attach Documents
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: ATTACH SUPPORTING DOCUMENTS ================= */}
        {step === 3 && (
          <div className="step-content-card">
            <div className="step-card-header">
              <h2 className="step-card-title">
                <FileCheck2 size={22} color="var(--color-primary-800)" />
                Step 3: Attach Required Supporting Documents
              </h2>
              <p className="step-card-desc">
                Select your verified certificates from your personal Documents Vault. (No need to re-upload files already in your vault).
              </p>
            </div>

            <div className="doc-attach-rows-container">
              {scheme?.requiredDocuments?.map((reqDocType, index) => {
                const currentlyAttached = attachedDocs.find(
                  (d) => d.documentType.trim().toLowerCase() === reqDocType.trim().toLowerCase()
                );

                // Find candidate matching user documents
                const candidateDocs = userDocs.filter(
                  (d) => d.documentType.trim().toLowerCase() === reqDocType.trim().toLowerCase() || d.documentType === 'Other'
                );

                return (
                  <div key={index} className="doc-attach-slot">
                    <div className="doc-slot-info">
                      <div className="doc-slot-icon">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="doc-slot-title">{reqDocType}</div>
                        <div className="doc-slot-status">
                          {currentlyAttached ? (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>
                              ✓ Attached: {currentlyAttached.documentName}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                              * Attachment Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border-main)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          backgroundColor: '#ffffff',
                          minWidth: '220px',
                        }}
                        value={currentlyAttached?.document || ''}
                        onChange={(e) => handleAttachDocument(reqDocType, e.target.value)}
                      >
                        <option value="">-- Choose from Vault --</option>
                        {userDocs.map((doc) => (
                          <option key={doc.id || doc._id} value={doc.id || doc._id}>
                            {doc.documentName} ({doc.documentType})
                          </option>
                        ))}
                      </select>

                      <Link to="/veteran/documents" target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm" icon={UploadCloud} style={{ padding: '0.45rem 0.65rem' }} title="Upload new document to Vault">
                          Vault
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="wizard-nav-bar">
              <Button variant="secondary" size="md" icon={ArrowLeft} onClick={() => setStep(2)}>
                Back to Form
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="ghost" size="md" icon={Save} loading={savingDraft} onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button variant="accent" size="md" icon={ArrowRight} onClick={handleValidateStep3}>
                  Next: Review & Submit
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: REVIEW & LEGAL DECLARATION ================= */}
        {step === 4 && (
          <div className="step-content-card">
            <div className="step-card-header">
              <h2 className="step-card-title">
                <ShieldCheck size={22} color="var(--color-primary-800)" />
                Step 4: Final Review & Submission Declaration
              </h2>
              <p className="step-card-desc">
                Review your application answers and sign the legal confirmation before official submission.
              </p>
            </div>

            {/* Applicant Records Review */}
            <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-slate-50)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-main)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary-950)', marginBottom: '6px' }}>
                Applicant & Military Service Dossier
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>Name: <strong>{profile?.personalInformation?.fullName}</strong></div>
                <div>ID: <strong>{profile?.veteranId}</strong></div>
                <div>Branch: <strong>{profile?.serviceInformation?.serviceBranch}</strong></div>
                <div>Rank: <strong>{profile?.serviceInformation?.rank}</strong></div>
                <div>Service Duration: <strong>{profile?.serviceInformation?.yearsOfService} Years</strong></div>
                <div>Phone: <strong>{profile?.personalInformation?.phone}</strong></div>
              </div>
            </div>

            {/* Form Answers Review */}
            <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-slate-50)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-main)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary-950)', marginBottom: '6px' }}>
                Application Field Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem' }}>
                {scheme?.applicationFields?.map((f) => (
                  <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--color-slate-600)' }}>{f.label}:</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary-950)' }}>
                      {formData[f.name] || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attached Documents Review */}
            <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-slate-50)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-main)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary-950)', marginBottom: '6px' }}>
                Attached Supporting Certificates ({attachedDocs.length})
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem' }}>
                {attachedDocs.map((d, i) => (
                  <li key={i} style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> {d.documentType}: <strong>{d.documentName}</strong>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Declaration Checkbox */}
            <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '2px solid rgba(234, 179, 8, 0.5)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: '20px', height: '20px', marginTop: '2px', flexShrink: 0 }}
                  checked={declarationAccepted}
                  onChange={(e) => setDeclarationAccepted(e.target.checked)}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-slate-900)', lineHeight: 1.5, fontWeight: 600 }}>
                  I hereby solemnly declare and confirm that all information provided and supporting defense certificates attached are genuine, correct, and complete to the best of my knowledge. I understand that any false representation will result in immediate disqualification and forfeiture of benefits under Armed Forces welfare regulations.
                </span>
              </label>
            </div>

            <div className="wizard-nav-bar">
              <Button variant="secondary" size="md" icon={ArrowLeft} onClick={() => setStep(3)}>
                Back to Documents
              </Button>
              <Button
                variant="accent"
                size="md"
                icon={Send}
                loading={submitting}
                disabled={!declarationAccepted}
                onClick={handleSubmitApplication}
              >
                Submit Official Application
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ApplyScheme;
