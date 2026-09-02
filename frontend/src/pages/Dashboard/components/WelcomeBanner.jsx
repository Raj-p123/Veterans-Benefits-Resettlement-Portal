import React from 'react';
import { CheckCircle2, Clock, XCircle, ShieldCheck } from 'lucide-react';

export const WelcomeBanner = ({ userName = 'Veteran', verificationStatus = 'PENDING' }) => {
  const firstName = userName.trim().split(' ')[0] || 'Veteran';
  const isVerified = verificationStatus === 'VERIFIED';
  const isRejected = verificationStatus === 'REJECTED';

  return (
    <section className="veteran-hero-banner" aria-label="Welcome banner">
      <div className="hero-text-block">
        <div className="hero-eyebrow">
          <ShieldCheck size={14} className="hero-eyebrow-icon" aria-hidden="true" />
          <span>MINISTRY OF DEFENSE • VETERAN SERVICES PORTAL</span>
        </div>
        <h1 className="hero-greeting">Welcome back, {firstName}! 👋</h1>
        <p className="hero-tagline">
          Manage your benefits, applications and career opportunities from one secure portal.
        </p>
      </div>

      <div className="hero-status-card" aria-label="Account status">
        <span className="status-card-header">ACCOUNT STATUS</span>
        <div
          className={`status-pill ${
            isVerified ? 'verified' : isRejected ? 'rejected' : 'pending'
          }`}
        >
          {isVerified && <CheckCircle2 size={15} aria-hidden="true" />}
          {!isVerified && !isRejected && <Clock size={15} aria-hidden="true" />}
          {isRejected && <XCircle size={15} aria-hidden="true" />}
          <span>
            {isVerified
              ? 'Verified'
              : isRejected
              ? 'Verification Rejected'
              : 'Pending Verification'}
          </span>
        </div>
        <span className="status-card-subtext">
          {isVerified
            ? 'Military service verified'
            : isRejected
            ? 'Please re-upload identity documents'
            : 'Service verification in review'}
        </span>
      </div>
    </section>
  );
};

export default WelcomeBanner;
