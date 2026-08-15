import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../constants/index.js';
import Button from '../../components/Button/Button.jsx';
import './Errors.css';

export const NotFound = () => {
  return (
    <div className="error-page-wrapper">
      <div className="error-page-card">
        <div className="error-icon-box error-icon-404">
          <Compass size={32} />
        </div>

        <div className="error-code">HTTP 404 Error</div>
        <h1 className="error-title">Page Not Found</h1>

        <p className="error-message">
          The page or portal resource you are searching for does not exist, has been moved, or is temporarily unavailable.
        </p>

        <div className="error-actions">
          <Link to={ROUTES.HOME}>
            <Button variant="primary" icon={Home}>
              Return to Homepage
            </Button>
          </Link>
          <Link to={ROUTES.CONTACT}>
            <Button variant="secondary">
              Contact Portal Helpdesk
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
