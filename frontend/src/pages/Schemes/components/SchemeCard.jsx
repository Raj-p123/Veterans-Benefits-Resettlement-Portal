import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Landmark,
  Home,
  GraduationCap,
  Briefcase,
  Award,
  Users,
  Wallet,
  FileText,
  Sparkles,
  Check,
  Building2,
  ArrowRight,
} from 'lucide-react';
import Button from '../../../components/Button/Button.jsx';

export const SchemeCard = ({ scheme }) => {
  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'Healthcare':
        return { icon: HeartPulse, colorClass: 'badge-healthcare' };
      case 'Pension':
        return { icon: Landmark, colorClass: 'badge-pension' };
      case 'Housing':
        return { icon: Home, colorClass: 'badge-housing' };
      case 'Education':
        return { icon: GraduationCap, colorClass: 'badge-education' };
      case 'Employment':
        return { icon: Briefcase, colorClass: 'badge-employment' };
      case 'Skill Development':
        return { icon: Award, colorClass: 'badge-skill' };
      case 'Family Welfare':
        return { icon: Users, colorClass: 'badge-family' };
      case 'Financial Assistance':
        return { icon: Wallet, colorClass: 'badge-financial' };
      default:
        return { icon: FileText, colorClass: 'badge-default' };
    }
  };

  const { icon: CatIcon, colorClass } = getCategoryMeta(scheme.category);
  const schemeId = scheme.schemeId || scheme.id || scheme._id;

  return (
    <div className={`gov-scheme-card ${scheme.isFeatured ? 'scheme-card-featured-border' : ''}`}>
      <div className="card-top-content">
        {/* Badges and Scheme ID */}
        <div className="card-top-badges-row">
          <div className="scheme-badges-left">
            <span className={`gov-category-badge ${colorClass}`}>
              <CatIcon size={12} aria-hidden="true" />
              <span>{scheme.category || 'General Welfare'}</span>
            </span>

            {scheme.isFeatured && (
              <span className="gov-featured-badge" title="Priority Welfare Scheme">
                <Sparkles size={11} aria-hidden="true" />
                <span>★ Featured</span>
              </span>
            )}
          </div>

          {scheme.schemeId && (
            <span className="gov-scheme-id-tag">
              ID: {scheme.schemeId}
            </span>
          )}
        </div>

        {/* Title & Short Description */}
        <h3 className="scheme-card-title">
          <Link to={`/schemes/${schemeId}`} className="scheme-title-link">
            {scheme.name}
          </Link>
        </h3>

        <p className="scheme-card-desc">
          {scheme.shortDescription ||
            'Financial, medical or resettlement grant sanctioned under Ministry of Defence welfare provisions.'}
        </p>

        {/* Benefit Highlights */}
        {scheme.benefits && scheme.benefits.length > 0 && (
          <div className="scheme-benefits-container">
            <span className="benefits-label">Key Benefits:</span>
            <ul className="scheme-benefits-list">
              {scheme.benefits.slice(0, 2).map((benefit, idx) => (
                <li key={idx} className="scheme-benefit-item">
                  <Check size={13} className="benefit-check-icon" aria-hidden="true" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer Area: Awarding Authority, Jurisdiction & CTA */}
      <div className="card-bottom-row">
        <div className="scheme-authority-stack">
          <span className="authority-prefix">Awarding Authority</span>
          <div className="authority-name-row" title={scheme.officialSource || 'Kendriya Sainik Board, MoD'}>
            <Building2 size={12} className="authority-icon" aria-hidden="true" />
            <span className="authority-name-text">
              {scheme.officialSource || 'Kendriya Sainik Board, MoD'}
            </span>
          </div>
          <span className="authority-scope-text">
            Scope: {scheme.state || 'All India'}
          </span>
        </div>

        <div className="card-cta-wrapper">
          <Link to={`/schemes/${schemeId}`}>
            <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SchemeCard;
