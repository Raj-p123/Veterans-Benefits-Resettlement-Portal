import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Info,
  Loader2,
  CornerDownLeft,
  RotateCcw,
  Globe,
  Building2,
  FileCheck2,
  CheckCircle2,
  Award,
  Layers,
} from 'lucide-react';
import { schemeService } from '../../services/schemeService.js';
import Button from '../../components/Button/Button.jsx';
import SchemeCard from './components/SchemeCard.jsx';
import SchemeSkeleton from './components/SchemeSkeleton.jsx';
import './SchemesList.css';

const CATEGORIES = [
  'All',
  'Pension',
  'Healthcare',
  'Housing',
  'Education',
  'Employment',
  'Skill Development',
  'Family Welfare',
  'Financial Assistance',
];

const STATES = [
  'All India',
  'Maharashtra',
  'Punjab',
  'Haryana',
  'Rajasthan',
  'Uttar Pradesh',
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Delhi NCR',
  'Odisha',
  'Gujarat',
  'West Bengal',
  'Madhya Pradesh',
];

export const SchemesList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Results State
  const [portalSchemes, setPortalSchemes] = useState([]);
  const [externalResults, setExternalResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States initialized from URL params if present
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [search, setSearch] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedState, setSelectedState] = useState('All India');
  const [isFeaturedOnly, setIsFeaturedOnly] = useState(false);

  // Autocomplete Dropdown State (Fast MongoDB Search)
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Pagination State
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(9);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });

  const searchBoxRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce search input for autocomplete suggestions ONLY
  useEffect(() => {
    const trimmed = (search || '').trim();
    if (!trimmed) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await schemeService.searchSchemes({
          q: trimmed,
          limit: 6,
          autocomplete: 'true',
          includeExternal: 'false',
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          state: selectedState !== 'All India' ? selectedState : undefined,
        });

        const payload = res?.data || res || {};
        setSuggestions(payload.suggestions || []);
      } catch (err) {
        console.error('Failed to fetch scheme suggestions:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedState]);

  // Click outside to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Full Search / Catalog Results
  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const isSearchActive = Boolean(debouncedQuery && debouncedQuery.trim().length > 0);

      const params = {
        page,
        limit,
        status: 'ACTIVE',
      };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedState !== 'All India') params.state = selectedState;
      if (isFeaturedOnly) params.featured = true;

      let res;
      if (isSearchActive) {
        params.q = debouncedQuery.trim();
        params.includeExternal = 'true';
        res = await schemeService.searchSchemes(params);
      } else {
        res = await schemeService.getSchemes(params);
      }

      const payload = res?.data || res || {};
      const pResults = payload.portalResults || payload.schemes || payload.results || [];
      const extResults = payload.externalResults || [];

      setPortalSchemes(pResults);
      setExternalResults(extResults);

      const totalCount =
        payload.totalPortalResults !== undefined
          ? payload.totalPortalResults
          : payload.total !== undefined
          ? payload.total
          : payload.pagination?.total !== undefined
          ? payload.pagination.total
          : pResults.length;

      const totalPages =
        payload.totalPages ||
        payload.pagination?.totalPages ||
        Math.ceil(totalCount / limit) ||
        1;

      setPagination({
        page: payload.page || payload.pagination?.page || page,
        limit: payload.limit || payload.pagination?.limit || limit,
        total: totalCount,
        totalPages,
      });
    } catch (err) {
      console.error('Failed to load schemes:', err);
      setError(err.message || 'Unable to load schemes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedQuery, selectedCategory, selectedState, isFeaturedOnly]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  // Execute full search
  const handleExecuteSearch = (queryToSearch) => {
    const term = queryToSearch !== undefined ? queryToSearch : search;
    setDebouncedQuery(term.trim());
    setPage(1);
    setDropdownOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e) => {
    if (!dropdownOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleExecuteSearch();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        handleExecuteSearch();
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Selecting a suggestion from dropdown
  const handleSelectSuggestion = (item) => {
    setDropdownOpen(false);
    setSelectedIndex(-1);

    if (item.type === 'scheme' && item.id) {
      navigate(`/schemes/${item.id}`);
    } else if (item.type === 'category' && item.category) {
      setSelectedCategory(item.category);
      setSearch('');
      setDebouncedQuery('');
      setPage(1);
    } else {
      setSearch(item.text);
      handleExecuteSearch(item.text);
    }
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setDebouncedQuery('');
    setSuggestions([]);
    setDropdownOpen(false);
    setSelectedIndex(-1);
    setPage(1);
  };

  const handleResetAllFilters = () => {
    setSearch('');
    setDebouncedQuery('');
    setSuggestions([]);
    setSelectedCategory('All');
    setSelectedState('All India');
    setIsFeaturedOnly(false);
    setPage(1);
  };

  const officialExternalSources = externalResults.filter((item) => item.official);
  const additionalExternalSources = externalResults.filter((item) => !item.official);

  // Calculate dynamic stats from actual existing data
  const totalSchemesCount = pagination.total;
  const featuredSchemesCount = portalSchemes.filter((s) => s.isFeatured).length;
  const availableCategoriesCount = CATEGORIES.length - 1; // excluding 'All'

  return (
    <div className="schemes-page-root">
      <div className="schemes-container">
        {/* ==================================================================
            1. PAGE HEADER (DEFENSE WELFARE SCHEMES & PENSION)
            ================================================================== */}
        <section className="schemes-hero-banner" aria-label="Welfare Hero">
          <div className="hero-grid-split">
            <div className="hero-left-info">
              <div className="hero-eyebrow">
                <ShieldCheck size={14} className="eyebrow-icon" aria-hidden="true" />
                <span>MINISTRY OF DEFENCE & CENTRAL ARMED FORCES</span>
              </div>
              <h1 className="schemes-hero-title">Defense Welfare Schemes & Pension</h1>
              <p className="schemes-hero-subtitle">
                Discover verified welfare schemes, pension benefits, healthcare assistance and government support available for veterans and their families.
              </p>
            </div>

            {/* Compact Visual Statistic Area */}
            <div className="hero-stats-cluster" aria-label="Scheme Statistics">
              <div className="hero-stat-badge">
                <div className="stat-icon-wrapper theme-navy">
                  <Award size={16} aria-hidden="true" />
                </div>
                <div className="stat-meta-stack">
                  <span className="stat-number-text">{totalSchemesCount}</span>
                  <span className="stat-label-text">Total Schemes</span>
                </div>
              </div>

              <div className="hero-stat-badge">
                <div className="stat-icon-wrapper theme-amber">
                  <Sparkles size={16} aria-hidden="true" />
                </div>
                <div className="stat-meta-stack">
                  <span className="stat-number-text">{featuredSchemesCount}</span>
                  <span className="stat-label-text">Featured</span>
                </div>
              </div>

              <div className="hero-stat-badge">
                <div className="stat-icon-wrapper theme-blue">
                  <Layers size={16} aria-hidden="true" />
                </div>
                <div className="stat-meta-stack">
                  <span className="stat-number-text">{availableCategoriesCount}</span>
                  <span className="stat-label-text">Categories</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            2. OFFICIAL GUIDANCE NOTICE
            ================================================================== */}
        <div className="official-guidance-banner" role="region" aria-label="Official Guidance Notice">
          <div className="guidance-icon-circle" aria-hidden="true">
            <Info size={16} />
          </div>
          <div className="guidance-body">
            <span className="guidance-title">Official Guidance</span>
            <p className="guidance-text">
              Scheme rules, pension entitlements and sanction amounts are determined by the respective official awarding authorities after verification.
            </p>
          </div>
        </div>

        {/* ==================================================================
            3. SEARCH SECTION & CATEGORY PILLS
            ================================================================== */}
        <div className="schemes-search-filter-card">
          {/* Large Search Input */}
          <div className="search-input-wrapper" ref={searchBoxRef}>
            <Search className="search-icon-pos" size={18} aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              className="search-input-field"
              placeholder="Search schemes by name, keyword, benefits, or jurisdiction..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value.trim().length > 0) {
                  setDropdownOpen(true);
                } else {
                  setDropdownOpen(false);
                  setDebouncedQuery('');
                }
                setSelectedIndex(-1);
              }}
              onFocus={() => {
                if (search.trim().length > 0) setDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              aria-label="Search welfare schemes"
              aria-autocomplete="list"
              aria-controls="scheme-autocomplete-list"
            />

            {/* Searching Spinner */}
            {suggestionsLoading && (
              <div className="search-loading-spinner" title="Searching database...">
                <Loader2 size={16} className="spin-icon" />
              </div>
            )}

            {/* Clear Button */}
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear Search Input"
              >
                <X size={15} />
              </button>
            )}

            {/* Autocomplete Dropdown */}
            {dropdownOpen && search.trim().length > 0 && (
              <div className="scheme-autocomplete-dropdown" id="scheme-autocomplete-list" role="listbox">
                {suggestionsLoading && suggestions.length === 0 ? (
                  <div className="dropdown-searching-state">
                    <Loader2 size={14} className="spin-icon" />
                    <span>Searching defense welfare database...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="dropdown-section-title">SUGGESTIONS</div>
                    <ul className="dropdown-items-list">
                      {suggestions.map((item, idx) => (
                        <li
                          key={idx}
                          role="option"
                          aria-selected={selectedIndex === idx}
                          className={`dropdown-item ${selectedIndex === idx ? 'selected' : ''}`}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => handleSelectSuggestion(item)}
                        >
                          <div className="dropdown-item-left">
                            <div className="dropdown-item-icon">
                              <Search size={14} />
                            </div>
                            <div className="dropdown-item-text">
                              <span className="dropdown-item-title">{item.text}</span>
                              {item.category && (
                                <span className="dropdown-item-cat">{item.category}</span>
                              )}
                            </div>
                          </div>
                          {item.type === 'scheme' && (
                            <span className="dropdown-item-type-badge">Scheme</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="dropdown-empty-state">
                    <span>No exact title matches. Press <strong>Enter</strong> to search all scheme details.</span>
                  </div>
                )}

                <div
                  className="dropdown-footer-row"
                  onClick={() => handleExecuteSearch()}
                >
                  <span>View all results for "<strong>{search}</strong>"</span>
                  <div className="enter-key-badge">
                    <span>Enter</span>
                    <CornerDownLeft size={12} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Navigation Pills */}
          <div className="category-navigation-bar" role="navigation" aria-label="Scheme Categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`gov-category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
                aria-pressed={selectedCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ==================================================================
              4. FILTER TOOLBAR (JURISDICTION, FEATURED ONLY, COUNT)
              ================================================================== */}
          <div className="filter-and-refine-bar">
            <div className="filter-refine-left">
              <div className="filter-field-pair">
                <label htmlFor="jurisdiction-select" className="filter-label-text">
                  Jurisdiction:
                </label>
                <select
                  id="jurisdiction-select"
                  className="gov-select-control"
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setPage(1);
                  }}
                >
                  {STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <label className="featured-checkbox-label">
                <input
                  type="checkbox"
                  checked={isFeaturedOnly}
                  onChange={(e) => {
                    setIsFeaturedOnly(e.target.checked);
                    setPage(1);
                  }}
                />
                <Sparkles size={13} className="featured-checkbox-icon" aria-hidden="true" />
                <span>Featured Only</span>
              </label>

              {(selectedCategory !== 'All' || selectedState !== 'All India' || isFeaturedOnly || search) && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="btn-reset-filters"
                  title="Reset all filters"
                >
                  <RotateCcw size={11} aria-hidden="true" />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            <div className="filter-refine-right">
              <span className="results-count-text">
                Found <strong>{pagination.total}</strong> schemes
              </span>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="schemes-error-card" role="alert">
            <AlertCircle size={28} className="error-icon" aria-hidden="true" />
            <h3 className="error-heading">Unable to load schemes</h3>
            <p className="error-body">{error}</p>
            <Button variant="primary" size="sm" icon={RotateCcw} onClick={fetchSchemes}>
              Retry
            </Button>
          </div>
        )}

        {/* ==================================================================
            5. RESULTS SECTION (SKELETONS, SCHEME CARDS, EXTERNAL SOURCES)
            ================================================================== */}
        {loading ? (
          /* Skeletons */
          <div className="schemes-grid-canvas" aria-busy="true" aria-label="Loading schemes">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SchemeSkeleton key={i} />
            ))}
          </div>
        ) : portalSchemes.length === 0 && externalResults.length === 0 ? (
          /* Empty State */
          <div className="schemes-empty-state-box">
            <div className="empty-state-icon-box" aria-hidden="true">
              <FileCheck2 size={32} />
            </div>
            <h3 className="empty-state-heading">No schemes found</h3>
            <p className="empty-state-body">
              Try changing your search or filter criteria.
            </p>
            <Button variant="primary" size="sm" icon={RotateCcw} onClick={handleResetAllFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="schemes-results-stream">
            {/* 5A. PORTAL SCHEMES GRID (RESPONSIVE MINMAX GRID) */}
            {portalSchemes.length > 0 && (
              <div className="schemes-grid-canvas">
                {portalSchemes.map((scheme) => (
                  <SchemeCard
                    key={scheme.schemeId || scheme.id || scheme._id}
                    scheme={scheme}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="schemes-pagination-bar" aria-label="Schemes Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  icon={ChevronLeft}
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(p - 1, 1));
                    window.scrollTo({ top: 320, behavior: 'smooth' });
                  }}
                  aria-label="Previous Page"
                >
                  Previous
                </Button>

                <span className="pagination-info-text">
                  Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  icon={ChevronRight}
                  iconPosition="right"
                  disabled={page >= pagination.totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(p + 1, pagination.totalPages));
                    window.scrollTo({ top: 320, behavior: 'smooth' });
                  }}
                  aria-label="Next Page"
                >
                  Next
                </Button>
              </div>
            )}

            {/* 5B. OFFICIAL GOVERNMENT & DEFENSE EXTERNAL SOURCES */}
            {officialExternalSources.length > 0 && (
              <div className="external-sources-block">
                <div className="external-section-header">
                  <div className="external-title-group">
                    <Building2 size={18} color="#059669" aria-hidden="true" />
                    <h3 className="external-section-heading">Official Government & Defense Sources</h3>
                    <span className="external-badge-green">{officialExternalSources.length}</span>
                  </div>
                  <span className="external-disclaimer-sub">Verified external government domains</span>
                </div>

                <div className="external-cards-grid">
                  {officialExternalSources.map((item, idx) => (
                    <div key={idx} className="gov-external-card official-green-border">
                      <div className="external-card-top-row">
                        <span className="external-verified-pill">
                          <ShieldCheck size={11} aria-hidden="true" />
                          <span>OFFICIAL SOURCE</span>
                        </span>
                        <span className="external-domain-label">
                          <Globe size={11} aria-hidden="true" />
                          <span>{item.source}</span>
                        </span>
                      </div>
                      <h4 className="external-item-title">{item.title}</h4>
                      <p className="external-item-desc">{item.description}</p>
                      <div className="external-item-footer">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-action-link"
                        >
                          <span>View Official Source</span>
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5C. ADDITIONAL EXTERNAL REFERENCES */}
            {additionalExternalSources.length > 0 && (
              <div className="external-sources-block">
                <div className="external-section-header">
                  <div className="external-title-group">
                    <Globe size={18} color="#1769E8" aria-hidden="true" />
                    <h3 className="external-section-heading">Additional External References</h3>
                    <span className="external-badge-blue">{additionalExternalSources.length}</span>
                  </div>
                </div>

                <div className="external-cards-grid">
                  {additionalExternalSources.map((item, idx) => (
                    <div key={idx} className="gov-external-card">
                      <div className="external-card-top-row">
                        <span className="external-ref-pill">EXTERNAL RESOURCE</span>
                        <span className="external-domain-label">
                          <Globe size={11} aria-hidden="true" />
                          <span>{item.source}</span>
                        </span>
                      </div>
                      <h4 className="external-item-title">{item.title}</h4>
                      <p className="external-item-desc">{item.description}</p>
                      <div className="external-item-footer">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-action-link"
                        >
                          <span>View Reference</span>
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            6. OFFICIAL WELFARE TRUST FOOTER
            ================================================================== */}
        <section className="official-trust-footer-section" aria-label="Official Welfare Information">
          <div className="trust-footer-content">
            <div className="trust-footer-icon-box" aria-hidden="true">
              <ShieldCheck size={26} />
            </div>
            <div className="trust-footer-text">
              <h3 className="trust-footer-title">Official Welfare Information</h3>
              <p className="trust-footer-desc">
                Scheme rules, pension entitlements and sanction amounts are determined by the respective official awarding authorities after verification.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SchemesList;
