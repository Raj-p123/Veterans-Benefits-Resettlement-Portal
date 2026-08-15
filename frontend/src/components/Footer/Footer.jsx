import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, PhoneCall } from 'lucide-react';
import { ROUTES } from '../../constants/index.js';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="public-site-footer">
      <div className="container">
        <div className="footer-columns-grid">
          {/* Brand Column */}
          <div className="footer-brand-column">
            <div className="footer-brand-header">
              <div className="footer-shield-icon">
                <Shield size={18} />
              </div>
              <span className="footer-brand-name">VBR PORTAL</span>
            </div>
            <p className="footer-brand-summary">
              A centralized platform dedicated to supporting military veterans, ex-servicemen,
              and their families with verified welfare schemes, career opportunities, and comprehensive resettlement programs.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-nav-column">
            <h4 className="footer-col-heading">Quick Links</h4>
            <ul className="footer-links-list">
              <li><Link to={ROUTES.HOME}>Home</Link></li>
              <li><Link to={ROUTES.SCHEMES}>Benefits & Schemes</Link></li>
              <li><Link to={ROUTES.JOBS}>Career Opportunities</Link></li>
              <li><Link to={ROUTES.ABOUT}>About Portal</Link></li>
              <li><Link to={ROUTES.CONTACT}>Contact Support</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-nav-column">
            <h4 className="footer-col-heading">Resources</h4>
            <ul className="footer-links-list">
              <li><Link to={ROUTES.ABOUT}>Privacy Policy</Link></li>
              <li><Link to={ROUTES.ABOUT}>Terms of Service</Link></li>
              <li><Link to={ROUTES.CONTACT}>FAQ & Knowledgebase</Link></li>
              <li><Link to={ROUTES.CONTACT}>Help Center</Link></li>
            </ul>
          </div>

          {/* Emergency & Support Column */}
          <div className="footer-support-column">
            <h4 className="footer-col-heading">Helpline Support</h4>
            <div className="footer-support-card">
              <div className="support-card-badge">
                <PhoneCall size={14} />
                <span>24/7 TOLL-FREE HELPLINE</span>
              </div>
              <div className="support-number">1800-VET-PORTAL</div>
              <p className="support-subtext">
                Dedicated transition assistance and welfare advisory for defense veterans.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="footer-bottom-strip">
          <div>
            © 2026 Veterans Benefits & Resettlement Portal. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <Link to={ROUTES.ABOUT}>Privacy Policy</Link>
            <span>•</span>
            <Link to={ROUTES.ABOUT}>Terms of Service</Link>
            <span>•</span>
            <Link to={ROUTES.CONTACT}>Security Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
