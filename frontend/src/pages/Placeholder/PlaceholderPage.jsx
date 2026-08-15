import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Shield, Compass, Briefcase } from 'lucide-react';
import PageContainer from '../../components/PageContainer/PageContainer.jsx';
import Button from '../../components/Button/Button.jsx';
import Badge from '../../components/Badge/Badge.jsx';
import { ROUTES } from '../../constants/index.js';

export const PlaceholderPage = ({
  title = 'Module In Development',
  subtitle = 'This module is scheduled for full deployment in upcoming phases.',
  icon: Icon = Compass,
  badgeText = 'Phase 3+ Module',
  description = 'Our engineering team is actively building this comprehensive module with full database persistence, workflow automation, and multi-tier role permissions.',
}) => {
  return (
    <PageContainer>
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-main)',
          borderRadius: 'var(--radius-xl)',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          maxWidth: '720px',
          margin: '2rem auto',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-primary-50)',
            color: 'var(--color-primary-800)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            border: '1px solid var(--color-primary-100)',
          }}
        >
          <Icon size={32} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <Badge variant="gold" icon={Sparkles}>
            {badgeText}
          </Badge>
        </div>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--color-primary-950)',
            marginBottom: '0.75rem',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}
        >
          {subtitle}
        </p>

        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-slate-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-slate-300)',
            fontSize: '0.875rem',
            color: 'var(--color-slate-600)',
            marginBottom: '2rem',
          }}
        >
          {description}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to={ROUTES.HOME}>
            <Button variant="secondary" icon={ArrowLeft}>
              Return to Homepage
            </Button>
          </Link>
          <Link to={ROUTES.REGISTER}>
            <Button variant="accent">
              Create Account for Updates
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default PlaceholderPage;
