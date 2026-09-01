/**
 * PRODUCTION MODE VERIFICATION TEST
 * 
 * Verifies backend behavior under NODE_ENV=production:
 * 1. Health check endpoint returns status "ok" and database "connected"
 * 2. Stack traces are strictly suppressed in error responses
 * 3. CORS blocks arbitrary unapproved foreign origins in production
 * 4. CORS allows approved FRONTEND_URL
 * 5. Production API routes operate correctly
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

// Force production environment for this test
process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = 'https://veterans-portal.gov.in';

import app from '../app.js';
import { config } from '../config/environment.js';
import { User } from '../models/User.js';
import { Scheme } from '../models/Scheme.js';

let server;
let serverPort;

function makeRequest(method, path, body = null, token = null, responseType = 'json', customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let payload;
    if (body && typeof body === 'object') {
      payload = JSON.stringify(body);
      headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (body) {
      payload = String(body);
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

async function runProductionTests() {
  console.log('========================================================================');
  console.log('  DEPLOYMENT PHASE 1: PRODUCTION-MODE LOCAL VERIFICATION TEST           ');
  console.log('========================================================================\n');

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
    // 1. Connect DB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/veterans_portal';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        console.log(`[Production Test Server] Live on http://localhost:${serverPort}\n`);
        resolve();
      });
    });

    // 2. Test GET /api/health
    const healthRes = await makeRequest('GET', '/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
    assert(healthRes.data?.status === 'ok', 'Health response status is "ok"');
    assert(healthRes.data?.database === 'connected', 'Database reported as "connected"');
    assert(!JSON.stringify(healthRes.data).includes('mongodb'), 'Health check does not expose MongoDB URI');

    // 3. Test Production Error Stack Trace Suppression
    const errorRes = await makeRequest('GET', '/api/schemes/invalid-non-id-format');
    assert(errorRes.status === 400 || errorRes.status === 404, 'Error endpoint returns 400/404');
    assert(errorRes.data?.stack === undefined, 'Error response does NOT include stack trace in production');

    // 4. Test Production CORS with Approved Origin
    const approvedCorsRes = await makeRequest('OPTIONS', '/api/schemes', null, null, 'text', {
      'Origin': 'https://veterans-portal.gov.in',
      'Access-Control-Request-Method': 'GET',
    });
    assert(
      approvedCorsRes.headers['access-control-allow-origin'] === 'https://veterans-portal.gov.in',
      'CORS permits approved production FRONTEND_URL'
    );

    // 5. Test Production CORS Rejection for Unauthorized Origin
    const blockedCorsRes = await makeRequest('GET', '/api/schemes', null, null, 'json', {
      'Origin': 'https://malicious-phishing-site.com',
    });
    assert(
      blockedCorsRes.status === 500 || blockedCorsRes.status === 403 || !blockedCorsRes.headers['access-control-allow-origin'],
      'CORS rejects unauthorized foreign origin in production'
    );

    // 6. Test Core API Functionality in Production Mode
    // Schemes Listing
    const schemesRes = await makeRequest('GET', '/api/schemes?limit=5');
    assert(schemesRes.status === 200, 'Production Schemes API returns 200 OK');

    // Jobs Listing
    const jobsRes = await makeRequest('GET', '/api/jobs?limit=5');
    assert(jobsRes.status === 200, 'Production Jobs API returns 200 OK');

    // Auth Login Validation
    const invalidAuthRes = await makeRequest('POST', '/api/auth/login', {
      email: 'nonexistent_test@example.com',
      password: 'RandomPassword123!',
    });
    assert(invalidAuthRes.status === 401, 'Production Auth rejects invalid login safely (401 Unauthorized)');

  } catch (err) {
    console.error('Production Test Error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    console.log('\n========================================================================');
    console.log(`  PRODUCTION MODE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runProductionTests();
