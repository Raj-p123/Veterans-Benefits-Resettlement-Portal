import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { Employer } from '../models/Employer.js';
import { geocodeLocation } from '../services/geocodingService.js';
import config from '../config/environment.js';

export const syncJobAndEmployerCoordinates = async () => {
  console.log('--- Syncing Coordinates for Jobs & Employers ---');
  
  // 1. Sync Jobs
  const jobs = await Job.find({});
  let updatedJobs = 0;

  for (const job of jobs) {
    if (!job.latitude || !job.longitude) {
      const geo = await geocodeLocation(job.city, job.state, job.address || job.location);
      if (geo) {
        job.latitude = geo.latitude;
        job.longitude = geo.longitude;
        job.locationCoordinates = {
          type: 'Point',
          coordinates: [geo.longitude, geo.latitude],
        };
        if (!job.address) job.address = `${job.city}, ${job.state}`;
        await job.save();
        updatedJobs++;
      }
    }
  }

  // 2. Sync Employers
  const employers = await Employer.find({});
  let updatedEmployers = 0;

  for (const emp of employers) {
    if (!emp.latitude || !emp.longitude) {
      const geo = await geocodeLocation(emp.city, emp.state, emp.address);
      if (geo) {
        emp.latitude = geo.latitude;
        emp.longitude = geo.longitude;
        await emp.save();
        updatedEmployers++;
      }
    }
  }

  console.log(`✓ Synchronized ${updatedJobs} jobs and ${updatedEmployers} employers with valid geographic coordinates.`);
  return { updatedJobs, updatedEmployers };
};

if (process.argv[1] && process.argv[1].endsWith('syncJobCoordinates.js')) {
  mongoose
    .connect(config.mongodbUri)
    .then(async () => {
      await syncJobAndEmployerCoordinates();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error syncing coordinates:', err);
      process.exit(1);
    });
}

export default syncJobAndEmployerCoordinates;
