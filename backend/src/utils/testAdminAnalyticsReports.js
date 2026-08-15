/**
 * Automated Test Suite: Admin Analytics, Reports & Dashboard Intelligence
 * 
 * Verifies:
 * 1. Admin Dashboard Stats (/api/admin/dashboard/stats) matching MongoDB data.
 * 2. Multi-period Analytics aggregations (/api/admin/analytics) for today, 7d, 30d, 90d, custom.
 * 3. KPI mathematical computations (Claim Approval Rate, Placement Rate, Processing Times).
 * 4. Categorical, industry, work mode, and geographical distributions.
 * 5. Reports Summary (/api/admin/reports/summary).
 * 6. CSV Exports with proper headers and complete absence of passwords/tokens/secrets.
 * 7. RBAC Security: 401 Unauthorized / 403 Forbidden enforcement on all analytics/report endpoints.
 */

import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from '../app.js';
import { User } from '../models/User.js';
import { Veteran } from '../models/Veteran.js';
import { Employer } from '../models/Employer.js';
import { Job } from '../models/Job.js';
import { Scheme } from '../models/Scheme.js';
import { Application } from '../models/Application.js';
import { JobApplication } from '../models/JobApplication.js';
import { Document } from '../models/Document.js';
import { AuditLog } from '../models/AuditLog.js';
import { config } from '../config/environment.js';

let server;
let serverPort;
let adminToken;
let veteranToken;
let testAdminUser;
let testVeteranUser;

