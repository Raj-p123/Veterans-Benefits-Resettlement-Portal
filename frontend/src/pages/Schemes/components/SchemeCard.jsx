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
  MapPin,
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
  const isFeatured = Boolean(scheme.isFeatured);

  return (
    <div className={`gov-scheme-card ${isFeatured ? 'scheme-card-featured' : ''}`}>
      <div className="card-top-content">
        {/* TOP: Category badge, Featured badge, Scheme ID */}
        <div className="card-top-badges-row">
          <div className="scheme-badges-left">
            <span className={`gov-category-badge ${colorClass}`}>
              <CatIcon size={12} aria-hidden="true" />
              <span>{scheme.category || 'General Welfare'}</span>
            </span>

            {isFeatured && (
              <span className="gov-featured-badge" title="Featured Defense Scheme">
                <Sparkles size={11} aria-hidden="true" />
                <span>Featured</span>
              </span>
            )}
          </div>

          {scheme.schemeId && (
            <span className="gov-scheme-id-tag">
              {scheme.schemeId}
            </span>
          )}
        </div>

        {/* TITLE */}
        <h3 className="scheme-card-title">
          <Link to={`/schemes/${schemeId}`} className="scheme-title-link">
            {scheme.name}
          </Link>
        </h3>

        {/* DESCRIPTION */}
        <p className="scheme-card-desc">
          {scheme.shortDescription ||
            scheme.description ||
            'Financial, medical or resettlement assistance sanctioned under Ministry of Defence welfare provisions.'}
        </p>

        {/* BENEFITS with green check icons */}
        {scheme.benefits && scheme.benefits.length > 0 && (
          <div className="scheme-benefits-container">
            <span className="benefits-label">Key Benefits:</span>
            <ul className="scheme-benefits-list">
              {scheme.benefits.slice(0, 3).map((benefit, idx) => (
                <li key={idx} className="scheme-benefit-item">
                  <div className="benefit-check-circle" aria-hidden="true">
                    <Check size={11} className="benefit-check-icon" />
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* BOTTOM: Authority, Scope/Jurisdiction, and View Details button */}
      <div className="card-bottom-row">
        <div className="scheme-authority-stack">
          <div className="authority-name-row" title={scheme.officialSource || 'Kendriya Sainik Board, MoD'}>
            <Building2 size={12} className="authority-icon" aria-hidden="true" />
            <span className="authority-name-text">
              {scheme.officialSource || 'Kendriya Sainik Board, MoD'}
            </span>
          </div>

          <div className="authority-scope-row">
            <MapPin size={11} className="scope-icon" aria-hidden="true" />
            <span className="authority-scope-text">
              {scheme.state || 'All India'}
            </span>
          </div>
        </div>

        <div className="card-cta-wrapper">
          <Link to={`/schemes/${schemeId}`} tabIndex={-1}>
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
