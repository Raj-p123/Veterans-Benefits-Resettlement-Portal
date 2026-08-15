/**
 * Smart Scheme Eligibility Engine
 * Evaluates a Veteran profile against structured Scheme criteria.
 */

export const evaluateEligibility = (veteran, scheme) => {
  const disclaimer =
    'This eligibility result is an informational estimate based on the information available in your profile. Final eligibility is determined by the relevant official authority.';

  if (!veteran) {
    return {
      eligible: false,
      status: 'INCOMPLETE_PROFILE',
      matchPercentage: 0,
      matchedCriteria: [],
      missingCriteria: ['Veteran profile does not exist yet.'],
      unmatchedCriteria: [],
      message: 'Please complete your service profile to evaluate eligibility.',
      disclaimer,
    };
  }

  const personal = veteran.personalInformation || {};
  const service = veteran.serviceInformation || {};
  const education = veteran.education || [];
  const skills = veteran.skills || [];

  const userDob = personal.dob || personal.dateOfBirth;

  // 1. Check for Missing Profile Data
  const missingCriteria = [];
  if (!userDob) {
    missingCriteria.push('Date of birth is missing in personal records.');
  }
  if (!service.serviceBranch) {
    missingCriteria.push('Service branch (Army / Navy / Air Force) is missing.');
  }
  if (!service.serviceStatus) {
    missingCriteria.push('Service status (Retired / Discharged / Released) is missing.');
  }
  if (service.yearsOfService === undefined || service.yearsOfService === null) {
    missingCriteria.push('Years of military service duration is missing.');
  }
  if (!personal.state) {
    missingCriteria.push('State of residence is not specified in address.');
  }

  // If major profile attributes are missing, return INCOMPLETE_PROFILE status
  if (missingCriteria.length >= 3) {
    return {
      eligible: false,
      status: 'INCOMPLETE_PROFILE',
      matchPercentage: 20,
      matchedCriteria: [],
      missingCriteria,
      unmatchedCriteria: [],
      message: 'Your profile lacks necessary service or personal information. Please update your profile.',
      disclaimer,
    };
  }

  // 2. Evaluate Specific Criteria
  const matchedCriteria = [];
  const unmatchedCriteria = [];
  let evaluatedCount = 0;
  let passedCount = 0;

  const reqs = scheme.eligibility || {};

  // A. Age Evaluation
  if (reqs.minimumAge > 0 || (reqs.maximumAge && reqs.maximumAge < 120)) {
    evaluatedCount++;
    if (userDob) {
      const birthDate = new Date(userDob);
      const ageDiff = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);

      const minPass = reqs.minimumAge ? age >= reqs.minimumAge : true;
      const maxPass = reqs.maximumAge ? age <= reqs.maximumAge : true;

      if (minPass && maxPass) {
        passedCount++;
        matchedCriteria.push(`Age criterion satisfied (Current Age: ${age} years).`);
      } else {
        unmatchedCriteria.push(
          `Age (${age} yrs) outside required bracket (${reqs.minimumAge || 0} - ${reqs.maximumAge || 120} yrs).`
        );
      }
    } else {
      missingCriteria.push('Date of birth required for age verification.');
    }
  }

  // B. Service Duration (Years of Service)
  if (reqs.minimumServiceYears > 0) {
    evaluatedCount++;
    const vetYears = parseFloat(service.yearsOfService || 0);
    if (vetYears >= reqs.minimumServiceYears) {
      passedCount++;
      matchedCriteria.push(
        `Minimum service requirement satisfied (${vetYears} yrs served ≥ ${reqs.minimumServiceYears} yrs required).`
      );
    } else {
      unmatchedCriteria.push(
        `Minimum service requirement not met (${vetYears} yrs served < ${reqs.minimumServiceYears} yrs required).`
      );
    }
  }

  // C. Service Branch
  if (reqs.serviceBranches && reqs.serviceBranches.length > 0) {
    evaluatedCount++;
    const branches = reqs.serviceBranches.map((b) => b.toLowerCase().trim());
    const isAll = branches.includes('all') || branches.includes('any') || branches.includes('other');
    const vetBranch = (service.serviceBranch || '').toLowerCase().trim();

    if (isAll || branches.includes(vetBranch)) {
      passedCount++;
      matchedCriteria.push(`Defense service branch matches (${service.serviceBranch || 'All'}).`);
    } else {
      unmatchedCriteria.push(
        `Scheme open to: ${reqs.serviceBranches.join(', ')} (Profile branch: ${service.serviceBranch}).`
      );
    }
  }

  // D. Service Status (Retired, Discharged, Released)
  if (reqs.serviceStatuses && reqs.serviceStatuses.length > 0) {
    evaluatedCount++;
    const statuses = reqs.serviceStatuses.map((s) => s.toLowerCase().trim());
    const isAll = statuses.includes('all') || statuses.includes('any');
    const vetStatus = (service.serviceStatus || '').toLowerCase().trim();

    if (isAll || statuses.includes(vetStatus)) {
      passedCount++;
      matchedCriteria.push(`Service discharge status matches (${service.serviceStatus || 'Eligible'}).`);
    } else {
      unmatchedCriteria.push(
        `Scheme requires status: ${reqs.serviceStatuses.join(', ')} (Profile status: ${service.serviceStatus}).`
      );
    }
  }

  // E. State / Domicile Criterion
  const schemeState = scheme.state || 'All India';
  if (schemeState !== 'All India' || (reqs.states && reqs.states.length > 0 && !reqs.states.includes('All India'))) {
    evaluatedCount++;
    const allowedStates = (reqs.states && reqs.states.length > 0 ? reqs.states : [schemeState]).map((s) =>
      s.toLowerCase().trim()
    );
    const vetState = (personal.state || '').toLowerCase().trim();

    if (allowedStates.includes('all india') || allowedStates.includes(vetState)) {
      passedCount++;
      matchedCriteria.push(`State domicile matches (${personal.state || 'All India'}).`);
    } else {
      unmatchedCriteria.push(
        `Scheme applies to: ${allowedStates.join(', ')} (Profile state: ${personal.state || 'Unspecified'}).`
      );
    }
  }

  // F. Rank Criteria (if specific ranks are mandated)
  if (reqs.ranks && reqs.ranks.length > 0) {
    evaluatedCount++;
    const allowedRanks = reqs.ranks.map((r) => r.toLowerCase().trim());
    const isAll = allowedRanks.includes('all') || allowedRanks.includes('any');
    const vetRank = (service.rank || '').toLowerCase().trim();

    if (isAll || allowedRanks.includes(vetRank) || allowedRanks.some((r) => vetRank.includes(r))) {
      passedCount++;
      matchedCriteria.push(`Rank qualification met (${service.rank}).`);
    } else {
      unmatchedCriteria.push(`Applicable ranks: ${reqs.ranks.join(', ')} (Your rank: ${service.rank || 'N/A'}).`);
    }
  }

  // 3. Fallback baseline if scheme has minimal structured criteria
  if (evaluatedCount === 0) {
    evaluatedCount = 1;
    passedCount = 1;
    matchedCriteria.push('General defense ex-serviceman criteria met.');
  }

  // 4. Calculate Match Percentage
  let matchPercentage = Math.round((passedCount / evaluatedCount) * 100);
  if (missingCriteria.length > 0) {
    matchPercentage = Math.min(matchPercentage, 85); // Cap if missing some info
  }

  // 5. Determine Overall Status
  let status = 'ELIGIBLE';
  let eligible = true;
  let message = 'You appear to meet all primary criteria based on your military profile.';

  if (unmatchedCriteria.length > 0) {
    status = 'NOT_ELIGIBLE';
    eligible = false;
    message = 'You do not appear to meet all criteria for this specific scheme.';
  } else if (missingCriteria.length > 0) {
    status = 'INCOMPLETE_PROFILE';
    eligible = false;
    message = 'Your profile is missing some details, but matching criteria appear favorable.';
  }

  return {
    eligible,
    status,
    matchPercentage,
    matchedCriteria,
    missingCriteria,
    unmatchedCriteria,
    message,
    disclaimer,
  };
};
