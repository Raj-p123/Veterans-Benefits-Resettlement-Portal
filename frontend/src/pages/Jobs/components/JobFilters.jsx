import React from 'react';
import { Filter, RotateCcw, X } from 'lucide-react';

export const JobFilters = ({
  industries = [],
  workModes = [],
  employmentTypes = [],
  hubs = ['Bhubaneswar', 'Delhi NCR', 'Pune', 'Bengaluru', 'Hyderabad'],
  selectedIndustry,
  selectedWorkMode,
  selectedEmploymentType,
  selectedCity,
  onIndustryChange,
  onWorkModeChange,
  onEmploymentTypeChange,
  onCityChange,
  onResetFilters,
  onCloseMobileDrawer,
}) => {
  return (
    <aside className="gov-job-filters-panel" aria-label="Job filters">
      <div className="filter-header-row">
        <div className="filter-title-group">
          <Filter size={16} aria-hidden="true" />
          <h2 className="filter-heading">FILTER JOBS</h2>
        </div>
        <div className="filter-header-actions">
          <button
            type="button"
            onClick={onResetFilters}
            className="filter-reset-btn"
            title="Reset all search filters"
          >
            <RotateCcw size={12} aria-hidden="true" />
            <span>Reset All</span>
          </button>
          {onCloseMobileDrawer && (
            <button
              type="button"
              className="filter-mobile-close-btn"
              onClick={onCloseMobileDrawer}
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 1. Industry Sector */}
      <div className="filter-block">
        <label htmlFor="filter-industry" className="filter-label">
          Industry Sector
        </label>
        <select
          id="filter-industry"
          value={selectedIndustry}
          onChange={(e) => onIndustryChange(e.target.value)}
          className="filter-select-input"
        >
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Work Mode */}
      <div className="filter-block">
        <label htmlFor="filter-workmode" className="filter-label">
          Work Mode
        </label>
        <select
          id="filter-workmode"
          value={selectedWorkMode}
          onChange={(e) => onWorkModeChange(e.target.value)}
          className="filter-select-input"
        >
          {workModes.map((wm) => (
            <option key={wm.value} value={wm.value}>
              {wm.label}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Employment Type */}
      <div className="filter-block">
        <label htmlFor="filter-employment" className="filter-label">
          Employment Type
        </label>
        <select
          id="filter-employment"
          value={selectedEmploymentType}
          onChange={(e) => onEmploymentTypeChange(e.target.value)}
          className="filter-select-input"
        >
          {employmentTypes.map((et) => (
            <option key={et.value} value={et.value}>
              {et.label}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Primary Resettlement Hubs */}
      <div className="filter-block">
        <label className="filter-label">Primary Resettlement Hubs</label>
        <div className="hub-pills-container">
          {hubs.map((hub) => {
            const isActive = selectedCity === hub;
            return (
              <button
                key={hub}
                type="button"
                className={`hub-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => onCityChange(isActive ? 'All' : hub)}
                aria-pressed={isActive}
              >
                {hub}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default JobFilters;
