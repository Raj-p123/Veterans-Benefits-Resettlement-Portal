import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './ErrorMessage.css';

export const ErrorMessage = ({
  title,
  message,
  errors = [],
  className = '',
}) => {
  if (!message && (!errors || errors.length === 0)) return null;

  return (
    <div className={`error-alert ${className}`} role="alert">
      <AlertTriangle className="error-alert-icon" size={18} />
      <div className="error-alert-content">
        {title && <div className="error-alert-title">{title}</div>}
        {message && <div>{message}</div>}
        {errors && errors.length > 0 && (
          <ul className="error-alert-list">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
