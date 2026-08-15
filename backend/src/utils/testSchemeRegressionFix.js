import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import schemeRoutes from '../routes/scheme.routes.js';
import { Scheme } from '../models/Scheme.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/veterans_portal';
const TEST_PORT = 5061;

async function runRegressionTests() {
  console.log('====================================================');
  console.log('   STARTING SCHEME EMPTY SEARCH REGRESSION TEST      ');
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
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(` Test server running on ${baseUrl}\n`);

  const totalSchemesInDb = await Scheme.countDocuments({ status: 'ACTIVE' });
  console.log(` Active Schemes in Database: ${totalSchemesInDb}\n`);

  let testsPassed = 0;

  // TEST 1: Initial Page Load (Empty query)
  console.log('--- TEST 1: Initial /schemes load (empty query) ---');
  const res1 = await fetch(`${baseUrl}/api/schemes?page=1&limit=9`);
  const data1 = await res1.json();
  if (data1.success && data1.data?.total > 0 && data1.data?.schemes?.length > 0) {
    console.log(`✓ Initial load returned ${data1.data.schemes.length} schemes on Page 1 (Total in DB: ${data1.data.total}).`);
    testsPassed++;
  } else {
    console.error('✗ TEST 1 Failed: Returned 0 schemes on initial load!', data1);
  }

  // TEST 2: Search "pension"
  console.log('\n--- TEST 2: Search "pension" ---');
  const res2 = await fetch(`${baseUrl}/api/schemes/search?q=pension&limit=9`);
  const data2 = await res2.json();
  if (data2.success && data2.data?.totalPortalResults > 0) {
    console.log(`✓ Search "pension" returned ${data2.data.totalPortalResults} schemes (Top: "${data2.data.portalResults[0].name}").`);
    testsPassed++;
  } else {
    console.error('✗ TEST 2 Failed:', data2);
  }

  // TEST 3: Search "ECHS"
  console.log('\n--- TEST 3: Search "ECHS" ---');
  const res3 = await fetch(`${baseUrl}/api/schemes/search?q=ECHS&limit=9`);
  const data3 = await res3.json();
  if (data3.success && data3.data?.totalPortalResults > 0) {
    console.log(`✓ Search "ECHS" returned ${data3.data.totalPortalResults} schemes (Top: "${data3.data.portalResults[0].name}").`);
    testsPassed++;
  } else {
    console.error('✗ TEST 3 Failed:', data3);
  }

  // TEST 4: Clear Search (Empty q on search endpoint)
  console.log('\n--- TEST 4: Clear Search (q="") ---');
  const res4 = await fetch(`${baseUrl}/api/schemes/search?q=&limit=9`);
  const data4 = await res4.json();
  if (data4.success && data4.data?.totalPortalResults === totalSchemesInDb) {
    console.log(`✓ Clearing search restored all ${data4.data.totalPortalResults} schemes.`);
    testsPassed++;
  } else {
    console.error('✗ TEST 4 Failed: Expected total schemes to match DB count!', data4);
  }

  // TEST 5: Invalid search term (xyzabc123)
  console.log('\n--- TEST 5: Invalid search term "xyzabc123" ---');
  const res5 = await fetch(`${baseUrl}/api/schemes/search?q=xyzabc123&limit=9`);
  const data5 = await res5.json();
  if (data5.success && data5.data?.totalPortalResults === 0) {
    console.log(`✓ Invalid search correctly returned 0 results.`);
    testsPassed++;
  } else {
    console.error('✗ TEST 5 Failed:', data5);
  }

  // TEST 6: Category Filter (Healthcare) with empty search
  console.log('\n--- TEST 6: Category Filter "Healthcare" (empty search) ---');
  const res6 = await fetch(`${baseUrl}/api/schemes?category=Healthcare&limit=9`);
  const data6 = await res6.json();
  if (data6.success && data6.data?.total > 0 && data6.data.schemes.every((s) => s.category === 'Healthcare')) {
    console.log(`✓ Healthcare category filter returned ${data6.data.total} schemes.`);
    testsPassed++;
  } else {
    console.error('✗ TEST 6 Failed:', data6);
  }

  // TEST 7: Jurisdiction Filter (Odisha) with empty search
  console.log('\n--- TEST 7: Jurisdiction Filter "Odisha" (empty search) ---');
  const res7 = await fetch(`${baseUrl}/api/schemes?state=Odisha&limit=9`);
  const data7 = await res7.json();
  if (data7.success && data7.data?.total > 0) {
    console.log(`✓ Odisha jurisdiction filter returned ${data7.data.total} schemes.`);
    testsPassed++;
  } else {
    console.error('✗ TEST 7 Failed:', data7);
  }

  // TEST 8: Combined Search + Category Filter ("pension" + Category "Pension")
  console.log('\n--- TEST 8: Combined Search + Category Filter ---');
  const res8 = await fetch(`${baseUrl}/api/schemes/search?q=pension&category=Pension&limit=9`);
  const data8 = await res8.json();
  if (data8.success && data8.data?.totalPortalResults > 0 && data8.data.portalResults.every((s) => s.category === 'Pension')) {
    console.log(`✓ Combined search + filter returned ${data8.data.totalPortalResults} schemes.`);
    testsPassed++;
  } else {
    console.error('✗ TEST 8 Failed:', data8);
  }

  console.log('\n====================================================');
  console.log(`  REGRESSION TEST SUITE: ${testsPassed}/8 PASSED! `);
  console.log('====================================================\n');

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runRegressionTests().catch((err) => {
  console.error('Error running regression tests:', err);
  process.exit(1);
});
