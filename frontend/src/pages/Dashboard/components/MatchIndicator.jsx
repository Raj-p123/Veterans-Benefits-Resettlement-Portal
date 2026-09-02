import React from 'react';

/**
 * Circular progress gauge for displaying match percentage
 * @param {number} percentage Match percentage (e.g. 92)
 * @param {number} size Diameter in pixels
 * @param {string} color Stroke color (default: emerald green)
 */
export const MatchIndicator = ({ percentage = 90, size = 44, color = '#059669' }) => {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="match-indicator-wrapper"
      style={{ width: size, height: size }}
      title={`${percentage}% Match`}
      aria-label={`${percentage}% Match`}
    >
      <svg width={size} height={size} className="match-svg" aria-hidden="true">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        {/* Foreground progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="match-text-container">
        <span className="match-num">{percentage}%</span>
        <span className="match-word">Match</span>
      </div>
    </div>
  );
};

export default MatchIndicator;
