import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Input.css';

export const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  as = 'input',
  children,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const inputClasses = [
    'input-field',
    error ? 'input-error' : '',
    Icon ? 'has-icon-left' : '',
    isPassword ? 'has-action-right' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="input-required" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="input-wrapper">
        {Icon && (
          <span className="input-icon-left">
            <Icon size={16} />
          </span>
        )}

        {as === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
            aria-invalid={!!error}
            {...props}
          />
        ) : as === 'select' ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={inputClasses}
            aria-invalid={!!error}
            {...props}
          >
            {children}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={effectiveType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
            aria-invalid={!!error}
            {...props}
          />
        )}

        {isPassword && (
          <button
            type="button"
            className="input-action-right"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && (
        <div className="input-error-text" role="alert">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {!error && helperText && (
        <div className="input-helper-text">{helperText}</div>
      )}
    </div>
  );
};

export default Input;
