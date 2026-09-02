import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin } from 'lucide-react';
import Button from '../../../components/Button/Button.jsx';
import MatchIndicator from './MatchIndicator.jsx';

export const RecommendationCard = ({
  type = 'scheme', // 'scheme' | 'job'
  tag = 'WELFARE SCHEME',
  title,
  description,
  company,
  location,
  employmentType,
  matchPercentage = 90,
  linkTo,
  buttonText = 'View Details →',
}) => {
  const isJob = type === 'job';

  return (
    <div className="gov-recommendation-card">
      <div className="rec-top-banner">
        <span className={`rec-tag ${isJob ? 'rec-tag-job' : 'rec-tag-scheme'}`}>{tag}</span>
        <MatchIndicator
          percentage={matchPercentage}
          color={isJob ? '#7C3AED' : '#059669'}
          size={46}
        />
      </div>

      <div className="rec-content-area">
        <h3 className="rec-opportunity-title">{title}</h3>

        {!isJob && description && (
          <p className="rec-opportunity-desc">{description}</p>
        )}

        {isJob && (
          <div className="rec-job-meta-row">
            {company && (
              <span className="rec-meta-item">
                <Building2 size={13} aria-hidden="true" />
                <span>{company}</span>
              </span>
            )}
            {location && (
              <span className="rec-meta-item">
                <MapPin size={13} aria-hidden="true" />
                <span>{location}</span>
              </span>
            )}
            {employmentType && (
              <span className="rec-employment-pill">{employmentType}</span>
            )}
          </div>
        )}
      </div>

      <div className="rec-bottom-action">
        <Link to={linkTo}>
          <Button variant="primary" size="sm">
            {buttonText}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RecommendationCard;
