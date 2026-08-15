import { Veteran } from '../models/Veteran.js';

export const generateVeteranId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `VET-${currentYear}-`;

  // Count existing veterans created this year
  const count = await Veteran.countDocuments({
    veteranId: new RegExp(`^${prefix}`),
  });

  const nextSequence = String(count + 1).padStart(5, '0');
  let candidateId = `${prefix}${nextSequence}`;

  // Double check uniqueness
  const exists = await Veteran.findOne({ veteranId: candidateId });
  if (exists) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    candidateId = `${prefix}${randomSuffix}`;
  }

  return candidateId;
};
