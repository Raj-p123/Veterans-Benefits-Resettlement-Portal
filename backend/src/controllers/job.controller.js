import { Job } from '../models/Job.js';
import { Employer } from '../models/Employer.js';
import { JobApplication, JOB_APPLICATION_STATUS } from '../models/JobApplication.js';
import { SavedJob } from '../models/SavedJob.js';
import { Veteran } from '../models/Veteran.js';
import { generateJobApplicationId } from '../utils/jobApplicationIdGenerator.js';
import { calculateJobMatch } from '../services/jobMatching.service.js';
import { notificationService } from '../services/notification.service.js';
import { socketService } from '../services/socketService.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { config } from '../config/environment.js';

import { calculateHaversineDistance, geocodeLocation, KNOWN_LOCATIONS } from '../services/geocodingService.js';

/**
 * Public paginated & filtered job search with Leaflet coordinates & distance calculation
 */
export const getPublicJobs = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 50);
    const skip = (page - 1) * limit;

    const {
      search,
      industry,
      location,
      city,
      state,
      employmentType,
      workMode,
      salaryMin,
      salaryMax,
      experience,
      featured,
      lat,
      lng,
      radius, // in km (e.g. 10, 25, 50, 100)
      sortBy = 'newest',
    } = req.query;

    const filter = { status: 'ACTIVE' };

    if (featured === 'true') filter.featured = true;
    if (industry && industry !== 'All') filter.industry = industry;
    if (employmentType && employmentType !== 'All') filter.employmentType = employmentType;
    if (workMode && workMode !== 'All') filter.workMode = workMode;

    if (city && city !== 'All') {
      filter.city = new RegExp(city.trim(), 'i');
    }
    if (state && state !== 'All') {
      filter.state = new RegExp(state.trim(), 'i');
    }
    if (location && location !== 'All') {
      filter.$or = [
        { location: new RegExp(location.trim(), 'i') },
        { city: new RegExp(location.trim(), 'i') },
        { state: new RegExp(location.trim(), 'i') },
        { address: new RegExp(location.trim(), 'i') },
      ];
    }

    if (salaryMin) {
      filter.salaryMax = { $gte: Number(salaryMin) };
    }
    if (salaryMax) {
      filter.salaryMin = { $lte: Number(salaryMax) };
    }

    if (experience) {
      filter.experienceMin = { $lte: Number(experience) };
    }

    // Text search query
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // Sort order
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'deadline') sortOptions = { applicationDeadline: 1 };
    if (sortBy === 'salaryHigh') sortOptions = { salaryMax: -1 };
    if (sortBy === 'salaryLow') sortOptions = { salaryMin: 1 };

    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;
    const hasUserCoords = userLat !== null && !isNaN(userLat) && userLng !== null && !isNaN(userLng);
    const searchRadiusKm = radius ? parseFloat(radius) : null;

    // Fetch all active matching jobs
    const allMatchingJobs = await Job.find(filter)
      .sort(sortOptions)
      .populate('employer', 'companyName industry city state logo employerId verificationStatus');

    // If veteran is logged in, attach match scores & saved status dynamically
    let veteran = null;
    let savedJobIds = [];
    if (req.user && req.user.role === 'VETERAN') {
      veteran = await Veteran.findOne({ user: req.user._id || req.user.id });
      const saved = await SavedJob.find({ user: req.user._id || req.user.id }, 'job');
      savedJobIds = saved.map((s) => s.job.toString());
    }

    // Process jobs, attach distance and coordinates
    let enhancedJobs = allMatchingJobs.map((job) => {
      const json = job.toJSON();
      json.isSaved = savedJobIds.includes(job._id.toString());
      if (veteran) {
        const match = calculateJobMatch(veteran, job);
        json.matchPercentage = match.matchPercentage;
      }

      // Ensure coordinates exist from known hubs fallback if missing
      if (!json.latitude || !json.longitude) {
        const cityKey = (json.city || '').toLowerCase().trim();
        if (KNOWN_LOCATIONS[cityKey]) {
          json.latitude = KNOWN_LOCATIONS[cityKey].lat;
          json.longitude = KNOWN_LOCATIONS[cityKey].lng;
        }
      }

      // Calculate distance if user coords provided
      if (hasUserCoords && json.latitude && json.longitude) {
        const dist = calculateHaversineDistance(userLat, userLng, json.latitude, json.longitude);
        json.distanceKm = dist;
        json.distanceText = dist !== null ? `${dist} km away` : null;
      } else {
        json.distanceKm = null;
        json.distanceText = null;
      }

      return json;
    });

    // Filter by radius if user coords and radius are provided
    if (hasUserCoords && searchRadiusKm && !isNaN(searchRadiusKm)) {
      enhancedJobs = enhancedJobs.filter((job) => {
        if (job.distanceKm === null) return true; // keep jobs without distance
        return job.distanceKm <= searchRadiusKm;
      });
    }

    // If sortBy === 'distance', sort jobs by distanceKm
    if (hasUserCoords && sortBy === 'distance') {
      enhancedJobs.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    const total = enhancedJobs.length;
    const paginatedJobs = enhancedJobs.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    // Filter jobs for Leaflet Map (must have valid coordinates)
    const mapJobs = enhancedJobs.filter((j) => j.latitude && j.longitude);

    return sendSuccess(res, 'Jobs retrieved successfully', {
      jobs: paginatedJobs,
      mapJobs, // Jobs ready for Leaflet Map pins
      userLocation: hasUserCoords ? { latitude: userLat, longitude: userLng } : null,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Nearby Jobs based on latitude, longitude & radius
 */
export const getNearbyJobs = async (req, res, next) => {
  req.query.sortBy = 'distance';
  return getPublicJobs(req, res, next);
};

/**
 * Get Featured Jobs
 */
export const getFeaturedJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ status: 'ACTIVE', featured: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('employer', 'companyName industry city state logo verificationStatus');

    return sendSuccess(res, 'Featured jobs retrieved', {
      jobs: jobs.map((j) => j.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Personalized Job Recommendations for Authenticated Veteran
 */
export const getRecommendedJobs = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const veteran = await Veteran.findOne({ user: userId });

    if (!veteran) {
      throw ApiError.badRequest('Please complete your service profile to view job recommendations');
    }

    const activeJobs = await Job.find({ status: 'ACTIVE' })
      .populate('employer', 'companyName industry city state logo verificationStatus');

    const saved = await SavedJob.find({ user: userId }, 'job');
    const savedJobIds = saved.map((s) => s.job.toString());

    const scoredJobs = activeJobs.map((job) => {
      const match = calculateJobMatch(veteran, job);
      const json = job.toJSON();
      json.isSaved = savedJobIds.includes(job._id.toString());
      return {
        job: json,
        matchPercentage: match.matchPercentage,
        matchedFactors: match.matchedFactors,
        missingFactors: match.missingFactors,
      };
    });

    // Sort descending by match score
    scoredJobs.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return sendSuccess(res, 'Job recommendations retrieved', {
      jobs: scoredJobs.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single Job details by ID
 */
export const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let job = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      job = await Job.findById(id);
    }
    if (!job) {
      job = await Job.findOne({ jobId: id });
    }

    if (!job) {
      throw ApiError.notFound('Job posting not found');
    }

    const populated = await Job.findById(job._id).populate('employer');
    const json = populated.toJSON();

    // Check if authenticated veteran has applied or saved this job
    if (req.user && req.user.role === 'VETERAN') {
      const userId = req.user._id || req.user.id;
      const veteran = await Veteran.findOne({ user: userId });

      if (veteran) {
        const existingApp = await JobApplication.findOne({
          veteran: veteran._id,
          job: job._id,
        });
        if (existingApp) {
          json.existingApplication = existingApp.toJSON();
        }

        const isSaved = await SavedJob.exists({ user: userId, job: job._id });
        json.isSaved = Boolean(isSaved);

        const match = calculateJobMatch(veteran, job);
        json.matchDetails = match;
      }
    }

    return sendSuccess(res, 'Job details retrieved successfully', { job: json });
  } catch (error) {
    next(error);
  }
};

/**
 * Save / Bookmark a Job
 */
export const saveJob = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let job = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) job = await Job.findById(id);
    if (!job) job = await Job.findOne({ jobId: id });

    if (!job) throw ApiError.notFound('Job posting not found');

    const veteran = await Veteran.findOne({ user: userId });
    if (!veteran) throw ApiError.badRequest('Veteran profile required');

    const existing = await SavedJob.findOne({ user: userId, job: job._id });
    if (existing) {
      return sendSuccess(res, 'Job already saved', { savedJob: existing.toJSON() });
    }

    const saved = await SavedJob.create({
      user: userId,
      veteran: veteran._id,
      job: job._id,
    });

    return sendCreated(res, 'Job bookmarked successfully', { savedJob: saved.toJSON() });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove saved Job bookmark
 */
export const unsaveJob = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let job = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) job = await Job.findById(id);
    if (!job) job = await Job.findOne({ jobId: id });

    if (!job) throw ApiError.notFound('Job posting not found');

    await SavedJob.findOneAndDelete({ user: userId, job: job._id });

    return sendSuccess(res, 'Job removed from saved bookmarks', { jobId: job.jobId });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all Saved Jobs for current veteran
 */
export const getSavedJobs = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const savedList = await SavedJob.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'job',
        populate: { path: 'employer', select: 'companyName industry city state logo verificationStatus' },
      });

    const jobs = savedList.filter((s) => s.job).map((s) => ({
      ...s.job.toJSON(),
      isSaved: true,
      savedAt: s.createdAt,
    }));

    return sendSuccess(res, 'Saved jobs retrieved', { jobs, total: jobs.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Veteran applies for a Job
 */
export const applyForJob = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { jobId } = req.params;
    const { coverLetter, resumeDocument, additionalDocuments } = req.body;

    let job = null;
    if (jobId.match(/^[0-9a-fA-F]{24}$/)) job = await Job.findById(jobId);
    if (!job) job = await Job.findOne({ jobId });

    if (!job) throw ApiError.notFound('Job posting not found');

    if (job.status !== 'ACTIVE') {
      throw ApiError.badRequest('This job posting is no longer accepting applications');
    }

    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      throw ApiError.badRequest('The application deadline for this job posting has passed');
    }

    const veteran = await Veteran.findOne({ user: userId });
    if (!veteran) {
      throw ApiError.badRequest('Please complete your service profile before applying for jobs');
    }

    // Check for existing active application
    const existing = await JobApplication.findOne({
      veteran: veteran._id,
      job: job._id,
      status: { $in: ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'] },
    });

    if (existing) {
      throw ApiError.badRequest(
        `You have already applied for this job (Application ID: ${existing.applicationId}) with status: ${existing.status}.`
      );
    }

    const applicationId = await generateJobApplicationId();

    const application = await JobApplication.create({
      applicationId,
      job: job._id,
      veteran: veteran._id,
      employer: job.employer,
      coverLetter: coverLetter?.trim() || '',
      resumeDocument: resumeDocument || null,
      additionalDocuments: Array.isArray(additionalDocuments) ? additionalDocuments : [],
      status: 'APPLIED',
      timeline: [
        {
          status: 'APPLIED',
          message: 'Job application officially submitted to employer portal.',
          changedAt: new Date(),
          changedBy: userId,
        },
      ],
      appliedAt: new Date(),
    });

    // Increment applicant count on Job record
    job.applicantCount = (job.applicantCount || 0) + 1;
    await job.save();

    const populated = await JobApplication.findById(application._id)
      .populate('job')
      .populate('employer')
      .populate('veteran');

    const employerDoc = await Employer.findById(job.employer);
    const candidateName = veteran.personalInformation?.fullName || req.user.name;

    // 1. Notify Employer Recruiter in Real-Time
    if (employerDoc && employerDoc.user) {
      await notificationService.createNotification({
        userId: employerDoc.user,
        type: 'JOB_APPLICATION_RECEIVED',
        title: `New Applicant: ${job.title}`,
        message: `Veteran candidate ${candidateName} has applied for "${job.title}".`,
        entityType: 'JOB_APPLICATION',
        entityId: application.applicationId,
        actionUrl: `/employer/applications/${application.applicationId}`,
        emailDetails: employerDoc.email
          ? {
              toEmail: employerDoc.email,
              templateType: 'JOB_RECEIVED',
              data: {
                applicantName: candidateName,
                veteranId: veteran.veteranId,
                jobTitle: job.title,
                applicationId: application.applicationId,
                applicationDate: application.appliedAt,
                actionUrl: `${config.clientUrl}/employer/applications/${application.applicationId}`,
              },
            }
          : null,
      });

      // Emit real-time applicant update to employer's user room
      socketService.emitToUser(employerDoc.user, SOCKET_EVENTS.JOB_APPLICATION_CREATED, {
        applicationId: application.applicationId,
        jobId: job.jobId,
        jobTitle: job.title,
        applicantCount: job.applicantCount,
        application: populated.toJSON(),
      });

      socketService.emitToUser(employerDoc.user, SOCKET_EVENTS.DASHBOARD_UPDATED, {
        module: 'employer_dashboard',
        jobId: job.jobId,
      });
    }

    // 2. Notify Veteran
    await notificationService.createNotification({
      userId,
      type: 'APPLICATION_SUBMITTED',
      title: 'Job Application Submitted',
      message: `Your application for "${job.title}" at ${employerDoc?.companyName || 'Employer'} (${application.applicationId}) has been successfully submitted.`,
      entityType: 'JOB_APPLICATION',
      entityId: application.applicationId,
      actionUrl: `/veteran/job-applications/${application.applicationId}`,
      emailDetails: req.user.email
        ? {
            toEmail: req.user.email,
            templateType: 'JOB_SUBMITTED',
            data: {
              veteranName: req.user.name,
              jobTitle: job.title,
              companyName: employerDoc?.companyName || 'Employer',
              applicationId: application.applicationId,
              applicationDate: application.appliedAt,
              status: 'APPLIED',
              actionUrl: `${config.clientUrl}/veteran/job-applications/${application.applicationId}`,
            },
          }
        : null,
    });

    socketService.emitToUser(userId, SOCKET_EVENTS.DASHBOARD_UPDATED, { module: 'veteran_dashboard' });

    // Emit to job room if recruiters are viewing candidate table
    socketService.emitToRoom(`job:${job.jobId}`, SOCKET_EVENTS.JOB_APPLICATION_CREATED, {
      applicationId: application.applicationId,
      jobId: job.jobId,
      applicantCount: job.applicantCount,
    });

    // Emit to ADMIN role
    socketService.emitToRole('ADMIN', 'admin:applicationCreated', {
      type: 'JOB',
      applicationId: application.applicationId,
      jobId: job.jobId,
      jobTitle: job.title,
      candidateName,
    });
    socketService.emitToRole('ADMIN', 'admin:dashboardUpdated', { module: 'job_applications' });

    return sendCreated(res, 'Job application submitted successfully!', {
      application: populated.toJSON(),
      applicationId: application.applicationId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all job applications for authenticated veteran
 */
export const getMyJobApplications = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const veteran = await Veteran.findOne({ user: userId });

    if (!veteran) {
      return sendSuccess(res, 'No veteran profile', {
        applications: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        counts: { total: 0, applied: 0, underReview: 0, shortlisted: 0, interview: 0, selected: 0, rejected: 0, withdrawn: 0 },
      });
    }

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const { status, search } = req.query;
    const filter = { veteran: veteran._id };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search && search.trim()) {
      filter.$or = [{ applicationId: new RegExp(search.trim(), 'i') }];
    }

    const [applications, total, allApps] = await Promise.all([
      JobApplication.find(filter)
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'job',
          populate: { path: 'employer', select: 'companyName logo industry city state verificationStatus' },
        }),
      JobApplication.countDocuments(filter),
      JobApplication.find({ veteran: veteran._id }, 'status'),
    ]);

    const counts = {
      total: allApps.length,
      applied: allApps.filter((a) => a.status === 'APPLIED').length,
      underReview: allApps.filter((a) => a.status === 'UNDER_REVIEW').length,
      shortlisted: allApps.filter((a) => a.status === 'SHORTLISTED').length,
      interview: allApps.filter((a) => a.status === 'INTERVIEW').length,
      selected: allApps.filter((a) => a.status === 'SELECTED').length,
      rejected: allApps.filter((a) => a.status === 'REJECTED').length,
      withdrawn: allApps.filter((a) => a.status === 'WITHDRAWN').length,
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Job applications retrieved successfully', {
      applications: applications.map((a) => a.toJSON()),
      pagination: { page, limit, total, totalPages },
      counts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single job application detail for veteran or employer
 */
export const getJobApplicationDetail = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await JobApplication.findById(id);
    }
    if (!application) {
      application = await JobApplication.findOne({ applicationId: id });
    }

    if (!application) throw ApiError.notFound('Job application not found');

    const veteran = await Veteran.findOne({ user: userId });
    const employer = await Employer.findOne({ user: userId });

    const isVeteranOwner = veteran && application.veteran.toString() === veteran._id.toString();
    const isEmployerOwner = employer && application.employer.toString() === employer._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isVeteranOwner && !isEmployerOwner && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to view this application');
    }

    const populated = await JobApplication.findById(application._id)
      .populate('job')
      .populate('employer')
      .populate('veteran');

    return sendSuccess(res, 'Job application details retrieved', {
      application: populated.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Veteran withdraws job application
 */
export const withdrawJobApplication = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await JobApplication.findById(id);
    }
    if (!application) {
      application = await JobApplication.findOne({ applicationId: id });
    }

    if (!application) throw ApiError.notFound('Job application not found');

    const veteran = await Veteran.findOne({ user: userId });
    if (!veteran || application.veteran.toString() !== veteran._id.toString()) {
      throw ApiError.forbidden('You can only withdraw your own applications');
    }

    if (!['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(application.status)) {
      throw ApiError.badRequest(
        `Application cannot be withdrawn in its current status (${application.status}).`
      );
    }

    application.status = 'WITHDRAWN';
    application.timeline.push({
      status: 'WITHDRAWN',
      message: 'Job application withdrawn by candidate.',
      changedAt: new Date(),
      changedBy: userId,
    });

    await application.save();

    return sendSuccess(res, 'Job application withdrawn successfully', {
      application: application.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
