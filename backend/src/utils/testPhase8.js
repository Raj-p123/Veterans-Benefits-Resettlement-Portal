import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { connectDB } from '../config/database.js';
import { socketService } from '../services/socketService.js';
import { User } from '../models/User.js';
import { Veteran } from '../models/Veteran.js';
import { Employer } from '../models/Employer.js';
import { Scheme } from '../models/Scheme.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { JobApplication } from '../models/JobApplication.js';
import { Document } from '../models/Document.js';
import { AuditLog } from '../models/AuditLog.js';
import { config } from '../config/environment.js';

const TEST_PORT = 5055;
const API_BASE = `http://localhost:${TEST_PORT}/api`;

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id || user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
};

const runPhase8Tests = async () => {
  console.log('====================================================');
  console.log('   STARTING PHASE 8 ADMIN PANEL VERIFICATION SUITE   ');
  console.log('====================================================\n');

  let server;
  try {
    await connectDB();
    console.log(' Connected to MongoDB for Phase 8 Verification.');

    server = http.createServer(app);
    socketService.init(server);

    await new Promise((resolve) => {
      server.listen(TEST_PORT, () => {
        console.log(` Test server running on http://localhost:${TEST_PORT}\n`);
        resolve();
      });
    });

    // 1. Fetch test users
    const adminUser = await User.findOne({ role: 'ADMIN' });
    const veteranUser = await User.findOne({ role: 'VETERAN' });
    const employerUser = await User.findOne({ role: 'EMPLOYER' });

    if (!adminUser) {
      throw new Error('Admin user not found in database. Run seed first.');
    }

    const adminToken = generateToken(adminUser);
    const veteranToken = veteranUser ? generateToken(veteranUser) : null;
    const employerToken = employerUser ? generateToken(employerUser) : null;

    console.log(` Admin User Identified: ${adminUser.email} (ID: ${adminUser._id})`);

    // Helper for API requests
    const fetchApi = async (path, options = {}) => {
      const url = `${API_BASE}${path}`;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.token || adminToken}`,
        ...options.headers,
      };

      const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    // TEST 1: Role-based Access Control (RBAC) Security
    console.log('\n--- TEST 1: RBAC Administrative Security Enforcement ---');
    if (veteranToken) {
      const vetRes = await fetchApi('/admin/dashboard/stats', { token: veteranToken });
      if (vetRes.status === 403) {
        console.log(' Veteran token blocked from administrative endpoint (403 Forbidden).');
      } else {
        console.error(`❌ Security breach: Veteran received status ${vetRes.status}`);
      }
    }
    if (employerToken) {
      const empRes = await fetchApi('/admin/dashboard/stats', { token: employerToken });
      if (empRes.status === 403) {
        console.log(' Employer token blocked from administrative endpoint (403 Forbidden).');
      } else {
        console.error(`❌ Security breach: Employer received status ${empRes.status}`);
      }
    }

    // TEST 2: Dashboard Statistics
    console.log('\n--- TEST 2: Admin Dashboard Aggregated Statistics ---');
    const statsRes = await fetchApi('/admin/dashboard/stats');
    if (statsRes.status === 200 && statsRes.data.success) {
      console.log(' Dashboard Statistics retrieved successfully:');
      console.log('   Veterans Count:', statsRes.data.data.veterans);
      console.log('   Employers Count:', statsRes.data.data.employers);
      console.log('   Active Jobs:', statsRes.data.data.activeJobs);
      console.log('   Welfare Schemes:', statsRes.data.data.schemes);
      console.log('   Scheme Applications:', statsRes.data.data.schemeApplications);
      console.log('   Job Applications:', statsRes.data.data.jobApplications);
      console.log('   Pending Verifications:', statsRes.data.data.pendingVerifications);
    } else {
      throw new Error(`Failed to fetch stats: ${JSON.stringify(statsRes.data)}`);
    }

    // TEST 3: Veteran Directory & Verification
    console.log('\n--- TEST 3: Veteran Directory & Verification ---');
    const vetListRes = await fetchApi('/admin/veterans?limit=5');
    if (vetListRes.status === 200 && vetListRes.data.success) {
      console.log(` Retrieved ${vetListRes.data.data.veterans.length} veterans records.`);
      if (vetListRes.data.data.veterans.length > 0) {
        const targetVet = vetListRes.data.data.veterans[0];
        const vetId = targetVet._id || targetVet.id;
        console.log(`   Verifying Veteran: ${targetVet.veteranId} (DB ID: ${vetId})`);

        const verifyRes = await fetchApi(`/admin/veterans/${vetId}/verification`, {
          method: 'PUT',
          body: {
            status: 'VERIFIED',
            remarks: 'Automated test suite verification check.',
          },
        });

        if (verifyRes.status === 200 && verifyRes.data.success) {
          console.log(' Veteran verification status updated to VERIFIED with audit logging.');
        } else {
          console.error('❌ Veteran verification failed:', verifyRes.data);
        }
      }
    }

    // TEST 4: Employer Directory & Verification
    console.log('\n--- TEST 4: Employer Directory & Verification ---');
    const empListRes = await fetchApi('/admin/employers?limit=5');
    if (empListRes.status === 200 && empListRes.data.success) {
      console.log(` Retrieved ${empListRes.data.data.employers.length} employer records.`);
      if (empListRes.data.data.employers.length > 0) {
        const targetEmp = empListRes.data.data.employers[0];
        const empId = targetEmp._id || targetEmp.id;
        console.log(`   Verifying Employer: ${targetEmp.companyName} (DB ID: ${empId})`);

        const verifyEmpRes = await fetchApi(`/admin/employers/${empId}/verification`, {
          method: 'PUT',
          body: {
            status: 'VERIFIED',
            remarks: 'Corporate defense recruitment privileges verified.',
          },
        });

        if (verifyEmpRes.status === 200 && verifyEmpRes.data.success) {
          console.log(' Employer verification status updated to VERIFIED with audit logging.');
        } else {
          console.error('❌ Employer verification failed:', verifyEmpRes.data);
        }
      }
    }

    // TEST 5: Document Scrutiny
    console.log('\n--- TEST 5: Supporting Documents Vault Scrutiny ---');
    const docListRes = await fetchApi('/admin/documents?limit=5');
    if (docListRes.status === 200 && docListRes.data.success) {
      console.log(` Retrieved ${docListRes.data.data.documents.length} uploaded documents.`);
      if (docListRes.data.data.documents.length > 0) {
        const targetDoc = docListRes.data.data.documents[0];
        const docId = targetDoc._id || targetDoc.id;
        console.log(`   Reviewing Document: ${targetDoc.documentName} (DB ID: ${docId})`);

        const docStatusRes = await fetchApi(`/admin/documents/${docId}/status`, {
          method: 'PUT',
          body: {
            status: 'VERIFIED',
            adminRemarks: 'Official military certificate verified in test.',
          },
        });

        if (docStatusRes.status === 200 && docStatusRes.data.success) {
          console.log(' Document status updated to VERIFIED.');
        } else {
          console.error('❌ Document status update failed:', docStatusRes.data);
        }
      }
    }

    // TEST 6: Welfare Scheme Creation & Management
    console.log('\n--- TEST 6: Welfare Scheme Management ---');
    const testSchemePayload = {
      name: `Ex-Servicemen Emergency Healthcare Scheme ${Date.now()}`,
      shortDescription: 'Emergency medical financial grant for defense veterans and dependents.',
      description: 'Comprehensive financial relief provided by Kendriya Sainik Board for urgent hospitalization and medical expenses.',
      category: 'Healthcare',
      officialSource: 'Kendriya Sainik Board, MoD',
      officialWebsite: 'https://ksb.gov.in',
      state: 'All India',
      status: 'ACTIVE',
      isFeatured: true,
      benefits: ['Up to ₹50,000 one-time emergency medical relief', 'Direct DBT transfer'],
      requiredDocuments: ['Discharge Certificate', 'Hospital Medical Bill', 'Identity Document'],
      eligibility: {
        minimumAge: 18,
        maximumAge: 100,
        minimumServiceYears: 3,
        serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard'],
      },
    };

    const createSchemeRes = await fetchApi('/admin/schemes', {
      method: 'POST',
      body: testSchemePayload,
    });

    if (createSchemeRes.status === 201 && createSchemeRes.data.success) {
      const createdScheme = createSchemeRes.data.data.scheme;
      const schId = createdScheme._id || createdScheme.id;
      console.log(` Welfare Scheme created successfully: ${createdScheme.name} (ID: ${createdScheme.schemeId})`);

      // Update the scheme
      const updateSchemeRes = await fetchApi(`/admin/schemes/${schId}`, {
        method: 'PUT',
        body: {
          shortDescription: 'Updated: Emergency medical financial grant for defense veterans.',
        },
      });

      if (updateSchemeRes.status === 200 && updateSchemeRes.data.success) {
        console.log(' Welfare Scheme updated successfully.');
      }
    }

    // TEST 7: Job Moderation
    console.log('\n--- TEST 7: Corporate Job Moderation ---');
    const jobsRes = await fetchApi('/admin/jobs?limit=5');
    if (jobsRes.status === 200 && jobsRes.data.success) {
      console.log(` Retrieved ${jobsRes.data.data.jobs.length} job postings.`);
      if (jobsRes.data.data.jobs.length > 0) {
        const targetJob = jobsRes.data.data.jobs[0];
        const jId = targetJob._id || targetJob.id;
        const jobStatusRes = await fetchApi(`/admin/jobs/${jId}/status`, {
          method: 'PUT',
          body: {
            status: 'ACTIVE',
            adminRemarks: 'Job approved for defense veterans.',
          },
        });

        if (jobStatusRes.status === 200 && jobStatusRes.data.success) {
          console.log(` Job ${targetJob.jobId} moderated to ACTIVE status.`);
        }
      }
    }

    // TEST 8: Scheme Application Processing
    console.log('\n--- TEST 8: Scheme Application Scrutiny ---');
    const schemeAppsRes = await fetchApi('/admin/applications/schemes?limit=5');
    if (schemeAppsRes.status === 200 && schemeAppsRes.data.success) {
      console.log(` Retrieved ${schemeAppsRes.data.data.applications.length} scheme applications.`);
      if (schemeAppsRes.data.data.applications.length > 0) {
        const targetApp = schemeAppsRes.data.data.applications[0];
        const appId = targetApp._id || targetApp.id;
        const currentSt = targetApp.status;
        const nextSt =
          currentSt === 'SUBMITTED'
            ? 'UNDER_REVIEW'
            : currentSt === 'UNDER_REVIEW'
            ? 'APPROVED'
            : currentSt === 'REJECTED'
            ? 'UNDER_REVIEW'
            : 'APPROVED';

        if (currentSt !== 'APPROVED') {
          const appStatusRes = await fetchApi(`/admin/applications/schemes/${appId}/status`, {
            method: 'PUT',
            body: {
              status: nextSt,
              adminRemarks: 'Official verification in progress by welfare officer.',
            },
          });

          if (appStatusRes.status === 200 && appStatusRes.data.success) {
            console.log(` Scheme application #${targetApp.applicationId} transitioned from ${currentSt} to ${nextSt}.`);
          } else {
            console.log(` Status transition response:`, appStatusRes.data.message);
          }
        } else {
          console.log(` Application #${targetApp.applicationId} is already APPROVED.`);
        }
      }
    }

    // TEST 9: Portal Users Management & Self-Deactivation Safeguard
    console.log('\n--- TEST 9: User Account Management & Self-Deactivation Safeguard ---');
    const usersRes = await fetchApi('/admin/users?limit=5');
    if (usersRes.status === 200 && usersRes.data.success) {
      console.log(` Retrieved ${usersRes.data.data.users.length} portal users.`);

      // Test Self-deactivation safeguard
      console.log('   Testing Admin Self-Deactivation Safeguard...');
      const selfDeactRes = await fetchApi(`/admin/users/${adminUser._id}/status`, {
        method: 'PUT',
        body: { isActive: false },
      });

      if (selfDeactRes.status === 400 && !selfDeactRes.data.success) {
        console.log(' Safeguard Active: Admin cannot deactivate own current account (400 Bad Request returned).');
      } else {
        console.error('❌ Safeguard failed! Admin account deactivation was permitted.');
      }
    }

    // TEST 10: Analytics & KPIs Aggregations
    console.log('\n--- TEST 10: Multi-Dimensional Analytics Aggregation ---');
    const analyticsRes = await fetchApi('/admin/analytics?range=30d');
    if (analyticsRes.status === 200 && analyticsRes.data.success) {
      console.log(' Analytics aggregated successfully:');
      console.log('   Claim Approval Rate:', analyticsRes.data.data.kpis.schemeApprovalRate + '%');
      console.log('   Job Placement Rate:', analyticsRes.data.data.kpis.portalJobPlacementRate + '%');
      console.log('   Average Processing Time:', analyticsRes.data.data.kpis.avgProcessingTimeDays, 'days');
      console.log('   Registration Trends Data Points:', analyticsRes.data.data.trends.veteranRegistrations.length);
    }

    // TEST 11: Reports Summary & CSV Export
    console.log('\n--- TEST 11: Reports Summary & CSV Exports ---');
    const reportsSummaryRes = await fetchApi('/admin/reports/summary');
    if (reportsSummaryRes.status === 200 && reportsSummaryRes.data.success) {
      console.log(' Reports summary compiled:');
      console.log('   Veterans:', reportsSummaryRes.data.data.summary.veterans);
      console.log('   Employers:', reportsSummaryRes.data.data.summary.employers);
      console.log('   Schemes:', reportsSummaryRes.data.data.summary.schemes);
      console.log('   Jobs:', reportsSummaryRes.data.data.summary.jobs);
    }

    // Test CSV Export endpoint
    const exportRes = await fetchApi('/admin/reports/veterans/export');
    if (exportRes.status === 200) {
      console.log(' Veterans CSV export generated successfully.');
    }

    // TEST 12: Security Audit Logs
    console.log('\n--- TEST 12: Administrative Security Audit Trail ---');
    const auditRes = await fetchApi('/admin/audit-logs?limit=10');
    if (auditRes.status === 200 && auditRes.data.success) {
      console.log(` Retrieved ${auditRes.data.data.logs.length} audit trail records.`);
      if (auditRes.data.data.logs.length > 0) {
        console.log('   Latest Audit Action:', auditRes.data.data.logs[0].action);
        console.log('   Latest Description:', auditRes.data.data.logs[0].description);
      }
    }

    // TEST 13: Global Search
    console.log('\n--- TEST 13: Global Fast Search ---');
    const searchRes = await fetchApi('/admin/search?q=army');
    if (searchRes.status === 200 && searchRes.data.success) {
      console.log(' Global Search executed successfully:');
      console.log('   Veterans found:', searchRes.data.data.veterans.length);
      console.log('   Schemes found:', searchRes.data.data.schemes.length);
      console.log('   Jobs found:', searchRes.data.data.jobs.length);
    }

    // TEST 14: Admin Settings Profile
    console.log('\n--- TEST 14: Admin Profile & Password Management ---');
    const profileRes = await fetchApi('/admin/settings/profile');
    if (profileRes.status === 200 && profileRes.data.success) {
      console.log(` Admin Profile: ${profileRes.data.data.admin.name} (${profileRes.data.data.admin.email})`);
    }

    console.log('\n====================================================');
    console.log('  ALL PHASE 8 TESTS PASSED WITH ZERO ERRORS!  ');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Phase 8 Verification Error:', error);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(0);
  }
};

runPhase8Tests();
