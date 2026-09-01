/**
 * UNIFIED RENDER WEB SERVICE VERIFICATION TEST
 * 
 * Verifies that the single Express server serves BOTH:
 * 1. React/Vite frontend SPA from frontend/dist (on /, /login, /dashboard, etc.)
 * 2. Backend REST API on /api/* (with clean JSON responses and JSON 404 for undefined /api routes)
 * 3. Static assets from frontend/dist
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from '../app.js';

let server;
let serverPort;

function requestRaw(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: serverPort,
        path,
        method,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runVerification() {
  console.log('========================================================================');
  console.log('  TESTING UNIFIED RENDER WEB SERVICE (FRONTEND + BACKEND)               ');
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
    // 1. Connect MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/veterans_portal';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    assert(mongoose.connection.readyState === 1, 'MongoDB connection ready');

    // 2. Verify frontend/dist/index.html exists on disk
    const distPath = path.resolve(__dirname, '../../../frontend/dist');
    const indexPath = path.join(distPath, 'index.html');
    assert(fs.existsSync(distPath), 'frontend/dist directory exists');
    assert(fs.existsSync(indexPath), 'frontend/dist/index.html exists');

    // 3. Start Live Server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        console.log(`  Unified Server listening on http://localhost:${serverPort}\n`);
        resolve();
      });
    });

    // 4. Test Root Route (GET /) serves React SPA HTML
    const rootRes = await requestRaw('GET', '/');
    assert(rootRes.status === 200, 'GET / returns 200 OK');
    assert(
      rootRes.headers['content-type']?.includes('text/html'),
      'GET / returns text/html content type'
    );
    assert(
      rootRes.body.includes('<div id="root">') || rootRes.body.includes('<!DOCTYPE html>') || rootRes.body.includes('<script type="module"'),
      'GET / contains React HTML bundle entry point'
    );

    // 5. Test React SPA Client-Side Routes (GET /login, /veteran/dashboard, /schemes)
    const loginRes = await requestRaw('GET', '/login');
    assert(loginRes.status === 200, 'GET /login returns 200 OK');
    assert(loginRes.headers['content-type']?.includes('text/html'), 'GET /login returns React index.html');

    const dashboardRes = await requestRaw('GET', '/veteran/dashboard');
    assert(dashboardRes.status === 200, 'GET /veteran/dashboard returns 200 OK');
    assert(dashboardRes.headers['content-type']?.includes('text/html'), 'GET /veteran/dashboard returns React index.html');

    const schemesParamRes = await requestRaw('GET', '/schemes?category=Pension');
    assert(schemesParamRes.status === 200, 'GET /schemes?category=Pension returns 200 OK');
    assert(schemesParamRes.headers['content-type']?.includes('text/html'), 'GET /schemes returns React index.html');

    // 6. Test Backend API Routes (GET /api/health)
    const healthRes = await requestRaw('GET', '/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
    assert(healthRes.headers['content-type']?.includes('application/json'), 'GET /api/health returns application/json');
    const healthData = JSON.parse(healthRes.body);
    assert(healthData.status === 'ok', 'Health status is "ok"');
    assert(healthData.database === 'connected', 'Health database is "connected"');

    // 7. Test Backend Schemes API (GET /api/schemes?limit=2)
    const apiSchemesRes = await requestRaw('GET', '/api/schemes?limit=2');
    assert(apiSchemesRes.status === 200, 'GET /api/schemes returns 200 OK JSON');
    assert(apiSchemesRes.headers['content-type']?.includes('application/json'), 'Schemes API returns application/json');

    // 8. Test Invalid API Route returns JSON 404 (NEVER index.html)
    const badApiRes = await requestRaw('GET', '/api/nonexistent-route-for-testing');
    assert(badApiRes.status === 404, 'GET /api/nonexistent returns 404 Not Found');
    assert(
      badApiRes.headers['content-type']?.includes('application/json'),
      'Unmatched /api route returns application/json (NOT index.html)'
    );
    const badApiData = JSON.parse(badApiRes.body);
    assert(badApiData.success === false, 'Unmatched /api route returns JSON error payload');

  } catch (err) {
    console.error('Unified Service Test Error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    console.log('\n========================================================================');
    console.log(`  UNIFIED SERVICE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runVerification();
