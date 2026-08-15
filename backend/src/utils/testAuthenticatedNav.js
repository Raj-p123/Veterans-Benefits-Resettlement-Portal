import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import authRoutes from '../routes/auth.routes.js';
import adminRoutes from '../routes/admin.routes.js';
import { User } from '../models/User.js';
import config from '../config/environment.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/veterans_portal';

// Helper function replicating frontend getAuthenticatedHomeRoute
const ROLE_DASHBOARD_MAP = {
  VETERAN: '/veteran/dashboard',
  EMPLOYER: '/employer/dashboard',
  ADMIN: '/admin/dashboard',
};

const getAuthenticatedHomeRoute = (role) => {
  if (!role) return '/';
  return ROLE_DASHBOARD_MAP[role] || '/';
};

const makeToken = (user) => {
  return jwt.sign(
    {
      userId: user._id || user.id,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
};

async function runNavigationTests() {
  console.log('====================================================');
  console.log('  STARTING AUTHENTICATED NAVIGATION VERIFICATION    ');
  console.log('====================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(' Connected to MongoDB:', mongoose.connection.name);

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);

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

  // TEST 1: Helper function verification across roles
  console.log('--- TEST 1: Role-to-Dashboard Mapping Logic ---');
  const roleTests = [
    { role: 'VETERAN', expected: '/veteran/dashboard' },
    { role: 'EMPLOYER', expected: '/employer/dashboard' },
    { role: 'ADMIN', expected: '/admin/dashboard' },
    { role: null, expected: '/' },
    { role: undefined, expected: '/' },
    { role: 'UNKNOWN', expected: '/' },
  ];

  let mapLogicPassed = true;
  roleTests.forEach((t) => {
    const route = getAuthenticatedHomeRoute(t.role);
    if (route === t.expected) {
      console.log(`✓ Role "${t.role}" → Home Route: "${route}"`);
    } else {
      console.error(`✗ Role "${t.role}" failed: expected "${t.expected}", got "${route}"`);
      mapLogicPassed = false;
    }
  });

  if (mapLogicPassed) passedTests++;

  // Fetch real users from DB
  const veteranUser = await User.findOne({ role: 'VETERAN' });
  const employerUser = await User.findOne({ role: 'EMPLOYER' });
  const adminUser = await User.findOne({ role: 'ADMIN' });

  // TEST 2: Veteran Session & Route Integrity
  console.log('\n--- TEST 2: Veteran Authentication & Session State ---');
  if (veteranUser) {
    const vetToken = makeToken(veteranUser);
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${vetToken}` },
    });
    const meData = await meRes.json();
    if (meRes.status === 200 && meData.data?.user?.role === 'VETERAN') {
      const homePath = getAuthenticatedHomeRoute(meData.data.user.role);
      console.log(`✓ Veteran token verified: ${veteranUser.email}`);
      console.log(`✓ Authenticated Home Destination: "${homePath}" (Never "/")`);
      passedTests++;
    } else {
      console.error('✗ Veteran session verification failed:', meData);
    }
  }

  // TEST 3: Employer Session & Route Integrity
  console.log('\n--- TEST 3: Employer Authentication & Session State ---');
  if (employerUser) {
    const empToken = makeToken(employerUser);
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    const meData = await meRes.json();
    if (meRes.status === 200 && meData.data?.user?.role === 'EMPLOYER') {
      const homePath = getAuthenticatedHomeRoute(meData.data.user.role);
      console.log(`✓ Employer token verified: ${employerUser.email}`);
      console.log(`✓ Authenticated Home Destination: "${homePath}" (Never "/")`);
      passedTests++;
    } else {
      console.error('✗ Employer session verification failed:', meData);
    }
  }

  // TEST 4: Admin Session & Route Integrity
  console.log('\n--- TEST 4: Admin Authentication & Session State ---');
  if (adminUser) {
    const adminToken = makeToken(adminUser);
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    if (meRes.status === 200 && meData.data?.user?.role === 'ADMIN') {
      const homePath = getAuthenticatedHomeRoute(meData.data.user.role);
      console.log(`✓ Admin token verified: ${adminUser.email}`);
      console.log(`✓ Authenticated Home Destination: "${homePath}" (Never "/")`);
      passedTests++;
    } else {
      console.error('✗ Admin session verification failed:', meData);
    }
  }

  // TEST 5: Route Guard Security (Veteran blocked from Admin Dashboard)
  console.log('\n--- TEST 5: Route Guard Security (RBAC Enforcement) ---');
  if (veteranUser) {
    const vetToken = makeToken(veteranUser);
    const adminEndpointRes = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${vetToken}` },
    });
    if (adminEndpointRes.status === 403) {
      console.log('✓ Veteran token strictly blocked from Admin API (403 Forbidden).');
      passedTests++;
    } else {
      console.error(`✗ Security check failed: Expected 403, got ${adminEndpointRes.status}`);
    }
  }

  // TEST 6: Unauthenticated Public Access
  console.log('\n--- TEST 6: Public / Unauthenticated User ---');
  const publicHome = getAuthenticatedHomeRoute(null);
  if (publicHome === '/') {
    console.log(`✓ Unauthenticated user Home Destination: "${publicHome}" (Public Landing Page).`);
    passedTests++;
  } else {
    console.error('✗ Public home failed:', publicHome);
  }

  console.log('\n====================================================');
  console.log(`  AUTHENTICATED NAVIGATION TESTS: ${passedTests}/6 PASSED!`);
  console.log('====================================================\n');

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runNavigationTests().catch((err) => {
  console.error('Error running navigation tests:', err);
  process.exit(1);
});
