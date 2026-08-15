import { JobApplication } from '../models/JobApplication.js';

export const generateJobApplicationId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `JOBAPP-${currentYear}-`;

  const count = await JobApplication.countDocuments({
    applicationId: new RegExp(`^${prefix}`),
  });

  const nextSeq = String(count + 1).padStart(6, '0');
  let candidateId = `${prefix}${nextSeq}`;

  const exists = await JobApplication.findOne({ applicationId: candidateId });
  if (exists) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    candidateId = `${prefix}${randomSuffix}`;
  }

  return candidateId;
};
