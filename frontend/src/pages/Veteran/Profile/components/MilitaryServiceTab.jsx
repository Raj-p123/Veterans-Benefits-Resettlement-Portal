import React from 'react';
import {
  Shield,
  Award,
  Hash,
  Calendar,
  Clock,
  CheckCircle2,
  MapPin,
  Briefcase,
} from 'lucide-react';
import Input from '../../../../components/Input/Input.jsx';

export const MilitaryServiceTab = ({
  isEditing,
  profile,
  formData,
  onChange,
}) => {
  const s = profile?.serviceInformation || {};

  return (
    <div className="gov-tab-content-card">
      <div className="tab-card-header">
        <div className="header-icon-cluster">
          <div className="header-icon-box" aria-hidden="true">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="tab-card-title">Military Service Record</h2>
            <p className="tab-card-subtitle">
              Verified service history and Armed Forces records.
            </p>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="tab-form-container">
          <div className="form-row-3">
            <Input
              label="Service Branch"
              name="serviceBranch"
              as="select"
              value={formData.serviceInformation.serviceBranch}
              onChange={onChange}
              required
            >
              <option value="Army">Army</option>
              <option value="Navy">Navy</option>
              <option value="Air Force">Air Force</option>
              <option value="Coast Guard">Coast Guard</option>
              <option value="Other">Other</option>
            </Input>
            <Input
              label="Rank / Substantive Rank"
              name="rank"
              value={formData.serviceInformation.rank}
              onChange={onChange}
              placeholder="e.g. Subedar Major / Wing Commander"
              required
            />
            <Input
              label="Service / Army Number"
              name="serviceNumber"
              value={formData.serviceInformation.serviceNumber}
              onChange={onChange}
              placeholder="e.g. JC-123456K"
              required
            />
          </div>

          <div className="form-row-3">
            <Input
              label="Date of Joining / Attestation"
              type="date"
              name="dateOfJoining"
              value={formData.serviceInformation.dateOfJoining}
              onChange={onChange}
              required
            />
            <Input
              label="Date of Discharge / Retirement"
              type="date"
              name="dateOfDischarge"
              value={formData.serviceInformation.dateOfDischarge}
              onChange={onChange}
              required
            />
            <Input
              label="Years of Service"
              type="number"
              name="yearsOfService"
              value={formData.serviceInformation.yearsOfService}
              onChange={onChange}
              helperText="Calculated automatically from service dates"
            />
          </div>

          <div className="form-row-3">
            <Input
              label="Service Status"
              name="serviceStatus"
              as="select"
              value={formData.serviceInformation.serviceStatus}
              onChange={onChange}
            >
              <option value="Retired">Retired</option>
              <option value="Discharged">Discharged</option>
              <option value="Released">Released</option>
              <option value="Other">Other</option>
            </Input>
            <Input
              label="Last Posting / Unit Station"
              name="lastPosting"
              value={formData.serviceInformation.lastPosting}
              onChange={onChange}
              placeholder="e.g. Northern Command Headquarters"
            />
            <Input
              label="Primary Military Trade / Role"
              name="primaryMilitaryRole"
              value={formData.serviceInformation.primaryMilitaryRole}
              onChange={onChange}
              placeholder="e.g. Signals / Tactical Logistics"
            />
          </div>
        </div>
      ) : (
        <div className="gov-details-3col-grid">
          {/* 1. Branch */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Shield size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Service Branch</span>
              <span className="data-cell-value">{s.serviceBranch || 'Not provided'}</span>
            </div>
          </div>

          {/* 2. Rank */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Award size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Rank</span>
              <span className="data-cell-value">{s.rank || 'Not specified'}</span>
            </div>
          </div>

          {/* 3. Service Number */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Hash size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Service Number</span>
              <span className="data-cell-value">{s.serviceNumber || 'Not specified'}</span>
            </div>
          </div>

          {/* 4. Joining Date */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Calendar size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Joining Date</span>
              <span className="data-cell-value">
                {s.dateOfJoining ? new Date(s.dateOfJoining).toLocaleDateString('en-GB') : 'Not specified'}
              </span>
            </div>
          </div>

          {/* 5. Discharge Date */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Calendar size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Discharge / Retirement</span>
              <span className="data-cell-value">
                {s.dateOfDischarge ? new Date(s.dateOfDischarge).toLocaleDateString('en-GB') : 'Not specified'}
              </span>
            </div>
          </div>

          {/* 6. Total Service */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Clock size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Total Duration</span>
              <span className="data-cell-value">{s.yearsOfService ? `${s.yearsOfService} Years` : '0 Years'}</span>
            </div>
          </div>

          {/* 7. Service Status */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <CheckCircle2 size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Service Status</span>
              <span className="data-cell-value">{s.serviceStatus || 'Retired'}</span>
            </div>
          </div>

          {/* 8. Last Posting */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <MapPin size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Last Posting</span>
              <span className="data-cell-value">{s.lastPosting || 'Not specified'}</span>
            </div>
          </div>

          {/* 9. Primary Role */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Briefcase size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Primary Role / Trade</span>
              <span className="data-cell-value">{s.primaryMilitaryRole || 'Not specified'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilitaryServiceTab;
