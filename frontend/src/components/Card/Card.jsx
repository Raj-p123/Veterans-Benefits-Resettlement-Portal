import React from 'react';
import './Card.css';

export const Card = ({
  children,
  hoverable = false,
  elevated = false,
  className = '',
  ...props
}) => {
  const classes = [
    'card',
    hoverable ? 'card-hover' : '',
    elevated ? 'card-elevated' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, as: Tag = 'h3', className = '', ...props }) => (
  <Tag className={`card-title ${className}`} {...props}>
    {children}
  </Tag>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`card-description ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`card-content ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
