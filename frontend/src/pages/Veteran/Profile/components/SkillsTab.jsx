import React from 'react';
import { Award, Plus, Trash2, X, ShieldCheck } from 'lucide-react';
import Button from '../../../../components/Button/Button.jsx';
import Input from '../../../../components/Input/Input.jsx';

export const SkillsTab = ({
  isEditing,
  profile,
  formData,
  newSkill,
  setNewSkill,
  onAddSkill,
  onRemoveSkill,
  onAddCert,
  onCertChange,
  onRemoveCert,
}) => {
  const skillsList = isEditing ? formData.skills : (profile?.skills || []);
  const certsList = isEditing ? formData.certifications : (profile?.certifications || []);

  return (
    <div className="gov-tab-content-card">
      <div className="tab-card-header">
        <div className="header-icon-cluster">
          <div className="header-icon-box" aria-hidden="true">
            <Award size={18} />
          </div>
          <div>
            <h2 className="tab-card-title">Skills & Technical Certifications</h2>
            <p className="tab-card-subtitle">
              Demonstrated competencies, military proficiencies, and accredited certifications.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Practical Skills Section */}
      <section className="skills-sub-section">
        <div className="sub-section-head">
          <h3 className="sub-section-title">Competencies & Practical Skills</h3>
        </div>

        <div className="skills-chips-wrapper">
          {skillsList && skillsList.length > 0 ? (
            skillsList.map((skill, idx) => (
              <span key={idx} className="gov-skill-badge">
                <span>{skill}</span>
                {isEditing && (
                  <button
                    type="button"
                    className="skill-remove-btn"
                    onClick={() => onRemoveSkill(skill)}
                    aria-label={`Remove skill ${skill}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))
          ) : (
            <p className="sub-section-empty-note">
              No skills listed yet. Click "Edit Profile" to add relevant competencies.
            </p>
          )}
        </div>

        {isEditing && (
          <div className="skill-input-cluster">
            <Input
              placeholder="Enter skill (e.g. Tactical Logistics, Radar Maintenance, Perimeter Security)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddSkill();
                }
              }}
            />
            <Button variant="secondary" size="md" onClick={onAddSkill}>
              Add Skill
            </Button>
          </div>
        )}
      </section>

      {/* 2. Professional Certifications Section */}
      <section className="certs-sub-section">
        <div className="sub-section-head-with-action">
          <h3 className="sub-section-title">Professional Certifications</h3>
          {isEditing && (
            <Button variant="secondary" size="sm" icon={Plus} onClick={onAddCert}>
              Add Certification
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="dynamic-items-container">
            {certsList?.length === 0 ? (
              <div className="dynamic-empty-hint">
                <p>No formal certifications logged yet. Click "Add Certification" to record certificates.</p>
              </div>
            ) : (
              certsList.map((cert, index) => (
                <div key={index} className="dynamic-item-card">
                  <div className="dynamic-item-top-row">
                    <span className="dynamic-item-index-tag">Certification #{index + 1}</span>
                    <button
                      type="button"
                      className="btn-item-delete"
                      onClick={() => onRemoveCert(index)}
                      title="Remove Certification"
                      aria-label={`Remove Certification ${index + 1}`}
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="form-row-2">
                    <Input
                      label="Certification Name"
                      value={cert.name}
                      onChange={(e) => onCertChange(index, 'name', e.target.value)}
                      placeholder="e.g. Certified Information Security Manager (CISM)"
                      required
                    />
                    <Input
                      label="Issuing Organization"
                      value={cert.issuingOrganization}
                      onChange={(e) => onCertChange(index, 'issuingOrganization', e.target.value)}
                      placeholder="e.g. ISACA / Military Institute"
                      required
                    />
                  </div>

                  <div className="form-row-3">
                    <Input
                      label="Issue Date"
                      type="date"
                      value={cert.issueDate}
                      onChange={(e) => onCertChange(index, 'issueDate', e.target.value)}
                    />
                    <Input
                      label="Expiry Date (if applicable)"
                      type="date"
                      value={cert.expiryDate}
                      onChange={(e) => onCertChange(index, 'expiryDate', e.target.value)}
                    />
                    <Input
                      label="Credential / License ID"
                      value={cert.credentialId}
                      onChange={(e) => onCertChange(index, 'credentialId', e.target.value)}
                      placeholder="e.g. CERT-998811"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {certsList && certsList.length > 0 ? (
              <div className="certs-cards-stack">
                {certsList.map((cert, idx) => (
                  <div key={idx} className="gov-cert-card">
                    <div className="cert-card-left">
                      <div className="cert-icon-circle" aria-hidden="true">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="cert-meta-stack">
                        <h4 className="cert-name">{cert.name}</h4>
                        <p className="cert-issuer">
                          Issued by: {cert.issuingOrganization}
                          {cert.credentialId && <span> • ID: {cert.credentialId}</span>}
                        </p>
                      </div>
                    </div>

                    {(cert.issueDate || cert.expiryDate) && (
                      <div className="cert-dates-col">
                        {cert.issueDate && (
                          <span className="cert-date-text">
                            Issued: {new Date(cert.issueDate).toLocaleDateString('en-GB')}
                          </span>
                        )}
                        {cert.expiryDate && (
                          <span className="cert-date-text">
                            Expires: {new Date(cert.expiryDate).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="gov-empty-tab-box">
                <div className="empty-tab-icon" aria-hidden="true">
                  <Award size={30} />
                </div>
                <h3 className="empty-tab-title">No formal certifications logged yet</h3>
                <p className="empty-tab-desc">
                  Click "Edit Profile" above to record relevant military or civilian certifications.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default SkillsTab;
