import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import schemeRoutes from '../routes/scheme.routes.js';
import jobRoutes from '../routes/job.routes.js';
import authRoutes from '../routes/auth.routes.js';
import { Scheme } from '../models/Scheme.js';
import { Job } from '../models/Job.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/veterans_portal';

async function runLandingPageTests() {
  console.log('====================================================');
  console.log('  STARTING REDESIGNED LANDING PAGE API VERIFICATION  ');
  console.log('====================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(' Connected to MongoDB:', mongoose.connection.name);

  const app = express();
  app.use(express.json());
  app.use('/api/schemes', schemeRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/auth', authRoutes);

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

  let passedTests = 0;

  // TEST 1: Total Active Schemes Count API
  console.log('--- TEST 1: Schemes Catalog Stats for Hero & Snapshots ---');
  const schemesRes = await fetch(`${baseUrl}/api/schemes?limit=1`);
  const schemesData = await schemesRes.json();
  if (schemesRes.status === 200 && schemesData.success && schemesData.data?.total > 0) {
    console.log(`✓ Active Schemes loaded successfully: Total in DB = ${schemesData.data.total}`);
    passedTests++;
  } else {
    console.error('✗ Schemes count test failed:', schemesData);
  }

  // TEST 2: Featured Schemes API for Benefits Showcase
  console.log('\n--- TEST 2: Featured Schemes Showcase API ---');
  const featRes = await fetch(`${baseUrl}/api/schemes/featured`);
  const featData = await featRes.json();
  if (featRes.status === 200 && featData.success) {
    const count = featData.data?.schemes?.length || 0;
    console.log(`✓ Featured schemes retrieved: ${count} schemes`);
    if (count > 0) {
      console.log(`  Top Featured: "${featData.data.schemes[0].name}" (${featData.data.schemes[0].category})`);
    }
    passedTests++;
  } else {
    console.error('✗ Featured schemes test failed:', featData);
  }

  // TEST 3: Active Jobs API for Career Showcase
  console.log('\n--- TEST 3: Active Jobs Career Showcase API ---');
  const jobsRes = await fetch(`${baseUrl}/api/jobs?limit=3&status=ACTIVE`);
  const jobsData = await jobsRes.json();
  if (jobsRes.status === 200 && jobsData.success) {
    const jobsList = jobsData.data?.jobs || [];
    const totalCount = jobsData.data?.pagination?.total || jobsList.length;
    console.log(`✓ Active jobs retrieved: ${jobsList.length} items loaded (Total in DB: ${totalCount})`);
    if (jobsList.length > 0) {
      console.log(`  Sample Job: "${jobsList[0].title}" at ${jobsList[0].companyName} (${jobsList[0].location})`);
    }
    passedTests++;
  } else {
    console.error('✗ Jobs showcase test failed:', jobsData);
  }

  // TEST 4: Scheme Categories Routing Verification
  console.log('\n--- TEST 4: Category-Specific Scheme Filter APIs ---');
  const categories = ['Pension', 'Healthcare', 'Education', 'Housing'];
  let categoriesPassed = true;
  for (const cat of categories) {
    const catRes = await fetch(`${baseUrl}/api/schemes?category=${cat}&limit=3`);
    const catData = await catRes.json();
    if (catRes.status === 200 && catData.success) {
      console.log(`  ✓ Category "${cat}": ${catData.data?.total || 0} schemes found`);
    } else {
      categoriesPassed = false;
    }
  }
  if (categoriesPassed) passedTests++;

  console.log('\n====================================================');
  console.log(`  LANDING PAGE SUITE COMPLETED: ${passedTests}/4 PASSED!`);
  console.log('====================================================\n');

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runLandingPageTests().catch((err) => {
  console.error('Error running landing page tests:', err);
  process.exit(1);
});
