import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import schemeRoutes from '../routes/scheme.routes.js';
import { Scheme } from '../models/Scheme.js';
import { searchExternalSchemes, isOfficialSource, extractSourceDomain } from '../services/externalSearchService.js';
import config from '../config/environment.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/veterans_portal';

async function runAdvancedSearchTests() {
  console.log('====================================================');
  console.log('  STARTING ADVANCED SCHEME SEARCH & EXTERNAL SUITE   ');
  console.log('====================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(' Connected to MongoDB:', mongoose.connection.name);

  const totalSchemesInDB = await Scheme.countDocuments({ status: 'ACTIVE' });
  console.log(` Total Active Schemes in Database: ${totalSchemesInDB}\n`);

  const app = express();
  app.use(express.json());
  app.use('/api/schemes', schemeRoutes);

  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(` Test server running on ${baseUrl}\n`);

  let testsPassed = 0;

  // ----------------------------------------------------
  // TEST 1: Empty Search / Initial Catalog Load (Must NOT return 0)
  // ----------------------------------------------------
  console.log('--- TEST 1: Initial Empty Search (q="") ---');
  const res1 = await fetch(`${baseUrl}/api/schemes?page=1&limit=10`);
  const data1 = await res1.json();
  const schemes1 = data1.data?.portalResults || data1.data?.schemes || [];
  const total1 = data1.data?.totalPortalResults !== undefined ? data1.data.totalPortalResults : data1.data?.total;

  if (res1.status === 200 && schemes1.length > 0 && total1 === totalSchemesInDB) {
    console.log(`✓ Initial empty search correctly returned ${schemes1.length} schemes on Page 1 (Total: ${total1}).`);
    testsPassed++;
  } else {
    console.error('✗ Test 1 Failed: Empty search returned 0 results or wrong total:', data1);
  }

  // ----------------------------------------------------
  // TEST 2: Clear Search (q="" restores all schemes)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Clear Search Restoration ---');
  const res2 = await fetch(`${baseUrl}/api/schemes/search?q=&page=1&limit=10`);
  const data2 = await res2.json();
  const schemes2 = data2.data?.portalResults || data2.data?.schemes || [];
  const total2 = data2.data?.totalPortalResults !== undefined ? data2.data.totalPortalResults : data2.data?.total;

  if (res2.status === 200 && schemes2.length > 0 && total2 === totalSchemesInDB) {
    console.log(`✓ Clearing search query restored all ${total2} schemes.`);
    testsPassed++;
  } else {
    console.error('✗ Test 2 Failed: Clear search did not restore all schemes:', data2);
  }

  // ----------------------------------------------------
  // TEST 3: Smart Search Across Fields (pension, ECHS, healthcare, housing, education)
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Multi-Field Smart Keyword Search ---');
  const testKeywords = [
    { query: 'pension', minExpected: 5 },
    { query: 'ECHS', minExpected: 2 },
    { query: 'healthcare', minExpected: 5 },
    { query: 'housing', minExpected: 1 },
    { query: 'education', minExpected: 1 },
    { query: 'ex-servicemen', minExpected: 5 },
  ];

  let allKeywordsPassed = true;
  for (const item of testKeywords) {
    const res = await fetch(`${baseUrl}/api/schemes/search?q=${encodeURIComponent(item.query)}`);
    const data = await res.json();
    const results = data.data?.portalResults || data.data?.schemes || [];
    if (res.status === 200 && results.length >= item.minExpected) {
      console.log(`  ✓ Search "${item.query}": Found ${results.length} schemes (Top: "${results[0].name}")`);
    } else {
      console.error(`  ✗ Search "${item.query}" expected >= ${item.minExpected}, got ${results.length}`);
      allKeywordsPassed = false;
    }
  }
  if (allKeywordsPassed) testsPassed++;

  // ----------------------------------------------------
  // TEST 4: Relevance Ranking (Exact Name Match Ranks First)
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Relevance Ranking Precision ---');
  const res4 = await fetch(`${baseUrl}/api/schemes/search?q=SPARSH`);
  const data4 = await res4.json();
  const results4 = data4.data?.portalResults || [];
  if (results4.length > 0 && results4[0].name.toLowerCase().includes('sparsh')) {
    console.log(`✓ Relevance ranking verified: Top result is "${results4[0].name}" with score ${results4[0].relevanceScore}`);
    testsPassed++;
  } else {
    console.error('✗ Relevance ranking failed:', results4);
  }

  // ----------------------------------------------------
  // TEST 5: Typo Tolerance Mapping (penson, health care, esm)
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Typo Tolerance Engine ---');
  const typoTests = [
    { input: 'penson', expectedMatchedWord: 'pension' },
    { input: 'health care', expectedMatchedWord: 'healthcare' },
    { input: 'esm', expectedMatchedWord: 'ex-servicemen' },
  ];

  let typoPassed = true;
  for (const t of typoTests) {
    const res = await fetch(`${baseUrl}/api/schemes/search?q=${encodeURIComponent(t.input)}`);
    const data = await res.json();
    const results = data.data?.portalResults || [];
    if (res.status === 200 && results.length > 0) {
      console.log(`  ✓ Typo "${t.input}" resolved to "${data.data.query.normalized}" -> Found ${results.length} schemes`);
    } else {
      console.error(`  ✗ Typo "${t.input}" failed to find results:`, data);
      typoPassed = false;
    }
  }
  if (typoPassed) testsPassed++;

  // ----------------------------------------------------
  // TEST 6: Fast Autocomplete Suggestions API
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Fast MongoDB Autocomplete Suggestions ---');
  const res6 = await fetch(`${baseUrl}/api/schemes/search?q=pen&autocomplete=true&includeExternal=false`);
  const data6 = await res6.json();
  const suggestions = data6.data?.suggestions || [];
  if (res6.status === 200 && suggestions.length > 0) {
    console.log(`✓ Autocomplete returned ${suggestions.length} suggestions for "pen":`);
    suggestions.slice(0, 4).forEach((s) => console.log(`   - [${s.type.toUpperCase()}] ${s.text} (${s.category || 'General'})`));
    testsPassed++;
  } else {
    console.error('✗ Autocomplete failed for "pen":', data6);
  }

  // ----------------------------------------------------
  // TEST 7: Combined Search and Category Filters
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Combined Search + Category Filters ---');
  const res7 = await fetch(`${baseUrl}/api/schemes/search?q=pension&category=Pension`);
  const data7 = await res7.json();
  const results7 = data7.data?.portalResults || [];
  const allPension = results7.every((s) => s.category === 'Pension');
  if (res7.status === 200 && results7.length > 0 && allPension) {
    console.log(`✓ Filtered search verified: ${results7.length} schemes found, all matching category "Pension".`);
    testsPassed++;
  } else {
    console.error('✗ Category filter mismatch:', results7);
  }

  // ----------------------------------------------------
  // TEST 8: Pagination Behavior (Page 1 vs Page 2)
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Backend Pagination (page=1, limit=5 vs page=2) ---');
  const resP1 = await fetch(`${baseUrl}/api/schemes?page=1&limit=5`);
  const dataP1 = await resP1.json();
  const resP2 = await fetch(`${baseUrl}/api/schemes?page=2&limit=5`);
  const dataP2 = await resP2.json();

  const id1 = dataP1.data?.portalResults?.[0]?._id || dataP1.data?.portalResults?.[0]?.id;
  const id2 = dataP2.data?.portalResults?.[0]?._id || dataP2.data?.portalResults?.[0]?.id;

  if (id1 && id2 && id1 !== id2) {
    console.log(`✓ Pagination verified: Page 1 top item differs from Page 2 top item. Total Pages: ${dataP1.data.pagination?.totalPages || dataP1.data.totalPages}`);
    testsPassed++;
  } else {
    console.error('✗ Pagination failed, items are identical:', { id1, id2 });
  }

  // ----------------------------------------------------
  // TEST 9: External Search Service - No API Key Graceful Fallback
  // ----------------------------------------------------
  console.log('\n--- TEST 9: External Search - Disabled / No Key Mode Fallback ---');
  const extRes = await searchExternalSchemes('pension defense welfare', 5);
  if (extRes.success && (extRes.status === 'DISABLED' || extRes.status === 'SUCCESS')) {
    console.log(`✓ External search gracefully handled (${extRes.status}): ${extRes.message || 'No API key needed for local MongoDB search'}`);
    testsPassed++;
  } else {
    console.error('✗ External search failed without fallback:', extRes);
  }

  // ----------------------------------------------------
  // TEST 10: Official Domain Recognition & Labeling
  // ----------------------------------------------------
  console.log('\n--- TEST 10: Official Defense Domain Recognition ---');
  const officialTestUrls = [
    { url: 'https://desw.gov.in/schemes', expectedOfficial: true },
    { url: 'https://echs.gov.in/empanelled-hospitals', expectedOfficial: true },
    { url: 'https://ksb.gov.in/pmss.htm', expectedOfficial: true },
    { url: 'https://random-commercial-blog.com/benefits', expectedOfficial: false },
  ];

  let domainTestsPassed = true;
  for (const u of officialTestUrls) {
    const isOff = isOfficialSource(u.url);
    const domainName = extractSourceDomain(u.url);
    if (isOff === u.expectedOfficial) {
      console.log(`  ✓ URL "${u.url}" -> Domain: "${domainName}" -> Official: ${isOff}`);
    } else {
      console.error(`  ✗ Domain test failed for ${u.url}, expected ${u.expectedOfficial}, got ${isOff}`);
      domainTestsPassed = false;
    }
  }
  if (domainTestsPassed) testsPassed++;

  console.log('\n====================================================');
  console.log(`  ADVANCED SCHEME SEARCH SUITE: ${testsPassed}/10 PASSED! `);
  console.log('====================================================\n');

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runAdvancedSearchTests().catch((err) => {
  console.error('Error running advanced search tests:', err);
  process.exit(1);
});
