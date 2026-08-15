import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Shield, Mail, Lock, User, Phone, Briefcase, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROUTES, ROLES, ROLE_DASHBOARD_MAP } from '../../constants/index.js';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx';
import './Auth.css';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: ROLES.VETERAN,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend Validations
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Please provide your full legal name (at least 2 characters)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      setError('Please enter a valid contact phone number (at least 7 digits)');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters in length');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    if (formData.role !== ROLES.VETERAN && formData.role !== ROLES.EMPLOYER) {
      setError('Please select a valid account category (Veteran or Employer)');
      return;
    }

    setLoading(true);
    try {
      const newUser = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      });

      const targetDashboard = ROLE_DASHBOARD_MAP[newUser.role] || ROUTES.HOME;
      navigate(targetDashboard, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <UserPlus size={24} />
          </div>
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">
            Register your profile to access welfare benefits or hire defense talent
          </p>
        </div>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit}>
          {/* Account Category Selector */}
          <label className="input-label" style={{ marginBottom: '8px' }}>
            Account Category <span className="input-required">*</span>
          </label>
          <div className="role-selector-grid">
            <div
              className={`role-choice-card ${formData.role === ROLES.VETERAN ? 'selected' : ''}`}
              onClick={() => handleRoleSelect(ROLES.VETERAN)}
              role="button"
              tabIndex={0}
            >
              <Award size={22} color={formData.role === ROLES.VETERAN ? 'var(--color-primary-800)' : 'var(--color-slate-500)'} />
              <div className="role-choice-title">Military Veteran</div>
              <div className="role-choice-desc">Ex-servicemen & Dependents</div>
            </div>

            <div
              className={`role-choice-card ${formData.role === ROLES.EMPLOYER ? 'selected' : ''}`}
              onClick={() => handleRoleSelect(ROLES.EMPLOYER)}
              role="button"
              tabIndex={0}
            >
              <Briefcase size={22} color={formData.role === ROLES.EMPLOYER ? 'var(--color-primary-800)' : 'var(--color-slate-500)'} />
              <div className="role-choice-title">Corporate Employer</div>
              <div className="role-choice-desc">Hiring Managers & Companies</div>
            </div>
          </div>

          <Input
            label="Full Name / Authorized Representative"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Captain Ramesh Sharma"
            icon={User}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ramesh@example.com"
              icon={Mail}
              required
            />
            <Input
              label="Contact Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              icon={Phone}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Password (min. 6 chars)"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              icon={Lock}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••••••"
              icon={Lock}
              required
            />
          </div>

          <Button
            type="submit"
            variant="accent"
            size="lg"
            fullWidth
            loading={loading}
            icon={UserPlus}
            style={{ marginTop: '0.5rem' }}
          >
            Complete Registration
          </Button>
        </form>

        <div className="auth-footer-text">
          Already registered? <Link to={ROUTES.LOGIN}>Sign In Here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
