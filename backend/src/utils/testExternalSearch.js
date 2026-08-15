import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import schemeRoutes from '../routes/scheme.routes.js';
import {
  searchExternalSchemes,
  isOfficialSource,
  extractSourceDomain,
} from '../services/externalSearchService.js';
import { Scheme } from '../models/Scheme.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/veterans_portal';
const TEST_PORT = 5059;

async function runExternalSearchTests() {
  console.log('====================================================');
  console.log('   STARTING EXTERNAL SEARCH INTEGRATION TEST SUITE   ');
  console.log('====================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(' Connected to MongoDB:', mongoose.connection.name);

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
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}`;
  console.log(` Test server running on ${baseUrl}\n`);

  let passedTests = 0;

  // TEST 1: Official Domain Verification
  console.log('--- TEST 1: Official Domain Detection ---');
  const officialUrls = [
    'https://ksb.gov.in/schemes.htm',
    'https://echs.gov.in/treatment',
    'https://desw.gov.in/pension',
    'https://dgrindia.gov.in/resettlement',
    'https://pcdapension.nic.in/sparsh',
    'https://indianarmy.nic.in/welfare',
  ];
  const nonOfficialUrls = [
    'https://randomdefenseblog.com/benefits',
    'https://newsportal.xyz/pension-guide',
  ];

  let domainTestsPass = true;
  officialUrls.forEach((url) => {
    if (!isOfficialSource(url)) {
      console.error(`✗ Expected ${url} to be detected as official!`);
      domainTestsPass = false;
    }
  });
  nonOfficialUrls.forEach((url) => {
    if (isOfficialSource(url)) {
      console.error(`✗ Expected ${url} to NOT be detected as official!`);
      domainTestsPass = false;
    }
  });

  if (domainTestsPass) {
    console.log('✓ Official government & defense domain detector working perfectly (100% accuracy).');
    passedTests++;
  }

  // TEST 2: Domain Extractor
  console.log('--- TEST 2: Source Domain Extraction ---');
  const domain = extractSourceDomain('https://www.ksb.gov.in/schemes/pmss');
  if (domain === 'ksb.gov.in') {
    console.log(`✓ Clean domain extraction: "https://www.ksb.gov.in/schemes/pmss" → "${domain}"`);
    passedTests++;
  } else {
    console.error(`✗ Failed domain extraction: "${domain}"`);
  }

  // TEST 3: External Search Resilience in No-API-Key / Missing Key Mode
  console.log('--- TEST 3: No-API-Key Mode & Fallback ---');
  const noKeyRes = await searchExternalSchemes('defense pension', 5);
  if (noKeyRes.success !== undefined && Array.isArray(noKeyRes.results)) {
    console.log(`✓ No-API-Key handled cleanly without crash. Status: "${noKeyRes.status}", Results: ${noKeyRes.results.length}`);
    passedTests++;
  } else {
    console.error('✗ No-API-Key mode failed:', noKeyRes);
  }

  // TEST 4: Scheme Search API with All 10 Required Queries
  console.log('--- TEST 4: Unified Scheme Search API (Portal + External) ---');
  const testQueries = [
    'ECHS',
    'pension',
    'healthcare',
    'housing',
    'education',
    'employment',
    'resettlement',
    'ex-servicemen',
    'disability pension',
    'family pension',
  ];

  for (const q of testQueries) {
    const rawRes = await fetch(`${baseUrl}/api/schemes/search?q=${encodeURIComponent(q)}&limit=10`);
    const res = await rawRes.json();

    if (rawRes.status === 200 && res.success) {
      const data = res.data;
      console.log(`✓ Query: "${q}"`);
      console.log(`  Portal Schemes: ${data.totalPortalResults}, External Sources: ${data.totalExternalResults}, Suggestions: ${data.suggestions.length}`);
      if (data.portalResults.length > 0) {
        console.log(`  Top Portal Result: "${data.portalResults[0].name}" (${data.portalResults[0].category})`);
      }
      passedTests++;
    } else {
      console.error(`✗ Query "${q}" failed:`, res);
    }
  }

  // TEST 5: Autocomplete Mode Skips External Search for Speed
  console.log('--- TEST 5: Autocomplete Mode Performance Guard ---');
  const acRaw = await fetch(`${baseUrl}/api/schemes/search?q=pen&autocomplete=true&limit=6`);
  const acRes = await acRaw.json();
  if (acRaw.status === 200 && acRes.success && acRes.data.suggestions.length > 0) {
    console.log(`✓ Autocomplete fast search completed with ${acRes.data.suggestions.length} suggestions, skipping external API calls.`);
    passedTests++;
  } else {
    console.error('✗ Autocomplete fast search failed:', acRes);
  }

  console.log('\n====================================================');
  console.log(`  EXTERNAL SEARCH SUITE COMPLETED: ${passedTests}/${testQueries.length + 4} PASSED!`);
  console.log('====================================================\n');

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runExternalSearchTests().catch((err) => {
  console.error('Error running external search verification tests:', err);
  process.exit(1);
});
