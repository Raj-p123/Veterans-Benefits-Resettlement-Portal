import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Award,
  Briefcase,
  GraduationCap,
  FileCheck2,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Check,
  Clock,
  Building2,
  ChevronRight,
  FileText,
  HeartHandshake,
  Lock,
  Layers,
  MapPin,
} from 'lucide-react';
import { ROUTES } from '../../constants/index.js';
import { schemeService } from '../../services/schemeService.js';
import { jobService } from '../../services/jobService.js';
import Button from '../../components/Button/Button.jsx';
import Badge from '../../components/Badge/Badge.jsx';
import './Home.css';

export const Home = () => {
  const [totalSchemes, setTotalSchemes] = useState(26);
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(24);
  const [loading, setLoading] = useState(true);

  // Load real catalog data from existing public backend APIs
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [schemesRes, jobsRes, featuredRes] = await Promise.allSettled([
          schemeService.getSchemes({ limit: 1 }),
          jobService.getJobs({ limit: 3, status: 'ACTIVE' }),
          schemeService.getFeaturedSchemes(),
        ]);

        if (isMounted) {
          if (schemesRes.status === 'fulfilled' && schemesRes.value) {
            const count =
              schemesRes.value.total ||
              schemesRes.value.totalPortalResults ||
              schemesRes.value.pagination?.total ||
              26;
            setTotalSchemes(count);
          }

          if (jobsRes.status === 'fulfilled' && jobsRes.value) {
            const jPayload = jobsRes.value.data || jobsRes.value;
            const jobsList = jPayload.jobs || jPayload.results || [];
            const jCount = jPayload.total || jPayload.pagination?.total || jobsList.length || 24;
            setActiveJobs(jobsList.slice(0, 3));
            setTotalJobs(jCount);
          }

          if (featuredRes.status === 'fulfilled' && featuredRes.value) {
            const fPayload = featuredRes.value.data || featuredRes.value;
            const featList = fPayload.schemes || fPayload.results || [];
            setFeaturedSchemes(featList.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic landing page data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="landing-page-root">
      {/* =========================================================================
          1. HERO SECTION (Spacious Two-Column SaaS Layout)
          ========================================================================= */}
      <section className="hero-landing-section">
        <div className="container hero-landing-grid">
          {/* Left Column: Core Value & Call to Actions */}
          <div className="hero-left-content">
            <div className="hero-eyebrow-badge">
              <span className="eyebrow-dot" />
              <span className="eyebrow-text">SUPPORTING THOSE WHO SERVED</span>
            </div>

            <h1 className="hero-main-heading">
              Your benefits, opportunities <br className="hidden-mobile" />
              and next chapter — <br className="hidden-mobile" />
              <span className="heading-highlight">in one place.</span>
            </h1>

            <p className="hero-lead-description">
              Access veteran benefits, discover employment opportunities, explore resettlement programs
              and track your applications from one simple platform.
            </p>

            <div className="hero-cta-button-group">
              <Link to={ROUTES.SCHEMES}>
                <Button variant="primary" size="lg" icon={Compass}>
                  Explore Benefits
                </Button>
              </Link>
              <Link to={ROUTES.JOBS}>
                <Button variant="secondary" size="lg" icon={Briefcase}>
                  Find Opportunities
                </Button>
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="hero-metrics-strip">
              <div className="metric-strip-item">
                <span className="metric-number">{totalSchemes}</span>
                <span className="metric-label">Welfare Schemes</span>
              </div>
              <div className="metric-strip-divider" />
              <div className="metric-strip-item">
                <span className="metric-number">{totalJobs}</span>
                <span className="metric-label">Active Career Openings</span>
              </div>
              <div className="metric-strip-divider" />
              <div className="metric-strip-item">
                <span className="metric-number">100%</span>
                <span className="metric-label">Digital Application Tracking</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Interactive Dashboard Preview */}
          <div className="hero-right-visual">
            <div className="hero-preview-container">
              {/* Background Geometric Glow / Pattern */}
              <div className="hero-visual-backdrop" />

              {/* Floating Primary Dashboard Preview Card */}
              <div className="hero-preview-card">
                <div className="preview-card-header">
                  <div className="preview-brand-indicator">
                    <div className="preview-brand-icon">
                      <Shield size={16} />
                    </div>
                    <span className="preview-brand-title">PORTAL SNAPSHOT</span>
                  </div>
                  <span className="preview-status-pill">LIVE DIRECTORY</span>
                </div>

                <div className="preview-card-body">
                  {/* Item 1: Benefits */}
                  <div className="preview-metric-row">
                    <div className="metric-row-left">
                      <div className="metric-icon-box bg-gold">
                        <Award size={18} />
                      </div>
                      <div>
                        <div className="metric-row-title">Benefits & Schemes</div>
                        <div className="metric-row-sub">Pensions, Healthcare, Education</div>
                      </div>
                    </div>
                    <span className="metric-count-badge">{totalSchemes} Available</span>
                  </div>

                  {/* Item 2: Jobs */}
                  <div className="preview-metric-row">
                    <div className="metric-row-left">
                      <div className="metric-icon-box bg-blue">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <div className="metric-row-title">Job Opportunities</div>
                        <div className="metric-row-sub">Private & Corporate Defense Roles</div>
                      </div>
                    </div>
                    <span className="metric-count-badge">{totalJobs} Active</span>
                  </div>

                  {/* Item 3: Application Tracking */}
                  <div className="preview-metric-row">
                    <div className="metric-row-left">
                      <div className="metric-icon-box bg-green">
                        <FileCheck2 size={18} />
                      </div>
                      <div>
                        <div className="metric-row-title">Application Vault</div>
                        <div className="metric-row-sub">End-to-End Status Milestones</div>
                      </div>
                    </div>
                    <span className="metric-count-badge" style={{ backgroundColor: '#ECFDF5', color: '#047857' }}>
                      Online Tracking
                    </span>
                  </div>
                </div>

                {/* Card Mini Timeline Preview */}
                <div className="preview-card-footer">
                  <div className="preview-timeline-label">Application Status Pipeline:</div>
                  <div className="preview-mini-timeline">
                    <span className="mini-step done">Submitted ✓</span>
                    <span className="mini-arrow">→</span>
                    <span className="mini-step active">Under Review ●</span>
                    <span className="mini-arrow">→</span>
                    <span className="mini-step pending">Sanction ○</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. VALUE PROPOSITION: EVERYTHING YOU NEED AFTER SERVICE
          ========================================================================= */}
      <section className="section-container bg-surface">
        <div className="container">
          <div className="section-head-center">
            <span className="section-eyebrow">COMPREHENSIVE RESETTLEMENT</span>
            <h2 className="section-heading">Everything you need after service</h2>
            <p className="section-subheading">
              A single unified gateway providing verified welfare programs, private-sector career pathways,
              and transparent application management.
            </p>
          </div>

          <div className="value-features-grid">
            {/* Feature 1 */}
            <div className="value-feature-card">
              <div className="feature-icon-wrapper">
                <Award size={24} />
              </div>
              <h3 className="feature-card-title">Benefits & Schemes</h3>
              <p className="feature-card-desc">
                Discover central and state welfare schemes, defense pensions, healthcare coverage, and family grants.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="value-feature-card">
              <div className="feature-icon-wrapper">
                <Briefcase size={24} />
              </div>
              <h3 className="feature-card-title">Career Opportunities</h3>
              <p className="feature-card-desc">
                Connect directly with corporate employers seeking military discipline, technical expertise, and leadership.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="value-feature-card">
              <div className="feature-icon-wrapper">
                <FileCheck2 size={24} />
              </div>
              <h3 className="feature-card-title">Application Tracking</h3>
              <p className="feature-card-desc">
                Submit claims digitally and track document scrutiny, approvals, and sanctions in real time.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="value-feature-card">
              <div className="feature-icon-wrapper">
                <GraduationCap size={24} />
              </div>
              <h3 className="feature-card-title">Skill Development</h3>
              <p className="feature-card-desc">
                Explore targeted certifications, civilian skill translation, and resettlement training programs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. BENEFITS SECTION: EXPLORE SUPPORT & BENEFITS
          ========================================================================= */}
      <section className="section-container">
        <div className="container">
          <div className="section-head-flex">
            <div>
              <span className="section-eyebrow">WELFARE & CLAIMS</span>
              <h2 className="section-heading">Explore Support & Benefits</h2>
              <p className="section-subheading">
                Verified programs categorized by service branch, welfare priority, and state jurisdiction.
              </p>
            </div>
            <Link to={ROUTES.SCHEMES} className="section-top-link">
              <span>View all benefits & schemes</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="categories-card-grid">
            {/* Category 1 */}
            <div className="benefit-category-card">
              <div className="category-icon-box bg-gold">
                <Award size={22} />
              </div>
              <h3 className="category-title">Pension & Welfare</h3>
              <p className="category-desc">
                SPARSH defense pension guidance, service disability claims, OROP equalization, and penury grants.
              </p>
              <Link to="/schemes?category=Pension" className="category-learn-link">
                <span>Learn more</span>
                <ChevronRight size={15} />
              </Link>
            </div>

            {/* Category 2 */}
            <div className="benefit-category-card">
              <div className="category-icon-box bg-green">
                <HeartHandshake size={22} />
              </div>
              <h3 className="category-title">Healthcare</h3>
              <p className="category-desc">
                ECHS empanelment procedures, cashless medical consultations, and emergency health assistance.
              </p>
              <Link to="/schemes?category=Healthcare" className="category-learn-link">
                <span>Learn more</span>
                <ChevronRight size={15} />
              </Link>
            </div>

            {/* Category 3 */}
            <div className="benefit-category-card">
              <div className="category-icon-box bg-blue">
                <GraduationCap size={22} />
              </div>
              <h3 className="category-title">Education</h3>
              <p className="category-desc">
                Prime Minister's Scholarship Scheme (PMSS) and higher education grants for children of ex-servicemen.
              </p>
              <Link to="/schemes?category=Education" className="category-learn-link">
                <span>Learn more</span>
                <ChevronRight size={15} />
              </Link>
            </div>

            {/* Category 4 */}
            <div className="benefit-category-card">
              <div className="category-icon-box bg-purple">
                <Building2 size={22} />
              </div>
              <h3 className="category-title">Resettlement & Housing</h3>
              <p className="category-desc">
                Army Welfare Housing Organisation (AWHO) schemes and Directorate General Resettlement programs.
              </p>
              <Link to="/schemes?category=Housing" className="category-learn-link">
                <span>Learn more</span>
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>

          {/* Featured Scheme Cards Showcase */}
          {featuredSchemes.length > 0 && (
            <div className="featured-schemes-subgrid">
              <div className="subgrid-title">Featured Welfare Programs</div>
              <div className="schemes-preview-cards">
                {featuredSchemes.map((s) => (
                  <div key={s.id || s._id} className="scheme-preview-card">
                    <div className="scheme-card-top-row">
                      <Badge variant="primary">{s.category}</Badge>
                      <span className="scheme-id-tag">{s.schemeId}</span>
                    </div>
                    <h4 className="scheme-preview-title">{s.name}</h4>
                    <p className="scheme-preview-desc">{s.shortDescription}</p>
                    <div className="scheme-preview-footer">
                      <span className="scheme-scope-text">Scope: {s.state || 'All India'}</span>
                      <Link to={`/schemes/${s.schemeId || s.id || s._id}`} className="view-detail-btn">
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          4. CAREER SECTION: FIND YOUR NEXT OPPORTUNITY
          ========================================================================= */}
      <section className="section-container bg-surface">
        <div className="container">
          <div className="section-head-flex">
            <div>
              <span className="section-eyebrow">VETERAN HIRING</span>
              <h2 className="section-heading">Find Your Next Opportunity</h2>
              <p className="section-subheading">
                Explore vetted corporate openings from companies prioritizing military veterans and leadership backgrounds.
              </p>
            </div>
            <Link to={ROUTES.JOBS} className="section-top-link">
              <span>Explore all opportunities</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="jobs-preview-grid">
            {activeJobs.length > 0 ? (
              activeJobs.map((job) => (
                <div key={job.id || job._id} className="job-preview-card">
                  <div className="job-card-header">
                    <div>
                      <h3 className="job-card-title">{job.title}</h3>
                      <div className="job-card-company">
                        {job.employer?.companyName || job.companyName || 'Defense-Ready Corporate Employer'}
                      </div>
                    </div>
                    <Badge variant="success">
                      {(job.jobType || job.type || 'FULL_TIME').replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="job-meta-row">
                    <span className="job-meta-item">
                      <MapPin size={14} />
                      {job.location || job.city || 'Bhubaneswar, Odisha'}
                    </span>
                    {job.salaryRange && (
                      <span className="job-meta-item">
                        ₹ {job.salaryRange.min ? job.salaryRange.min.toLocaleString('en-IN') : '30,000'} -{' '}
                        {job.salaryRange.max ? job.salaryRange.max.toLocaleString('en-IN') : '50,000'} / mo
                      </span>
                    )}
                  </div>

                  <p className="job-card-summary">
                    {job.description?.slice(0, 110) || 'Seeking disciplined defense veteran with proven team leadership and operational skills.'}...
                  </p>

                  <div className="job-card-footer">
                    <span className="job-posted-date">Verified Employer</span>
                    <Link to={`/jobs/${job.id || job._id}`}>
                      <Button variant="secondary" size="sm" icon={ArrowRight}>
                        View Job
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-jobs-notice">
                <Briefcase size={32} />
                <p>Loading active corporate requisitions...</p>
                <Link to={ROUTES.JOBS}>
                  <Button variant="primary" size="sm">
                    Browse All Opportunities
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. HOW IT WORKS (Three-Step Process)
          ========================================================================= */}
      <section className="section-container">
        <div className="container">
          <div className="section-head-center">
            <span className="section-eyebrow">SIMPLE & TRANSPARENT</span>
            <h2 className="section-heading">How It Works</h2>
            <p className="section-subheading">
              A structured 3-step pathway designed to remove bureaucratic hurdles and deliver rapid outcomes.
            </p>
          </div>

          <div className="how-it-works-timeline-grid">
            {/* Step 1 */}
            <div className="process-step-card">
              <div className="step-badge-number">01</div>
              <h3 className="process-step-title">Create Your Profile</h3>
              <p className="process-step-desc">
                Add your military service details, trade credentials, rank, skills, and resettlement preferences.
              </p>
            </div>

            {/* Step 2 */}
            <div className="process-step-card">
              <div className="step-badge-number">02</div>
              <h3 className="process-step-title">Explore Opportunities</h3>
              <p className="process-step-desc">
                Browse matched welfare schemes, verified government benefits, and corporate career opportunities.
              </p>
            </div>

            {/* Step 3 */}
            <div className="process-step-card">
              <div className="step-badge-number">03</div>
              <h3 className="process-step-title">Apply & Track</h3>
              <p className="process-step-desc">
                Submit digital applications with one click and track review milestones without paperwork or delays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. APPLICATION TRACKING PREVIEW
          ========================================================================= */}
      <section className="section-container bg-surface">
        <div className="container tracking-preview-box">
          <div className="tracking-preview-left">
            <span className="section-eyebrow">TRANSPARENT WORKFLOW</span>
            <h2 className="section-heading">Stay Informed at Every Step</h2>
            <p className="tracking-lead-text">
              Track your welfare claims and job applications without paperwork, repeated visits, or administrative uncertainty.
            </p>

            <ul className="tracking-perks-list">
              <li>
                <CheckCircle2 size={18} color="#10B981" />
                <span>Instant status alerts on milestone changes and approvals</span>
              </li>
              <li>
                <CheckCircle2 size={18} color="#10B981" />
                <span>Direct clarification requests if additional documents are needed</span>
              </li>
              <li>
                <CheckCircle2 size={18} color="#10B981" />
                <span>Centralized digital documents vault for certified defense records</span>
              </li>
            </ul>

            <div style={{ marginTop: '1.5rem' }}>
              <Link to={ROUTES.SCHEMES}>
                <Button variant="primary" size="md" icon={Compass}>
                  Explore Benefits
                </Button>
              </Link>
            </div>
          </div>

          <div className="tracking-preview-right">
            <div className="workflow-card">
              <div className="workflow-card-head">
                <span className="workflow-tag">LIVE MILESTONE TRACKER</span>
                <span className="workflow-id">APP-2026-0042</span>
              </div>

              <div className="workflow-steps-vertical">
                {/* Step 1 */}
                <div className="workflow-step-row completed">
                  <div className="step-status-icon">✓</div>
                  <div className="step-text-block">
                    <span className="step-label">Application Submitted</span>
                    <span className="step-date">Digital documents uploaded & verified</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="workflow-step-row active">
                  <div className="step-status-icon">●</div>
                  <div className="step-text-block">
                    <span className="step-label">Under Scrutiny</span>
                    <span className="step-date">Record verification by welfare authority</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="workflow-step-row pending">
                  <div className="step-status-icon">○</div>
                  <div className="step-text-block">
                    <span className="step-label">Document Verification</span>
                    <span className="step-date">Pending administrative review</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="workflow-step-row pending">
                  <div className="step-status-icon">○</div>
                  <div className="step-text-block">
                    <span className="step-label">Final Decision & Sanction</span>
                    <span className="step-date">Direct benefit disbursement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. TRUST & INTEGRITY VALUES
          ========================================================================= */}
      <section className="section-container">
        <div className="container">
          <div className="trust-features-grid">
            <div className="trust-item">
              <ShieldCheck size={26} className="text-primary" />
              <div>
                <h4 className="trust-title">Verified Official Sources</h4>
                <p className="trust-desc">
                  All welfare schemes are cross-referenced with authorized defense guidelines.
                </p>
              </div>
            </div>

            <div className="trust-item">
              <Lock size={26} className="text-primary" />
              <div>
                <h4 className="trust-title">Secure & Confidential</h4>
                <p className="trust-desc">
                  Defense service records and personal credentials protected with role-based encryption.
                </p>
              </div>
            </div>

            <div className="trust-item">
              <Clock size={26} className="text-primary" />
              <div>
                <h4 className="trust-title">Real-Time Tracking</h4>
                <p className="trust-desc">
                  Clear digital progress updates from submission through final sanction.
                </p>
              </div>
            </div>

            <div className="trust-item">
              <Users size={26} className="text-primary" />
              <div>
                <h4 className="trust-title">Dedicated Support</h4>
                <p className="trust-desc">
                  Comprehensive assistance for veterans, ex-servicemen, and family dependents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FINAL CALL TO ACTION (Dark Navy Section)
          ========================================================================= */}
      <section className="final-cta-section">
        <div className="container final-cta-container">
          <h2 className="final-cta-heading">Ready to take the next step?</h2>
          <p className="final-cta-subheading">
            Create your profile and explore benefits, opportunities, and resettlement support in one place.
          </p>

          <div className="final-cta-buttons">
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                Get Started
              </Button>
            </Link>
            <Link to={ROUTES.SCHEMES}>
              <Button variant="outline" size="lg" style={{ color: '#FFFFFF', borderColor: '#FFFFFF' }}>
                Explore Benefits
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
