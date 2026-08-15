import React from 'react';
import './PageContainer.css';

export const PageContainer = ({
  children,
  title,
  subtitle,
  width = 'default',
  className = '',
  ...props
}) => {
  const containerClasses = [
    'page-container',
    width === 'narrow' ? 'page-container-narrow' : width === 'wide' ? 'page-container-wide' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <main className={containerClasses} {...props}>
      {(title || subtitle) && (
        <header className="page-header">
          {title && <h1 className="page-title">{title}</h1>}
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </header>
      )}
      {children}
    </main>
  );
};

export default PageContainer;
