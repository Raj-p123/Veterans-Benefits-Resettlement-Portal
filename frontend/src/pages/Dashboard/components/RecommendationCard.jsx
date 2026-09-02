import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Award, Briefcase, ArrowRight } from 'lucide-react';
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
  isEmpty = false,
}) => {
  const isJob = type === 'job';

  if (isEmpty) {
    return (
      <div className="gov-recommendation-card rec-card-empty">
        <div className="rec-top-banner">
          <span className={`rec-tag ${isJob ? 'rec-tag-job' : 'rec-tag-scheme'}`}>
            {isJob ? 'CAREER OPPORTUNITY' : 'WELFARE SCHEME'}
          </span>
          <div className="rec-empty-badge" aria-hidden="true">
            {isJob ? <Briefcase size={16} /> : <Award size={16} />}
          </div>
        </div>

        <div className="rec-content-area">
          <h3 className="rec-opportunity-title">
            {isJob ? 'Targeted Job Matches' : 'Personalized Welfare Schemes'}
          </h3>
          <p className="rec-opportunity-desc">
            {isJob
              ? 'Complete your profile with your defense trade and preferred locations to unlock tailored corporate opportunities.'
              : 'Add your military rank, corps, and discharge category to receive personalized welfare and pension grants.'}
          </p>
        </div>

        <div className="rec-bottom-action">
          <Link to={isJob ? '/jobs' : '/schemes'}>
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              {isJob ? 'Explore Jobs' : 'Explore Benefits'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