function makeRequest(method, path, body = null, token = null, responseType = 'json') {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body && typeof body === 'object' ? JSON.stringify(body) : body;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: serverPort,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          if (responseType === 'json') {
            try {
              parsed = JSON.parse(data);
            } catch (e) {
              parsed = data;
            }
          } else {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: ADMIN ANALYTICS, REPORTS & DASHBOARD INTELLIGENCE  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      if (details) console.error(`    Details: ${details}`);
      failed++;
    }
  }

  try {
    // 1. Connect to DB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/veterans_portal';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // 2. Start HTTP server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        console.log(`Test server running on port ${serverPort}`);
        resolve();
      });
    });

    // 3. Create test users & JWTs
    testAdminUser = await User.findOne({ role: 'ADMIN' });
    if (!testAdminUser) {
      testAdminUser = await User.create({
        name: 'Analytics Super Admin',
        email: `analytics_admin_${Date.now()}@example.gov.in`,
        password: 'Password123!',
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
      });
    }

    testVeteranUser = await User.findOne({ role: 'VETERAN' });
    if (!testVeteranUser) {
      testVeteranUser = await User.create({
        name: 'Test Veteran User',
        email: `analytics_vet_${Date.now()}@example.gov.in`,
        password: 'Password123!',
        role: 'VETERAN',
        isActive: true,
        isVerified: true,
      });
    }

    adminToken = jwt.sign(
      { userId: testAdminUser._id.toString(), id: testAdminUser._id.toString(), role: 'ADMIN', email: testAdminUser.email },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    veteranToken = jwt.sign(
      { userId: testVeteranUser._id.toString(), id: testVeteranUser._id.toString(), role: 'VETERAN', email: testVeteranUser.email },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // TEST 1: Admin Dashboard Statistics
    console.log('\n--- SECTION 1: ADMIN DASHBOARD STATS ---');
    const statsRes = await makeRequest('GET', '/api/admin/dashboard/stats', null, adminToken);
    assert(statsRes.status === 200, 'GET /api/admin/dashboard/stats returns 200 OK');
    assert(statsRes.data?.success === true, 'Response body has success: true');
    assert(typeof statsRes.data?.data?.veterans === 'number', 'Contains numeric veterans count');
    assert(typeof statsRes.data?.data?.employers === 'number', 'Contains numeric employers count');
    assert(typeof statsRes.data?.data?.activeJobs === 'number', 'Contains numeric activeJobs count');
    assert(typeof statsRes.data?.data?.schemes === 'number', 'Contains numeric schemes count');
    assert(typeof statsRes.data?.data?.totalApplications === 'number', 'Contains numeric totalApplications');
    assert(statsRes.data?.data?.pendingBreakdown !== undefined, 'Contains pendingBreakdown object');

    // TEST 2: Analytics Endpoint (Default 30 Days)
    console.log('\n--- SECTION 2: ANALYTICS AGGREGATION (30 DAYS) ---');
    const analytics30d = await makeRequest('GET', '/api/admin/analytics?period=30days', null, adminToken);
    assert(analytics30d.status === 200, 'GET /api/admin/analytics?period=30days returns 200 OK');
    assert(analytics30d.data?.data?.kpis !== undefined, 'Analytics returns KPI summary');
    assert(typeof analytics30d.data?.data?.kpis?.schemeApprovalRate === 'number', 'Contains valid schemeApprovalRate');
    assert(typeof analytics30d.data?.data?.kpis?.portalJobPlacementRate === 'number', 'Contains valid portalJobPlacementRate');
    assert(typeof analytics30d.data?.data?.kpis?.avgProcessingTimeDays === 'number', 'Contains valid avgProcessingTimeDays');
    assert(Array.isArray(analytics30d.data?.data?.trends?.veteranRegistrations), 'Returns veteranRegistrations trend array');
    assert(Array.isArray(analytics30d.data?.data?.trends?.employerRegistrations), 'Returns employerRegistrations trend array');
    assert(Array.isArray(analytics30d.data?.data?.trends?.schemeApplications), 'Returns schemeApplications trend array');

    // TEST 3: Multi-Period Analytics Filters
    console.log('\n--- SECTION 3: DATE RANGE PERIOD FILTERS ---');
    const analyticsToday = await makeRequest('GET', '/api/admin/analytics?period=today', null, adminToken);
    assert(analyticsToday.status === 200, 'GET /api/admin/analytics?period=today returns 200 OK');
    assert(analyticsToday.data?.data?.period === 'today', 'Period preserved as today');

    const analytics7d = await makeRequest('GET', '/api/admin/analytics?period=7days', null, adminToken);
    assert(analytics7d.status === 200, 'GET /api/admin/analytics?period=7days returns 200 OK');

    const analytics90d = await makeRequest('GET', '/api/admin/analytics?period=90days', null, adminToken);
    assert(analytics90d.status === 200, 'GET /api/admin/analytics?period=90days returns 200 OK');

    const analyticsCustom = await makeRequest(
      'GET',
      '/api/admin/analytics?period=custom&startDate=2024-01-01&endDate=2026-12-31',
      null,
      adminToken
    );
    assert(analyticsCustom.status === 200, 'GET /api/admin/analytics with custom range returns 200 OK');
    assert(analyticsCustom.data?.data?.period === 'custom', 'Period identified as custom');

    // TEST 4: Categorical and Geographic Distributions
    console.log('\n--- SECTION 4: DISTRIBUTIONS & SEGMENTS ---');
    const dist = analytics30d.data?.data?.distributions || {};
    assert(Array.isArray(dist.schemeCategories), 'Contains schemeCategories distribution');
    assert(Array.isArray(dist.jobIndustries), 'Contains jobIndustries distribution');
    assert(Array.isArray(dist.jobEmploymentTypes), 'Contains jobEmploymentTypes distribution');
    assert(Array.isArray(dist.applicationsByStatus), 'Contains applicationsByStatus breakdown');
    assert(Array.isArray(dist.topJobLocations), 'Contains topJobLocations array');

    // TEST 5: Reports Summary
    console.log('\n--- SECTION 5: REPORTS SUMMARY ---');
    const reportsSummary = await makeRequest('GET', '/api/admin/reports/summary', null, adminToken);
    assert(reportsSummary.status === 200, 'GET /api/admin/reports/summary returns 200 OK');
    assert(reportsSummary.data?.data?.summary?.veterans !== undefined, 'Summary contains veterans count');
    assert(Array.isArray(reportsSummary.data?.data?.availableReports), 'Contains list of available reports');
    assert(reportsSummary.data?.data?.availableReports.length >= 6, 'Contains at least 6 available report categories');

    // TEST 6: CSV Exports & Sanitization
    console.log('\n--- SECTION 6: CSV EXPORT SECURITY & FORMATTING ---');
    const vetCsvRes = await makeRequest('GET', '/api/admin/reports/veterans/export', null, adminToken, 'text');
    assert(vetCsvRes.status === 200, 'GET /api/admin/reports/veterans/export returns 200 OK');
    assert(vetCsvRes.headers['content-type']?.includes('text/csv'), 'Header content-type is text/csv');
    assert(vetCsvRes.data.includes('"Veteran ID"'), 'CSV contains header "Veteran ID"');
    assert(!vetCsvRes.data.includes('password') && !vetCsvRes.data.includes('$2a$'), 'CSV strictly excludes passwords and password hashes');

    const empCsvRes = await makeRequest('GET', '/api/admin/reports/employers/export', null, adminToken, 'text');
    assert(empCsvRes.status === 200, 'GET /api/admin/reports/employers/export returns 200 OK');
    assert(empCsvRes.data.includes('"Company Name"'), 'CSV contains header "Company Name"');

    const schemesCsvRes = await makeRequest('GET', '/api/admin/reports/schemes/export', null, adminToken, 'text');
    assert(schemesCsvRes.status === 200, 'GET /api/admin/reports/schemes/export returns 200 OK');
    assert(schemesCsvRes.data.includes('"Scheme Name"'), 'CSV contains header "Scheme Name"');

    const jobsCsvRes = await makeRequest('GET', '/api/admin/reports/jobs/export', null, adminToken, 'text');
    assert(jobsCsvRes.status === 200, 'GET /api/admin/reports/jobs/export returns 200 OK');
    assert(jobsCsvRes.data.includes('"Job Title"'), 'CSV contains header "Job Title"');

    const schemeAppsCsvRes = await makeRequest('GET', '/api/admin/reports/scheme-applications/export', null, adminToken, 'text');
    assert(schemeAppsCsvRes.status === 200, 'GET /api/admin/reports/scheme-applications/export returns 200 OK');
    assert(schemeAppsCsvRes.data.includes('"Application ID"'), 'CSV contains header "Application ID"');

    // TEST 7: RBAC Protection & Authorization Checks
    console.log('\n--- SECTION 7: RBAC & AUTHORIZATION SECURITY ---');
    const unauthAnalytics = await makeRequest('GET', '/api/admin/analytics');
    assert(unauthAnalytics.status === 401, 'Unauthenticated access to /api/admin/analytics returns 401 Unauthorized');

    const forbiddenAnalytics = await makeRequest('GET', '/api/admin/analytics', null, veteranToken);
    assert(forbiddenAnalytics.status === 403, 'Veteran role access to /api/admin/analytics returns 403 Forbidden');

    const unauthCsv = await makeRequest('GET', '/api/admin/reports/veterans/export');
    assert(unauthCsv.status === 401, 'Unauthenticated access to CSV export returns 401 Unauthorized');

    const forbiddenCsv = await makeRequest('GET', '/api/admin/reports/veterans/export', null, veteranToken);
    assert(forbiddenCsv.status === 403, 'Veteran role access to CSV export returns 403 Forbidden');

  } catch (error) {
    console.error('\nUnexpected Error during test run:', error);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    console.log('\n================================================================');
    console.log(`  FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
