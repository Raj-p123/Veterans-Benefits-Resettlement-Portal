import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Calendar,
  Building,
  FileText,
  HelpCircle,
  Sparkles,
  Info,
  Check,
  FileCheck2,
  Lock,
  Send,
  Clock,
  Edit3,
} from 'lucide-react';
import { schemeService } from '../../services/schemeService.js';
import { applicationService } from '../../services/applicationService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageContainer from '../../components/PageContainer/PageContainer.jsx';
import Button from '../../components/Button/Button.jsx';
import Badge from '../../components/Badge/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx';
import { ROUTES } from '../../constants/index.js';
import './SchemeDetail.css';

export const SchemeDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Eligibility Evaluation State
  const [evaluating, setEvaluating] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [evalError, setEvalError] = useState('');

  // User's Existing Application for this Scheme
  const [existingApp, setExistingApp] = useState(null);

  useEffect(() => {
    const fetchSchemeDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const [schemeData, appsData] = await Promise.all([
          schemeService.getSchemeById(id),
          isAuthenticated && user?.role === 'VETERAN'
            ? applicationService.getMyApplications({ limit: 50 }).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (schemeData && schemeData.scheme) {
          const s = schemeData.scheme;
          setScheme(s);

          // Check if user has an application for this scheme
          if (appsData && appsData.applications) {
            const found = appsData.applications.find(
              (a) =>
                a.scheme?.schemeId === s.schemeId ||
                a.scheme?.id === s.id ||
                a.scheme?._id === s._id ||
                a.scheme === s.id ||
                a.scheme === s._id
            );
            if (found) setExistingApp(found);
          }
        }
      } catch (err) {
        setError(err.message || 'Unable to retrieve scheme details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSchemeDetail();
    }
  }, [id, isAuthenticated, user]);

  const handleCheckEligibility = async () => {
    if (!scheme) return;
    setEvaluating(true);
    setEvalError('');
    try {
      const data = await schemeService.checkEligibility(scheme.schemeId || scheme.id || scheme._id);
      setEligibilityResult(data);
    } catch (err) {
      setEvalError(err.message || 'Failed to check eligibility for this scheme');
    } finally {
      setEvaluating(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#16a34a';
    if (percentage >= 50) return '#ca8a04';
    return '#dc2626';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" message="Loading scheme specification & official records..." />
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <PageContainer width="regular">
        <div style={{ padding: '3rem 0' }}>
          <ErrorMessage message={error || 'Scheme not found.'} />
          <Link to="/schemes">
            <Button variant="secondary" size="md" icon={ArrowLeft}>
              Back to Schemes Catalog
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const reqs = scheme.eligibility || {};

  return (
    <PageContainer width="wide">
      <div className="scheme-detail-wrapper">
        {/* Back Link */}
        <div className="scheme-detail-nav">
          <Link to="/schemes">
            <Button variant="ghost" size="sm" icon={ArrowLeft}>
              Back to All Schemes
            </Button>
          </Link>
        </div>

        {/* Scheme Header Banner */}
        <div className="scheme-header-banner">
          <div className="scheme-header-top">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Badge variant="gold">{scheme.category}</Badge>
              {scheme.isFeatured && (
                <Badge variant="accent" icon={Sparkles}>
                  Featured Program
                </Badge>
              )}
              <Badge variant={scheme.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {scheme.status}
              </Badge>
            </div>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-slate-400)' }}>
              Scheme ID: {scheme.schemeId}
            </span>
          </div>

          <h1 className="scheme-title-main">{scheme.name}</h1>

          <div className="scheme-meta-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building size={16} /> {scheme.officialSource}
            </span>
            <span>•</span>
            <span>Jurisdiction: {scheme.state || 'All India'}</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={16} /> Mode: {scheme.applicationMode || 'Online'}
            </span>
            {scheme.deadline && (
              <>
                <span>•</span>
                <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                  Deadline: {new Date(scheme.deadline).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="scheme-layout-grid">
          {/* Main Column */}
          <div>
            {/* 1. Overview */}
            <div className="detail-card-block">
              <h2 className="detail-block-title">
                <FileText size={20} color="var(--color-primary-800)" /> Program Overview
              </h2>
              <p className="detail-desc-text">{scheme.description}</p>
            </div>

            {/* 2. Key Benefits */}
            <div className="detail-card-block">
              <h2 className="detail-block-title">
                <Sparkles size={20} color="var(--color-accent-600)" /> Key Benefits & Entitlements
              </h2>
              {scheme.benefits?.length > 0 ? (
                <ul className="benefits-bullet-list">
                  {scheme.benefits.map((b, i) => (
                    <li key={i} className="benefit-bullet-item">
                      <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Standard defense welfare entitlements apply.
                </p>
              )}
            </div>

            {/* 3. Eligibility Criteria */}
            <div className="detail-card-block">
              <h2 className="detail-block-title">
                <ShieldCheck size={20} color="var(--color-primary-800)" /> Eligibility Requirements
              </h2>
              <div className="criteria-grid">
                <div className="criteria-cell">
                  <div className="criteria-label">Service Duration</div>
                  <div className="criteria-val">
                    {reqs.minimumServiceYears > 0 ? `Minimum ${reqs.minimumServiceYears} Years` : 'Any service length'}
                  </div>
                </div>

                <div className="criteria-cell">
                  <div className="criteria-label">Service Branches</div>
                  <div className="criteria-val">
                    {reqs.serviceBranches?.length > 0 ? reqs.serviceBranches.join(', ') : 'All Branches'}
                  </div>
                </div>

                <div className="criteria-cell">
                  <div className="criteria-label">Discharge Status</div>
                  <div className="criteria-val">
                    {reqs.serviceStatuses?.length > 0 ? reqs.serviceStatuses.join(', ') : 'All Statuses'}
                  </div>
                </div>

                <div className="criteria-cell">
                  <div className="criteria-label">Applicable Geography</div>
                  <div className="criteria-val">{scheme.state || 'All India'}</div>
                </div>
              </div>

              {reqs.otherConditions?.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--color-slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-main)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate-600)', marginBottom: '4px' }}>
                    Additional Criteria:
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-slate-800)' }}>
                    {reqs.otherConditions.map((cond, i) => (
                      <li key={i}>{cond}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 4. Required Documents */}
            <div className="detail-card-block">
              <h2 className="detail-block-title">
                <FileCheck2 size={20} color="var(--color-primary-800)" /> Required Supporting Documents
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                You can attach these verified documents directly from your personal{' '}
                <Link to="/veteran/documents" style={{ color: 'var(--color-primary-800)', fontWeight: 600 }}>
                  Documents Vault
                </Link>{' '}
                during application:
              </p>
              <ul className="benefits-bullet-list">
                {scheme.requiredDocuments?.map((doc, i) => (
                  <li key={i} className="benefit-bullet-item">
                    <FileText size={16} color="var(--color-primary-700)" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontWeight: 600 }}>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 5. Application Process */}
            <div className="detail-card-block">
              <h2 className="detail-block-title">
                <HelpCircle size={20} color="var(--color-primary-800)" /> Application Procedure & Next Steps
              </h2>
              <ol className="process-steps-list">
                {scheme.applicationProcess?.map((step, idx) => (
                  <li key={idx} className="process-step-item">
                    <div className="step-number-circle">{idx + 1}</div>
                    <div className="step-text">{step}</div>
                  </li>
                ))}
              </ol>
            </div>

            {/* 6. Official Source Reference */}
            <div className="detail-card-block" style={{ backgroundColor: 'var(--color-primary-50)', borderColor: 'var(--color-primary-200)' }}>
              <h2 className="detail-block-title" style={{ borderColor: 'var(--color-primary-200)' }}>
                <ExternalLink size={20} color="var(--color-primary-900)" /> Official Government Source
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-950)', marginBottom: '1rem', lineHeight: 1.5 }}>
                This scheme record is indexed from public notifications issued by{' '}
                <strong>{scheme.officialSource}</strong>:
              </p>
              <a href={scheme.officialWebsite} target="_blank" rel="noopener noreferrer">
                <Button variant="accent" size="sm" icon={ExternalLink}>
                  Visit Official Authority Website
                </Button>
              </a>
            </div>
          </div>

          {/* Sidebar / Smart Eligibility Checker & Application Actions */}
          <div>
            <div className="eligibility-widget-card">
              <h3 className="eligibility-widget-title">
                <ShieldCheck size={22} color="var(--color-primary-800)" /> Smart Eligibility & Application
              </h3>
              <p className="eligibility-widget-desc">
                Check eligibility against your records and initiate online claim submission.
              </p>

              {/* Authenticated Veteran Flow */}
              {isAuthenticated && user?.role === 'VETERAN' ? (
                <div>
                  {/* If user already has an active application or draft */}
                  {existingApp ? (
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-border-main)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate-500)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Application Status
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <Badge variant={existingApp.status === 'APPROVED' ? 'success' : existingApp.status === 'DRAFT' ? 'neutral' : 'warning'}>
                          {existingApp.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--color-primary-950)', marginBottom: '1rem' }}>
                        {existingApp.applicationId}
                      </div>

                      {existingApp.status === 'DRAFT' ? (
                        <Link to={`/veteran/apply/${scheme.schemeId}`}>
                          <Button variant="accent" size="md" fullWidth icon={Edit3}>
                            Continue Draft Application
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/veteran/applications/${existingApp.applicationId}`}>
                          <Button variant="primary" size="md" fullWidth icon={Clock}>
                            Track Application Timeline
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : null}

                  {/* Eligibility Checker */}
                  {!eligibilityResult ? (
                    <div>
                      <Button
                        variant="accent"
                        size="md"
                        fullWidth
                        loading={evaluating}
                        icon={Sparkles}
                        onClick={handleCheckEligibility}
                      >
                        Check My Eligibility
                      </Button>
                      <ErrorMessage message={evalError} />
                    </div>
                  ) : (
                    <div>
                      {/* Match Score Meter */}
                      <div className="match-meter-box">
                        <div
                          className="match-percentage-score"
                          style={{ color: getScoreColor(eligibilityResult.matchPercentage) }}
                        >
                          {eligibilityResult.matchPercentage}%
                        </div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-slate-600)' }}>
                          Portal Eligibility Match
                        </div>
                        <div className="match-progress-bar-bg">
                          <div
                            className="match-progress-bar-val"
                            style={{
                              width: `${eligibilityResult.matchPercentage}%`,
                              backgroundColor: getScoreColor(eligibilityResult.matchPercentage),
                            }}
                          />
                        </div>

                        <Badge
                          variant={
                            eligibilityResult.status === 'ELIGIBLE'
                              ? 'success'
                              : eligibilityResult.status === 'INCOMPLETE_PROFILE'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {eligibilityResult.status === 'ELIGIBLE'
                            ? 'Eligible'
                            : eligibilityResult.status === 'INCOMPLETE_PROFILE'
                            ? 'Incomplete Profile'
                            : 'Criteria Not Met'}
                        </Badge>
                      </div>

                      {/* Criteria Breakdown */}
                      <ul className="eligibility-criteria-eval-list">
                        {eligibilityResult.matchedCriteria?.map((m, i) => (
                          <li key={i} className="eval-item-pass">
                            <Check size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{m}</span>
                          </li>
                        ))}

                        {eligibilityResult.missingCriteria?.map((mc, i) => (
                          <li key={i} className="eval-item-warn">
                            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{mc}</span>
                          </li>
                        ))}

                        {eligibilityResult.unmatchedCriteria?.map((um, i) => (
                          <li key={i} className="eval-item-fail">
                            <XCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{um}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Action Button Based on Result */}
                      {!existingApp && (
                        <div style={{ marginBottom: '1rem' }}>
                          {eligibilityResult.status === 'ELIGIBLE' ? (
                            <Link to={`/veteran/apply/${scheme.schemeId}`}>
                              <Button variant="accent" size="md" fullWidth icon={Send}>
                                Apply For This Scheme
                              </Button>
                            </Link>
                          ) : eligibilityResult.status === 'INCOMPLETE_PROFILE' ? (
                            <Link to="/veteran/profile">
                              <Button variant="secondary" size="sm" fullWidth>
                                Complete Service Profile to Apply
                              </Button>
                            </Link>
                          ) : (
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-danger)', textAlign: 'center' }}>
                              You currently do not meet the criteria for online application.
                            </p>
                          )}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        onClick={() => setEligibilityResult(null)}
                      >
                        Re-evaluate Criteria
                      </Button>
                    </div>
                  )}

                  {/* Informational Disclaimer */}
                  <div className="eligibility-disclaimer-box">
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '2px', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                      <Info size={12} style={{ marginTop: '2px' }} /> Informational Estimate Only
                    </div>
                    {eligibilityResult?.disclaimer ||
                      'This eligibility result is an informational estimate based on the information available in your profile. Final eligibility is determined by the relevant official authority.'}
                  </div>
                </div>
              ) : (
                /* Unauthenticated / Non-Veteran Prompt */
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <Lock size={28} color="var(--color-slate-400)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)', marginBottom: '1rem' }}>
                    Sign in with your verified Veteran account to check eligibility and submit your online claim application.
                  </p>
                  <Link to={ROUTES.LOGIN}>
                    <Button variant="accent" size="sm" fullWidth>
                      Sign In as Veteran
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default SchemeDetail;
