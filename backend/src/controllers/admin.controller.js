import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Veteran } from '../models/Veteran.js';
import { Employer } from '../models/Employer.js';
import { Document, DOCUMENT_STATUS } from '../models/Document.js';
import { Scheme } from '../models/Scheme.js';
import { Job, JOB_STATUS } from '../models/Job.js';
import { Application, APPLICATION_STATUS } from '../models/Application.js';
import { JobApplication, JOB_APPLICATION_STATUS } from '../models/JobApplication.js';
import { AuditLog } from '../models/AuditLog.js';
import { recordAuditLog } from '../services/audit.service.js';
import { notificationService } from '../services/notification.service.js';
import { socketService } from '../services/socketService.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { generateSchemeId } from '../utils/schemeIdGenerator.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { config } from '../config/environment.js';

/**
 * Helper to parse pagination params
 */
const getPagination = (req, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || String(defaultLimit), 10), 1), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Helper to parse date range filters
 */
const getDateRangeFilter = (period, customStart, customEnd) => {
  const now = new Date();
  let startDate = null;
  let endDate = new Date(now);

  const cleanPeriod = (period || '30days').toLowerCase().trim();

  switch (cleanPeriod) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;
    case '7d':
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3m':
    case '90d':
    case '90days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6m':
    case '180d':
    case '180days':
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case '12m':
    case '365d':
    case '1year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
    case 'all_time':
      startDate = new Date(0); // Beginning of epoch
      break;
    case 'custom':
      if (customStart) startDate = new Date(customStart);
      if (customEnd) endDate = new Date(customEnd);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30 days
  }

  return { startDate, endDate };
};

/**
 * Helper to convert array of objects to CSV string
 */
const convertToCsv = (headers, rows) => {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map((h) => escapeCsv(h.label)).join(',');
  const rowLines = rows.map((row) =>
    headers.map((h) => escapeCsv(typeof h.value === 'function' ? h.value(row) : row[h.key])).join(',')
  );

  return [headerLine, ...rowLines].join('\r\n');
};

/* ==========================================================================
   1. DASHBOARD & SUMMARY STATISTICS
   ========================================================================== */

