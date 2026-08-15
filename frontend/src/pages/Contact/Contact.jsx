import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import PageContainer from '../../components/PageContainer/PageContainer.jsx';
import Input from '../../components/Input/Input.jsx';
import Button from '../../components/Button/Button.jsx';
import './Contact.css';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate frontend form submission UX
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div>
      <div className="contact-header-section">
        <div className="container">
          <h1 className="contact-header-title">Contact & Support</h1>
          <p className="contact-header-sub">
            Get in touch with veteran facilitation officers, regional grievance cells, and technical helpdesk.
          </p>
        </div>
      </div>

      <PageContainer>
        <div className="contact-layout">
          {/* Support Channels Panel */}
          <div className="contact-info-panel">
            {/* Crisis Alert Card */}
            <div className="contact-info-card" style={{ borderColor: 'var(--color-accent-500)', backgroundColor: 'var(--color-accent-50)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldAlert size={20} color="var(--color-accent-700)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-accent-900)' }}>
                  Emergency Veteran Helpline
                </h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-accent-900)', marginBottom: '8px' }}>
                Immediate assistance for medical emergencies, distress, and critical pension escalation:
              </p>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent-700)' }}>
                Toll-Free: 1800-VET-PORTAL
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-900)' }}>Available 24 hours a day, 7 days a week</span>
            </div>

            {/* Direct Contact Info */}
            <div className="contact-info-card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary-900)', marginBottom: '1rem' }}>
                National Facilitation Centers
              </h3>

              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="contact-info-heading">Official Support Email</div>
                  <div className="contact-info-val">support@veteransportal.gov.in</div>
                  <div className="contact-info-val">grievance@veteransportal.gov.in</div>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="contact-info-heading">Desk Helpline</div>
                  <div className="contact-info-val">+91 (011) 2301-0000 / 0001</div>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="contact-info-heading">Operational Hours</div>
                  <div className="contact-info-val">Monday - Friday: 09:00 AM - 05:30 PM</div>
                  <div className="contact-info-val">Saturday: 09:00 AM - 01:00 PM</div>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="contact-info-heading">Central Directorate</div>
                  <div className="contact-info-val">
                    Directorate General of Resettlement (DGR)<br />
                    West Block-IV, RK Puram, New Delhi - 110066
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="contact-form-card">
            <h2 className="contact-form-title">Send a Portal Inquiry</h2>
            <p className="contact-form-desc">
              Fill in your details below and a dedicated facilitation officer will respond within 24 business hours.
            </p>

            {submitted ? (
              <div className="form-success-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircle2 size={18} />
                  <strong>Inquiry Submitted Successfully</strong>
                </div>
                <p>
                  Thank you, <strong>{formData.name}</strong>. Your ticket reference <strong>#VET-{Math.floor(100000 + Math.random() * 900000)}</strong> has been registered.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ marginTop: '12px' }}
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                  }}
                >
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Havildar Rajesh Kumar (Retd)"
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div className="form-row">
                  <Input
                    label="Phone / Mobile Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit Mobile Number"
                    required
                  />
                  <Input
                    label="Inquiry Category"
                    name="subject"
                    as="select"
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="General Inquiry">General Portal Inquiry</option>
                    <option value="Pension Query">Pension & Entitlement Query</option>
                    <option value="Welfare Scheme">Welfare Scheme Application</option>
                    <option value="Employer Partnership">Corporate Employer Partnership</option>
                    <option value="Technical Support">Technical Portal Issue</option>
                  </Input>
                </div>

                <Input
                  label="Message / Query Description"
                  name="message"
                  as="textarea"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please provide specifics regarding your service record, scheme name, or inquiry..."
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  icon={Send}
                  iconPosition="right"
                >
                  Submit Inquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default Contact;
