import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
  linkTo,
  linkText,
  colorScheme = 'blue',
}) => {
  return (
    <div className={`veteran-stat-card theme-${colorScheme}`}>
      <div className="stat-header">
        <span className="stat-category-label">{label}</span>
        <div className={`stat-icon-box stat-icon-${colorScheme}`} aria-hidden="true">
          {Icon && <Icon size={18} />}
        </div>
      </div>
      <div className="stat-number">{value ?? 0}</div>
      <p className="stat-short-desc">{description}</p>
      <div className="stat-footer">
        <Link to={linkTo} className="stat-link">
          <span>{linkText}</span>
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default StatCard;
