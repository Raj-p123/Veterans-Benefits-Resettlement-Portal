import { Scheme } from '../models/Scheme.js';

export const generateSchemeId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `SCH-${currentYear}-`;

  const count = await Scheme.countDocuments({
    schemeId: new RegExp(`^${prefix}`),
  });

  const nextSeq = String(count + 1).padStart(5, '0');
  let candidateId = `${prefix}${nextSeq}`;

  const exists = await Scheme.findOne({ schemeId: candidateId });
  if (exists) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    candidateId = `${prefix}${randomSuffix}`;
  }

  return candidateId;
};
