import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import jobService from '../../services/jobService.js';
import JobMap from '../../components/Map/JobMap.jsx';
import {
  Briefcase,
  MapPin,
  Search,
  Filter,
  Navigation,
  Map as MapIcon,
  List as ListIcon,
  AlertCircle,
  X,
  RotateCcw,
  ShieldCheck,
  Award,
} from 'lucide-react';
import Button from '../../components/Button/Button.jsx';
import JobCard from './components/JobCard.jsx';
import JobFilters from './components/JobFilters.jsx';
import JobSkeleton from './components/JobSkeleton.jsx';
import './JobsList.css';

const INDUSTRIES = [
  'All',
  'Defense & Aerospace',
  'Defense Manufacturing',
  'Ammunition & Drone Systems',
  'Heavy Engineering & Artillery',
  'Tactical Vehicles & Maritime',
  'Cybersecurity & Intelligence',
  'Security & Facility Management',
  'Logistics & Supply Chain',
];

const WORK_MODES = [
  { value: 'All', label: 'All Modes' },
  { value: 'ONSITE', label: 'Onsite' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];

const EMPLOYMENT_TYPES = [
  { value: 'All', label: 'All Types' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
];

const DISTANCE_OPTIONS = [
  { value: 'All', label: 'All Distances' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
  { value: '100', label: 'Within 100 km' },
];

export const JobsList = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // View Mode: 'list' or 'map'
  const [viewMode, setViewMode] = useState('list');

  // Job Data State
  const [jobs, setJobs] = useState([]);
  const [mapJobs, setMapJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Geolocation & Proximity State
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoNotice, setGeoNotice] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState('All');
  const [selectedMapJobId, setSelectedMapJobId] = useState(null);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [locationSearch, setLocationSearch] = useState(searchParams.get('location') || '');
  const [industry, setIndustry] = useState(searchParams.get('industry') || 'All');
  const [workMode, setWorkMode] = useState(searchParams.get('workMode') || 'All');
  const [employmentType, setEmploymentType] = useState(searchParams.get('employmentType') || 'All');
  const [city, setCity] = useState(searchParams.get('city') || 'All');
  const [sortBy, setSortBy] = useState('newest');

  // Mobile Filter Drawer Toggle State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: 12,
        sortBy,
      };

      if (search.trim()) params.search = search.trim();
      if (locationSearch.trim()) params.location = locationSearch.trim();
      if (industry !== 'All') params.industry = industry;
      if (workMode !== 'All') params.workMode = workMode;
      if (employmentType !== 'All') params.employmentType = employmentType;
      if (city !== 'All') params.city = city;

      // Attach coordinates if GPS proximity is active
      if (userLocation) {
        params.lat = userLocation.latitude;
        params.lng = userLocation.longitude;
        if (selectedRadius !== 'All') {
          params.radius = selectedRadius;
        }
      }

      const res = await jobService.getJobs(params);
      const payload = res?.data || res || {};

      if (payload.jobs || payload.results) {
        const fetchedJobs = payload.jobs || payload.results || [];
        const fetchedMapJobs =
          payload.mapJobs || fetchedJobs.filter((j) => j.latitude && j.longitude);
        setJobs(fetchedJobs);
        setMapJobs(fetchedMapJobs);
        setPagination(
          payload.pagination || {
            page: 1,
            limit: 12,
            total: payload.total || fetchedJobs.length,
            totalPages: Math.ceil((payload.total || fetchedJobs.length) / 12) || 1,
          }
        );
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Unable to load defense job opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    search,
    locationSearch,
    industry,
    workMode,
    employmentType,
    city,
    sortBy,
    userLocation,
    selectedRadius,
  ]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchJobs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setLocationSearch('');
    setIndustry('All');
    setWorkMode('All');
    setEmploymentType('All');
    setCity('All');
    setSortBy('newest');
    setUserLocation(null);
    setSelectedRadius('All');
    setGeoNotice(null);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setMobileFilterOpen(false);
  };

  // Browser Geolocation for "Jobs Near Me"
  const handleGetNearbyJobs = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser. You can still search by city or state.');
      return;
    }

    setGeoLoading(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(coords);
        setSortBy('distance');
        setGeoLoading(false);
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
      (geoErr) => {
        console.warn('Geolocation access denied/failed:', geoErr);
        setGeoLoading(false);
        setGeoNotice('Location access is unavailable. You can still search by city or state.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleToggleBookmark = async (jobId, currentSaved) => {
    if (!user || user.role !== 'VETERAN') {
      alert('Please log in as a registered Veteran to bookmark jobs.');
      return;
    }

    try {
      if (currentSaved) {
        await jobService.unsaveJob(jobId);
      } else {
        await jobService.saveJob(jobId);
      }

      setJobs((prevJobs) =>
        prevJobs.map((j) =>
          j._id === jobId || j.id === jobId || j.jobId === jobId
            ? { ...j, isSaved: !currentSaved }
            : j
        )
      );
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  // Count active filters for badge
  const activeFilterCount = [
    industry !== 'All',
    workMode !== 'All',
    employmentType !== 'All',
    city !== 'All',
    userLocation !== null,
  ].filter(Boolean).length;

  return (
    <div className="jobs-page-root">
      <div className="jobs-container">
        {/* ==================================================================
            1. PAGE HEADER / HERO SECTION (DEFENSE THEME)
            ================================================================== */}
        <section className="jobs-hero-banner" aria-label="Jobs Hero">
          <div className="hero-badge-row">
            <span className="gov-seal-badge">
              <ShieldCheck size={14} className="gov-seal-icon" aria-hidden="true" />
              <span>DEFENSE RESETTLEMENT & EMPLOYMENT COMMAND</span>
            </span>
          </div>

          <h1 className="jobs-hero-title">Veteran Career & Resettlement</h1>
          <p className="jobs-hero-subtitle">
            Verified career opportunities for Indian Armed Forces veterans.
          </p>
          <p className="jobs-hero-support-text">
            Discover defense, aerospace, security, technology, logistics and other career opportunities matched to your experience and skills.
          </p>

          {/* Integrated Modern Job Search Bar */}
          <form onSubmit={handleSearchSubmit} className="jobs-search-bar-unified" role="search">
            <div className="search-bar-field keyword-field">
              <Search size={18} className="search-field-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Job title, skill, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="unified-search-input"
                aria-label="Job title, skill, or role"
              />
            </div>

            <div className="search-bar-divider" aria-hidden="true" />

            <div className="search-bar-field location-field">
              <MapPin size={18} className="search-field-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="City, state or location..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="unified-search-input"
                aria-label="City, state or location"
              />
            </div>

            <div className="search-bar-actions">
              <Button type="submit" variant="primary" size="md">
                Search Jobs
              </Button>
              <button
                type="button"
                onClick={handleGetNearbyJobs}
                className={`btn-jobs-near-me ${userLocation ? 'active' : ''}`}
                disabled={geoLoading}
                title="Discover opportunities near your current GPS location"
              >
                <Navigation size={14} className={geoLoading ? 'spin-icon' : ''} aria-hidden="true" />
                <span>{geoLoading ? 'Locating...' : 'Jobs Near Me'}</span>
              </button>
            </div>
          </form>

          {/* Geolocation Notices */}
          {geoNotice && (
            <div className="geo-notice-banner" role="alert">
              <AlertCircle size={15} color="#D97706" aria-hidden="true" />
              <span>{geoNotice}</span>
              <button
                type="button"
                onClick={() => setGeoNotice(null)}
                className="notice-close-btn"
                aria-label="Dismiss notice"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {userLocation && (
            <div className="geo-active-banner">
              <div className="geo-active-info">
                <Navigation size={14} color="#059669" aria-hidden="true" />
                <span>Showing nearby jobs sorted by distance from your coordinates.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserLocation(null);
                  setSortBy('newest');
                }}
                className="geo-clear-btn"
              >
                Clear GPS Filter
              </button>
            </div>
          )}
        </section>

        {/* ==================================================================
            2. RESULTS TOOLBAR (STATUS, RADIUS, SORT, LIST/MAP SWITCHER)
            ================================================================== */}
        <div className="jobs-toolbar-row">
          <div className="toolbar-left-stats">
            <span className="results-count-text">
              Showing <strong>{jobs.length}</strong> of <strong>{pagination.total}</strong> opportunities
            </span>

            {/* Mobile Filter Trigger Button */}
            <button
              type="button"
              className="btn-mobile-filter-trigger"
              onClick={() => setMobileFilterOpen(true)}
              aria-label="Open filter drawer"
            >
              <Filter size={14} aria-hidden="true" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="filter-count-badge">{activeFilterCount}</span>
              )}
            </button>
          </div>

          <div className="toolbar-right-actions">
            {/* Radius Filter if GPS is active */}
            {userLocation && (
              <div className="toolbar-control-box">
                <label htmlFor="radius-select" className="toolbar-label">
                  Radius:
                </label>
                <select
                  id="radius-select"
                  value={selectedRadius}
                  onChange={(e) => {
                    setSelectedRadius(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="toolbar-select"
                >
                  {DISTANCE_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Control */}
            <div className="toolbar-control-box">
              <label htmlFor="sort-select" className="toolbar-label">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="toolbar-select"
              >
                <option value="newest">Newest First</option>
                {userLocation && <option value="distance">Nearest Distance</option>}
                <option value="salaryHigh">Highest Salary</option>
                <option value="deadline">Application Deadline</option>
              </select>
            </div>

            {/* List / Map View Toggle Button Group */}
            <div className="view-mode-toggle-group" role="group" aria-label="View mode">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="View as job cards list"
                aria-pressed={viewMode === 'list'}
              >
                <ListIcon size={15} aria-hidden="true" />
                <span>List</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                title="View interactive OpenStreetMap with job markers"
                aria-pressed={viewMode === 'map'}
              >
                <MapIcon size={15} aria-hidden="true" />
                <span>Map ({mapJobs.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================
            3. MAIN CONTENT: FILTERS SIDEBAR + JOB RESULTS
            ================================================================== */}
        <div className="jobs-main-content-layout">
          {/* Desktop Filter Sidebar */}
          <div className="desktop-filters-wrapper">
            <JobFilters
              industries={INDUSTRIES}
              workModes={WORK_MODES}
              employmentTypes={EMPLOYMENT_TYPES}
              selectedIndustry={industry}
              selectedWorkMode={workMode}
              selectedEmploymentType={employmentType}
              selectedCity={city}
              onIndustryChange={(val) => {
                setIndustry(val);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              onWorkModeChange={(val) => {
                setWorkMode(val);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              onEmploymentTypeChange={(val) => {
                setEmploymentType(val);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              onCityChange={(val) => {
                setCity(val);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* Mobile Filter Drawer & Backdrop */}
          {mobileFilterOpen && (
            <>
              <div
                className="mobile-filter-backdrop"
                onClick={() => setMobileFilterOpen(false)}
                aria-hidden="true"
              />
              <div className="mobile-filter-drawer">
                <JobFilters
                  industries={INDUSTRIES}
                  workModes={WORK_MODES}
                  employmentTypes={EMPLOYMENT_TYPES}
                  selectedIndustry={industry}
                  selectedWorkMode={workMode}
                  selectedEmploymentType={employmentType}
                  selectedCity={city}
                  onIndustryChange={(val) => {
                    setIndustry(val);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  onWorkModeChange={(val) => {
                    setWorkMode(val);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  onEmploymentTypeChange={(val) => {
                    setEmploymentType(val);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  onCityChange={(val) => {
                    setCity(val);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  onResetFilters={handleResetFilters}
                  onCloseMobileDrawer={() => setMobileFilterOpen(false)}
                />
              </div>
            </>
          )}

          {/* Results Display Canvas */}
          <main className="jobs-display-canvas">
            {loading ? (
              /* Loading Skeletons (6 Cards) */
              <div className="jobs-cards-grid" aria-busy="true" aria-label="Loading job opportunities">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <JobSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              /* Error State */
              <div className="jobs-error-card" role="alert">
                <AlertCircle size={32} className="error-icon" aria-hidden="true" />
                <h3 className="error-title">Unable to load opportunities</h3>
                <p className="error-msg">{error}</p>
                <Button variant="primary" size="sm" icon={RotateCcw} onClick={fetchJobs}>
                  Retry
                </Button>
              </div>
            ) : viewMode === 'map' ? (
              /* Map View (Leaflet + OpenStreetMap) */
              <div className="jobs-map-view-wrapper">
                <div className="map-wrapper-head">
                  <div>
                    <h3 className="map-title">Geographic Opportunity Distribution</h3>
                    <p className="map-subtitle">
                      Explore {mapJobs.length} defense opportunities pinned across pan-India resettlement clusters.
                    </p>
                  </div>
                </div>
                <JobMap
                  jobs={mapJobs.length > 0 ? mapJobs : jobs}
                  userLocation={userLocation}
                  selectedJobId={selectedMapJobId}
                  onSelectJob={(id) => setSelectedMapJobId(id)}
                  height="580px"
                  searchRadiusKm={selectedRadius !== 'All' ? Number(selectedRadius) : null}
                />
              </div>
            ) : jobs.length === 0 ? (
              /* Empty State */
              <div className="jobs-empty-state-box">
                <div className="empty-icon-wrapper" aria-hidden="true">
                  <Briefcase size={32} />
                </div>
                <h3 className="empty-heading">No opportunities found</h3>
                <p className="empty-supporting-text">
                  Try changing your search or filters to discover more veteran-friendly opportunities.
                </p>
                <Button variant="primary" size="sm" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              /* List View (2-Column Job Cards) */
              <>
                <div className="jobs-cards-grid">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id || job._id || job.jobId}
                      job={job}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="jobs-pagination-bar" aria-label="Pagination Navigation">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => {
                        setPagination((p) => ({ ...p, page: p.page - 1 }));
                        window.scrollTo({ top: 200, behavior: 'smooth' });
                      }}
                      aria-label="Previous Page"
                    >
                      Previous
                    </Button>
                    <span className="pagination-page-indicator">
                      Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => {
                        setPagination((p) => ({ ...p, page: p.page + 1 }));
                        window.scrollTo({ top: 200, behavior: 'smooth' });
                      }}
                      aria-label="Next Page"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default JobsList;
