import { Scheme } from '../models/Scheme.js';
import { Veteran } from '../models/Veteran.js';
import { evaluateEligibility } from '../services/eligibility.service.js';
import { searchExternalSchemes } from '../services/externalSearchService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

// Common typo corrections dictionary
const TYPO_MAP = {
  penson: 'pension',
  penshion: 'pension',
  pennsion: 'pension',
  'health care': 'healthcare',
  'health-care': 'healthcare',
  heal: 'healthcare',
  med: 'medical',
  medic: 'medical',
  'ex servicemen': 'ex-servicemen',
  exservicemen: 'ex-servicemen',
  'ex-service': 'ex-servicemen',
  esm: 'ex-servicemen',
  disablity: 'disability',
  disablty: 'disability',
  echs: 'ECHS',
  sparsh: 'SPARSH',
  ksb: 'Kendriya Sainik Board',
  dgr: 'Directorate General Resettlement',
  scholarship: 'scholarship',
  scholership: 'scholarship',
  resettle: 'resettlement',
  resettlment: 'resettlement',
  odisa: 'Odisha',
  orissa: 'Odisha',
  bhubaneshwar: 'Bhubaneswar',
  bhubneswar: 'Bhubaneswar',
  famiily: 'family',
  famly: 'family',
  educaton: 'education',
  edukation: 'education',
  housng: 'housing',
  employmnt: 'employment',
  employement: 'employment',
};

/**
 * Normalize and expand search query for typo tolerance
 */
const normalizeQuery = (rawQuery) => {
  if (!rawQuery || typeof rawQuery !== 'string') return { normalized: '', tokens: [] };
  const lower = rawQuery.trim().toLowerCase();
  
  // Direct dictionary check
  let normalized = TYPO_MAP[lower] || lower;
  
  // Tokenize
  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const correctedTokens = rawTokens.map((t) => TYPO_MAP[t] || t);
  
  return {
    raw: rawQuery.trim(),
    normalized: correctedTokens.join(' '),
    tokens: correctedTokens,
  };
};

/**
 * Calculate relevance score for a scheme against search query
 */
const calculateRelevanceScore = (scheme, rawQuery, normalizedQuery, tokens) => {
  let score = 0;
  const qRaw = rawQuery.toLowerCase();
  const qNorm = normalizedQuery.toLowerCase();

  const nameLower = (scheme.name || '').toLowerCase();
  const idLower = (scheme.schemeId || '').toLowerCase();
  const catLower = (scheme.category || '').toLowerCase();
  const subCatLower = (scheme.subCategory || '').toLowerCase();
  const shortDescLower = (scheme.shortDescription || '').toLowerCase();
  const descLower = (scheme.description || '').toLowerCase();
  const sourceLower = (scheme.officialSource || '').toLowerCase();
  const stateLower = (scheme.state || '').toLowerCase();
  const benefitsText = (scheme.benefits || []).join(' ').toLowerCase();
  const docsText = (scheme.requiredDocuments || []).join(' ').toLowerCase();
  const branchesText = (scheme.eligibility?.serviceBranches || []).join(' ').toLowerCase();
  const conditionsText = (scheme.eligibility?.otherConditions || []).join(' ').toLowerCase();

  // 1. Exact scheme name match
  if (nameLower === qRaw || nameLower === qNorm) {
    score += 100;
  }
  // 2. Scheme name starts with query
  else if (nameLower.startsWith(qRaw) || nameLower.startsWith(qNorm)) {
    score += 80;
  }
  // 3. Scheme name contains query
  else if (nameLower.includes(qRaw) || nameLower.includes(qNorm)) {
    score += 60;
  }

  // Exact or prefix match on Scheme ID
  if (idLower === qRaw || idLower.includes(qRaw)) {
    score += 50;
  }

  // 4. Category / SubCategory Match
  if (catLower === qRaw || catLower === qNorm) {
    score += 40;
  } else if (catLower.includes(qRaw) || catLower.includes(qNorm) || subCatLower.includes(qNorm)) {
    score += 30;
  }

  // 5. Benefits match
  if (benefitsText.includes(qRaw) || benefitsText.includes(qNorm)) {
    score += 25;
  }

  // 6. Eligibility & Documents match
  if (conditionsText.includes(qNorm) || branchesText.includes(qNorm) || docsText.includes(qNorm)) {
    score += 15;
  }

  // 7. Short Description / Full Description match
  if (shortDescLower.includes(qRaw) || shortDescLower.includes(qNorm)) {
    score += 15;
  } else if (descLower.includes(qRaw) || descLower.includes(qNorm)) {
    score += 10;
  }

  // 8. State / Source / Jurisdiction match
  if (stateLower.includes(qNorm) || sourceLower.includes(qNorm)) {
    score += 12;
  }

  // Token-level matches
  tokens.forEach((token) => {
    if (token.length > 2) {
      if (nameLower.includes(token)) score += 10;
      if (benefitsText.includes(token)) score += 5;
      if (catLower.includes(token)) score += 5;
      if (shortDescLower.includes(token)) score += 3;
    }
  });

  // Featured bonus
  if (scheme.isFeatured) {
    score += 5;
  }

  return score;
};

