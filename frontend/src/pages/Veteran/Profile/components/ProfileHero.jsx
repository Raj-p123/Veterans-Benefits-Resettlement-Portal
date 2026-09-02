import React from 'react';
import { Edit3, Save, X, CheckCircle2, Clock, XCircle, Shield } from 'lucide-react';
import Button from '../../../../components/Button/Button.jsx';

export const ProfileHero = ({
  profile,
  user,
  isEditing,
  saving,
  onStartEdit,
  onCancelEdit,
  onSaveProfile,
}) => {
  const fullName = profile?.personalInformation?.fullName || user?.name || 'Veteran';
  const veteranId = profile?.veteranId || 'VET-PENDING';
  const branch = profile?.serviceInformation?.serviceBranch || 'Armed Forces';
  const rank = profile?.serviceInformation?.rank || 'Ex-Serviceman';
  const verificationStatus = profile?.verificationStatus || 'PENDING';

  const isVerified = verificationStatus === 'VERIFIED';
  const isRejected = verificationStatus === 'REJECTED';

  const getUserInitials = () => {
    if (!fullName) return 'V';
    const parts = fullName.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <section className="gov-profile-hero-card" aria-label="Veteran Profile Summary">
      <div className="hero-avatar-cluster">
        {/* Large Circular Avatar with Initials Fallback */}
        <div className="hero-avatar-circle" aria-hidden="true">
          <span className="avatar-initials-text">{getUserInitials()}</span>
          <div
            className={`avatar-status-pip ${
              isVerified ? 'pip-verified' : isRejected ? 'pip-rejected' : 'pip-pending'
            }`}
            title={verificationStatus}
          />
        </div>

        {/* Center Details Block */}
        <div className="hero-identity-block">
          <div className="hero-status-pill-row">
            <span
              className={`gov-status-pill ${
                isVerified ? 'status-verified' : isRejected ? 'status-rejected' : 'status-pending'
              }`}
            >
              {isVerified && <CheckCircle2 size={12} aria-hidden="true" />}
              {!isVerified && !isRejected && <Clock size={12} aria-hidden="true" />}
              {isRejected && <XCircle size={12} aria-hidden="true" />}
              <span>{verificationStatus.replace('_', ' ')}</span>
            </span>
          </div>

          <h1 className="hero-veteran-name">{fullName}</h1>

          <div className="hero-meta-strip">
            <span className="meta-id-tag">ID: {veteranId}</span>
            <span className="meta-divider">•</span>
            <span className="meta-branch-tag">{branch}</span>
            <span className="meta-divider">•</span>
            <span className="meta-rank-tag">{rank}</span>
          </div>
        </div>
      </div>

      {/* Right Action Button Cluster */}
      <div className="hero-actions-cluster">
        {!isEditing ? (
          <Button
            variant="primary"
            size="md"
            icon={Edit3}
            onClick={onStartEdit}
            aria-label="Edit Profile Details"
          >
            Edit Profile
          </Button>
        ) : (
          <div className="edit-mode-btns-row">
            <Button
              variant="outline"
              size="md"
              icon={X}
              onClick={onCancelEdit}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Save}
              loading={saving}
              onClick={onSaveProfile}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProfileHero;
