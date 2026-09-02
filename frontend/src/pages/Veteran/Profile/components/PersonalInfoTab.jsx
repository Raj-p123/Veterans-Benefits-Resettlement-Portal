import React from 'react';
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  Compass,
  Globe,
  CheckCircle2,
  Hash,
} from 'lucide-react';
import Input from '../../../../components/Input/Input.jsx';

export const PersonalInfoTab = ({
  isEditing,
  profile,
  user,
  formData,
  onChange,
}) => {
  const p = profile?.personalInformation || {};

  return (
    <div className="gov-tab-content-card">
      <div className="tab-card-header">
        <div className="header-icon-cluster">
          <div className="header-icon-box" aria-hidden="true">
            <User size={18} />
          </div>
          <div>
            <h2 className="tab-card-title">Personal Details & Contact</h2>
            <p className="tab-card-subtitle">
              This information helps us provide better services and opportunities.
            </p>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="tab-form-container">
          <div className="form-row-2">
            <Input
              label="Full Name"
              name="fullName"
              value={formData.personalInformation.fullName}
              onChange={onChange}
              placeholder="e.g. Subedar Major Rajesh Kumar"
              required
            />
            <Input
              label="Date of Birth"
              type="date"
              name="dob"
              value={formData.personalInformation.dob}
              onChange={onChange}
            />
          </div>

          <div className="form-row-3">
            <Input
              label="Gender"
              name="gender"
              as="select"
              value={formData.personalInformation.gender}
              onChange={onChange}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </Input>
            <Input
              label="Contact Phone"
              name="phone"
              value={formData.personalInformation.phone}
              onChange={onChange}
              placeholder="+91 98765 43210"
              required
            />
            <Input
              label="Email Address (Synced)"
              type="email"
              name="email"
              value={formData.personalInformation.email}
              disabled
              helperText="Email is bound to your authentication account"
            />
          </div>

          <Input
            label="Residential Address"
            name="address"
            value={formData.personalInformation.address}
            onChange={onChange}
            placeholder="House/Plot No., Street, Locality"
          />

          <div className="form-row-3">
            <Input
              label="City / District"
              name="city"
              value={formData.personalInformation.city}
              onChange={onChange}
              placeholder="e.g. Pune"
            />
            <Input
              label="State / Province"
              name="state"
              value={formData.personalInformation.state}
              onChange={onChange}
              placeholder="e.g. Maharashtra"
            />
            <Input
              label="PIN / Postal Code"
              name="pincode"
              value={formData.personalInformation.pincode}
              onChange={onChange}
              placeholder="e.g. 411001"
            />
          </div>
        </div>
      ) : (
        <div className="gov-details-3col-grid">
          {/* 1. Full Name */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <User size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Full Name</span>
              <span className="data-cell-value">{p.fullName || user?.name || 'Not provided'}</span>
            </div>
          </div>

          {/* 2. Date of Birth */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Calendar size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Date of Birth</span>
              <span className="data-cell-value">
                {p.dob ? new Date(p.dob).toLocaleDateString('en-GB') : 'Not specified'}
              </span>
            </div>
          </div>

          {/* 3. Gender */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <User size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Gender</span>
              <span className="data-cell-value">{p.gender || 'Not specified'}</span>
            </div>
          </div>

          {/* 4. Phone */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Phone size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Phone / Mobile</span>
              <span className="data-cell-value">{p.phone || user?.phone || 'Not provided'}</span>
            </div>
          </div>

          {/* 5. Email */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Mail size={15} />
            </div>
            <div className="data-cell-stack">
              <div className="label-with-badge-row">
                <span className="data-cell-label">Email Address</span>
                <span className="verified-email-chip">
                  <CheckCircle2 size={10} aria-hidden="true" />
                  <span>Verified Email</span>
                </span>
              </div>
              <span className="data-cell-value">{p.email || user?.email || 'Not provided'}</span>
            </div>
          </div>

          {/* 6. City */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Building2 size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">City / District</span>
              <span className="data-cell-value">{p.city || 'Not provided'}</span>
            </div>
          </div>

          {/* 7. State */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Compass size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">State</span>
              <span className="data-cell-value">{p.state || 'Not provided'}</span>
            </div>
          </div>

          {/* 8. PIN Code */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Hash size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">PIN Code</span>
              <span className="data-cell-value">{p.pincode || 'Not provided'}</span>
            </div>
          </div>

          {/* 9. Country */}
          <div className="detail-data-cell">
            <div className="data-cell-icon" aria-hidden="true">
              <Globe size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Country</span>
              <span className="data-cell-value">{p.country || 'India'}</span>
            </div>
          </div>

          {/* 10. Correspondence Address (Full Width) */}
          <div className="detail-data-cell cell-span-full">
            <div className="data-cell-icon" aria-hidden="true">
              <MapPin size={15} />
            </div>
            <div className="data-cell-stack">
              <span className="data-cell-label">Correspondence Address</span>
              <span className="data-cell-value">
                {p.address
                  ? `${p.address}${p.city ? `, ${p.city}` : ''}${p.state ? `, ${p.state}` : ''}${
                      p.pincode ? ` - ${p.pincode}` : ''
                    }`
                  : 'Address not provided'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoTab;
