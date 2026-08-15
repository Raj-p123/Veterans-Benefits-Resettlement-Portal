import { Employer } from '../models/Employer.js';
import { Job, JOB_STATUS } from '../models/Job.js';
import { JobApplication, JOB_APPLICATION_STATUS } from '../models/JobApplication.js';
import { Veteran } from '../models/Veteran.js';
import { User } from '../models/User.js';
import { generateEmployerId } from '../utils/employerIdGenerator.js';
import { generateJobId } from '../utils/jobIdGenerator.js';
import { notificationService } from '../services/notification.service.js';
import { socketService } from '../services/socketService.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { config } from '../config/environment.js';

/**
 * Get profile for authenticated employer
 */
export const getEmployerProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const employer = await Employer.findOne({ user: userId });

    return sendSuccess(res, 'Employer profile retrieved successfully', {
      employer: employer ? employer.toJSON() : null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update employer profile
 */
export const saveEmployerProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      companyName,
      companyDescription,
      industry,
      companySize,
      website,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      logo,
      contactPerson,
    } = req.body;

    if (!companyName || !companyDescription || !industry || !email || !phone || !city || !state) {
      throw ApiError.badRequest(
        'Please provide all required company details (companyName, description, industry, email, phone, city, state)'
      );
    }

    if (!contactPerson || !contactPerson.name || !contactPerson.designation) {
      throw ApiError.badRequest(
        'Contact person details (name and designation) are required'
      );
    }

    let employer = await Employer.findOne({ user: userId });

    if (!employer) {
      const employerId = await generateEmployerId();
      employer = await Employer.create({
        user: userId,
        employerId,
        companyName,
        companyDescription,
        industry,
        companySize: companySize || '51-200 Employees',
        website: website || '',
        email,
        phone,
        address: address || '',
        city,
        state,
        country: country || 'India',
        postalCode: postalCode || '',
        logo: logo || '',
        contactPerson,
        verificationStatus: 'PENDING',
        isActive: true,
      });

      return sendCreated(res, 'Employer profile created successfully', {
        employer: employer.toJSON(),
      });
    }

    // Update existing profile (preserve verificationStatus & employerId)
    employer.companyName = companyName;
    employer.companyDescription = companyDescription;
    employer.industry = industry;
    if (companySize) employer.companySize = companySize;
    if (website !== undefined) employer.website = website;
    employer.email = email;
    employer.phone = phone;
    if (address !== undefined) employer.address = address;
    employer.city = city;
    employer.state = state;
    if (country !== undefined) employer.country = country;
    if (postalCode !== undefined) employer.postalCode = postalCode;
    if (logo !== undefined) employer.logo = logo;
    employer.contactPerson = contactPerson;

    await employer.save();

    return sendSuccess(res, 'Employer profile updated successfully', {
      employer: employer.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new Job posting
 */
export const createJob = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let employer = await Employer.findOne({ user: userId });

    if (!employer) {
      const employerId = await generateEmployerId();
      employer = await Employer.create({
        user: userId,
        employerId,
        companyName: req.user.name || 'Corporate Employer',
        companyDescription: 'Registered Corporate Partner',
        industry: req.body.industry || 'Defense & Security',
        email: req.user.email,
        phone: req.user.phone || '9876543210',
        city: req.body.city || 'Pune',
        state: req.body.state || 'Maharashtra',
        country: req.body.country || 'India',
        verificationStatus: 'PENDING',
        isActive: true,
      });
    }

    const {
      title,
      description,
      industry,
      location,
      city,
      state,
      country,
      employmentType,
      workMode,
      salaryMin,
      salaryMax,
      salaryCurrency,
      experienceMin,
      experienceMax,
      education,
      requiredSkills,
      preferredSkills,
      responsibilities,
      requirements,
      benefits,
      openings,
      applicationDeadline,
      status,
      featured,
    } = req.body;

    if (!title || !description || !industry || !location || !city || !state) {
      throw ApiError.badRequest(
        'Please provide all required fields: title, description, industry, location, city, state'
      );
    }

    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax && salaryMax > 0) {
      throw ApiError.badRequest('Minimum salary cannot be greater than maximum salary');
    }

    if (experienceMin !== undefined && experienceMax !== undefined && experienceMin > experienceMax) {
      throw ApiError.badRequest('Minimum experience cannot exceed maximum experience');
    }

    if (applicationDeadline) {
      const deadlineDate = new Date(applicationDeadline);
      if (deadlineDate < new Date() && status === 'ACTIVE') {
        throw ApiError.badRequest('Application deadline cannot be in the past for an active job');
      }
    }

    const jobId = await generateJobId();

    const job = await Job.create({
      jobId,
      employer: employer._id,
      title,
      description,
      industry: industry || employer.industry,
      location,
      city,
      state,
      country: country || 'India',
      employmentType: employmentType || 'FULL_TIME',
      workMode: workMode || 'ONSITE',
      salaryMin: salaryMin || 0,
      salaryMax: salaryMax || 0,
      salaryCurrency: salaryCurrency || 'INR',
      experienceMin: experienceMin || 0,
      experienceMax: experienceMax || 30,
      education: education || 'Any Graduate / Defense Certified',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      benefits: Array.isArray(benefits) ? benefits : [],
      openings: openings || 1,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      status: status || 'ACTIVE',
      featured: Boolean(featured),
    });

    const populated = await Job.findById(job._id).populate('employer');

    // Emit real-time job creation and dashboard update events
    socketService.emitToUser(userId, SOCKET_EVENTS.JOB_CREATED, {
      jobId: job.jobId,
      title: job.title,
      status: job.status,
    });
    socketService.emitToUser(userId, SOCKET_EVENTS.DASHBOARD_UPDATED, { module: 'employer_jobs' });
    socketService.emitToRole('VETERAN', SOCKET_EVENTS.JOB_CREATED, {
      jobId: job.jobId,
      title: job.title,
      companyName: employer.companyName,
      city: job.city,
      state: job.state,
    });
    socketService.emitToRole('ADMIN', 'admin:jobCreated', {
      jobId: job.jobId,
      title: job.title,
      companyName: employer.companyName,
      city: job.city,
      state: job.state,
      status: job.status,
    });
    socketService.emitToRole('ADMIN', 'admin:dashboardUpdated', { module: 'jobs' });

    return sendCreated(res, 'Job posted successfully', {
      job: populated.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all jobs posted by the authenticated employer
 */
export const getEmployerJobs = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const employer = await Employer.findOne({ user: userId });

    if (!employer) {
      return sendSuccess(res, 'No employer profile', {
        jobs: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        counts: { total: 0, active: 0, draft: 0, paused: 0, closed: 0 },
      });
    }

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const { status, search } = req.query;

    const filter = { employer: employer._id };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: new RegExp(search.trim(), 'i') },
        { jobId: new RegExp(search.trim(), 'i') },
      ];
    }

    const [jobs, total, allEmployerJobs] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('employer'),
      Job.countDocuments(filter),
      Job.find({ employer: employer._id }, 'status'),
    ]);

    // Aggregate applicant counts dynamically for each job
    const jobIds = jobs.map((j) => j._id);
    const appCounts = await JobApplication.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$job', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    appCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const jobsWithCounts = jobs.map((j) => {
      const json = j.toJSON();
      json.applicantCount = countMap[j._id.toString()] || 0;
      return json;
    });

    const counts = {
      total: allEmployerJobs.length,
      active: allEmployerJobs.filter((j) => j.status === 'ACTIVE').length,
      draft: allEmployerJobs.filter((j) => j.status === 'DRAFT').length,
      paused: allEmployerJobs.filter((j) => j.status === 'PAUSED').length,
      closed: allEmployerJobs.filter((j) => j.status === 'CLOSED').length,
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Employer jobs retrieved successfully', {
      jobs: jobsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      counts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single job for editing/view by the owner employer
 */
export const getEmployerJobById = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const employer = await Employer.findOne({ user: userId });
    if (!employer) {
      throw ApiError.forbidden('Employer profile required');
    }

    let job = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      job = await Job.findById(id);
    }
    if (!job) {
      job = await Job.findOne({ jobId: id });
    }

    if (!job) {
      throw ApiError.notFound('Job record not found');
    }

    // Ownership check
    if (job.employer.toString() !== employer._id.toString() && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to manage this job');
    }

    const populated = await Job.findById(job._id).populate('employer');
    const applicantCount = await JobApplication.countDocuments({ job: job._id });
    const jobJson = populated.toJSON();
    jobJson.applicantCount = applicantCount;

    return sendSuccess(res, 'Job details retrieved', { job: jobJson });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing job
 */
