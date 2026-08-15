import React from 'react';
import { Target, AlertCircle, CheckCircle2, Shield, HeartHandshake } from 'lucide-react';
import PageContainer from '../../components/PageContainer/PageContainer.jsx';
import './About.css';

export const About = () => {
  return (
    <div>
      <div className="about-header-section">
        <div className="container">
          <h1 className="about-header-title">About the Portal</h1>
          <p className="about-header-sub">
            Bridging the gap between military service and civilian prosperity through structured digital governance.
          </p>
        </div>
      </div>

      <PageContainer>
        <div className="about-grid">
          {/* Column 1: Problems Veterans Face */}
          <div className="about-card">
            <h2 className="about-card-title">
              <AlertCircle size={24} color="var(--color-warning)" />
              The Transition Challenge
            </h2>
            <p style={{ marginBottom: '1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
              Every year, thousands of highly disciplined defense personnel transition to civilian life, encountering significant systemic obstacles:
            </p>
            <ul className="about-list">
              <li className="about-list-item">
                <span className="about-list-icon">▪</span>
                <div>
                  <strong>Fragmented Information:</strong> Welfare schemes, medical benefits, and pension updates are scattered across disparate departments.
                </div>
              </li>
              <li className="about-list-item">
                <span className="about-list-icon">▪</span>
                <div>
                  <strong>Skill Translation Gap:</strong> Defense competencies (logistics, tactical command, cybersecurity) often fail to be recognized by private employers.
                </div>
              </li>
              <li className="about-list-item">
                <span className="about-list-icon">▪</span>
                <div>
                  <strong>Bureaucratic Delay:</strong> Physical paper trails and lack of digital tracking prolong grievance redressal and welfare disbursements.
                </div>
              </li>
              <li className="about-list-item">
                <span className="about-list-icon">▪</span>
                <div>
                  <strong>Limited Resettlement Support:</strong> Lack of direct corporate hiring channels focused on second-career veterans.
                </div>
              </li>
            </ul>
          </div>

          {/* Column 2: What We Aim to Solve */}
          <div className="about-card">
            <h2 className="about-card-title">
              <Target size={24} color="var(--color-primary-600)" />
              Our Mission & Solution
            </h2>
            <p style={{ marginBottom: '1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
              The Veterans Benefits & Resettlement Portal acts as a unified digital ecosystem built to honor service with effective opportunity:
            </p>
            <ul className="about-list">
              <li className="about-list-item">
                <CheckCircle2 size={18} color="var(--color-success)" className="about-list-icon" />
                <div>
                  <strong>Single Window Gateway:</strong> Consolidating central, state, and defense welfare schemes in a searchable, verified repository.
                </div>
              </li>
              <li className="about-list-item">
                <CheckCircle2 size={18} color="var(--color-success)" className="about-list-icon" />
                <div>
                  <strong>Verified Corporate Hiring:</strong> Connecting transitioning veterans directly to verified employers with dedicated military recruitment programs.
                </div>
              </li>
              <li className="about-list-item">
                <CheckCircle2 size={18} color="var(--color-success)" className="about-list-icon" />
                <div>
                  <strong>Transparent Tracking:</strong> Real-time status updates on all applications, grievances, and resettlement enrollment.
                </div>
              </li>
              <li className="about-list-item">
                <CheckCircle2 size={18} color="var(--color-success)" className="about-list-icon" />
                <div>
                  <strong>Role-Based Security:</strong> Strict multi-role architecture ensuring privacy and authenticity for veterans, employers, and administrators.
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Vision Statement Box */}
        <div className="vision-box">
          <div style={{ display: 'inline-flex', padding: '8px', background: '#fff', borderRadius: '50%', marginBottom: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <Shield size={28} color="var(--color-accent-600)" />
          </div>
          <h3 className="vision-title">Our Long-Term Vision</h3>
          <p className="vision-text">
            To ensure no veteran is left behind after laying down their uniform. By combining cutting-edge technology,
            robust government standards, and dynamic employer networks, we foster dignity, security, and fulfilling second careers for every service member and their family.
          </p>
        </div>
      </PageContainer>
    </div>
  );
};

export default About;
