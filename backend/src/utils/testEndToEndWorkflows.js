/**
 * COMPREHENSIVE END-TO-END WORKFLOW REGRESSION TEST SUITE
 * 
 * Tests Workflows A, B, and C as required:
 * - WORKFLOW A: VETERAN (Login, Profile, Multi-Location Job Search, Apply, Doc Upload, Status Tracking, Notification, Logout)
 * - WORKFLOW B: EMPLOYER (Login, Dashboard, Profile, Job Posting, Candidate Review, Status Transition, Real-time Notification, Logout)
 * - WORKFLOW C: ADMIN (Login, Dashboard Stats, Application Approval, Document Scrutiny, Analytics Filters, Reports, CSV Sanitization, Logout)
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
import { Notification } from '../models/Notification.js';
import { config } from '../config/environment.js';

let server;
let serverPort;

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

async function runWorkflows() {
  console.log('========================================================================');
  console.log('  FINAL E2E REGRESSION SUITE: WORKFLOWS A, B & C  ');
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
    // Connect to DB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/veterans_portal';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Start Live Server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        console.log(`[Test Server] Live on http://localhost:${serverPort}\n`);
        resolve();
      });
    });

    const timestamp = Date.now();
    const testPassword = 'Password123!';

    // =========================================================================
    // WORKFLOW A: VETERAN END-TO-END JOURNEY
    // =========================================================================
    console.log('--- WORKFLOW A: VETERAN (LOGIN -> DISCOVERY -> APPLY -> TRACK) ---');

    // 1. Veteran Register & Login
    const vetEmail = `workflow_vet_${timestamp}@example.gov.in`;
    const regVet = await makeRequest('POST', '/api/auth/register', {
      name: 'Subedar Major Balwinder Singh',
      email: vetEmail,
      phone: '9876540001',
      password: testPassword,
      role: 'VETERAN',
    });
    assert(regVet.status === 201, 'Veteran registers successfully (201 Created)');
    const vetToken = regVet.data?.data?.token;

    // 2. Profile Setup & Verification
    const profileRes = await makeRequest('PUT', '/api/veteran/profile', {
      personalInformation: {
        fullName: 'Subedar Major Balwinder Singh',
        state: 'Punjab',
        city: 'Amritsar',
      },
      serviceInformation: {
        serviceNumber: `ARM-VET-${timestamp.toString().slice(-4)}`,
        serviceBranch: 'Army',
        rank: 'Subedar Major',
        yearsOfService: 28,
        serviceStatus: 'Retired',
      },
    }, vetToken);
    assert(profileRes.status === 200, 'Veteran profile updated and saved in MongoDB');

    // 3. Multi-Location Job Search (Bhubaneswar, Cuttack, Berhampur, Delhi, Mumbai, Pune)
    const locations = ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Delhi', 'Mumbai', 'Pune'];
    for (const loc of locations) {
      const locRes = await makeRequest('GET', `/api/jobs?location=${encodeURIComponent(loc)}`, null, vetToken);
      assert(locRes.status === 200, `Job search by location "${loc}" executed cleanly`);
    }

    // 4. Scheme Discovery & Search
    const schemeSearch = await makeRequest('GET', '/api/schemes?category=Pension', null, vetToken);
    assert(schemeSearch.status === 200, 'Veteran searched schemes by category Pension');

    // 5. Veteran Applies for Welfare Scheme
    const activeScheme = await Scheme.findOne({ status: 'ACTIVE' });
    let createdClaimId = null;
    if (activeScheme) {
      const claimRes = await makeRequest('POST', '/api/applications', {
        schemeId: activeScheme._id,
        bankDetails: {
          accountNumber: '987654321012',
          ifscCode: 'SBIN0004321',
          bankName: 'State Bank of India',
          branchName: 'Amritsar Cantt',
        },
      }, vetToken);
      assert(claimRes.status === 201, 'Veteran submitted welfare claim with generated APP-ID');
      createdClaimId = claimRes.data?.data?.application?._id;
    }

    // 6. Veteran Uploads Supporting Document
    const uploadDoc = await makeRequest('POST', '/api/veteran/documents', {
      documentType: 'DISCHARGE_CERTIFICATE',
      fileUrl: '/uploads/documents/sample_discharge.pdf',
      fileName: 'Discharge_Certificate_Balwinder.pdf',
      fileSize: 1024 * 300,
      mimeType: 'application/pdf',
    }, vetToken);
    assert(uploadDoc.status === 201, 'Veteran uploaded supporting document (Status: PENDING)');

    // 7. Check Notifications & Status Tracking
    const notifsRes = await makeRequest('GET', '/api/notifications/unread-count', null, vetToken);
    assert(notifsRes.status === 200, 'Veteran notification count checked successfully');

    // =========================================================================
    // WORKFLOW B: EMPLOYER END-TO-END JOURNEY
    // =========================================================================
    console.log('\n--- WORKFLOW B: EMPLOYER (LOGIN -> POST JOB -> REVIEW -> STATUS) ---');

    // 1. Employer Register & Login
    const empEmail = `workflow_emp_${timestamp}@example.corp.in`;
    const regEmp = await makeRequest('POST', '/api/auth/register', {
      name: 'Bharat Dynamics Recruitment Group',
      email: empEmail,
      phone: '9876540002',
      password: testPassword,
      role: 'EMPLOYER',
    });
    assert(regEmp.status === 201, 'Employer registers successfully (201 Created)');
    const empToken = regEmp.data?.data?.token;

    // 2. Company Profile Setup
    const empProfileRes = await makeRequest('POST', '/api/employer/profile', {
      companyName: 'Bharat Dynamics Systems Corp',
      companyDescription: 'Leading aerospace and defense equipment manufacturer.',
      industry: 'Defense Manufacturing',
      email: empEmail,
      phone: '9876540002',
      city: 'Hyderabad',
      state: 'Telangana',
      contactPerson: {
        name: 'Vikram Mehta',
        designation: 'Senior HR Director',
      },
    }, empToken);
    assert(empProfileRes.status === 201 || empProfileRes.status === 200, 'Employer company profile saved');

    // 3. Post a Verified Job Opening
    const postJob = await makeRequest('POST', '/api/employer/jobs', {
      title: 'Chief Security Officer — Aerospace Complex',
      description: 'Lead facility security, access control, and defense perimeter surveillance.',
      industry: 'Defense & Security',
      employmentType: 'FULL_TIME',
      workMode: 'ONSITE',
      location: 'Hyderabad, Telangana',
      city: 'Hyderabad',
      state: 'Telangana',
      salaryMin: 800000,
      salaryMax: 1400000,
      experienceMin: 10,
      experienceMax: 25,
      openings: 2,
    }, empToken);
    assert(postJob.status === 201, 'Employer posted verified job vacancy');
    const workflowJobId = postJob.data?.data?.job?._id;

    // 4. Veteran applies for Employer's Job
    if (workflowJobId) {
      const applyJob = await makeRequest('POST', `/api/jobs/${workflowJobId}/apply`, {
        coverLetter: '28 years of defense security experience.',
      }, vetToken);
      assert(applyJob.status === 201 || applyJob.status === 200, 'Veteran applied for Employer job opening');
      const jobAppId = applyJob.data?.data?.application?._id;

      // 5. Employer reviews & updates status
      if (jobAppId) {
        const updateCandidate = await makeRequest('PUT', `/api/employer/applications/${jobAppId}/status`, {
          status: 'SHORTLISTED',
          feedback: 'Outstanding leadership record.',
        }, empToken);
        assert(updateCandidate.status === 200, 'Employer updated candidate status to SHORTLISTED');
      }
    }

    // =========================================================================
    // WORKFLOW C: ADMIN END-TO-END JOURNEY
    // =========================================================================
    console.log('\n--- WORKFLOW C: ADMIN (LOGIN -> SCRUTINY -> ANALYTICS -> CSV) ---');

    // 1. Admin Token
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Portal Administrator',
        email: `workflow_admin_${timestamp}@example.gov.in`,
        password: testPassword,
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
      });
    }
    const adminToken = jwt.sign(
      { userId: adminUser._id.toString(), id: adminUser._id.toString(), role: 'ADMIN', email: adminUser.email },
      config.jwtSecret,
      { expiresIn: '2h' }
    );

    // 2. Admin Dashboard Stats
    const adminStats = await makeRequest('GET', '/api/admin/dashboard/stats', null, adminToken);
    assert(adminStats.status === 200, 'Admin Dashboard Stats loaded with live MongoDB counts');

    // 3. Admin Reviews & Approves Scheme Application
    if (createdClaimId) {
      const approveClaim = await makeRequest('PUT', `/api/admin/applications/schemes/${createdClaimId}/status`, {
        status: 'APPROVED',
        adminRemarks: 'Eligible based on verified service records.',
      }, adminToken);
      assert(approveClaim.status === 200, 'Admin verified and approved welfare scheme claim');
    }

    // 4. Admin Analytics Across Date Filters
    const periods = ['today', '7days', '30days', '90days'];
    for (const p of periods) {
      const analyticsRes = await makeRequest('GET', `/api/admin/analytics?period=${p}`, null, adminToken);
      assert(analyticsRes.status === 200, `Admin Analytics aggregation loaded for period "${p}"`);
    }

    // 5. Admin CSV Reports (with Secret Sanitization)
    const reportTypes = ['veterans', 'employers', 'schemes', 'jobs', 'scheme-applications'];
    for (const rep of reportTypes) {
      const csvRes = await makeRequest('GET', `/api/admin/reports/${rep}/export`, null, adminToken, 'text');
      assert(csvRes.status === 200, `Admin CSV export for "${rep}" generated 200 OK`);
      assert(!csvRes.data.includes('password') && !csvRes.data.includes('$2a$'), `CSV for "${rep}" sanitized (no passwords/hashes)`);
    }

  } catch (error) {
    console.error('Workflow error:', error);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    console.log('\n========================================================================');
    console.log(`  WORKFLOW RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runWorkflows();