export const updateJob = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const employer = await Employer.findOne({ user: userId });
    if (!employer) {
      throw ApiError.forbidden('Employer profile required');
    }

    let job = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      job = await Job.findById(id);
    }
    if (!job) {
      job = await Job.findOne({ jobId: id });
    }

    if (!job) {
      throw ApiError.notFound('Job record not found');
    }

    // Ownership check
    if (job.employer.toString() !== employer._id.toString()) {
      throw ApiError.forbidden('You can only modify jobs posted by your organization');
    }

    const {
      title,
      description,
      industry,
      location,
      city,
      state,
      employmentType,
      workMode,
      salaryMin,
      salaryMax,
      experienceMin,
      experienceMax,
      education,
      requiredSkills,
      preferredSkills,
      responsibilities,
      requirements,
      benefits,
      openings,
      applicationDeadline,
      status,
      featured,
    } = req.body;

    if (title) job.title = title;
    if (description) job.description = description;
    if (industry) job.industry = industry;
    if (location) job.location = location;
    if (city) job.city = city;
    if (state) job.state = state;
    if (employmentType) job.employmentType = employmentType;
    if (workMode) job.workMode = workMode;
    if (salaryMin !== undefined) job.salaryMin = salaryMin;
    if (salaryMax !== undefined) job.salaryMax = salaryMax;
    if (experienceMin !== undefined) job.experienceMin = experienceMin;
    if (experienceMax !== undefined) job.experienceMax = experienceMax;
    if (education) job.education = education;
    if (Array.isArray(requiredSkills)) job.requiredSkills = requiredSkills;
    if (Array.isArray(preferredSkills)) job.preferredSkills = preferredSkills;
    if (Array.isArray(responsibilities)) job.responsibilities = responsibilities;
    if (Array.isArray(requirements)) job.requirements = requirements;
    if (Array.isArray(benefits)) job.benefits = benefits;
    if (openings !== undefined) job.openings = openings;
    if (applicationDeadline !== undefined) {
      job.applicationDeadline = applicationDeadline ? new Date(applicationDeadline) : null;
    }
    if (status && JOB_STATUS.includes(status)) job.status = status;
    if (featured !== undefined) job.featured = Boolean(featured);

    await job.save();

    const populated = await Job.findById(job._id).populate('employer');

    return sendSuccess(res, 'Job updated successfully', { job: populated.toJSON() });
  } catch (error) {
    next(error);
  }
};

