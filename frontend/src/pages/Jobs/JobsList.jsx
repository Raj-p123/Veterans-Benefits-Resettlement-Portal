import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import jobService from '../../services/jobService.js';
import JobMap from '../../components/Map/JobMap.jsx';
import {
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  Search,
  Filter,
  Bookmark,
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Navigation,
  Map as MapIcon,
  List as ListIcon,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react';
import Button from '../../components/Button/Button.jsx';
import Badge from '../../components/Badge/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx';
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
  const [searchParams, setSearchParams] = useSearchParams();

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
        const fetchedMapJobs = payload.mapJobs || fetchedJobs.filter((j) => j.latitude && j.longitude);
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
          j._id === jobId || j.jobId === jobId ? { ...j, isSaved: !currentSaved } : j
        )
      );
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Best in Industry';
    const toLakhs = (val) => `${(val / 100000).toFixed(1)} LPA`;
    if (min && max) return `₹${toLakhs(min)} - ₹${toLakhs(max)}`;
    if (min) return `₹${toLakhs(min)}+`;
    return `Up to ₹${toLakhs(max)}`;
  };

  return (
    <div className="jobs-page-root">
      <div className="container">
        {/* Hero Section */}
        <div className="jobs-hero-card">
          <div className="jobs-hero-content">
            <h1 className="jobs-hero-title">Defense Veteran Career & Resettlement Portal</h1>
            <p className="jobs-hero-subtitle">
              Verified corporate opportunities tailored for Indian Armed Forces veterans across
              aerospace, defense manufacturing, physical security, logistics, and technology.
            </p>

            <form onSubmit={handleSearchSubmit} className="jobs-search-bar-unified">
              <div className="search-bar-field keyword-field">
                <Search size={18} className="search-field-icon" />
                <input
                  type="text"
                  placeholder="Job title, skill (e.g. Radar, Drone), or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="unified-search-input"
                />
              </div>

              <div className="search-bar-divider" />

              <div className="search-bar-field location-field">
                <MapPin size={18} className="search-field-icon" />
                <input
                  type="text"
                  placeholder="City or state (e.g. Bhubaneswar, Odisha)..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="unified-search-input"
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
                  title="Discover jobs near your current GPS location"
                >
                  <Navigation size={15} className={geoLoading ? 'spin-icon' : ''} />
                  <span>{geoLoading ? 'Locating...' : 'Jobs Near Me'}</span>
                </button>
              </div>
            </form>

            {/* Geolocation Notice Banner */}
            {geoNotice && (
              <div className="geo-notice-banner">
                <AlertCircle size={15} color="#D97706" />
                <span>{geoNotice}</span>
                <button type="button" onClick={() => setGeoNotice(null)} className="notice-close-btn">
                  <X size={13} />
                </button>
              </div>
            )}

            {userLocation && (
              <div className="geo-active-banner">
                <Navigation size={14} color="#10B981" />
                <span>
                  Showing nearby jobs sorted by distance from your location.
                </span>
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
          </div>
        </div>

        {/* View Mode & Sorting Control Bar */}
        <div className="jobs-toolbar-controls">
          <div className="toolbar-left-stats">
            <span>
              Showing <strong>{jobs.length}</strong> of <strong>{pagination.total}</strong> opportunities
            </span>
          </div>

          <div className="toolbar-right-actions">
            {/* Distance Filter if GPS is active */}
            {userLocation && (
              <div className="distance-filter-box">
                <span className="distance-label">Radius:</span>
                <select
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

            {/* Sorting */}
            <div className="sort-dropdown-box">
              <select
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

            {/* View Mode Toggle Button Group [List] [Map] */}
            <div className="view-mode-toggle-group">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="View as cards list"
              >
                <ListIcon size={16} />
                <span>List</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                title="View interactive OpenStreetMap with job pins"
              >
                <MapIcon size={16} />
                <span>Map ({mapJobs.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="jobs-main-layout">
          {/* Sidebar Filters */}
          <aside className="jobs-filter-sidebar">
            <div className="filter-card-head">
              <span className="filter-card-title">
                <Filter size={16} /> Filters
              </span>
              <button onClick={handleResetFilters} className="filter-reset-link">
                Reset All
              </button>
            </div>

            {/* Industry Filter */}
            <div className="filter-section-group">
              <label className="filter-field-label">Industry Sector</label>
              <select
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="filter-input-control"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Work Mode */}
            <div className="filter-section-group">
              <label className="filter-field-label">Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => {
                  setWorkMode(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="filter-input-control"
              >
                {WORK_MODES.map((wm) => (
                  <option key={wm.value} value={wm.value}>
                    {wm.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Type */}
            <div className="filter-section-group">
              <label className="filter-field-label">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="filter-input-control"
              >
                {EMPLOYMENT_TYPES.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick City Filters */}
            <div className="filter-section-group">
              <label className="filter-field-label">Primary Resettlement Hubs</label>
              <div className="quick-city-tags">
                {['Bhubaneswar', 'Delhi NCR', 'Pune', 'Bengaluru', 'Hyderabad'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`city-filter-tag ${city === c ? 'active' : ''}`}
                    onClick={() => {
                      setCity(city === c ? 'All' : c);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results Area (Map View OR List View) */}
          <main className="jobs-display-area">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <LoadingSpinner size="lg" message="Loading verified defense opportunities..." />
              </div>
            ) : error ? (
              <div className="jobs-error-card">
                <ErrorMessage message={error} />
                <Button variant="secondary" size="sm" icon={RotateCcw} onClick={fetchJobs}>
                  Try Again
                </Button>
              </div>
            ) : viewMode === 'map' ? (
              /* MAP VIEW (Leaflet + OpenStreetMap) */
              <div className="jobs-map-view-wrapper">
                <JobMap
                  jobs={mapJobs.length > 0 ? mapJobs : jobs}
                  userLocation={userLocation}
                  selectedJobId={selectedMapJobId}
                  onSelectJob={(id) => setSelectedMapJobId(id)}
                  height="600px"
                  searchRadiusKm={selectedRadius !== 'All' ? Number(selectedRadius) : null}
                />
              </div>
            ) : jobs.length === 0 ? (
              /* EMPTY STATE */
              <div className="jobs-empty-state-box">
                <Briefcase size={44} color="#94A3B8" />
                <h3>No Jobs Found Matching Criteria</h3>
                <p>We could not find any active postings matching your search criteria. Try adjusting your filters.</p>
                <Button variant="primary" size="sm" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              /* LIST VIEW */
              <div className="jobs-cards-grid">
                {jobs.map((job) => {
                  const employerName =
                    job.employer?.companyName || job.companyName || 'Defense Ready Corporate Recruiter';

                  return (
                    <div key={job._id || job.id || job.jobId} className="job-card-item">
                      <div className="job-card-top">
                        <div className="job-card-employer-row">
                          <div className="employer-avatar-box">
                            <Building2 size={18} color="#146EF5" />
                          </div>
                          <div>
                            <div className="job-employer-title">{employerName}</div>
                            <h3 className="job-main-title">{job.title}</h3>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`btn-save-bookmark ${job.isSaved ? 'saved' : ''}`}
                          onClick={() => handleToggleBookmark(job._id || job.id, job.isSaved)}
                          title={job.isSaved ? 'Remove Bookmark' : 'Save Job'}
                        >
                          <Bookmark size={16} />
                        </button>
                      </div>

                      <div className="job-metadata-chips">
                        <span className="meta-chip">
                          <MapPin size={13} />
                          {job.city || job.location}, {job.state}
                        </span>
                        <span className="meta-chip">
                          <Clock size={13} />
                          {(job.employmentType || 'FULL_TIME').replace(/_/g, ' ')}
                        </span>
                        {job.workMode && (
                          <span className="meta-chip">{job.workMode}</span>
                        )}
                        {job.distanceText && (
                          <span className="meta-chip distance-chip">
                            <Navigation size={11} />
                            {job.distanceText}
                          </span>
                        )}
                      </div>

                      <p className="job-card-description">
                        {job.description?.slice(0, 140) || 'Seeking disciplined military veteran with proven leadership and operational experience.'}...
                      </p>

                      <div className="job-card-bottom-bar">
                        <div className="job-salary-figure">
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </div>
                        <Link to={`/jobs/${job.id || job._id || job.jobId}`}>
                          <Button variant="primary" size="sm" icon={ChevronRight} iconPosition="right">
                            View Job
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {viewMode === 'list' && pagination.totalPages > 1 && (
              <div className="jobs-pagination-bar">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
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
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default JobsList;
