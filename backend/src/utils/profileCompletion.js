export const calculateProfileCompletion = (veteran, documentsCount = 0) => {
  let percentage = 0;
  const completedSections = [];
  const remainingSections = [];
  const breakdown = {};

  // 1. Personal Information (20%)
  const personal = veteran?.personalInformation || {};
  const hasPersonalInfo = !!(
    personal.fullName &&
    personal.dob &&
    personal.gender &&
    personal.phone &&
    personal.address &&
    personal.city &&
    personal.state &&
    personal.pincode
  );

  if (hasPersonalInfo) {
    percentage += 20;
    completedSections.push('Personal Information');
    breakdown.personal = { score: 20, max: 20, completed: true };
  } else {
    remainingSections.push('Personal Information (Full details required)');
    breakdown.personal = { score: personal.fullName ? 10 : 0, max: 20, completed: false };
    if (personal.fullName) percentage += 10;
  }

  // 2. Service Information (30%)
  const service = veteran?.serviceInformation || {};
  const hasServiceInfo = !!(
    service.serviceBranch &&
    service.rank &&
    service.serviceNumber &&
    service.dateOfJoining &&
    service.serviceStatus
  );

  if (hasServiceInfo) {
    percentage += 30;
    completedSections.push('Service Record');
    breakdown.service = { score: 30, max: 30, completed: true };
  } else {
    remainingSections.push('Service Record (Branch, Rank, Service No, Dates)');
    const partialService = (service.serviceBranch ? 10 : 0) + (service.rank ? 10 : 0);
    percentage += partialService;
    breakdown.service = { score: partialService, max: 30, completed: false };
  }

  // 3. Education (15%)
  const education = veteran?.education || [];
  const hasEducation = Array.isArray(education) && education.length > 0 && education[0].qualification;

  if (hasEducation) {
    percentage += 15;
    completedSections.push('Education History');
    breakdown.education = { score: 15, max: 15, completed: true };
  } else {
    remainingSections.push('Education History (Add at least 1 qualification)');
    breakdown.education = { score: 0, max: 15, completed: false };
  }

  // 4. Skills & Competencies (15%)
  const skills = veteran?.skills || [];
  const hasSkills = Array.isArray(skills) && skills.length > 0;

  if (hasSkills) {
    percentage += 15;
    completedSections.push('Skills & Competencies');
    breakdown.skills = { score: 15, max: 15, completed: true };
  } else {
    remainingSections.push('Skills (Add your military/civilian skills)');
    breakdown.skills = { score: 0, max: 15, completed: false };
  }

  // 5. Job Preferences (10%)
  const prefs = veteran?.jobPreferences || {};
  const hasPreferences = !!(
    (prefs.preferredJobLocation && prefs.preferredJobLocation.length > 0) ||
    (prefs.preferredEmploymentType && prefs.preferredEmploymentType.length > 0)
  );

  if (hasPreferences) {
    percentage += 10;
    completedSections.push('Job Preferences');
    breakdown.jobPreferences = { score: 10, max: 10, completed: true };
  } else {
    remainingSections.push('Job Preferences');
    breakdown.jobPreferences = { score: 0, max: 10, completed: false };
  }

  // 6. Verification Documents (10%)
  const hasDocs = documentsCount > 0;
  if (hasDocs) {
    percentage += 10;
    completedSections.push('Supporting Documents');
    breakdown.documents = { score: 10, max: 10, completed: true };
  } else {
    remainingSections.push('Supporting Documents (Upload at least 1 document)');
    breakdown.documents = { score: 0, max: 10, completed: false };
  }

  // Clamp 0 to 100
  percentage = Math.min(Math.max(percentage, 0), 100);

  return {
    percentage,
    completedSections,
    remainingSections,
    breakdown,
  };
};