/**
 * Change Job status (e.g. PAUSED, CLOSED, ACTIVE)
 */
export const updateJobStatus = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !JOB_STATUS.includes(status)) {
      throw ApiError.badRequest(`Invalid status. Allowed: ${JOB_STATUS.join(', ')}`);
    }

    const employer = await Employer.findOne({ user: userId });
    if (!employer) throw ApiError.forbidden('Employer profile required');

    let job = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      job = await Job.findById(id);
    }
    if (!job) {
      job = await Job.findOne({ jobId: id });
    }

    if (!job) throw ApiError.notFound('Job not found');

    if (job.employer.toString() !== employer._id.toString() && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to modify this job');
    }

    job.status = status;
    await job.save();

    return sendSuccess(res, `Job status updated to ${status}`, { job: job.toJSON() });
  } catch (error) {
    next(error);
  }
};

/**
 * Get applicants for a specific job owned by the employer
 */
export const getJobApplicants = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { jobId } = req.params;

    const employer = await Employer.findOne({ user: userId });
    if (!employer) throw ApiError.forbidden('Employer profile required');

    let job = null;
    if (jobId.match(/^[0-9a-fA-F]{24}$/)) {
      job = await Job.findById(jobId);
    }
    if (!job) {
      job = await Job.findOne({ jobId });
    }

    if (!job) throw ApiError.notFound('Job record not found');

    if (job.employer.toString() !== employer._id.toString() && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to view applicants for this job');
    }

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const { status, search } = req.query;
    const filter = { job: job._id };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const [applications, total, allJobApps] = await Promise.all([
      JobApplication.find(filter)
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('veteran')
        .populate('job', 'title jobId location employmentType'),
      JobApplication.countDocuments(filter),
      JobApplication.find({ job: job._id }, 'status'),
    ]);

    const counts = {
      total: allJobApps.length,
      applied: allJobApps.filter((a) => a.status === 'APPLIED').length,
      underReview: allJobApps.filter((a) => a.status === 'UNDER_REVIEW').length,
      shortlisted: allJobApps.filter((a) => a.status === 'SHORTLISTED').length,
      interview: allJobApps.filter((a) => a.status === 'INTERVIEW').length,
      selected: allJobApps.filter((a) => a.status === 'SELECTED').length,
      rejected: allJobApps.filter((a) => a.status === 'REJECTED').length,
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Applicants retrieved successfully', {
      job: job.toJSON(),
      applications: applications.map((a) => a.toJSON()),
      pagination: { page, limit, total, totalPages },
      counts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get applicant detailed profile dossier
 */
export const getApplicantDetail = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const employer = await Employer.findOne({ user: userId });
    if (!employer && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('Employer authorization required');
    }

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await JobApplication.findById(id);
    }
    if (!application) {
      application = await JobApplication.findOne({ applicationId: id });
    }

    if (!application) throw ApiError.notFound('Job application not found');

    if (
      employer &&
      application.employer.toString() !== employer._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      throw ApiError.forbidden('You do not have permission to view this applicant');
    }

    const populated = await JobApplication.findById(application._id)
      .populate('veteran')
      .populate('job')
      .populate('employer');

    return sendSuccess(res, 'Applicant dossier retrieved', {
      application: populated.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Employer status update for an applicant (SHORTLIST, INTERVIEW, SELECT, REJECT)
 */
export const updateApplicantStatus = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { status, employerRemarks } = req.body;

    if (!status || !JOB_APPLICATION_STATUS.includes(status)) {
      throw ApiError.badRequest(`Invalid status. Allowed: ${JOB_APPLICATION_STATUS.join(', ')}`);
    }

    const employer = await Employer.findOne({ user: userId });
    if (!employer && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('Employer profile required');
    }

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await JobApplication.findById(id);
    }
    if (!application) {
      application = await JobApplication.findOne({ applicationId: id });
    }

    if (!application) throw ApiError.notFound('Job application not found');

    if (
      employer &&
      application.employer.toString() !== employer._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      throw ApiError.forbidden('You do not have permission to update this applicant');
    }

    // Validate allowed status transitions
    const allowedTransitions = {
      APPLIED: ['UNDER_REVIEW', 'SHORTLISTED', 'REJECTED'],
      UNDER_REVIEW: ['SHORTLISTED', 'REJECTED'],
      SHORTLISTED: ['INTERVIEW', 'REJECTED'],
      INTERVIEW: ['SELECTED', 'REJECTED'],
      SELECTED: [],
      REJECTED: [],
      WITHDRAWN: [],
    };

    if (
      req.user.role !== 'ADMIN' &&
      allowedTransitions[application.status] &&
      !allowedTransitions[application.status].includes(status)
    ) {
      throw ApiError.badRequest(
        `Invalid status transition from ${application.status} to ${status}. Allowed: ${allowedTransitions[
          application.status
        ].join(', ')}`
      );
    }

    application.status = status;
    if (employerRemarks) application.employerRemarks = employerRemarks.trim();

    application.timeline.push({
      status,
      message:
        employerRemarks?.trim() ||
        `Candidate status updated to ${status.replace('_', ' ')} by recruiter.`,
      changedAt: new Date(),
      changedBy: userId,
    });

    await application.save();

    const populated = await JobApplication.findById(application._id)
      .populate('veteran')
      .populate('job');

    // Notify Veteran in Real-Time
    const veteranDoc = await Veteran.findById(application.veteran);
    const jobDoc = await Job.findById(application.job);
    const veteranUser = veteranDoc?.user ? await User.findById(veteranDoc.user) : null;

    if (veteranDoc && veteranDoc.user) {
      await notificationService.createNotification({
        userId: veteranDoc.user,
        type: 'JOB_APPLICATION_STATUS_CHANGED',
        title: `Application ${status.replace('_', ' ')}`,
        message: `Your application for "${jobDoc?.title || 'Job'}" has been updated to "${status.replace('_', ' ')}".${employerRemarks ? ` Note: ${employerRemarks}` : ''}`,
        entityType: 'JOB_APPLICATION',
        entityId: application.applicationId,
        actionUrl: `/veteran/job-applications/${application.applicationId}`,
        emailDetails: veteranUser?.email
          ? {
              toEmail: veteranUser.email,
              templateType: 'JOB_STATUS_CHANGED',
              data: {
                veteranName: veteranUser.name || 'Veteran Candidate',
                jobTitle: jobDoc?.title || 'Job Role',
                companyName: employer?.companyName || 'Employer',
                applicationId: application.applicationId,
                newStatus: status,
                employerRemarks,
                actionUrl: `${config.clientUrl}/veteran/job-applications/${application.applicationId}`,
              },
            }
          : null,
      });

      // Emit real-time status update to Veteran's room
      socketService.emitToUser(veteranDoc.user, SOCKET_EVENTS.JOB_APPLICATION_STATUS_CHANGED, {
        applicationId: application.applicationId,
        status,
        employerRemarks,
        timeline: application.timeline,
      });

      socketService.emitToUser(veteranDoc.user, SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, {
        applicationId: application.applicationId,
        status,
        employerRemarks,
        timeline: application.timeline,
      });

      socketService.emitToUser(veteranDoc.user, SOCKET_EVENTS.DASHBOARD_UPDATED, {
        module: 'veteran_dashboard',
      });
    }

    socketService.emitToUser(userId, SOCKET_EVENTS.DASHBOARD_UPDATED, {
      module: 'employer_dashboard',
    });

    return sendSuccess(res, `Applicant status updated to ${status}`, {
      application: populated.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get summary metrics for Employer Dashboard
 */
export const getEmployerDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const employer = await Employer.findOne({ user: userId });

    if (!employer) {
      return sendSuccess(res, 'Employer stats', {
        activeJobs: 0,
        draftJobs: 0,
        totalJobs: 0,
        totalApplicants: 0,
        underReview: 0,
        shortlisted: 0,
        interview: 0,
        selected: 0,
        recentApplications: [],
        recentJobs: [],
      });
    }

    const [jobs, applications] = await Promise.all([
      Job.find({ employer: employer._id }).sort({ createdAt: -1 }),
      JobApplication.find({ employer: employer._id })
        .sort({ appliedAt: -1 })
        .populate('veteran')
        .populate('job', 'title jobId location'),
    ]);

    const stats = {
      activeJobs: jobs.filter((j) => j.status === 'ACTIVE').length,
      draftJobs: jobs.filter((j) => j.status === 'DRAFT').length,
      totalJobs: jobs.length,
      totalApplicants: applications.length,
      underReview: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
      shortlisted: applications.filter((a) => a.status === 'SHORTLISTED').length,
      interview: applications.filter((a) => a.status === 'INTERVIEW').length,
      selected: applications.filter((a) => a.status === 'SELECTED').length,
      recentApplications: applications.slice(0, 5).map((a) => a.toJSON()),
      recentJobs: jobs.slice(0, 5).map((j) => j.toJSON()),
    };

    return sendSuccess(res, 'Employer dashboard stats retrieved', stats);
  } catch (error) {
    next(error);
  }
};
