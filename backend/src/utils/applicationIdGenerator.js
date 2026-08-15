import { Application } from '../models/Application.js';

export const generateApplicationId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `APP-${currentYear}-`;

  const count = await Application.countDocuments({
    applicationId: new RegExp(`^${prefix}`),
  });

  const nextSeq = String(count + 1).padStart(6, '0');
  let candidateId = `${prefix}${nextSeq}`;

  const exists = await Application.findOne({ applicationId: candidateId });
  if (exists) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    candidateId = `${prefix}${randomSuffix}`;
  }

  return candidateId;
};