export const getDashboardStats = async (req, res, next) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      veteransCount,
      employersCount,
      activeJobsCount,
      totalJobsCount,
      expiredJobsCount,
      jobsThisWeekCount,
      jobsThisMonthCount,
      schemesCount,
      activeSchemesCount,
      schemeAppsCount,
      jobAppsCount,
      pendingVeteransCount,
      pendingEmployersCount,
      pendingDocsCount,
      approvedSchemeAppsCount,
      rejectedSchemeAppsCount,
      pendingSchemeAppsCount,
      selectedJobAppsCount,
      rejectedJobAppsCount,
      pendingJobAppsCount,
      recentVeterans,
      recentEmployers,
      recentSchemeApps,
      recentJobApps,
      recentAuditLogs,
    ] = await Promise.all([
      Veteran.countDocuments(),
      Employer.countDocuments(),
      Job.countDocuments({ status: 'ACTIVE' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'EXPIRED' }),
      Job.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Job.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
      Scheme.countDocuments(),
      Scheme.countDocuments({ status: 'ACTIVE' }),
      Application.countDocuments(),
      JobApplication.countDocuments(),
      Veteran.countDocuments({ verificationStatus: 'PENDING' }),
      Employer.countDocuments({ verificationStatus: 'PENDING' }),
      Document.countDocuments({ verificationStatus: { $in: ['UPLOADED', 'UNDER_REVIEW', 'PENDING'] } }),
      Application.countDocuments({ status: { $in: ['APPROVED', 'DISBURSED'] } }),
      Application.countDocuments({ status: 'REJECTED' }),
      Application.countDocuments({ status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION'] } }),
      JobApplication.countDocuments({ status: { $in: ['SELECTED', 'HIRED'] } }),
      JobApplication.countDocuments({ status: 'REJECTED' }),
      JobApplication.countDocuments({ status: { $in: ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW'] } }),
      Veteran.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email phone isActive isVerified'),
      Employer.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email phone isActive isVerified'),
      Application.find().sort({ createdAt: -1 }).limit(5).populate('scheme', 'name category').populate('veteran', 'veteranId personalInformation'),
      JobApplication.find().sort({ createdAt: -1 }).limit(5).populate('job', 'title jobId').populate('employer', 'companyName').populate('veteran', 'veteranId personalInformation'),
      AuditLog.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name email role'),
    ]);

    const totalApplications = schemeAppsCount + jobAppsCount;
    const totalPendingVerifications = pendingVeteransCount + pendingEmployersCount + pendingDocsCount;
    const totalPendingApplications = pendingSchemeAppsCount + pendingJobAppsCount;
    const totalApprovedApplications = approvedSchemeAppsCount + selectedJobAppsCount;
    const totalRejectedApplications = rejectedSchemeAppsCount + rejectedJobAppsCount;
    const draftSchemesCount = Math.max(schemesCount - activeSchemesCount, 0);

    return sendSuccess(res, 'Admin dashboard statistics retrieved', {
      veterans: veteransCount,
      employers: employersCount,
      activeJobs: activeJobsCount,
      totalJobs: totalJobsCount,
      expiredJobs: expiredJobsCount,
      jobsThisWeek: jobsThisWeekCount,
      jobsThisMonth: jobsThisMonthCount,
      schemes: schemesCount,
      activeSchemes: activeSchemesCount,
      draftSchemes: draftSchemesCount,
      schemeApplications: schemeAppsCount,
      jobApplications: jobAppsCount,
      totalApplications,
      pendingApplications: totalPendingApplications,
      approvedApplications: totalApprovedApplications,
      rejectedApplications: totalRejectedApplications,
      pendingVerifications: totalPendingVerifications,
      pendingBreakdown: {
        veterans: pendingVeteransCount,
        employers: pendingEmployersCount,
        documents: pendingDocsCount,
      },
      recentActivity: {
        veterans: recentVeterans.map((v) => v.toJSON()),
        employers: recentEmployers.map((e) => e.toJSON()),
        schemeApplications: recentSchemeApps.map((a) => a.toJSON()),
        jobApplications: recentJobApps.map((j) => j.toJSON()),
        auditLogs: recentAuditLogs.map((l) => l.toJSON()),
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   2. VETERAN MANAGEMENT & VERIFICATION
   ========================================================================== */

export const getVeterans = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req, 10);
    const { search, branch, status, verificationStatus, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};

    if (verificationStatus && verificationStatus !== 'ALL') {
      filter.verificationStatus = verificationStatus;
    }

    if (branch && branch !== 'ALL') {
      filter['serviceInformation.serviceBranch'] = branch;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { veteranId: regex },
        { 'personalInformation.fullName': regex },
        { 'personalInformation.email': regex },
        { 'personalInformation.phone': regex },
        { 'serviceInformation.rank': regex },
        { 'serviceInformation.serviceNumber': regex },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [veterans, total, pendingCount, verifiedCount, rejectedCount] = await Promise.all([
      Veteran.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone isActive isVerified lastLogin createdAt'),
      Veteran.countDocuments(filter),
      Veteran.countDocuments({ verificationStatus: 'PENDING' }),
      Veteran.countDocuments({ verificationStatus: 'VERIFIED' }),
      Veteran.countDocuments({ verificationStatus: 'REJECTED' }),
    ]);

    // Optional status filter (active/inactive from linked user)
    let filteredVeterans = veterans;
    if (status && status !== 'ALL') {
      const isActiveBool = status === 'ACTIVE';
      filteredVeterans = veterans.filter((v) => v.user && v.user.isActive === isActiveBool);
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Veterans list retrieved successfully', {
      veterans: filteredVeterans.map((v) => v.toJSON()),
      pagination: { page, limit, total, totalPages },
      counts: {
        total: await Veteran.countDocuments(),
        pending: pendingCount,
        verified: verifiedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVeteranById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let veteran = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      veteran = await Veteran.findById(id).populate('user', '-password');
    }
    if (!veteran) {
      veteran = await Veteran.findOne({ veteranId: id }).populate('user', '-password');
    }

    if (!veteran) {
      throw ApiError.notFound('Veteran profile record not found');
    }

    const userId = veteran.user?._id || veteran.user;

    const [documents, schemeApplications, jobApplications, auditHistory] = await Promise.all([
      Document.find({ veteran: veteran._id }).sort({ createdAt: -1 }),
      Application.find({ veteran: veteran._id }).sort({ createdAt: -1 }).populate('scheme', 'name category officialSource'),
      JobApplication.find({ veteran: veteran._id }).sort({ createdAt: -1 }).populate('job', 'title jobId location').populate('employer', 'companyName'),
      AuditLog.find({ entityType: 'VETERAN', entityId: veteran._id.toString() }).sort({ createdAt: -1 }).populate('user', 'name email'),
    ]);

    return sendSuccess(res, 'Veteran details dossier retrieved', {
      veteran: veteran.toJSON(),
      documents: documents.map((d) => d.toJSON()),
      schemeApplications: schemeApplications.map((a) => a.toJSON()),
      jobApplications: jobApplications.map((j) => j.toJSON()),
      auditHistory: auditHistory.map((h) => h.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

export const updateVeteranVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      throw ApiError.badRequest('Invalid verification status. Allowed: PENDING, VERIFIED, REJECTED');
    }

    let veteran = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      veteran = await Veteran.findById(id).populate('user');
    }
    if (!veteran) {
      veteran = await Veteran.findOne({ veteranId: id }).populate('user');
    }

    if (!veteran) {
      throw ApiError.notFound('Veteran profile record not found');
    }

    const previousStatus = veteran.verificationStatus;
    veteran.verificationStatus = status;
    await veteran.save();

    // Update linked user isVerified status
    if (veteran.user) {
      const user = await User.findById(veteran.user._id || veteran.user);
      if (user) {
        user.isVerified = status === 'VERIFIED';
        await user.save();
      }
    }

    // Record Audit Log
    const auditAction =
      status === 'VERIFIED'
        ? 'VETERAN_VERIFIED'
        : status === 'REJECTED'
        ? 'VETERAN_REJECTED'
        : 'VETERAN_PENDING';

    await recordAuditLog({
      userId: adminId,
      action: auditAction,
      entityType: 'VETERAN',
      entityId: veteran._id.toString(),
      description: `Veteran ${veteran.personalInformation?.fullName || veteran.veteranId} verification status set to ${status}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      metadata: {
        veteranId: veteran.veteranId,
        previousStatus,
        newStatus: status,
        remarks: remarks || '',
      },
      req,
    });

    // Notify Veteran User
    const targetUserId = veteran.user?._id || veteran.user;
    if (targetUserId) {
      const statusTitle =
        status === 'VERIFIED'
          ? 'Military Service Profile Verified'
          : status === 'REJECTED'
          ? 'Profile Verification Action Required'
          : 'Profile Verification Status Updated';

      const statusMsg =
        status === 'VERIFIED'
          ? 'Your military veteran profile and service credentials have been officially verified.'
          : status === 'REJECTED'
          ? `Your profile verification could not be approved.${remarks ? ` Reason: ${remarks}` : ' Please review your submitted documents.'}`
          : `Your profile verification status is now ${status}.`;

      await notificationService.createNotification({
        userId: targetUserId,
        type: 'VERIFICATION_STATUS_CHANGED',
        title: statusTitle,
        message: statusMsg,
        entityType: 'PROFILE',
        entityId: veteran.veteranId,
        actionUrl: '/veteran/profile',
      });

      socketService.emitToUser(targetUserId, 'verification:updated', {
        verificationStatus: status,
        remarks: remarks || '',
      });
      socketService.emitToUser(targetUserId, SOCKET_EVENTS.DASHBOARD_UPDATED, { module: 'profile' });
    }

    // Emit Real-Time updates to Admin role
    socketService.emitToRole('ADMIN', SOCKET_EVENTS.ADMIN_VERIFICATION_UPDATED, {
      entityType: 'VETERAN',
      entityId: veteran.veteranId,
      status,
    });
    socketService.emitToRole('ADMIN', SOCKET_EVENTS.ADMIN_DASHBOARD_UPDATED, { module: 'veterans' });

    return sendSuccess(res, `Veteran verification status updated to ${status}`, {
      veteran: veteran.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   3. DOCUMENT VERIFICATION
   ========================================================================== */

export const getDocuments = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req, 12);
    const { search, documentType, verificationStatus, veteranId } = req.query;

    const filter = {};

    if (verificationStatus && verificationStatus !== 'ALL') {
      filter.verificationStatus = verificationStatus;
    }

    if (documentType && documentType !== 'ALL') {
      filter.documentType = documentType;
    }

    if (veteranId) {
      if (veteranId.match(/^[0-9a-fA-F]{24}$/)) {
        filter.veteran = veteranId;
      } else {
        const vet = await Veteran.findOne({ veteranId });
        if (vet) filter.veteran = vet._id;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ documentName: regex }, { documentType: regex }];
    }

    const [documents, total, uploadedCount, underReviewCount, verifiedCount, rejectedCount] = await Promise.all([
      Document.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'veteran',
          select: 'veteranId personalInformation serviceInformation',
        })
        .populate({
          path: 'user',
          select: 'name email phone',
        }),
      Document.countDocuments(filter),
      Document.countDocuments({ verificationStatus: 'UPLOADED' }),
      Document.countDocuments({ verificationStatus: 'UNDER_REVIEW' }),
      Document.countDocuments({ verificationStatus: 'VERIFIED' }),
      Document.countDocuments({ verificationStatus: 'REJECTED' }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Documents retrieved successfully', {
      documents: documents.map((d) => d.toJSON()),
      pagination: { page, limit, total, totalPages },
      counts: {
        total: await Document.countDocuments(),
        uploaded: uploadedCount,
        underReview: underReviewCount,
        verified: verifiedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocumentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, rejectionReason } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!DOCUMENT_STATUS.includes(status)) {
      throw ApiError.badRequest(`Invalid document status. Allowed: ${DOCUMENT_STATUS.join(', ')}`);
    }

    // Strict validation: Rejection requires a mandatory reason
    if (status === 'REJECTED') {
      const reason = (rejectionReason || adminRemarks || '').trim();
      if (!reason) {
        throw ApiError.badRequest('Please provide a clear reason or explanation for rejecting this document.');
      }
    }

    const document = await Document.findById(id).populate('veteran');
    if (!document) {
      throw ApiError.notFound('Document record not found');
    }

    const previousStatus = document.verificationStatus;
    document.verificationStatus = status;

    if (adminRemarks !== undefined) {
      document.adminRemarks = adminRemarks.trim();
    }

    if (status === 'VERIFIED') {
      document.verifiedBy = adminId;
      document.verifiedAt = new Date();
      document.rejectionReason = '';
    } else if (status === 'REJECTED') {
      const reason = (rejectionReason || adminRemarks || '').trim();
      document.rejectionReason = reason;
      document.adminRemarks = reason;
      document.reviewedBy = adminId;
      document.reviewedAt = new Date();
    } else {
      document.reviewedBy = adminId;
      document.reviewedAt = new Date();
    }

    await document.save();

    // Determine audit action
    const auditAction =
      status === 'VERIFIED'
        ? 'DOCUMENT_VERIFIED'
        : status === 'REJECTED'
        ? 'DOCUMENT_REJECTED'
        : 'DOCUMENT_STATUS_CHANGED';

    // Record Audit Log
    await recordAuditLog({
      userId: adminId,
      action: auditAction,
      entityType: 'DOCUMENT',
      entityId: document._id.toString(),
      description: `Document "${document.documentName}" (${document.documentType}) status changed from ${previousStatus} to ${status}.${document.adminRemarks ? ` Remarks: ${document.adminRemarks}` : ''}`,
      metadata: {
        documentName: document.documentName,
        documentType: document.documentType,
        previousStatus,
        newStatus: status,
        adminRemarks: document.adminRemarks || '',
        rejectionReason: document.rejectionReason || '',
      },
      req,
    });

    // Notify Veteran
    if (document.user) {
      const notifTitle =
        status === 'VERIFIED'
          ? `Document Verified: ${document.documentName}`
          : status === 'REJECTED'
          ? `Document Rejected: ${document.documentName}`
          : `Document ${status.replace('_', ' ')}: ${document.documentName}`;

      const notifMsg =
        status === 'VERIFIED'
          ? `Your document "${document.documentName}" has been officially verified.`
          : status === 'REJECTED'
          ? `Your document "${document.documentName}" was rejected. Reason: ${document.rejectionReason}`
          : `Your document "${document.documentName}" is now marked as ${status.replace('_', ' ')}.${document.adminRemarks ? ` Remarks: ${document.adminRemarks}` : ''}`;

      await notificationService.createNotification({
        userId: document.user,
        type: 'DOCUMENT_STATUS_CHANGED',
        title: notifTitle,
        message: notifMsg,
        entityType: 'DOCUMENT',
        entityId: document._id.toString(),
        actionUrl: '/veteran/documents',
      });

      socketService.emitToUser(document.user, 'document:statusChanged', {
        documentId: document._id.toString(),
        status,
        adminRemarks: document.adminRemarks,
        rejectionReason: document.rejectionReason,
      });
    }

    socketService.emitToRole('ADMIN', SOCKET_EVENTS.ADMIN_DASHBOARD_UPDATED, { module: 'documents' });

    return sendSuccess(res, `Document status updated to ${status}`, {
      document: document.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   4. EMPLOYER MANAGEMENT & VERIFICATION
   ========================================================================== */

export const getEmployers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req, 10);
    const { search, verificationStatus, isActive, industry, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};

    if (verificationStatus && verificationStatus !== 'ALL') {
      filter.verificationStatus = verificationStatus;
    }

    if (isActive !== undefined && isActive !== 'ALL') {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (industry && industry !== 'ALL') {
      filter.industry = industry;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { employerId: regex },
        { companyName: regex },
        { email: regex },
        { phone: regex },
        { city: regex },
        { state: regex },
        { 'contactPerson.name': regex },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [employers, total, pendingCount, verifiedCount, rejectedCount] = await Promise.all([
      Employer.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone isActive isVerified lastLogin createdAt'),
      Employer.countDocuments(filter),
      Employer.countDocuments({ verificationStatus: 'PENDING' }),
      Employer.countDocuments({ verificationStatus: 'VERIFIED' }),
      Employer.countDocuments({ verificationStatus: 'REJECTED' }),
    ]);

    // Attach active job count for each employer
    const employerIds = employers.map((e) => e._id);
    const jobCounts = await Job.aggregate([
      { $match: { employer: { $in: employerIds } } },
      { $group: { _id: '$employer', count: { $sum: 1 }, activeCount: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } } } },
    ]);

    const jobCountMap = {};
    jobCounts.forEach((c) => {
      jobCountMap[c._id.toString()] = { totalJobs: c.count, activeJobs: c.activeCount };
    });

    const enrichedEmployers = employers.map((e) => {
      const json = e.toJSON();
      const stats = jobCountMap[e._id.toString()] || { totalJobs: 0, activeJobs: 0 };
      json.totalJobs = stats.totalJobs;
      json.activeJobs = stats.activeJobs;
      return json;
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Employers list retrieved successfully', {
      employers: enrichedEmployers,
      pagination: { page, limit, total, totalPages },
      counts: {
        total: await Employer.countDocuments(),
        pending: pendingCount,
        verified: verifiedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let employer = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      employer = await Employer.findById(id).populate('user', '-password');
    }
    if (!employer) {
      employer = await Employer.findOne({ employerId: id }).populate('user', '-password');
    }

    if (!employer) {
      throw ApiError.notFound('Employer record not found');
    }

    const [jobs, applications, auditHistory] = await Promise.all([
      Job.find({ employer: employer._id }).sort({ createdAt: -1 }),
      JobApplication.find({ employer: employer._id }).sort({ appliedAt: -1 }).populate('job', 'title jobId location').populate('veteran', 'veteranId personalInformation'),
      AuditLog.find({ entityType: 'EMPLOYER', entityId: employer._id.toString() }).sort({ createdAt: -1 }).populate('user', 'name email'),
    ]);

    return sendSuccess(res, 'Employer details dossier retrieved', {
      employer: employer.toJSON(),
      jobs: jobs.map((j) => j.toJSON()),
      applications: applications.map((a) => a.toJSON()),
      auditHistory: auditHistory.map((h) => h.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployerVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      throw ApiError.badRequest('Invalid verification status. Allowed: PENDING, VERIFIED, REJECTED');
    }

    let employer = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      employer = await Employer.findById(id).populate('user');
    }
    if (!employer) {
      employer = await Employer.findOne({ employerId: id }).populate('user');
    }

    if (!employer) {
      throw ApiError.notFound('Employer record not found');
    }

    const previousStatus = employer.verificationStatus;
    employer.verificationStatus = status;
    await employer.save();

    // Update linked user isVerified status
    if (employer.user) {
      const user = await User.findById(employer.user._id || employer.user);
      if (user) {
        user.isVerified = status === 'VERIFIED';
        await user.save();
      }
    }

    // Record Audit Log
    const auditAction =
      status === 'VERIFIED'
        ? 'EMPLOYER_VERIFIED'
        : status === 'REJECTED'
        ? 'EMPLOYER_REJECTED'
        : 'EMPLOYER_PENDING';

    await recordAuditLog({
      userId: adminId,
      action: auditAction,
      entityType: 'EMPLOYER',
      entityId: employer._id.toString(),
      description: `Employer ${employer.companyName} (${employer.employerId}) verification status set to ${status}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      metadata: {
        companyName: employer.companyName,
        employerId: employer.employerId,
        previousStatus,
        newStatus: status,
        remarks: remarks || '',
      },
      req,
    });

    // Notify Employer User
    const targetUserId = employer.user?._id || employer.user;
    if (targetUserId) {
      const statusTitle =
        status === 'VERIFIED'
          ? 'Corporate Employer Account Verified'
          : status === 'REJECTED'
          ? 'Employer Verification Notice'
          : 'Verification Status Updated';

      const statusMsg =
        status === 'VERIFIED'
          ? `Congratulations! Your corporate employer profile for "${employer.companyName}" is officially verified. You can now publish defense-friendly job listings.`
          : status === 'REJECTED'
          ? `Your employer account verification could not be approved at this time.${remarks ? ` Note: ${remarks}` : ' Please contact support.'}`
          : `Your employer verification status is currently ${status}.`;

      await notificationService.createNotification({
        userId: targetUserId,
        type: 'EMPLOYER_VERIFIED',
        title: statusTitle,
        message: statusMsg,
        entityType: 'EMPLOYER',
        entityId: employer.employerId,
        actionUrl: '/employer/profile',
      });

      socketService.emitToUser(targetUserId, 'verification:updated', {
        verificationStatus: status,
        remarks: remarks || '',
      });
      socketService.emitToUser(targetUserId, SOCKET_EVENTS.DASHBOARD_UPDATED, { module: 'employer_profile' });
    }

    // Emit Real-Time updates to Admin role
    socketService.emitToRole('ADMIN', SOCKET_EVENTS.ADMIN_VERIFICATION_UPDATED, {
      entityType: 'EMPLOYER',
      entityId: employer.employerId,
      status,
    });
    socketService.emitToRole('ADMIN', SOCKET_EVENTS.ADMIN_DASHBOARD_UPDATED, { module: 'employers' });

    return sendSuccess(res, `Employer verification status updated to ${status}`, {
      employer: employer.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   5. USER ACCOUNT MANAGEMENT (With Safeguards)
   ========================================================================== */

export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req, 10);
    const { search, role, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};

    if (role && role !== 'ALL') {
      filter.role = role;
    }

    if (isActive !== undefined && isActive !== 'ALL') {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, total, veteranRoleCount, employerRoleCount, adminRoleCount, activeCount, inactiveCount] =
      await Promise.all([
        User.find(filter).select('-password').sort(sortOptions).skip(skip).limit(limit),
        User.countDocuments(filter),
        User.countDocuments({ role: 'VETERAN' }),
        User.countDocuments({ role: 'EMPLOYER' }),
        User.countDocuments({ role: 'ADMIN' }),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false }),
      ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Users list retrieved successfully', {
      users: users.map((u) => u.toJSON()),
      pagination: { page, limit, total, totalPages },
      counts: {
        total: await User.countDocuments(),
        veterans: veteranRoleCount,
        employers: employerRoleCount,
        admins: adminRoleCount,
        active: activeCount,
        inactive: inactiveCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      throw ApiError.notFound('User account not found');
    }

    let profile = null;
    if (user.role === 'VETERAN') {
      profile = await Veteran.findOne({ user: user._id });
    } else if (user.role === 'EMPLOYER') {
      profile = await Employer.findOne({ user: user._id });
    }

    const auditHistory = await AuditLog.find({
      $or: [{ entityType: 'USER', entityId: user._id.toString() }, { user: user._id }],
    }).sort({ createdAt: -1 }).limit(10);

    return sendSuccess(res, 'User details retrieved', {
      user: user.toJSON(),
      profile: profile ? profile.toJSON() : null,
      auditHistory: auditHistory.map((h) => h.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, status } = req.body;
    const currentAdminId = (req.user._id || req.user.id).toString();

    // Determine target boolean status
    let newStatusBool = true;
    if (typeof isActive === 'boolean') {
      newStatusBool = isActive;
    } else if (typeof status === 'string') {
      newStatusBool = status.toUpperCase() === 'ACTIVE';
    }

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound('User account not found');
    }

    // CRITICAL BACKEND SAFEGUARD: Admin must not deactivate their own current account
    if (user._id.toString() === currentAdminId && newStatusBool === false) {
      throw ApiError.badRequest(
        'Admin Self-Deactivation Safeguard: You cannot deactivate your own current administrator account.'
      );
    }

    const previousStatus = user.isActive;
    user.isActive = newStatusBool;
    await user.save();

    // Also sync active status to Employer model if employer
    if (user.role === 'EMPLOYER') {
      await Employer.updateOne({ user: user._id }, { isActive: newStatusBool });
    }

    // Record Audit Log
    const auditAction = newStatusBool ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
    await recordAuditLog({
      userId: currentAdminId,
      action: auditAction,
      entityType: 'USER',
      entityId: user._id.toString(),
      description: `User account ${user.email} (${user.name}) ${newStatusBool ? 'activated' : 'deactivated'} by Admin.`,
      metadata: {
        email: user.email,
        name: user.name,
        role: user.role,
        previousStatus,
        newStatus: newStatusBool,
      },
      req,
    });

    return sendSuccess(res, `User account ${newStatusBool ? 'activated' : 'deactivated'} successfully`, {
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   6. SCHEME MANAGEMENT
   ========================================================================== */

export const getSchemes = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req, 10);
    const { search, category, status, isFeatured, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};

    if (category && category !== 'ALL' && category !== 'All') {
      filter.category = category;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (isFeatured !== undefined && isFeatured !== 'ALL') {
      filter.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { schemeId: regex },
        { name: regex },
        { shortDescription: regex },
        { category: regex },
        { officialSource: regex },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [schemes, total, activeCount, inactiveCount, featuredCount] = await Promise.all([
      Scheme.find(filter).sort(sortOptions).skip(skip).limit(limit),
      Scheme.countDocuments(filter),
      Scheme.countDocuments({ status: 'ACTIVE' }),
      Scheme.countDocuments({ status: 'INACTIVE' }),
      Scheme.countDocuments({ isFeatured: true }),
    ]);

    // Attach application counts for each scheme
    const schemeIds = schemes.map((s) => s._id);
    const appCounts = await Application.aggregate([
      { $match: { scheme: { $in: schemeIds } } },
      { $group: { _id: '$scheme', totalApps: { $sum: 1 } } },
    ]);

    const countMap = {};
    appCounts.forEach((c) => {
      countMap[c._id.toString()] = c.totalApps;
    });

    const enrichedSchemes = schemes.map((s) => {
      const json = s.toJSON();
      json.applicationCount = countMap[s._id.toString()] || 0;
      return json;
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Schemes list retrieved successfully', {
      schemes: enrichedSchemes,
      pagination: { page, limit, total, totalPages },
      counts: {
        total: await Scheme.countDocuments(),
        active: activeCount,
        inactive: inactiveCount,
        featured: featuredCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSchemeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let scheme = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      scheme = await Scheme.findById(id);
    }
    if (!scheme) {
      scheme = await Scheme.findOne({ schemeId: id });
    }

    if (!scheme) {
      throw ApiError.notFound('Welfare scheme record not found');
    }

    const applicationCount = await Application.countDocuments({ scheme: scheme._id });
    const json = scheme.toJSON();
    json.applicationCount = applicationCount;

    return sendSuccess(res, 'Scheme details retrieved', { scheme: json });
  } catch (error) {
    next(error);
  }
};

export const createScheme = async (req, res, next) => {
  try {
    const adminId = req.user._id || req.user.id;
    const {
      name,
      shortDescription,
      description,
      category,
      subCategory,
      benefits,
      eligibility,
      requiredDocuments,
      applicationFields,
      applicationProcess,
      applicationMode,
      deadline,
      officialSource,
      officialWebsite,
      state,
      country,
      status,
      isFeatured,
    } = req.body;

    if (!name || !shortDescription || !description || !category || !officialSource || !officialWebsite) {
      throw ApiError.badRequest(
        'Please provide all required fields: name, shortDescription, description, category, officialSource, officialWebsite'
      );
    }

    const schemeId = req.body.schemeId?.trim() || (await generateSchemeId());

    const existing = await Scheme.findOne({ schemeId });
    if (existing) {
      throw ApiError.badRequest(`Scheme ID "${schemeId}" already exists. Please provide a unique ID.`);
    }

    const scheme = await Scheme.create({
      schemeId,
      name,
      shortDescription,
      description,
      category,
      subCategory: subCategory || '',
      benefits: Array.isArray(benefits) ? benefits : [],
      eligibility: eligibility || {},
      requiredDocuments: Array.isArray(requiredDocuments) ? requiredDocuments : [],
      applicationFields: Array.isArray(applicationFields) ? applicationFields : [],
      applicationProcess: Array.isArray(applicationProcess) ? applicationProcess : [],
      applicationMode: applicationMode || 'Online',
      deadline: deadline ? new Date(deadline) : null,
      officialSource,
      officialWebsite,
      state: state || 'All India',
      country: country || 'India',
      status: status || 'ACTIVE',
      isFeatured: Boolean(isFeatured),
    });

    // Record Audit Log
    await recordAuditLog({
      userId: adminId,
      action: 'SCHEME_CREATED',
      entityType: 'SCHEME',
      entityId: scheme._id.toString(),
      description: `Welfare Scheme "${scheme.name}" (${scheme.schemeId}) created by Admin.`,
      metadata: {
        schemeId: scheme.schemeId,
        name: scheme.name,
        category: scheme.category,
      },
      req,
    });

    socketService.emitToRole('ADMIN', SOCKET_EVENTS.ADMIN_DASHBOARD_UPDATED, { module: 'schemes' });

    return sendCreated(res, 'Welfare Scheme created successfully', {
      scheme: scheme.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const updateScheme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id || req.user.id;

    let scheme = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      scheme = await Scheme.findById(id);
    }
    if (!scheme) {
      scheme = await Scheme.findOne({ schemeId: id });
    }

    if (!scheme) {
      throw ApiError.notFound('Scheme record not found');
    }

    const fields = [
      'name',
      'shortDescription',
      'description',
      'category',
      'subCategory',
      'benefits',
      'eligibility',
      'requiredDocuments',
      'applicationFields',
      'applicationProcess',
      'applicationMode',
      'deadline',
      'officialSource',
      'officialWebsite',
      'state',
      'country',
      'status',
      'isFeatured',
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        scheme[f] = req.body[f];
      }
    });

    await scheme.save();

    // Record Audit Log
    await recordAuditLog({
      userId: adminId,
      action: 'SCHEME_UPDATED',
      entityType: 'SCHEME',
      entityId: scheme._id.toString(),
      description: `Welfare Scheme "${scheme.name}" (${scheme.schemeId}) updated by Admin.`,
      metadata: {
        schemeId: scheme.schemeId,
        name: scheme.name,
        status: scheme.status,
      },
      req,
    });

    return sendSuccess(res, 'Welfare Scheme updated successfully', {
      scheme: scheme.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteScheme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id || req.user.id;

    let scheme = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      scheme = await Scheme.findById(id);
    }
    if (!scheme) {
      scheme = await Scheme.findOne({ schemeId: id });
    }

    if (!scheme) {
      throw ApiError.notFound('Scheme record not found');
    }

    // Safety check: Check if applications exist for this scheme
    const applicationCount = await Application.countDocuments({ scheme: scheme._id });
    if (applicationCount > 0) {
      throw ApiError.badRequest(
        `Cannot permanently delete scheme "${scheme.name}" because it has ${applicationCount} submitted application(s). You may change its status to INACTIVE instead.`
      );
    }

    await Scheme.findByIdAndDelete(scheme._id);

    // Record Audit Log
    await recordAuditLog({
      userId: adminId,
      action: 'SCHEME_DELETED',
      entityType: 'SCHEME',
      entityId: scheme._id.toString(),
      description: `Welfare Scheme "${scheme.name}" (${scheme.schemeId}) deleted permanently by Admin.`,
      metadata: {
        schemeId: scheme.schemeId,
        name: scheme.name,
      },
      req,
    });

    return sendSuccess(res, 'Scheme deleted successfully', {
      schemeId: scheme.schemeId,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   7. JOB MODERATION & MANAGEMENT
   ========================================================================== */

export const getJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req, 10);
    const { search, status, industry, employerId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (industry && industry !== 'ALL') {
      filter.industry = industry;
    }

    if (employerId) {
      if (employerId.match(/^[0-9a-fA-F]{24}$/)) {
        filter.employer = employerId;
      } else {
        const emp = await Employer.findOne({ employerId });
        if (emp) filter.employer = emp._id;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ jobId: regex }, { title: regex }, { city: regex }, { state: regex }, { industry: regex }];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [jobs, total, activeCount, pendingApprovalCount, pausedCount, closedCount, rejectedCount] = await Promise.all([
      Job.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('employer', 'companyName employerId industry city state verificationStatus logo'),
      Job.countDocuments(filter),
      Job.countDocuments({ status: 'ACTIVE' }),
      Job.countDocuments({ status: 'PENDING_APPROVAL' }),
      Job.countDocuments({ status: 'PAUSED' }),
      Job.countDocuments({ status: 'CLOSED' }),
      Job.countDocuments({ status: 'REJECTED' }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Jobs list retrieved successfully', {
      jobs: jobs.map((j) => j.toJSON()),
      pagination: { page, limit, total, totalPages },
      counts: {
        total: await Job.countDocuments(),
        active: activeCount,
        pendingApproval: pendingApprovalCount,
        paused: pausedCount,
        closed: closedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let job = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      job = await Job.findById(id).populate('employer');
    }
    if (!job) {
      job = await Job.findOne({ jobId: id }).populate('employer');
    }

    if (!job) {
      throw ApiError.notFound('Job record not found');
    }

    const applications = await JobApplication.find({ job: job._id })
      .sort({ appliedAt: -1 })
      .populate('veteran', 'veteranId personalInformation serviceInformation');

    return sendSuccess(res, 'Job details retrieved', {
      job: job.toJSON(),
      applications: applications.map((a) => a.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

export const updateJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!JOB_STATUS.includes(status)) {
      throw ApiError.badRequest(`Invalid job status. Allowed: ${JOB_STATUS.join(', ')}`);
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

    const previousStatus = job.status;
    job.status = status;
    await job.save();

    const employerDoc = job.employer ? await Employer.findById(job.employer) : null;

    // Record Audit Log
    await recordAuditLog({
      userId: adminId,
      action: 'JOB_MODERATED',
      entityType: 'JOB',
      entityId: job._id.toString(),
      description: `Job listing "${job.title}" (${job.jobId}) status updated from ${previousStatus} to ${status}.${adminRemarks ? ` Remarks: ${adminRemarks}` : ''}`,
      metadata: {
        jobId: job.jobId,
        title: job.title,
        previousStatus,
        newStatus: status,
        adminRemarks: adminRemarks || '',
      },
      req,
    });

    // Notify Employer
    if (employerDoc?.user) {
      await notificationService.createNotification({
        userId: employerDoc.user,
        type: 'JOB_POSTED',
        title: `Job Listing Moderation: ${job.title}`,
        message: `Your job posting "${job.title}" status has been set to ${status} by admin.${adminRemarks ? ` Reason: ${adminRemarks}` : ''}`,
        entityType: 'JOB',
        entityId: job.jobId,
        actionUrl: `/employer/jobs/${job.jobId}`,
      });
    }

    socketService.emitToRole('ADMIN', SOCKET_EVENTS.ADMIN_DASHBOARD_UPDATED, { module: 'jobs' });

    return sendSuccess(res, `Job status updated to ${status}`, {
      job: job.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id || req.user.id;

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

    await Job.findByIdAndDelete(job._id);

    // Record Audit Log
    await recordAuditLog({
      userId: adminId,
      action: 'JOB_DELETED',
      entityType: 'JOB',
      entityId: job._id.toString(),
      description: `Job listing "${job.title}" (${job.jobId}) removed by Admin.`,
      metadata: {
        jobId: job.jobId,
        title: job.title,
      },
      req,
    });

    return sendSuccess(res, 'Job listing removed successfully', {
      jobId: job.jobId,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   8. SCHEME APPLICATION MANAGEMENT
   ========================================================================== */

export const getSchemeApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req, 10);
    const { search, status, schemeId, veteranId, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (schemeId) {
      if (schemeId.match(/^[0-9a-fA-F]{24}$/)) {
        filter.scheme = schemeId;
      } else {
        const sch = await Scheme.findOne({ schemeId });
        if (sch) filter.scheme = sch._id;
      }
    }

    if (veteranId) {
      if (veteranId.match(/^[0-9a-fA-F]{24}$/)) {
        filter.veteran = veteranId;
      } else {
        const vet = await Veteran.findOne({ veteranId });
        if (vet) filter.veteran = vet._id;
      }
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      filter.applicationId = new RegExp(search.trim(), 'i');
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [applications, total, submittedCount, underReviewCount, approvedCount, rejectedCount] = await Promise.all([
      Application.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('scheme', 'name category schemeId officialSource')
        .populate('veteran', 'veteranId personalInformation serviceInformation')
        .populate('user', 'name email phone'),
      Application.countDocuments(filter),
      Application.countDocuments({ status: 'SUBMITTED' }),
      Application.countDocuments({ status: { $in: ['UNDER_REVIEW', 'DOCUMENT_VERIFICATION'] } }),
      Application.countDocuments({ status: 'APPROVED' }),
      Application.countDocuments({ status: 'REJECTED' }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Scheme applications retrieved successfully', {
      applications: applications.map((a) => a.toJSON()),
      pagination: { page, limit, total, totalPages },
      counts: {
        total: await Application.countDocuments(),
        submitted: submittedCount,
        underReview: underReviewCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSchemeApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await Application.findById(id);
    }
    if (!application) {
      application = await Application.findOne({ applicationId: id });
    }

    if (!application) {
      throw ApiError.notFound('Scheme application record not found');
    }

    const populated = await Application.findById(application._id)
      .populate('scheme')
      .populate('veteran')
      .populate('user', 'name email phone')
      .populate('documents.document');

    const auditHistory = await AuditLog.find({
      entityType: 'SCHEME_APPLICATION',
      entityId: application._id.toString(),
    }).sort({ createdAt: -1 }).populate('user', 'name email');

    return sendSuccess(res, 'Scheme application details retrieved', {
      application: populated.toJSON(),
      auditHistory: auditHistory.map((h) => h.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

export const updateSchemeApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;
    const adminId = req.user._id || req.user.id;

    if (!APPLICATION_STATUS.includes(status)) {
      throw ApiError.badRequest(`Invalid application status. Allowed: ${APPLICATION_STATUS.join(', ')}`);
    }

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await Application.findById(id).populate('scheme').populate('user');
    }
    if (!application) {
      application = await Application.findOne({ applicationId: id }).populate('scheme').populate('user');
    }

    if (!application) {
      throw ApiError.notFound('Application record not found');
    }

    // Validate permitted administrative status transitions
    const allowedTransitions = {
      SUBMITTED: ['UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'REJECTED'],
      UNDER_REVIEW: ['DOCUMENT_VERIFICATION', 'APPROVED', 'REJECTED'],
      DOCUMENT_VERIFICATION: ['APPROVED', 'REJECTED', 'UNDER_REVIEW'],
      APPROVED: [], // Terminal
      REJECTED: ['UNDER_REVIEW'], // May reopen on appeal
      DRAFT: ['SUBMITTED'],
      WITHDRAWN: [],
    };

    if (allowedTransitions[application.status] && !allowedTransitions[application.status].includes(status)) {
      throw ApiError.badRequest(
        `Invalid status transition from ${application.status} to ${status}. Permitted: ${allowedTransitions[
          application.status
        ].join(', ')}`
      );
    }

    const previousStatus = application.status;
    application.status = status;
    if (adminRemarks) {
      application.adminRemarks = adminRemarks.trim();
    }

    application.timeline.push({
      status,
      message: adminRemarks?.trim() || `Application status updated to ${status.replace('_', ' ')} by authority.`,
      changedAt: new Date(),
      changedBy: adminId,
    });

    await application.save();

    // Record Audit Log
    await recordAuditLog({
      userId: adminId,
      action: 'SCHEME_APPLICATION_STATUS_CHANGED',
      entityType: 'SCHEME_APPLICATION',
      entityId: application._id.toString(),
      description: `Application ${application.applicationId} status updated from ${previousStatus} to ${status}.${adminRemarks ? ` Remarks: ${adminRemarks}` : ''}`,
      metadata: {
        applicationId: application.applicationId,
        previousStatus,
        newStatus: status,
        adminRemarks: adminRemarks || '',
      },
      req,
    });

    // Notify Veteran User
    const schemeName = application.scheme?.name || 'Welfare Scheme';
    if (application.user) {
      const targetUserId = application.user._id || application.user;
      await notificationService.createNotification({
        userId: targetUserId,
        type: 'APPLICATION_STATUS_CHANGED',
        title: `Scheme Application ${status.replace('_', ' ')}`,
        message: `Your application for "${schemeName}" (${application.applicationId}) is now ${status.replace('_', ' ')}.${adminRemarks ? ` Remarks: ${adminRemarks}` : ''}`,
        entityType: 'SCHEME_APPLICATION',
        entityId: application.applicationId,
        actionUrl: `/veteran/applications/${application.applicationId}`,
        emailDetails: application.user.email
          ? {
              toEmail: application.user.email,
              templateType: 'SCHEME_STATUS_CHANGED',
              data: {
                veteranName: application.user.name || 'Veteran',
                schemeName,
                applicationId: application.applicationId,
                newStatus: status,
                adminRemarks,
                actionUrl: `${config.clientUrl}/veteran/applications/${application.applicationId}`,
              },
            }
          : null,
      });

      socketService.emitToUser(targetUserId, SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, {
        applicationId: application.applicationId,
        status,
        adminRemarks,
        timeline: application.timeline,
      });
      socketService.emitToUser(targetUserId, SOCKET_EVENTS.DASHBOARD_UPDATED, { module: 'schemes', status });
    }

    socketService.emitToRole('ADMIN', SOCKET_EVENTS.ADMIN_DASHBOARD_UPDATED, { module: 'applications' });

    return sendSuccess(res, `Application status updated to ${status}`, {
      application: application.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   9. JOB APPLICATION MONITORING
   ========================================================================== */

export const getJobApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req, 10);
    const { search, status, jobId, employerId, veteranId, startDate, endDate, sortBy = 'appliedAt', sortOrder = 'desc' } = req.query;

    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (jobId) {
      if (jobId.match(/^[0-9a-fA-F]{24}$/)) {
        filter.job = jobId;
      } else {
        const j = await Job.findOne({ jobId });
        if (j) filter.job = j._id;
      }
    }

    if (employerId) {
      if (employerId.match(/^[0-9a-fA-F]{24}$/)) {
        filter.employer = employerId;
      } else {
        const emp = await Employer.findOne({ employerId });
        if (emp) filter.employer = emp._id;
      }
    }

    if (veteranId) {
      if (veteranId.match(/^[0-9a-fA-F]{24}$/)) {
        filter.veteran = veteranId;
      } else {
        const vet = await Veteran.findOne({ veteranId });
        if (vet) filter.veteran = vet._id;
      }
    }

    if (startDate || endDate) {
      filter.appliedAt = {};
      if (startDate) filter.appliedAt.$gte = new Date(startDate);
      if (endDate) filter.appliedAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      filter.applicationId = new RegExp(search.trim(), 'i');
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [applications, total, appliedCount, shortlistedCount, interviewCount, selectedCount, rejectedCount] =
      await Promise.all([
        JobApplication.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('job', 'title jobId location employmentType')
          .populate('employer', 'companyName employerId city state')
          .populate('veteran', 'veteranId personalInformation serviceInformation'),
        JobApplication.countDocuments(filter),
        JobApplication.countDocuments({ status: 'APPLIED' }),
        JobApplication.countDocuments({ status: 'SHORTLISTED' }),
        JobApplication.countDocuments({ status: 'INTERVIEW' }),
        JobApplication.countDocuments({ status: 'SELECTED' }),
        JobApplication.countDocuments({ status: 'REJECTED' }),
      ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Job applications retrieved successfully', {
      applications: applications.map((a) => a.toJSON()),
      pagination: { page, limit, total, totalPages },
      counts: {
        total: await JobApplication.countDocuments(),
        applied: appliedCount,
        shortlisted: shortlistedCount,
        interview: interviewCount,
        selected: selectedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getJobApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await JobApplication.findById(id);
    }
    if (!application) {
      application = await JobApplication.findOne({ applicationId: id });
    }

    if (!application) {
      throw ApiError.notFound('Job application record not found');
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

/* ==========================================================================
   10. ANALYTICS & DATABASE AGGREGATIONS
   ========================================================================== */

export const getAnalytics = async (req, res, next) => {
  try {
    const { period = '30days', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRangeFilter(period, customStart, customEnd);

    const dateMatch = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    const [
      veteranTrends,
      employerTrends,
      jobTrends,
      schemeAppTrends,
      jobAppTrends,
      schemeCategories,
      jobIndustries,
      jobEmploymentTypes,
      topJobLocations,
      topVeteranLocations,
      topEmployerLocations,
      schemeAppsByStatus,
      jobAppsByStatus,
      totalCompletedSchemeApps,
      approvedSchemeApps,
      rejectedSchemeApps,
      totalCompletedJobApps,
      selectedJobApps,
      processingTimeData,
      recentAuditLogs,
      totalVeteransInPeriod,
      totalEmployersInPeriod,
      totalJobsInPeriod,
      totalSchemeAppsInPeriod,
      totalJobAppsInPeriod,
    ] = await Promise.all([
      // 1. Veteran registrations over time
      Veteran.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 2. Employer registrations over time
      Employer.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 3. Jobs posted over time
      Job.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 4. Scheme applications over time
      Application.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 5. Job applications over time
      JobApplication.aggregate([
        { $match: { appliedAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 6. Popular scheme categories
      Scheme.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // 7. Popular job industries
      Job.aggregate([
        { $group: { _id: '$industry', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // 8. Job Employment Types
      Job.aggregate([
        { $group: { _id: '$employmentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // 9. Top job locations
      Job.aggregate([
        { $match: { city: { $ne: null, $ne: '' } } },
        { $group: { _id: '$city', state: { $first: '$state' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // 10. Top veteran locations
      Veteran.aggregate([
        { $match: { 'personalInformation.state': { $ne: null, $ne: '' } } },
        { $group: { _id: '$personalInformation.state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // 11. Top employer locations
      Employer.aggregate([
        { $match: { city: { $ne: null, $ne: '' } } },
        { $group: { _id: '$city', state: { $first: '$state' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // 12. Scheme applications by status
      Application.aggregate([
        { $match: dateMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // 13. Job applications by status
      JobApplication.aggregate([
        { $match: { appliedAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // 14. Scheme approval / rejection counts
      Application.countDocuments({ status: { $in: ['APPROVED', 'DISBURSED', 'REJECTED'] }, createdAt: { $gte: startDate, $lte: endDate } }),
      Application.countDocuments({ status: { $in: ['APPROVED', 'DISBURSED'] }, createdAt: { $gte: startDate, $lte: endDate } }),
      Application.countDocuments({ status: 'REJECTED', createdAt: { $gte: startDate, $lte: endDate } }),

      // 15. Job selection counts
      JobApplication.countDocuments({ status: { $in: ['SELECTED', 'HIRED', 'REJECTED'] }, appliedAt: { $gte: startDate, $lte: endDate } }),
      JobApplication.countDocuments({ status: { $in: ['SELECTED', 'HIRED'] }, appliedAt: { $gte: startDate, $lte: endDate } }),

      // 16. Processing time (days) for scheme applications with completed timeline
      Application.aggregate([
        { $match: { status: { $in: ['APPROVED', 'DISBURSED', 'REJECTED'] }, submittedAt: { $ne: null } } },
        {
          $project: {
            durationDays: {
              $divide: [{ $subtract: ['$updatedAt', '$submittedAt'] }, 1000 * 60 * 60 * 24],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgDays: { $avg: '$durationDays' },
            minDays: { $min: '$durationDays' },
            maxDays: { $max: '$durationDays' },
          },
        },
      ]),

      // 17. Recent Audit Logs
      AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email role'),

      // 18. Overall counts in period
      Veteran.countDocuments(dateMatch),
      Employer.countDocuments(dateMatch),
      Job.countDocuments(dateMatch),
      Application.countDocuments(dateMatch),
      JobApplication.countDocuments({ appliedAt: { $gte: startDate, $lte: endDate } }),
    ]);

    // Calculate rates safely
    const schemeApprovalRate =
      totalCompletedSchemeApps > 0
        ? Math.round((approvedSchemeApps / totalCompletedSchemeApps) * 100)
        : 0;
    const schemeRejectionRate =
      totalCompletedSchemeApps > 0
        ? Math.round((rejectedSchemeApps / totalCompletedSchemeApps) * 100)
        : 0;

    const portalJobPlacementRate =
      totalCompletedJobApps > 0
        ? Math.round((selectedJobApps / totalCompletedJobApps) * 100)
        : 0;

    const hasProcessingTimeData =
      processingTimeData.length > 0 &&
      processingTimeData[0].avgDays !== null &&
      !isNaN(processingTimeData[0].avgDays);

    const avgProcessingTimeDays = hasProcessingTimeData
      ? Number(Math.max(processingTimeData[0].avgDays, 0.1).toFixed(1))
      : 0;
    const minProcessingTimeDays = hasProcessingTimeData
      ? Number(Math.max(processingTimeData[0].minDays, 0.1).toFixed(1))
      : 0;
    const maxProcessingTimeDays = hasProcessingTimeData
      ? Number(Math.max(processingTimeData[0].maxDays, 0.1).toFixed(1))
      : 0;

    // Combine applications by status for unified chart
    const combinedStatusMap = {};
    schemeAppsByStatus.forEach((s) => {
      combinedStatusMap[s._id] = (combinedStatusMap[s._id] || 0) + s.count;
    });
    jobAppsByStatus.forEach((j) => {
      combinedStatusMap[j._id] = (combinedStatusMap[j._id] || 0) + j.count;
    });

    const applicationsByStatusList = Object.entries(combinedStatusMap).map(([status, count]) => ({
      status: status.replace(/_/g, ' '),
      count,
    }));

    return sendSuccess(res, 'Portal analytics aggregated successfully', {
      period,
      startDate,
      endDate,
      kpis: {
        schemeApprovalRate,
        schemeRejectionRate,
        portalJobPlacementRate,
        avgProcessingTimeDays,
        minProcessingTimeDays,
        maxProcessingTimeDays,
        hasProcessingTimeData,
        totalCompletedSchemeApps,
        totalCompletedJobApps,
        totalApplicationsInPeriod: totalSchemeAppsInPeriod + totalJobAppsInPeriod,
        totalJobsInPeriod,
        totalVeteransInPeriod,
        totalEmployersInPeriod,
      },
      trends: {
        veteranRegistrations: veteranTrends,
        employerRegistrations: employerTrends,
        jobsPosted: jobTrends,
        schemeApplications: schemeAppTrends,
        jobApplications: jobAppTrends,
      },
      distributions: {
        applicationsByStatus: applicationsByStatusList,
        schemeAppsByStatus: schemeAppsByStatus.map((s) => ({ status: s._id, count: s.count })),
        jobAppsByStatus: jobAppsByStatus.map((j) => ({ status: j._id, count: j.count })),
        schemeCategories: schemeCategories.map((c) => ({ category: c._id || 'Other', count: c.count })),
        jobIndustries: jobIndustries.map((i) => ({ industry: i._id || 'General', count: i.count })),
        jobEmploymentTypes: jobEmploymentTypes.map((e) => ({
          type: (e._id || 'Full Time').replace(/_/g, ' '),
          count: e.count,
        })),
        topJobLocations: topJobLocations.map((l) => ({
          location: l.state ? `${l._id}, ${l.state}` : l._id,
          count: l.count,
        })),
        topVeteranLocations: topVeteranLocations.map((v) => ({
          location: v._id || 'Unknown',
          count: v.count,
        })),
        topEmployerLocations: topEmployerLocations.map((e) => ({
          location: e.state ? `${e._id}, ${e.state}` : e._id,
          count: e.count,
        })),
      },
      recentActivity: recentAuditLogs.map((l) => l.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   11. REPORTS & CSV EXPORT
   ========================================================================== */

export const getReportsSummary = async (req, res, next) => {
  try {
    const [
      veteransCount,
      employersCount,
      schemesCount,
      schemeAppsCount,
      jobsCount,
      jobAppsCount,
      verificationsCount,
    ] = await Promise.all([
      Veteran.countDocuments(),
      Employer.countDocuments(),
      Scheme.countDocuments(),
      Application.countDocuments(),
      Job.countDocuments(),
      JobApplication.countDocuments(),
      AuditLog.countDocuments({ action: { $regex: /VERIF/ } }),
    ]);

    return sendSuccess(res, 'Reports summary retrieved', {
      summary: {
        veterans: veteransCount,
        employers: employersCount,
        schemes: schemesCount,
        schemeApplications: schemeAppsCount,
        jobs: jobsCount,
        jobApplications: jobAppsCount,
        auditLogs: verificationsCount,
      },
      availableReports: [
        { id: 'veterans', name: 'Veteran Registrations & Profiles Report', recordCount: veteransCount },
        { id: 'employers', name: 'Employer Organizations Report', recordCount: employersCount },
        { id: 'schemes', name: 'Welfare Schemes & Benefit Catalog Report', recordCount: schemesCount },
        { id: 'scheme-applications', name: 'Welfare Scheme Applications Report', recordCount: schemeAppsCount },
        { id: 'jobs', name: 'Job Opportunities & Vacancies Report', recordCount: jobsCount },
        { id: 'job-applications', name: 'Job Applications & Recruitment Report', recordCount: jobAppsCount },
        { id: 'verifications', name: 'Administrative Verification Audit Report', recordCount: verificationsCount },
      ],
    });
  } catch (error) {
    next(error);
  }
};

export const exportVeteransCsv = async (req, res, next) => {
  try {
    const { branch, verificationStatus, search } = req.query;
    const filter = {};
    if (branch && branch !== 'ALL') filter['serviceInformation.serviceBranch'] = branch;
    if (verificationStatus && verificationStatus !== 'ALL') filter.verificationStatus = verificationStatus;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ veteranId: regex }, { 'personalInformation.fullName': regex }, { 'personalInformation.email': regex }];
    }

    const veterans = await Veteran.find(filter).populate('user', 'email phone isActive isVerified createdAt');

    const headers = [
      { label: 'Veteran ID', key: 'veteranId' },
      { label: 'Full Name', value: (v) => v.personalInformation?.fullName || '' },
      { label: 'Email', value: (v) => v.personalInformation?.email || v.user?.email || '' },
      { label: 'Phone', value: (v) => v.personalInformation?.phone || v.user?.phone || '' },
      { label: 'Service Branch', value: (v) => v.serviceInformation?.serviceBranch || '' },
      { label: 'Rank', value: (v) => v.serviceInformation?.rank || '' },
      { label: 'Service Number', value: (v) => v.serviceInformation?.serviceNumber || '' },
      { label: 'Years of Service', value: (v) => v.serviceInformation?.yearsOfService || 0 },
      { label: 'Service Status', value: (v) => v.serviceInformation?.serviceStatus || '' },
      { label: 'State', value: (v) => v.personalInformation?.state || '' },
      { label: 'City', value: (v) => v.personalInformation?.city || '' },
      { label: 'Verification Status', key: 'verificationStatus' },
      { label: 'Account Status', value: (v) => (v.user?.isActive ? 'ACTIVE' : 'INACTIVE') },
      { label: 'Registration Date', value: (v) => (v.createdAt ? new Date(v.createdAt).toISOString().split('T')[0] : '') },
    ];

    const csvContent = convertToCsv(headers, veterans);
    const filename = `veterans_report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const exportEmployersCsv = async (req, res, next) => {
  try {
    const { verificationStatus, industry } = req.query;
    const filter = {};
    if (verificationStatus && verificationStatus !== 'ALL') filter.verificationStatus = verificationStatus;
    if (industry && industry !== 'ALL') filter.industry = industry;

    const employers = await Employer.find(filter).populate('user', 'email phone isActive createdAt');

    const headers = [
      { label: 'Employer ID', key: 'employerId' },
      { label: 'Company Name', key: 'companyName' },
      { label: 'Industry', key: 'industry' },
      { label: 'Company Size', key: 'companySize' },
      { label: 'City', key: 'city' },
      { label: 'State', key: 'state' },
      { label: 'Official Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'Website', key: 'website' },
      { label: 'Contact Person Name', value: (e) => e.contactPerson?.name || '' },
      { label: 'Contact Designation', value: (e) => e.contactPerson?.designation || '' },
      { label: 'Verification Status', key: 'verificationStatus' },
      { label: 'Active Status', value: (e) => (e.isActive ? 'ACTIVE' : 'INACTIVE') },
      { label: 'Registration Date', value: (e) => (e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : '') },
    ];

    const csvContent = convertToCsv(headers, employers);
    const filename = `employers_report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const exportSchemesCsv = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    if (category && category !== 'ALL') filter.category = category;
    if (status && status !== 'ALL') filter.status = status;

    const schemes = await Scheme.find(filter);

    const headers = [
      { label: 'Scheme ID', key: 'schemeId' },
      { label: 'Scheme Name', key: 'name' },
      { label: 'Category', key: 'category' },
      { label: 'Official Source', key: 'officialSource' },
      { label: 'Official Website', key: 'officialWebsite' },
      { label: 'Target State', key: 'state' },
      { label: 'Status', key: 'status' },
      { label: 'Is Featured', value: (s) => (s.isFeatured ? 'YES' : 'NO') },
      { label: 'Deadline', value: (s) => (s.deadline ? new Date(s.deadline).toISOString().split('T')[0] : 'None') },
      { label: 'Created Date', value: (s) => (s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '') },
    ];

    const csvContent = convertToCsv(headers, schemes);
    const filename = `schemes_report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const exportJobsCsv = async (req, res, next) => {
  try {
    const { status, industry } = req.query;
    const filter = {};
    if (status && status !== 'ALL') filter.status = status;
    if (industry && industry !== 'ALL') filter.industry = industry;

    const jobs = await Job.find(filter).populate('employer', 'companyName city state');

    const headers = [
      { label: 'Job ID', key: 'jobId' },
      { label: 'Job Title', key: 'title' },
      { label: 'Company Name', value: (j) => j.employer?.companyName || '' },
      { label: 'Industry', key: 'industry' },
      { label: 'Location', key: 'location' },
      { label: 'Employment Type', key: 'employmentType' },
      { label: 'Work Mode', key: 'workMode' },
      { label: 'Salary Range (INR)', value: (j) => `${j.salaryMin} - ${j.salaryMax}` },
      { label: 'Experience (Years)', value: (j) => `${j.experienceMin} - ${j.experienceMax}` },
      { label: 'Applicant Count', key: 'applicantCount' },
      { label: 'Status', key: 'status' },
      { label: 'Created Date', value: (j) => (j.createdAt ? new Date(j.createdAt).toISOString().split('T')[0] : '') },
    ];

    const csvContent = convertToCsv(headers, jobs);
    const filename = `jobs_report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const exportSchemeApplicationsCsv = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'ALL') filter.status = status;

    const apps = await Application.find(filter)
      .populate('scheme', 'name category schemeId')
      .populate('veteran', 'veteranId personalInformation serviceInformation')
      .populate('user', 'name email phone');

    const headers = [
      { label: 'Application ID', key: 'applicationId' },
      { label: 'Scheme Name', value: (a) => a.scheme?.name || '' },
      { label: 'Scheme ID', value: (a) => a.scheme?.schemeId || '' },
      { label: 'Category', value: (a) => a.scheme?.category || '' },
      { label: 'Veteran ID', value: (a) => a.veteran?.veteranId || '' },
      { label: 'Veteran Name', value: (a) => a.veteran?.personalInformation?.fullName || a.user?.name || '' },
      { label: 'Veteran Email', value: (a) => a.user?.email || '' },
      { label: 'Service Branch', value: (a) => a.veteran?.serviceInformation?.serviceBranch || '' },
      { label: 'Rank', value: (a) => a.veteran?.serviceInformation?.rank || '' },
      { label: 'Status', key: 'status' },
      { label: 'Submission Date', value: (a) => (a.submittedAt ? new Date(a.submittedAt).toISOString().split('T')[0] : '') },
      { label: 'Admin Remarks', value: (a) => a.adminRemarks || '' },
    ];

    const csvContent = convertToCsv(headers, apps);
    const filename = `scheme_applications_report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const exportJobApplicationsCsv = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'ALL') filter.status = status;

    const apps = await JobApplication.find(filter)
      .populate('job', 'title jobId')
      .populate('employer', 'companyName')
      .populate('veteran', 'veteranId personalInformation serviceInformation');

    const headers = [
      { label: 'Application ID', key: 'applicationId' },
      { label: 'Job Title', value: (a) => a.job?.title || '' },
      { label: 'Job ID', value: (a) => a.job?.jobId || '' },
      { label: 'Employer Company', value: (a) => a.employer?.companyName || '' },
      { label: 'Veteran ID', value: (a) => a.veteran?.veteranId || '' },
      { label: 'Candidate Name', value: (a) => a.veteran?.personalInformation?.fullName || '' },
      { label: 'Service Branch', value: (a) => a.veteran?.serviceInformation?.serviceBranch || '' },
      { label: 'Status', key: 'status' },
      { label: 'Applied Date', value: (a) => (a.appliedAt ? new Date(a.appliedAt).toISOString().split('T')[0] : '') },
      { label: 'Employer Remarks', value: (a) => a.employerRemarks || '' },
    ];

    const csvContent = convertToCsv(headers, apps);
    const filename = `job_applications_report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const exportVerificationsCsv = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ action: { $regex: /VERIF/ } })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    const headers = [
      { label: 'Date & Time', value: (l) => (l.createdAt ? new Date(l.createdAt).toISOString() : '') },
      { label: 'Admin User', value: (l) => `${l.user?.name || 'Admin'} (${l.user?.email || ''})` },
      { label: 'Action', key: 'action' },
      { label: 'Entity Type', key: 'entityType' },
      { label: 'Entity ID', key: 'entityId' },
      { label: 'Description', key: 'description' },
      { label: 'IP Address', key: 'ipAddress' },
    ];

    const csvContent = convertToCsv(headers, logs);
    const filename = `verifications_audit_report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   12. AUDIT LOGS
   ========================================================================== */

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req, 15);
    const { search, action, entityType, adminId, startDate, endDate } = req.query;

    const filter = {};

    if (action && action !== 'ALL') {
      filter.action = action;
    }

    if (entityType && entityType !== 'ALL') {
      filter.entityType = entityType;
    }

    if (adminId && adminId.match(/^[0-9a-fA-F]{24}$/)) {
      filter.user = adminId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ description: regex }, { entityId: regex }, { action: regex }, { ipAddress: regex }];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email role'),
      AuditLog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Audit logs retrieved successfully', {
      logs: logs.map((l) => l.toJSON()),
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   13. GLOBAL SEARCH (Debounced lookup across all collections)
   ========================================================================== */

export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim() || q.trim().length < 2) {
      return sendSuccess(res, 'Search query too short', {
        veterans: [],
        employers: [],
        schemes: [],
        jobs: [],
        applications: [],
      });
    }

    const regex = new RegExp(q.trim(), 'i');

    const [veterans, employers, schemes, jobs, applications] = await Promise.all([
      Veteran.find({
        $or: [
          { veteranId: regex },
          { 'personalInformation.fullName': regex },
          { 'personalInformation.email': regex },
          { 'serviceInformation.serviceNumber': regex },
        ],
      })
        .limit(5)
        .select('veteranId personalInformation serviceInformation verificationStatus'),

      Employer.find({
        $or: [{ employerId: regex }, { companyName: regex }, { email: regex }, { city: regex }],
      })
        .limit(5)
        .select('employerId companyName industry city verificationStatus'),

      Scheme.find({
        $or: [{ schemeId: regex }, { name: regex }, { category: regex }, { officialSource: regex }],
      })
        .limit(5)
        .select('schemeId name category status'),

      Job.find({
        $or: [{ jobId: regex }, { title: regex }, { city: regex }, { industry: regex }],
      })
        .limit(5)
        .select('jobId title location status')
        .populate('employer', 'companyName'),

      Application.find({
        applicationId: regex,
      })
        .limit(5)
        .select('applicationId status')
        .populate('scheme', 'name')
        .populate('veteran', 'personalInformation.fullName'),
    ]);

    return sendSuccess(res, 'Global search results', {
      veterans: veterans.map((v) => ({
        id: v._id,
        title: v.personalInformation?.fullName || v.veteranId,
        subtitle: `Veteran ID: ${v.veteranId} | ${v.serviceInformation?.serviceBranch || ''}`,
        url: `/admin/veterans/${v.veteranId}`,
        badge: v.verificationStatus,
      })),
      employers: employers.map((e) => ({
        id: e._id,
        title: e.companyName,
        subtitle: `Employer ID: ${e.employerId} | ${e.industry}`,
        url: `/admin/employers/${e.employerId}`,
        badge: e.verificationStatus,
      })),
      schemes: schemes.map((s) => ({
        id: s._id,
        title: s.name,
        subtitle: `Scheme ID: ${s.schemeId} | ${s.category}`,
        url: `/admin/schemes/${s.schemeId}`,
        badge: s.status,
      })),
      jobs: jobs.map((j) => ({
        id: j._id,
        title: j.title,
        subtitle: `Job ID: ${j.jobId} | ${j.employer?.companyName || ''}`,
        url: `/admin/jobs/${j.jobId}`,
        badge: j.status,
      })),
      applications: applications.map((a) => ({
        id: a._id,
        title: `App: ${a.applicationId}`,
        subtitle: `Scheme: ${a.scheme?.name || ''} | ${a.veteran?.personalInformation?.fullName || ''}`,
        url: `/admin/applications/schemes/${a.applicationId}`,
        badge: a.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================================
   14. SETTINGS & PASSWORD CHANGE
   ========================================================================== */

export const getAdminProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) throw ApiError.notFound('Admin user not found');

    return sendSuccess(res, 'Admin profile retrieved', { admin: user.toJSON(), user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

export const updateAdminProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('Admin user not found');

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();

    await user.save();

    await recordAuditLog({
      userId,
      action: 'ADMIN_PROFILE_UPDATED',
      entityType: 'SETTINGS',
      entityId: userId.toString(),
      description: `Administrator ${user.email} updated profile details.`,
      metadata: { name: user.name, phone: user.phone },
      req,
    });

    return sendSuccess(res, 'Admin profile updated successfully', { admin: user.toJSON(), user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw ApiError.badRequest('Please provide current password, new password, and password confirmation');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters long');
    }

    if (newPassword !== confirmPassword) {
      throw ApiError.badRequest('New password and confirmation do not match');
    }

    const user = await User.findById(userId).select('+password');
    if (!user) throw ApiError.notFound('Admin user not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password entered is incorrect');
    }

    user.password = newPassword;
    await user.save();

    await recordAuditLog({
      userId,
      action: 'ADMIN_PASSWORD_CHANGED',
      entityType: 'SETTINGS',
      entityId: userId.toString(),
      description: `Administrator ${user.email} successfully updated their login password.`,
      metadata: { action: 'PASSWORD_RESET' },
      req,
    });

    return sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
