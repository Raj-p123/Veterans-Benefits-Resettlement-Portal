import React from 'react';
import {
  Briefcase,
  MapPin,
  Building2,
  Wallet,
  Compass,
  Laptop,
} from 'lucide-react';
import Input from '../../../../components/Input/Input.jsx';

export const PreferencesTab = ({
  isEditing,
  profile,
  formData,
  onPrefChange,
}) => {
  const prefs = profile?.jobPreferences || {};
  const formPrefs = formData.jobPreferences || {};

  return (
    <div className="gov-tab-content-card">
      <div className="tab-card-header">
        <div className="header-icon-cluster">
          <div className="header-icon-box" aria-hidden="true">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="tab-card-title">Career & Job Preferences</h2>
            <p className="tab-card-subtitle">
              Helps our resettlement matching engine recommend relevant defense and civilian positions.
            </p>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="tab-form-container">
          <div className="form-row-2">
            <Input
              label="Preferred Work Locations (Cities, comma separated)"
              value={formPrefs.preferredJobLocation?.join(', ')}
              onChange={(e) =>
                onPrefChange(
                  'preferredJobLocation',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              placeholder="e.g. Bengaluru, Hyderabad, Pune, NCR"
            />
            <Input
              label="Target Industries (comma separated)"
              value={formPrefs.preferredIndustries?.join(', ')}
              onChange={(e) =>
                onPrefChange(
                  'preferredIndustries',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              placeholder="e.g. Defense Tech, Aerospace, Corporate Security, Supply Chain"
            />
          </div>

          <div className="form-row-2">
            <Input
              label="Expected Minimum Annual Salary (INR)"
              type="number"
              value={formPrefs.expectedSalaryRange?.min || ''}
              onChange={(e) =>
                onPrefChange('expectedSalaryRange', {
                  ...formPrefs.expectedSalaryRange,
                  min: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="e.g. 800000"
            />
            <Input
              label="Expected Maximum Annual Salary (INR)"
              type="number"
              value={formPrefs.expectedSalaryRange?.max || ''}
              onChange={(e) =>
                onPrefChange('expectedSalaryRange', {
                  ...formPrefs.expectedSalaryRange,
                  max: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="e.g. 1500000"
            />
          </div>

          <div className="preferences-checkbox-row">
            <label className="gov-checkbox-label">
              <input
                type="checkbox"
                checked={formPrefs.willingToRelocate}
                onChange={(e) => onPrefChange('willingToRelocate', e.target.checked)}
              />
              <span>Willing to Relocate to another city or state</span>
            </label>

            <label className="gov-checkbox-label">
              <input
                type="checkbox"
                checked={formPrefs.remoteWorkPreference}
                onChange={(e) => onPrefChange('remoteWorkPreference', e.target.checked)}
              />
              <span>Open to Hybrid / Remote work opportunities</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="gov-details-3col-grid">
          {/* 1. Preferred Locations */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <MapPin size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Preferred Locations</span>
              <span className="data-cell-value">
                {prefs.preferredJobLocation?.length > 0
                  ? prefs.preferredJobLocation.join(', ')
                  : 'Flexible / Anywhere in India'}
              </span>
            </div>
          </div>

          {/* 2. Target Industries */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Building2 size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Target Industries</span>
              <span className="data-cell-value">
                {prefs.preferredIndustries?.length > 0
                  ? prefs.preferredIndustries.join(', ')
                  : 'All Openings'}
              </span>
            </div>
          </div>

          {/* 3. Expected Salary Range */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Wallet size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Expected Salary</span>
              <span className="data-cell-value">
                {prefs.expectedSalaryRange?.min
                  ? `₹${prefs.expectedSalaryRange.min.toLocaleString()} – ₹${(
                      prefs.expectedSalaryRange.max || prefs.expectedSalaryRange.min * 1.5
                    ).toLocaleString()} / year`
                  : 'Negotiable'}
              </span>
            </div>
          </div>

          {/* 4. Willing to Relocate */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Compass size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Relocation Preference</span>
              <span className="data-cell-value">
                {prefs.willingToRelocate ? 'Yes (Willing to Relocate)' : 'No (Local Only)'}
              </span>
            </div>
          </div>

          {/* 5. Remote / Hybrid */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Laptop size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Work Mode Preference</span>
              <span className="data-cell-value">
                {prefs.remoteWorkPreference ? 'Open to Remote / Hybrid' : 'Onsite'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferencesTab;
