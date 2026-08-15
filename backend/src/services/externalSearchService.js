import config from '../config/environment.js';

// Recognized official defense & government domain patterns
const OFFICIAL_DOMAINS = [
  'gov.in',
  'nic.in',
  'ksb.gov.in',
  'echs.gov.in',
  'desw.gov.in',
  'dgrindia.gov.in',
  'pcdapension.nic.in',
  'cgda.nic.in',
  'mod.gov.in',
  'indianarmy.nic.in',
  'indiannavy.nic.in',
  'indianairforce.nic.in',
  'awhoindia.com',
  'afnhb.org',
];

/**
 * Check if a URL or hostname belongs to an official government or defense welfare source
 */
export const isOfficialSource = (urlStr) => {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
  } catch {
    const lower = urlStr.toLowerCase();
    return OFFICIAL_DOMAINS.some((d) => lower.includes(d));
  }
};

/**
 * Extract clean display source hostname from URL
 */
export const extractSourceDomain = (urlStr) => {
  if (!urlStr) return 'External Source';
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Official Source';
  }
};

/**
 * Search Tavily API
 */
const searchTavily = async (query, apiKey, apiUrl, limit = 5, signal) => {
  const enhancedQuery = `${query} defense veteran welfare scheme pension ex-servicemen India`;
  
  const response = await fetch(apiUrl || 'https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: enhancedQuery,
      search_depth: 'basic',
      include_domains: OFFICIAL_DOMAINS,
      max_results: limit,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Tavily API responded with HTTP status ${response.status}`);
  }

  const data = await response.json();
  const rawResults = data.results || [];

  return rawResults.map((item) => {
    const isOfficial = isOfficialSource(item.url);
    const sourceDomain = extractSourceDomain(item.url);
    return {
      title: item.title || 'Official Welfare Information',
      description: item.content || item.snippet || 'External defense welfare program details.',
      source: sourceDomain,
      url: item.url,
      type: 'external',
      official: isOfficial,
      badge: isOfficial ? 'OFFICIAL SOURCE' : 'EXTERNAL SOURCE',
      publishedDate: item.published_date || null,
      score: item.score || (isOfficial ? 85 : 60),
    };
  });
};

/**
 * Search Google Custom Search API
 */
const searchGoogleCSE = async (query, apiKey, apiUrl, limit = 5, signal) => {
  const cx = process.env.SEARCH_ENGINE_ID || '';
  const searchUrl = new URL(apiUrl || 'https://www.googleapis.com/customsearch/v1');
  searchUrl.searchParams.set('key', apiKey);
  if (cx) searchUrl.searchParams.set('cx', cx);
  searchUrl.searchParams.set('q', `${query} ex-servicemen welfare scheme`);
  searchUrl.searchParams.set('num', String(Math.min(limit, 10)));

  const response = await fetch(searchUrl.toString(), { signal });
  if (!response.ok) {
    throw new Error(`Google CSE API responded with HTTP status ${response.status}`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items.map((item) => {
    const isOfficial = isOfficialSource(item.link);
    const sourceDomain = extractSourceDomain(item.link);
    return {
      title: item.title || 'Official Welfare Program',
      description: item.snippet || item.htmlSnippet?.replace(/<[^>]*>?/gm, '') || 'Official scheme reference.',
      source: sourceDomain,
      url: item.link,
      type: 'external',
      official: isOfficial,
      badge: isOfficial ? 'OFFICIAL SOURCE' : 'EXTERNAL SOURCE',
      publishedDate: null,
      score: isOfficial ? 90 : 65,
    };
  });
};

/**
 * Search Brave Search API
 */
const searchBrave = async (query, apiKey, apiUrl, limit = 5, signal) => {
  const searchUrl = new URL(apiUrl || 'https://api.search.brave.com/res/v1/web/search');
  searchUrl.searchParams.set('q', `${query} defense veteran scheme India`);
  searchUrl.searchParams.set('count', String(Math.min(limit, 10)));

  const response = await fetch(searchUrl.toString(), {
    headers: {
      'Accept': 'application/json',
      'X-Subscription-Token': apiKey,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Brave Search API responded with HTTP status ${response.status}`);
  }

  const data = await response.json();
  const results = data.web?.results || [];

  return results.map((item) => {
    const isOfficial = isOfficialSource(item.url);
    const sourceDomain = extractSourceDomain(item.url);
    return {
      title: item.title || 'Defense Scheme Reference',
      description: item.description || 'External information source.',
      source: sourceDomain,
      url: item.url,
      type: 'external',
      official: isOfficial,
      badge: isOfficial ? 'OFFICIAL SOURCE' : 'EXTERNAL SOURCE',
      publishedDate: null,
      score: isOfficial ? 85 : 60,
    };
  });
};

/**
 * Main External Search Dispatcher
 *
 * @param {string} query - Public search keyword
 * @param {number} limit - Maximum external items to return
 * @returns {Promise<{ success: boolean, results: Array, status: string, message?: string }>}
 */
export const searchExternalSchemes = async (query, limit = 5) => {
  // 1. Safety Checks: Only search if query provided
  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      success: true,
      results: [],
      status: 'EMPTY_QUERY',
    };
  }

  const trimmedQuery = query.trim();

  // 2. Check if Search API is configured
  const apiKey = config.search.apiKey;
  const apiUrl = config.search.apiUrl;
  const provider = config.search.provider;

  if (!config.search.isConfigured || !apiKey) {
    return {
      success: true,
      results: [],
      status: 'DISABLED',
      message: 'External search API key not configured. Displaying verified portal schemes.',
    };
  }

  // 3. Strict 3.5s Timeout Controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    let rawResults = [];

    if (provider === 'google' || provider === 'google_cse') {
      rawResults = await searchGoogleCSE(trimmedQuery, apiKey, apiUrl, limit, controller.signal);
    } else if (provider === 'brave') {
      rawResults = await searchBrave(trimmedQuery, apiKey, apiUrl, limit, controller.signal);
    } else {
      // Default to Tavily
      rawResults = await searchTavily(trimmedQuery, apiKey, apiUrl, limit, controller.signal);
    }

    clearTimeout(timeoutId);

    // 4. Deduplicate and Prioritize Official Sources
    const seenUrls = new Set();
    const uniqueResults = [];

    for (const item of rawResults) {
      if (!item.url || seenUrls.has(item.url.toLowerCase())) continue;
      seenUrls.add(item.url.toLowerCase());
      uniqueResults.push(item);
    }

    // Sort: Official sources first, then score
    uniqueResults.sort((a, b) => {
      if (a.official !== b.official) {
        return a.official ? -1 : 1;
      }
      return (b.score || 0) - (a.score || 0);
    });

    return {
      success: true,
      results: uniqueResults.slice(0, limit),
      status: 'SUCCESS',
      total: uniqueResults.length,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.warn(`[External Search] Request timed out after 3.5s for query: "${trimmedQuery}". Falling back to MongoDB.`);
      return {
        success: false,
        results: [],
        status: 'TIMEOUT',
        message: 'External search timed out. Displaying portal schemes.',
      };
    }

    console.warn(`[External Search] API error: ${error.message}. Falling back to MongoDB.`);
    return {
      success: false,
      results: [],
      status: 'UNAVAILABLE',
      message: 'External search temporarily unavailable. Displaying portal schemes.',
    };
  }
};

export default {
  searchExternalSchemes,
  isOfficialSource,
  extractSourceDomain,
};
