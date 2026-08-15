/**
 * Rule-based Job Recommendation & Match Score Engine
 * Compares Veteran military profile & preferences against Job specifications.
 */

export const calculateJobMatch = (veteran, job) => {
  if (!veteran || !job) {
    return {
      matchPercentage: 0,
      matchedFactors: [],
      missingFactors: [],
    };
  }

  const personal = veteran.personalInformation || {};
  const service = veteran.serviceInformation || {};
  const preferences = veteran.jobPreferences || {};
  const veteranSkills = (veteran.skills || []).map((s) => s.toLowerCase().trim());

  let totalScore = 0;
  const matchedFactors = [];
  const missingFactors = [];

  // 1. Skill Matching (Weight: 40 points)
  const reqSkills = (job.requiredSkills || []).map((s) => s.toLowerCase().trim());
  const prefSkills = (job.preferredSkills || []).map((s) => s.toLowerCase().trim());
  const allJobSkills = [...new Set([...reqSkills, ...prefSkills])];

  if (allJobSkills.length > 0) {
    let skillHits = 0;
    for (const jSkill of allJobSkills) {
      if (
        veteranSkills.some(
          (vSkill) => vSkill.includes(jSkill) || jSkill.includes(vSkill)
        )
      ) {
        skillHits++;
      }
    }
    const skillRatio = skillHits / allJobSkills.length;
    const skillPoints = Math.round(skillRatio * 40);
    totalScore += skillPoints;

    if (skillHits > 0) {
      matchedFactors.push(`Matched ${skillHits} of ${allJobSkills.length} key skills`);
    } else {
      missingFactors.push('Key skills requirement not directly matched in profile');
    }
  } else {
    // If job specifies no explicit skills, assign default baseline
    totalScore += 30;
    matchedFactors.push('General defense skill background applicable');
  }

  // 2. Location / Work Mode Matching (Weight: 20 points)
  const isRemote = job.workMode === 'REMOTE';
  const prefLocations = (preferences.preferredJobLocation || []).map((l) => l.toLowerCase());
  const prefStates = (preferences.preferredStates || []).map((s) => s.toLowerCase());
  const vetState = (personal.state || '').toLowerCase();
  const vetCity = (personal.city || '').toLowerCase();
  const jobCity = (job.city || '').toLowerCase();
  const jobState = (job.state || '').toLowerCase();

  if (
    isRemote ||
    preferences.willingToRelocate ||
    (jobCity && (jobCity === vetCity || prefLocations.includes(jobCity))) ||
    (jobState && (jobState === vetState || prefStates.includes(jobState)))
  ) {
    totalScore += 20;
    matchedFactors.push(isRemote ? 'Remote work option matches' : `Location matches (${job.city}, ${job.state})`);
  } else {
    totalScore += 5;
    missingFactors.push(`Position located in ${job.city}, ${job.state}`);
  }

  // 3. Industry / Preference Matching (Weight: 15 points)
  const prefIndustries = (preferences.preferredIndustries || []).map((i) => i.toLowerCase());
  const jobIndustry = (job.industry || '').toLowerCase();

  if (
    prefIndustries.length === 0 ||
    prefIndustries.some((i) => jobIndustry.includes(i) || i.includes(jobIndustry))
  ) {
    totalScore += 15;
    matchedFactors.push(`Industry aligned: ${job.industry}`);
  } else {
    totalScore += 5;
  }

  // 4. Employment Type Matching (Weight: 10 points)
  const prefEmpTypes = (preferences.preferredEmploymentType || []).map((t) =>
    t.toLowerCase().replace(/[-_ ]/g, '')
  );
  const normalizedJobType = (job.employmentType || '').toLowerCase().replace(/[-_ ]/g, '');

  if (
    prefEmpTypes.length === 0 ||
    prefEmpTypes.some((t) => t.includes(normalizedJobType) || normalizedJobType.includes(t))
  ) {
    totalScore += 10;
    matchedFactors.push(`Employment type matches (${job.employmentType.replace('_', ' ')})`);
  } else {
    totalScore += 3;
  }

  // 5. Experience / Service Years Matching (Weight: 15 points)
  const vetExp = service.yearsOfService || 0;
  const expMin = job.experienceMin || 0;
  const expMax = job.experienceMax || 35;

  if (vetExp >= expMin && vetExp <= expMax + 5) {
    totalScore += 15;
    matchedFactors.push(`Military service experience qualifies (${vetExp} yrs service)`);
  } else if (vetExp < expMin) {
    totalScore += 5;
    missingFactors.push(`Requires ${expMin} yrs experience (Profile has ${vetExp} yrs)`);
  } else {
    totalScore += 10;
  }

  const matchPercentage = Math.min(Math.max(totalScore, 15), 98);

  return {
    matchPercentage,
    matchedFactors,
    missingFactors,
  };
};
