import React from 'react';
import './Badge.css';

export const Badge = ({
  children,
  variant = 'neutral',
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {Icon && <Icon size={12} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
