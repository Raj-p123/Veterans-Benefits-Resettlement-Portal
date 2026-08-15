import { Employer } from '../models/Employer.js';

export const generateEmployerId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `EMP-${currentYear}-`;

  const count = await Employer.countDocuments({
    employerId: new RegExp(`^${prefix}`),
  });

  const nextSeq = String(count + 1).padStart(5, '0');
  let candidateId = `${prefix}${nextSeq}`;

  const exists = await Employer.findOne({ employerId: candidateId });
  if (exists) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    candidateId = `${prefix}${randomSuffix}`;
  }

  return candidateId;
};
