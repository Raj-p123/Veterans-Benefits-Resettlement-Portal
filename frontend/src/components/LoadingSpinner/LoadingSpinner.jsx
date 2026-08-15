import React from 'react';
import './LoadingSpinner.css';

export const LoadingSpinner = ({
  size = 'md',
  message = 'Loading...',
  color = 'var(--color-primary-800)',
  className = '',
}) => {
  return (
    <div className={`spinner-container ${className}`} role="status" aria-live="polite">
      <svg
        className={`spinner-svg spinner-${size}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="var(--color-slate-200)"
          strokeWidth="3"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {message && <span className="spinner-text">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;
