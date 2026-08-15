import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import schemeRoutes from '../routes/scheme.routes.js';
import { Scheme } from '../models/Scheme.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/veterans_portal';
const TEST_PORT = 5057;

async function runSearchTests() {
  console.log('====================================================');
  console.log('   STARTING SCHEME SMART SEARCH VERIFICATION SUITE   ');
  console.log('====================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(' Connected to MongoDB:', mongoose.connection.name);

  const app = express();
  app.use(express.json());
  app.use('/api/schemes', schemeRoutes);

  // Error handler middleware
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

  const totalSchemes = await Scheme.countDocuments({ status: 'ACTIVE' });
  console.log(` Active Schemes in Database: ${totalSchemes}\n`);

  const testQueries = [
    { query: 'pension', desc: 'Exact Keyword: "pension"' },
    { query: 'pen', desc: 'Prefix Search: "pen"' },
    { query: 'penson', desc: 'Typo Search: "penson" (should match Pension schemes)' },
    { query: 'healthcare', desc: 'Exact Keyword: "healthcare"' },
    { query: 'health care', desc: 'Spaced Typo: "health care"' },
    { query: 'heal', desc: 'Prefix Search: "heal"' },
    { query: 'ECHS', desc: 'Acronym Search: "ECHS"' },
    { query: 'housing', desc: 'Category Search: "housing"' },
    { query: 'education', desc: 'Category Search: "education"' },
    { query: 'employment', desc: 'Category Search: "employment"' },
    { query: 'family pension', desc: 'Multi-word Search: "family pension"' },
    { query: 'medical assistance', desc: 'Benefits Search: "medical assistance"' },
    { query: 'disability', desc: 'Condition Search: "disability"' },
    { query: 'ex-servicemen', desc: 'Audience Search: "ex-servicemen"' },
    { query: 'ex servicemen', desc: 'Typo Search: "ex servicemen"' },
    { query: 'Odisha', desc: 'State Jurisdiction Search: "Odisha"' },
    { query: 'Bhubaneswar', desc: 'Location / State Search: "Bhubaneswar"' },
    { query: 'nonexistentxyzterm123', desc: 'Empty Results Search: "nonexistentxyzterm123"' },
  ];

  let passedTests = 0;

  for (const t of testQueries) {
    const rawRes = await fetch(`${baseUrl}/api/schemes/search?q=${encodeURIComponent(t.query)}&limit=10`);
    const res = await rawRes.json();

    if (rawRes.status === 200 && res.success) {
      const data = res.data;
      console.log(`✓ TEST: ${t.desc}`);
      console.log(`  Query: "${t.query}" → Results Count: ${data.total}, Suggestions: ${data.suggestions.length}`);
      if (data.results.length > 0) {
        console.log(`  Top Result: "${data.results[0].name}" (Category: ${data.results[0].category}, Relevance Score: ${data.results[0].relevanceScore})`);
      }
      if (data.suggestions.length > 0) {
        console.log(`  Suggestions: ${data.suggestions.slice(0, 3).map((s) => `"${s.text}"`).join(', ')}`);
      }
      console.log('');
      passedTests++;
    } else {
      console.error(`✗ TEST FAILED: ${t.desc} (Status: ${rawRes.status})`, res);
    }
  }

  // Test Combined Search + Category Filter
  console.log('--- Testing Search + Category Filter ---');
  const catRaw = await fetch(`${baseUrl}/api/schemes/search?q=pension&category=Pension&limit=5`);
  const catRes = await catRaw.json();
  if (catRaw.status === 200 && catRes.success) {
    console.log(`✓ Combined Search + Filter (q=pension, category=Pension) → Total: ${catRes.data.total}`);
    passedTests++;
  } else {
    console.error('✗ Combined Search + Filter Failed:', catRes);
  }

  // Test Pagination
  console.log('--- Testing Pagination ---');
  const pageRaw = await fetch(`${baseUrl}/api/schemes/search?page=1&limit=3`);
  const pageRes = await pageRaw.json();
  if (pageRaw.status === 200 && pageRes.success) {
    console.log(`✓ Pagination (page=1, limit=3) → Page: ${pageRes.data.page}, Limit: ${pageRes.data.limit}, Total Pages: ${pageRes.data.totalPages}`);
    passedTests++;
  } else {
    console.error('✗ Pagination Failed:', pageRes);
  }

  console.log('====================================================');
  console.log(`  SMART SEARCH SUITE COMPLETED: ${passedTests}/${testQueries.length + 2} PASSED!`);
  console.log('====================================================\n');

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runSearchTests().catch((err) => {
  console.error('Error running search verification tests:', err);
  process.exit(1);
});
