import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Info,
  Award,
  Loader2,
  CornerDownLeft,
  RotateCcw,
  Globe,
  Building2,
  FileText,
} from 'lucide-react';
import { schemeService } from '../../services/schemeService.js';
import Button from '../../components/Button/Button.jsx';
import Badge from '../../components/Badge/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx';
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Results State
  const [portalSchemes, setPortalSchemes] = useState([]);
  const [externalResults, setExternalResults] = useState([]);
  const [externalStatus, setExternalStatus] = useState('DISABLED');
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

  // Autocomplete Dropdown State (Uses Fast MongoDB Search Only)
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

  // Debounce search input for autocomplete suggestions ONLY (MongoDB fast search)
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

      // Robust payload unwrapping (supports res.data, res, nested pagination)
      const payload = res?.data || res || {};
      const pResults = payload.portalResults || payload.schemes || payload.results || [];
      const extResults = payload.externalResults || [];

      setPortalSchemes(pResults);
      setExternalResults(extResults);
      setExternalStatus(payload.externalSearchStatus || 'DISABLED');

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
      setError(err.message || 'Failed to load welfare schemes catalog');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedQuery, selectedCategory, selectedState, isFeaturedOnly]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  // Execute full search with current input
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

  const getCategoryBadgeVariant = (cat) => {
    switch (cat) {
      case 'Pension': return 'gold';
      case 'Healthcare': return 'success';
      case 'Housing': return 'accent';
      case 'Education': return 'primary';
      case 'Employment': return 'warning';
      case 'Skill Development': return 'info';
      default: return 'neutral';
    }
  };

  // Partition external results into official and additional
  const officialExternalSources = externalResults.filter((item) => item.official);
  const additionalExternalSources = externalResults.filter((item) => !item.official);

  const isSearchActive = Boolean(debouncedQuery && debouncedQuery.trim().length > 0);

  return (
    <div className="schemes-page-wrapper">
      {/* 1. Hero Title & Subtitle */}
      <div className="schemes-hero">
        <h1 className="schemes-hero-title">
          Defense Welfare Schemes & Pension Vault
        </h1>
        <p className="schemes-hero-subtitle">
          Centralized search across verified portal schemes, central/state defense welfare programs, and official government authorities.
        </p>

        {/* Informational Guidance Notice */}
        <div className="official-disclaimer-banner">
          <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Official Guidance Notice:</strong> Scheme rules, pension entitlements, and sanction amounts are determined by the official awarding authorities (DESW, Kendriya Sainik Board, ECHS, or DGR) upon verification of certified defense records.
          </div>
        </div>
      </div>

      {/* 2. Smart Search & Filters Toolbar */}
      <div className="schemes-toolbar-card">
        {/* Search Input with Autocomplete */}
        <div className="search-input-wrapper" ref={searchBoxRef}>
          <Search className="search-icon-pos" size={18} />
          <input
            ref={inputRef}
            type="text"
            className="search-input-field"
            placeholder="Search schemes by name, keyword, benefits, or jurisdiction (e.g. Pension, ECHS, PMSS, Housing)..."
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
            aria-autocomplete="list"
            aria-controls="scheme-autocomplete-list"
          />

          {/* Searching Loader Indicator */}
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
              aria-label="Clear Search"
            >
              <X size={16} />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {dropdownOpen && search.trim().length > 0 && (
            <div className="scheme-autocomplete-dropdown" id="scheme-autocomplete-list" role="listbox">
              {suggestionsLoading && suggestions.length === 0 ? (
                <div className="dropdown-searching-state">
                  <Loader2 size={14} className="spin-icon" />
                  <span>Searching defense schemes database...</span>
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

              {/* View all results footer */}
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

        {/* Category Filter Pills */}
        <div className="category-pills-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sub-Filters: State / Jurisdiction & Featured */}
        <div className="sub-filters-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Jurisdiction:
            </span>
            <select
              className="state-select-control"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-main)' }}>
              <input
                type="checkbox"
                checked={isFeaturedOnly}
                onChange={(e) => {
                  setIsFeaturedOnly(e.target.checked);
                  setPage(1);
                }}
              />
              Featured Only
            </label>

            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              {isSearchActive ? (
                <>Found <strong>{pagination.total}</strong> relevant schemes</>
              ) : (
                <>Found <strong>{pagination.total}</strong> schemes</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <ErrorMessage message={error} />

      {/* 3. Results Container */}
      {loading ? (
        <div style={{ minHeight: '35vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner size="lg" text="Loading welfare schemes & pension directory..." />
        </div>
      ) : portalSchemes.length === 0 && externalResults.length === 0 ? (
        /* Empty State */
        <div className="scheme-empty-state-card">
          <div className="empty-state-icon-box">
            <SlidersHorizontal size={28} />
          </div>
          <h2 className="empty-state-title">
            No schemes found {isSearchActive ? `for "${debouncedQuery.trim()}"` : ''}
          </h2>
          <p className="empty-state-subtitle">
            We couldn't find any welfare schemes matching your current query and filters.
          </p>

          <div className="empty-state-tips-box">
            <span className="tips-header">Suggestions to find what you're looking for:</span>
            <ul className="tips-list">
              <li>Check your spelling or try broader terms (e.g. <em>Pension</em>, <em>Healthcare</em>, <em>ECHS</em>)</li>
              <li>Switch category filter to <strong>All</strong> or jurisdiction to <strong>All India</strong></li>
              <li>Search by sponsoring authority such as <em>KSB</em>, <em>DESW</em>, or <em>DGR</em></li>
            </ul>
          </div>

          <Button variant="primary" size="md" icon={RotateCcw} onClick={handleResetAllFilters}>
            Browse All Schemes
          </Button>
        </div>
      ) : (
        <div className="schemes-results-layout">
          {/* 3A. VERIFIED PORTAL SCHEMES SECTION */}
          {portalSchemes.length > 0 && (
            <div className="results-section-block">
              {isSearchActive && (
                <div className="results-section-header">
                  <div className="results-section-title-group">
                    <ShieldCheck size={18} className="text-primary" />
                    <h2>Verified Portal Schemes</h2>
                    <span className="results-count-pill">{portalSchemes.length}</span>
                  </div>
                </div>
              )}

              <div className="schemes-grid">
                {portalSchemes.map((item) => (
                  <div key={item.id || item._id} className="scheme-card">
                    <div>
                      <div className="scheme-card-top">
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Badge variant={getCategoryBadgeVariant(item.category)}>
                            {item.category}
                          </Badge>
                          {item.isFeatured && (
                            <Badge variant="gold" icon={Sparkles}>
                              Featured
                            </Badge>
                          )}
                        </div>
                        <span className="scheme-card-id">{item.schemeId}</span>
                      </div>

                      <h3 className="scheme-card-title">{item.name}</h3>
                      <p className="scheme-card-desc">{item.shortDescription}</p>

                      {/* Benefits Preview */}
                      {item.benefits?.length > 0 && (
                        <ul className="scheme-benefits-list">
                          {item.benefits.slice(0, 2).map((b, i) => (
                            <li key={i} className="scheme-benefit-item">
                              <Check size={14} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="scheme-card-footer">
                      <div>
                        <div className="scheme-source-text" title={item.officialSource}>
                          {item.officialSource}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                          Scope: {item.state || 'All India'}
                        </div>
                      </div>

                      <Link to={`/schemes/${item.schemeId || item.id || item._id}`}>
                        <Button variant="secondary" size="sm" icon={ArrowRight}>
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Portal Schemes Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination-container">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ChevronLeft}
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((p) => Math.max(p - 1, 1));
                      window.scrollTo({ top: 250, behavior: 'smooth' });
                    }}
                  >
                    Previous
                  </Button>

                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-main)' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ChevronRight}
                    disabled={page >= pagination.totalPages}
                    onClick={() => {
                      setPage((p) => Math.min(p + 1, pagination.totalPages));
                      window.scrollTo({ top: 250, behavior: 'smooth' });
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 3B. OFFICIAL GOVERNMENT & DEFENSE EXTERNAL SOURCES SECTION */}
          {officialExternalSources.length > 0 && (
            <div className="results-section-block">
              <div className="results-section-header">
                <div className="results-section-title-group">
                  <Building2 size={18} style={{ color: '#059669' }} />
                  <h2>Official Government & Defense Sources</h2>
                  <span className="results-count-pill" style={{ backgroundColor: '#ECFDF5', color: '#047857' }}>
                    {officialExternalSources.length}
                  </span>
                </div>
                <span className="external-source-disclaimer">
                  Verified external government domains
                </span>
              </div>

              <div className="external-cards-grid">
                {officialExternalSources.map((item, idx) => (
                  <div key={idx} className="external-source-card official-border">
                    <div className="external-card-top">
                      <span className="official-source-pill">
                        <ShieldCheck size={12} />
                        OFFICIAL SOURCE
                      </span>
                      <span className="external-source-domain">
                        <Globe size={12} />
                        {item.source}
                      </span>
                    </div>

                    <h3 className="external-card-title">{item.title}</h3>
                    <p className="external-card-desc">{item.description}</p>

                    <div className="external-card-footer">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link-btn"
                      >
                        <span>View Source</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3C. ADDITIONAL EXTERNAL SOURCES SECTION */}
          {additionalExternalSources.length > 0 && (
            <div className="results-section-block">
              <div className="results-section-header">
                <div className="results-section-title-group">
                  <Globe size={18} className="text-secondary" />
                  <h2>Additional External References</h2>
                  <span className="results-count-pill">{additionalExternalSources.length}</span>
                </div>
              </div>

              <div className="external-cards-grid">
                {additionalExternalSources.map((item, idx) => (
                  <div key={idx} className="external-source-card">
                    <div className="external-card-top">
                      <span className="external-source-pill">EXTERNAL RESOURCE</span>
                      <span className="external-source-domain">
                        <Globe size={12} />
                        {item.source}
                      </span>
                    </div>

                    <h3 className="external-card-title">{item.title}</h3>
                    <p className="external-card-desc">{item.description}</p>

                    <div className="external-card-footer">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link-btn"
                      >
                        <span>View Source</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchemesList;
