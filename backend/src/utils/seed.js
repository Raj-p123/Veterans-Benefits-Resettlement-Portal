import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { config } from '../config/environment.js';
import { ROLES } from '../constants/index.js';
import { seedSchemes } from './seedSchemes.js';
import { seedEmployersAndJobs } from './seedJobs.js';

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[Seed] Connected to MongoDB.');

    // 1. Seed Demo Users
    const demoUsers = [
      {
        name: config.admin.name || 'Portal Administrator',
        email: config.admin.email || 'admin@example.com',
        phone: '+919876500001',
        password: config.admin.password || 'AdminPassword123!',
        role: ROLES.ADMIN,
        isActive: true,
        isVerified: true,
      },
      {
        name: 'Major Vikramaditya Rathore',
        email: 'veteran@example.com',
        phone: '+919876500002',
        password: 'VeteranPassword123!',
        role: ROLES.VETERAN,
        isActive: true,
        isVerified: true,
      },
      {
        name: 'Tata Advanced Systems Recruiter',
        email: 'employer@example.com',
        phone: '+919876500003',
        password: 'EmployerPassword123!',
        role: ROLES.EMPLOYER,
        isActive: true,
        isVerified: true,
      },
    ];

    for (const demoUser of demoUsers) {
      const existingUser = await User.findOne({ email: demoUser.email });
      if (!existingUser) {
        await User.create(demoUser);
        console.log(`[Seed] Created ${demoUser.role} account: ${demoUser.email}`);
      } else {
        console.log(`[Seed] Account already exists: ${demoUser.email} (${demoUser.role})`);
      }
    }

    // 2. Seed Welfare Schemes & Pension Data
    await seedSchemes();

    // 3. Seed Employers & Defense Jobs
    await seedEmployersAndJobs();

    console.log('[Seed] All seeding completed successfully.');
  } catch (error) {
    console.error('[Seed Error]', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
  }
};

// If run directly via node CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
