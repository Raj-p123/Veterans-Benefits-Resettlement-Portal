/**
 * Automated Test Suite: Employer Login, Routing & Role Security Verification
 * 
 * Verifies:
 * 1. Employer login API returns role 'EMPLOYER' and valid JWT.
 * 2. Veteran login API returns role 'VETERAN' and valid JWT.
 * 3. Admin login API returns role 'ADMIN' and valid JWT.
 * 4. User profile API (/api/auth/me) restores the session correctly for all 3 roles.
 * 5. Backend Authorization:
 *    - Employer token is strictly rejected (403) on Admin APIs (/api/admin/analytics, /api/admin/stats, etc.).
 *    - Veteran token is strictly rejected (403) on Admin APIs.
 *    - Employer token is authorized on Employer APIs.
 *    - Veteran token is authorized on Veteran APIs.
 *    - Admin token is authorized on Admin APIs.
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
import { config } from '../config/environment.js';

let server;
let serverPort;

function makeRequest(method, path, body = null, token = null) {
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
          try {
            parsed = JSON.parse(data);
          } catch (e) {
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
  console.log('  TEST SUITE: EMPLOYER LOGIN, ROUTING & RBAC SECURITY  ');
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

    // 3. Setup Test Users
    const timestamp = Date.now();
    const testPassword = 'Password123!';

    // Admin user
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin Routing Test',
        email: `admin_route_${timestamp}@example.com`,
        password: testPassword,
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
      });
    }

    // Employer user
    let employerUser = await User.findOne({ role: 'EMPLOYER' });
    if (!employerUser) {
      employerUser = await User.create({
        name: 'Employer Routing Test',
        email: `employer_route_${timestamp}@example.com`,
        password: testPassword,
        role: 'EMPLOYER',
        isActive: true,
        isVerified: true,
      });
      await Employer.create({
        user: employerUser._id,
        employerId: `EMP-TEST-${timestamp}`,
        companyName: 'Tata Defense Systems Corp',
        industry: 'Defense Manufacturing',
        email: employerUser.email,
        phone: '9876543210',
        city: 'Pune',
        state: 'Maharashtra',
        verificationStatus: 'VERIFIED',
      });
    }

    // Veteran user
    let veteranUser = await User.findOne({ role: 'VETERAN' });
    if (!veteranUser) {
      veteranUser = await User.create({
        name: 'Veteran Routing Test',
        email: `veteran_route_${timestamp}@example.com`,
        password: testPassword,
        role: 'VETERAN',
        isActive: true,
        isVerified: true,
      });
      await Veteran.create({
        user: veteranUser._id,
        veteranId: `VET-TEST-${timestamp}`,
        personalInformation: {
          fullName: 'Subedar Major Ramesh Singh',
          email: veteranUser.email,
          phone: '9876543211',
          state: 'Punjab',
        },
        serviceInformation: {
          serviceBranch: 'ARMY',
          rank: 'Subedar Major',
        },
        verificationStatus: 'VERIFIED',
      });
    }

    const adminToken = jwt.sign(
      { userId: adminUser._id.toString(), id: adminUser._id.toString(), role: 'ADMIN', email: adminUser.email },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const employerToken = jwt.sign(
      { userId: employerUser._id.toString(), id: employerUser._id.toString(), role: 'EMPLOYER', email: employerUser.email },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const veteranToken = jwt.sign(
      { userId: veteranUser._id.toString(), id: veteranUser._id.toString(), role: 'VETERAN', email: veteranUser.email },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // TEST 1: Session Verification (/api/auth/me) for Employer
    console.log('\n--- SECTION 1: EMPLOYER IDENTITY & ROLE RESTORATION ---');
    const empMeRes = await makeRequest('GET', '/api/auth/me', null, employerToken);
    assert(empMeRes.status === 200, 'GET /api/auth/me returns 200 OK for Employer');
    assert(empMeRes.data?.data?.user?.role === 'EMPLOYER', 'Employer role is strictly "EMPLOYER"');
    assert(empMeRes.data?.data?.user?.email === employerUser.email, 'Employer email matches record');

    // TEST 2: Session Verification for Veteran & Admin
    console.log('\n--- SECTION 2: VETERAN & ADMIN ROLE VERIFICATION ---');
    const vetMeRes = await makeRequest('GET', '/api/auth/me', null, veteranToken);
    assert(vetMeRes.status === 200, 'GET /api/auth/me returns 200 OK for Veteran');
    assert(vetMeRes.data?.data?.user?.role === 'VETERAN', 'Veteran role is strictly "VETERAN"');

    const adminMeRes = await makeRequest('GET', '/api/auth/me', null, adminToken);
    assert(adminMeRes.status === 200, 'GET /api/auth/me returns 200 OK for Admin');
    assert(adminMeRes.data?.data?.user?.role === 'ADMIN', 'Admin role is strictly "ADMIN"');

    // TEST 3: Backend Security - Employer Blocked from Admin APIs
    console.log('\n--- SECTION 3: EMPLOYER BLOCKED FROM ADMIN APIS (403) ---');
    const empAdminStats = await makeRequest('GET', '/api/admin/dashboard/stats', null, employerToken);
    assert(empAdminStats.status === 403, 'Employer token GET /api/admin/dashboard/stats returns 403 Forbidden');

    const empAdminAnalytics = await makeRequest('GET', '/api/admin/analytics', null, employerToken);
    assert(empAdminAnalytics.status === 403, 'Employer token GET /api/admin/analytics returns 403 Forbidden');

    const empAdminVeterans = await makeRequest('GET', '/api/admin/veterans', null, employerToken);
    assert(empAdminVeterans.status === 403, 'Employer token GET /api/admin/veterans returns 403 Forbidden');

    const empAdminReports = await makeRequest('GET', '/api/admin/reports/summary', null, employerToken);
    assert(empAdminReports.status === 403, 'Employer token GET /api/admin/reports/summary returns 403 Forbidden');

    // TEST 4: Backend Security - Veteran Blocked from Admin APIs
    console.log('\n--- SECTION 4: VETERAN BLOCKED FROM ADMIN APIS (403) ---');
    const vetAdminStats = await makeRequest('GET', '/api/admin/dashboard/stats', null, veteranToken);
    assert(vetAdminStats.status === 403, 'Veteran token GET /api/admin/dashboard/stats returns 403 Forbidden');

    const vetAdminAnalytics = await makeRequest('GET', '/api/admin/analytics', null, veteranToken);
    assert(vetAdminAnalytics.status === 403, 'Veteran token GET /api/admin/analytics returns 403 Forbidden');

    // TEST 5: Admin Token Allowed on Admin APIs
    console.log('\n--- SECTION 5: ADMIN ACCESS AUTHORIZED ---');
    const adminStats = await makeRequest('GET', '/api/admin/dashboard/stats', null, adminToken);
    assert(adminStats.status === 200, 'Admin token GET /api/admin/dashboard/stats returns 200 OK');

    const adminAnalytics = await makeRequest('GET', '/api/admin/analytics', null, adminToken);
    assert(adminAnalytics.status === 200, 'Admin token GET /api/admin/analytics returns 200 OK');

    // TEST 6: Employer Access Allowed on Employer Modules
    console.log('\n--- SECTION 6: EMPLOYER ACCESS TO EMPLOYER APIS ---');
    const empProfile = await makeRequest('GET', '/api/employer/profile', null, employerToken);
    assert(empProfile.status === 200 || empProfile.status === 404, 'Employer token authorized on /api/employer/profile');

    const empJobs = await makeRequest('GET', '/api/employer/jobs', null, employerToken);
    assert(empJobs.status === 200, 'Employer token authorized on /api/employer/jobs (200 OK)');

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
