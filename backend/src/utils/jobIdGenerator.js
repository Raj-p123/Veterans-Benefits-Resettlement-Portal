import { Job } from '../models/Job.js';

export const generateJobId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `JOB-${currentYear}-`;

  const count = await Job.countDocuments({
    jobId: new RegExp(`^${prefix}`),
  });

  const nextSeq = String(count + 1).padStart(6, '0');
  let candidateId = `${prefix}${nextSeq}`;

  const exists = await Job.findOne({ jobId: candidateId });
  if (exists) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    candidateId = `${prefix}${randomSuffix}`;
  }

  return candidateId;
};
