import React from 'react';
import { GraduationCap, Plus, Trash2, BookOpen } from 'lucide-react';
import Button from '../../../../components/Button/Button.jsx';
import Input from '../../../../components/Input/Input.jsx';

export const EducationTab = ({
  isEditing,
  profile,
  formData,
  onAddEducation,
  onEducationChange,
  onRemoveEducation,
}) => {
  const educationList = profile?.education || [];

  return (
    <div className="gov-tab-content-card">
      <div className="tab-card-header">
        <div className="header-icon-cluster">
          <div className="header-icon-box" aria-hidden="true">
            <GraduationCap size={18} />
          </div>
          <div>
            <h2 className="tab-card-title">Academic & Technical Education</h2>
            <p className="tab-card-subtitle">
              Formal degrees, technical diplomas, and military trade certifications.
            </p>
          </div>
        </div>

        {isEditing && (
          <Button variant="secondary" size="sm" icon={Plus} onClick={onAddEducation}>
            Add Qualification
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="dynamic-items-container">
          {formData.education?.length === 0 ? (
            <div className="dynamic-empty-hint">
              <p>No educational entries added yet. Click "Add Qualification" above to record your credentials.</p>
            </div>
          ) : (
            formData.education.map((item, index) => (
              <div key={index} className="dynamic-item-card">
                <div className="dynamic-item-top-row">
                  <span className="dynamic-item-index-tag">Qualification #{index + 1}</span>
                  <button
                    type="button"
                    className="btn-item-delete"
                    onClick={() => onRemoveEducation(index)}
                    title="Remove Qualification"
                    aria-label={`Remove Qualification ${index + 1}`}
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>

                <div className="form-row-2">
                  <Input
                    label="Degree / Qualification"
                    value={item.qualification}
                    onChange={(e) => onEducationChange(index, 'qualification', e.target.value)}
                    placeholder="e.g. B.Tech / Diploma in Engineering / 12th Standard"
                    required
                  />
                  <Input
                    label="Institution / University / Board"
                    value={item.institution}
                    onChange={(e) => onEducationChange(index, 'institution', e.target.value)}
                    placeholder="e.g. Army School of Mechanical Engineering"
                    required
                  />
                </div>

                <div className="form-row-3">
                  <Input
                    label="Field of Study / Specialization"
                    value={item.fieldOfStudy}
                    onChange={(e) => onEducationChange(index, 'fieldOfStudy', e.target.value)}
                    placeholder="e.g. Electrical & Radar Systems"
                  />
                  <Input
                    label="Passing Year"
                    type="number"
                    value={item.year}
                    onChange={(e) => onEducationChange(index, 'year', e.target.value)}
                    placeholder="e.g. 2018"
                  />
                  <Input
                    label="Grade / Percentage / CGPA"
                    value={item.gradeOrPercentage}
                    onChange={(e) => onEducationChange(index, 'gradeOrPercentage', e.target.value)}
                    placeholder="e.g. 78% or First Class"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          {educationList.length > 0 ? (
            <div className="education-cards-stack">
              {educationList.map((edu, idx) => (
                <div key={idx} className="gov-qualification-card">
                  <div className="qual-card-left">
                    <div className="qual-icon-circle" aria-hidden="true">
                      <GraduationCap size={18} />
                    </div>
                    <div className="qual-meta-stack">
                      <h3 className="qual-title">{edu.qualification}</h3>
                      <p className="qual-institution">
                        {edu.institution}
                        {edu.fieldOfStudy && <span> • {edu.fieldOfStudy}</span>}
                      </p>
                      {edu.gradeOrPercentage && (
                        <span className="qual-grade-badge">Grade: {edu.gradeOrPercentage}</span>
                      )}
                    </div>
                  </div>

                  <div className="qual-card-right">
                    <span className="qual-year-pill">Passing Year: {edu.year || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="gov-empty-tab-box">
              <div className="empty-tab-icon" aria-hidden="true">
                <BookOpen size={30} />
              </div>
              <h3 className="empty-tab-title">No education records added yet</h3>
              <p className="empty-tab-desc">
                Click "Edit Profile" above to record your degrees, diplomas, or trade certificates.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EducationTab;