/**
 * Generate smart autocomplete suggestions
 */
const generateSuggestions = (schemes, rawQuery, normalizedQuery) => {
  const suggestionsMap = new Map();
  const qNorm = normalizedQuery.toLowerCase();
  const qRaw = rawQuery.toLowerCase();

  // 1. Matched Scheme Titles (highest priority)
  schemes.slice(0, 6).forEach((s) => {
    if (!suggestionsMap.has(s.name)) {
      suggestionsMap.set(s.name, {
        text: s.name,
        type: 'scheme',
        category: s.category,
        id: s.schemeId,
        score: s.relevanceScore || 10,
      });
    }
  });

  // 2. Category suggestions
  const allCategories = [
    'Pension',
    'Healthcare',
    'Housing',
    'Education',
    'Employment',
    'Skill Development',
    'Family Welfare',
    'Financial Assistance',
    'Resettlement',
  ];

  allCategories.forEach((cat) => {
    if (cat.toLowerCase().includes(qNorm) || cat.toLowerCase().includes(qRaw)) {
      const catText = `${cat} Schemes`;
      if (!suggestionsMap.has(catText)) {
        suggestionsMap.set(catText, {
          text: catText,
          type: 'category',
          category: cat,
          score: 50,
        });
      }
    }
  });

  // 3. Keyword / Key Benefit Suggestions
  const commonKeywords = [
    { text: 'Defence Pension', category: 'Pension' },
    { text: 'Family Pension Support', category: 'Pension' },
    { text: 'Disability Pension Ex-Gratia', category: 'Pension' },
    { text: 'ECHS Medical Cashless', category: 'Healthcare' },
    { text: 'Emergency Healthcare Grants', category: 'Healthcare' },
    { text: 'Prime Minister Scholarship Scheme', category: 'Education' },
    { text: 'Defense Housing Subsidy', category: 'Housing' },
    { text: 'Directorate General Resettlement', category: 'Employment' },
  ];

  commonKeywords.forEach((kw) => {
    if (
      kw.text.toLowerCase().includes(qNorm) ||
      kw.text.toLowerCase().includes(qRaw) ||
      qNorm.includes(kw.category.toLowerCase())
    ) {
      if (!suggestionsMap.has(kw.text)) {
        suggestionsMap.set(kw.text, {
          text: kw.text,
          type: 'keyword',
          category: kw.category,
          score: 30,
        });
      }
    }
  });

  return Array.from(suggestionsMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
};

/**
 * Helper to escape regex special characters
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Smart Search API with MongoDB Relevance Ranking + Optional External Search Integration
 * GET /api/schemes/search?q=<query>&category=<cat>&state=<state>&featured=<bool>&page=<p>&limit=<l>&autocomplete=<bool>
 */
export const searchSchemes = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 50);
    const skip = (page - 1) * limit;

    const {
      q = '',
      search = '',
      category,
      state,
      featured,
      status = 'ACTIVE',
      autocomplete = 'false',
      includeExternal = 'true',
    } = req.query;

    const isAutocompleteOnly = autocomplete === 'true' || autocomplete === true;
    const shouldQueryExternal =
      includeExternal !== 'false' &&
      includeExternal !== false &&
      !isAutocompleteOnly &&
      Boolean((q || search || '').trim());

    const searchQuery = (q || search || '').trim();
    const { raw, normalized, tokens } = normalizeQuery(searchQuery);

    const baseFilter = {};
    if (status && status !== 'ALL') {
      baseFilter.status = status;
    }
    if (category && category !== 'All' && category !== 'ALL') {
      baseFilter.category = category;
    }
    if (state && state !== 'All India' && state !== 'ALL') {
      baseFilter.$or = [{ state: 'All India' }, { state: new RegExp(state, 'i') }];
    }
    if (featured === 'true' || featured === true) {
      baseFilter.isFeatured = true;
    }

    // 1. If query provided, construct multi-field regex condition for MongoDB
    if (searchQuery) {
      const regexPatterns = [
        new RegExp(escapeRegex(searchQuery), 'i'),
        new RegExp(escapeRegex(normalized), 'i'),
        ...tokens.map((t) => new RegExp(escapeRegex(t), 'i')),
      ];

      const searchConditions = regexPatterns.map((rx) => ({
        $or: [
          { name: rx },
          { schemeId: rx },
          { shortDescription: rx },
          { description: rx },
          { category: rx },
          { subCategory: rx },
          { benefits: rx },
          { officialSource: rx },
          { state: rx },
          { 'eligibility.serviceBranches': rx },
          { 'eligibility.otherConditions': rx },
          { requiredDocuments: rx },
        ],
      }));

      if (baseFilter.$or) {
        baseFilter.$and = [{ $or: baseFilter.$or }, { $or: searchConditions.flatMap((c) => c.$or) }];
        delete baseFilter.$or;
      } else {
        baseFilter.$or = searchConditions.flatMap((c) => c.$or);
      }
    }

    // 2. Fetch candidate schemes from MongoDB & optionally query external search in parallel
    const [allMatches, externalSearchRes] = await Promise.all([
      Scheme.find(baseFilter).lean(),
      shouldQueryExternal
        ? searchExternalSchemes(searchQuery, 6)
        : Promise.resolve({ success: true, results: [], status: 'SKIPPED' }),
    ]);

    // 3. Compute Relevance Scores for MongoDB schemes
    let scoredResults = allMatches.map((doc) => {
      const docObj = {
        ...doc,
        id: doc._id.toString(),
        type: 'portal',
        official: true,
      };
      if (searchQuery) {
        docObj.relevanceScore = calculateRelevanceScore(docObj, raw, normalized, tokens);
      } else {
        docObj.relevanceScore = docObj.isFeatured ? 10 : 0;
      }
      return docObj;
    });

    // Sort by relevance score descending, then by creation date
    if (searchQuery) {
      scoredResults.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else {
      scoredResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // 4. Process & Deduplicate External Results
    let externalResults = externalSearchRes.results || [];
    const portalUrls = new Set(
      scoredResults.map((s) => (s.officialWebsite || '').toLowerCase().replace(/\/$/, '')).filter(Boolean)
    );
    const portalTitles = new Set(scoredResults.map((s) => s.name.toLowerCase().trim()));

    // Filter out external results that exactly duplicate a portal scheme
    externalResults = externalResults.filter((ext) => {
      const extUrl = (ext.url || '').toLowerCase().replace(/\/$/, '');
      const extTitle = (ext.title || '').toLowerCase().trim();
      if (portalUrls.has(extUrl)) return false;
      if (portalTitles.has(extTitle)) return false;
      return true;
    });

    // 5. Generate Autocomplete Suggestions
    const suggestions = searchQuery ? generateSuggestions(scoredResults, raw, normalized) : [];

    const totalPortalResults = scoredResults.length;
    const totalExternalResults = externalResults.length;
    const paginatedPortalResults = scoredResults.slice(skip, skip + limit);

    // Combined results for backwards-compatibility
    const combinedResults = [...paginatedPortalResults, ...externalResults];

    return sendSuccess(res, 'Scheme search completed successfully', {
      portalResults: paginatedPortalResults,
      externalResults,
      results: combinedResults,
      schemes: paginatedPortalResults, // backwards compatibility
      suggestions,
      totalPortalResults,
      totalExternalResults,
      total: totalPortalResults + totalExternalResults,
      page,
      limit,
      totalPages: Math.ceil(totalPortalResults / limit) || 1,
      query: {
        raw,
        normalized,
      },
      externalSearchStatus: externalSearchRes.status || 'DISABLED',
      externalSearchMessage: externalSearchRes.message || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated, searchable, filterable schemes catalog (Enhanced with Smart Search)
 */
export const getSchemes = async (req, res, next) => {
  // If search/q is present, route through smart search engine
  if (req.query.search || req.query.q) {
    return searchSchemes(req, res, next);
  }

  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const {
      category,
      state,
      status = 'ACTIVE',
      featured,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (category && category !== 'All' && category !== 'ALL') {
      query.category = category;
    }
    if (state && state !== 'All India' && state !== 'ALL') {
      query.$or = [{ state: 'All India' }, { state: new RegExp(state, 'i') }];
    }
    if (featured === 'true' || featured === true) {
      query.isFeatured = true;
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const [schemes, total] = await Promise.all([
      Scheme.find(query).sort(sortOptions).skip(skip).limit(limit),
      Scheme.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Schemes retrieved successfully', {
      schemes: schemes.map((s) => s.toJSON()),
      portalResults: schemes.map((s) => s.toJSON()),
      externalResults: [],
      results: schemes.map((s) => s.toJSON()),
      total,
      totalPortalResults: total,
      totalExternalResults: 0,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured active schemes for home/dashboards
 */
export const getFeaturedSchemes = async (req, res, next) => {
  try {
    const featuredSchemes = await Scheme.find({
      status: 'ACTIVE',
      isFeatured: true,
    })
      .sort({ createdAt: -1 })
      .limit(6);

    return sendSuccess(res, 'Featured schemes retrieved successfully', {
      schemes: featuredSchemes.map((s) => s.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single scheme details by MongoDB _id or human-readable schemeId
 */
export const getSchemeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let scheme = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      scheme = await Scheme.findById(id);
    }

    if (!scheme) {
      scheme = await Scheme.findOne({ schemeId: id });
    }

    if (!scheme) {
      throw ApiError.notFound(`Scheme not found with identifier: ${id}`);
    }

    return sendSuccess(res, 'Scheme details retrieved successfully', {
      scheme: scheme.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Smart Eligibility Check for authenticated Veteran
 */
export const checkEligibility = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { schemeId } = req.body;

    if (!schemeId) {
      throw ApiError.badRequest('Please provide schemeId to evaluate eligibility');
    }

    let scheme = null;
    if (schemeId.match(/^[0-9a-fA-F]{24}$/)) {
      scheme = await Scheme.findById(schemeId);
    }
    if (!scheme) {
      scheme = await Scheme.findOne({ schemeId });
    }

    if (!scheme) {
      throw ApiError.notFound('Scheme not found');
    }

    const veteran = await Veteran.findOne({ user: userId });
    const result = evaluateEligibility(veteran, scheme);

    return sendSuccess(res, 'Eligibility check completed', {
      schemeId: scheme.schemeId,
      schemeName: scheme.name,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get personalized scheme recommendations for authenticated Veteran
 */
export const getRecommendedSchemes = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const veteran = await Veteran.findOne({ user: userId });

    const activeSchemes = await Scheme.find({ status: 'ACTIVE' });

    const evaluated = activeSchemes.map((scheme) => {
      const evalResult = evaluateEligibility(veteran, scheme);
      return {
        scheme: scheme.toJSON(),
        matchPercentage: evalResult.matchPercentage,
        status: evalResult.status,
        eligible: evalResult.eligible,
        matchedCriteria: evalResult.matchedCriteria,
        missingCriteria: evalResult.missingCriteria,
      };
    });

    evaluated.sort((a, b) => b.matchPercentage - a.matchPercentage);
    const topRecommendations = evaluated.slice(0, 8);

    return sendSuccess(res, 'Recommended schemes retrieved successfully', {
      schemes: topRecommendations,
      totalEvaluated: activeSchemes.length,
      disclaimer:
        'Recommendations are estimated based on your military service records. Final eligibility is subject to verification by the official awarding department.',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  searchSchemes,
  getSchemes,
  getFeaturedSchemes,
  getSchemeById,
  checkEligibility,
  getRecommendedSchemes,
};
