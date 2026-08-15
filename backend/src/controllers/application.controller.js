import { Application, APPLICATION_STATUS } from '../models/Application.js';
import { Scheme } from '../models/Scheme.js';
import { Veteran } from '../models/Veteran.js';
import { Document } from '../models/Document.js';
import { User } from '../models/User.js';
import { generateApplicationId } from '../utils/applicationIdGenerator.js';
import { evaluateEligibility } from '../services/eligibility.service.js';
import { emitApplicationEvent, NOTIFICATION_EVENTS } from '../services/notificationHook.js';
import { notificationService } from '../services/notification.service.js';
import { socketService } from '../services/socketService.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Start or continue a draft application for a scheme
 */
export const createApplication = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { schemeId } = req.body;

    if (!schemeId) {
      throw ApiError.badRequest('Please provide schemeId to start an application');
    }

    // Find Scheme
    let scheme = null;
    if (schemeId.match(/^[0-9a-fA-F]{24}$/)) {
      scheme = await Scheme.findById(schemeId);
    }
    if (!scheme) {
      scheme = await Scheme.findOne({ schemeId });
    }

    if (!scheme) {
      throw ApiError.notFound('Scheme not found');
    }

    if (scheme.status !== 'ACTIVE') {
      throw ApiError.badRequest('This scheme is not currently accepting applications');
    }

    // Find Veteran Profile
    let veteran = await Veteran.findOne({ user: userId });
    if (!veteran) {
      throw ApiError.badRequest(
        'Please create your military service profile before starting an application'
      );
    }

    // Check for existing active application (SUBMITTED, UNDER_REVIEW, DOCUMENT_VERIFICATION, APPROVED)
    const existingActive = await Application.findOne({
      user: userId,
      scheme: scheme._id,
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'APPROVED'] },
    });

    if (existingActive) {
      throw ApiError.badRequest(
        `You already have an active application (${existingActive.applicationId}) for this scheme with status: ${existingActive.status}.`
      );
    }

    // Check if an existing DRAFT exists to resume
    let application = await Application.findOne({
      user: userId,
      scheme: scheme._id,
      status: 'DRAFT',
    }).populate('scheme', 'name category schemeId officialSource requiredDocuments applicationFields');

    if (application) {
      return sendSuccess(res, 'Continuing existing draft application', {
        application: application.toJSON(),
        isResume: true,
      });
    }

    // Generate unique Application ID
    const applicationId = await generateApplicationId();

    application = await Application.create({
      applicationId,
      user: userId,
      veteran: veteran._id,
      scheme: scheme._id,
      applicationType: 'SCHEME',
      formData: {},
      documents: [],
      status: 'DRAFT',
      timeline: [
        {
          status: 'DRAFT',
          message: 'Application draft initiated by applicant.',
          changedAt: new Date(),
          changedBy: userId,
        },
      ],
    });

    const populated = await Application.findById(application._id).populate(
      'scheme',
      'name category schemeId officialSource requiredDocuments applicationFields'
    );

    emitApplicationEvent(NOTIFICATION_EVENTS.APPLICATION_CREATED, {
      applicationId,
      status: 'DRAFT',
      userId,
    });

    return sendCreated(res, 'Application initiated successfully', {
      application: populated.toJSON(),
      isResume: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all applications for current authenticated veteran with search and status filtering
 */
export const getMyApplications = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const { status, search } = req.query;

    const filter = { user: userId };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search && search.trim()) {
      filter.$or = [
        { applicationId: new RegExp(search.trim(), 'i') },
      ];
    }

    const [applications, total, allAppsForCounts] = await Promise.all([
      Application.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('scheme', 'name category schemeId officialSource deadline'),
      Application.countDocuments(filter),
      Application.find({ user: userId }, 'status'),
    ]);

    // Status metrics
    const counts = {
      total: allAppsForCounts.length,
      draft: allAppsForCounts.filter((a) => a.status === 'DRAFT').length,
      submitted: allAppsForCounts.filter((a) => a.status === 'SUBMITTED').length,
      underReview: allAppsForCounts.filter(
        (a) => a.status === 'UNDER_REVIEW' || a.status === 'DOCUMENT_VERIFICATION'
      ).length,
      approved: allAppsForCounts.filter((a) => a.status === 'APPROVED').length,
      rejected: allAppsForCounts.filter((a) => a.status === 'REJECTED').length,
      withdrawn: allAppsForCounts.filter((a) => a.status === 'WITHDRAWN').length,
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Applications retrieved successfully', {
      applications: applications.map((a) => a.toJSON()),
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
 * Get summary statistics for Veteran Dashboard
 */
export const getApplicationStats = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const apps = await Application.find({ user: userId }, 'status');

    const stats = {
      total: apps.length,
      draft: apps.filter((a) => a.status === 'DRAFT').length,
      submitted: apps.filter((a) => a.status === 'SUBMITTED').length,
      underReview: apps.filter(
        (a) => a.status === 'UNDER_REVIEW' || a.status === 'DOCUMENT_VERIFICATION'
      ).length,
      approved: apps.filter((a) => a.status === 'APPROVED').length,
      rejected: apps.filter((a) => a.status === 'REJECTED').length,
      withdrawn: apps.filter((a) => a.status === 'WITHDRAWN').length,
    };

    return sendSuccess(res, 'Application statistics retrieved', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single application by ID with strict ownership validation
 */
export const getApplicationById = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await Application.findById(id);
    }
    if (!application) {
      application = await Application.findOne({ applicationId: id });
    }

    if (!application) {
      throw ApiError.notFound('Application record not found');
    }

    // Ownership Enforcement
    if (
      application.user.toString() !== userId.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      throw ApiError.forbidden('You do not have authorization to view this application record');
    }

    const populated = await Application.findById(application._id)
      .populate('scheme')
      .populate('veteran')
      .populate('documents.document');

    return sendSuccess(res, 'Application details retrieved', {
      application: populated.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a DRAFT application (form data and attached documents)
 */
export const updateApplication = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { formData, documents } = req.body;

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await Application.findById(id);
    }
    if (!application) {
      application = await Application.findOne({ applicationId: id });
    }

    if (!application) {
      throw ApiError.notFound('Application record not found');
    }

    // Ownership Enforcement
    if (application.user.toString() !== userId.toString()) {
      throw ApiError.forbidden('You do not have authorization to modify this application');
    }

    if (application.status !== 'DRAFT') {
      throw ApiError.badRequest(
        `Only DRAFT applications can be modified. Current status is ${application.status}.`
      );
    }

    if (formData && typeof formData === 'object') {
      application.formData = {
        ...application.formData,
        ...formData,
      };
    }

    if (Array.isArray(documents)) {
      application.documents = documents;
    }

    await application.save();

    const populated = await Application.findById(application._id)
      .populate('scheme')
      .populate('documents.document');

    return sendSuccess(res, 'Draft application saved successfully', {
      application: populated.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit an application (validates eligibility, required fields, documents, and declaration)
 */
export const submitApplication = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { formData, documents, declarationAccepted } = req.body;

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await Application.findById(id);
    }
    if (!application) {
      application = await Application.findOne({ applicationId: id });
    }

    if (!application) {
      throw ApiError.notFound('Application record not found');
    }

    // Ownership check
    if (application.user.toString() !== userId.toString()) {
      throw ApiError.forbidden('You do not have authorization to submit this application');
    }

    if (application.status !== 'DRAFT') {
      throw ApiError.badRequest(
        `Application has already been submitted or processed (Status: ${application.status})`
      );
    }

    if (!declarationAccepted) {
      throw ApiError.badRequest(
        'You must accept the legal declaration confirming the accuracy of your submitted records before submitting.'
      );
    }

    // Merge any final form answers and documents
    if (formData && typeof formData === 'object') {
      application.formData = { ...application.formData, ...formData };
    }
    if (Array.isArray(documents)) {
      application.documents = documents;
    }

    // Load Scheme & Veteran
    const scheme = await Scheme.findById(application.scheme);
    if (!scheme || scheme.status !== 'ACTIVE') {
      throw ApiError.badRequest('The welfare scheme is inactive or no longer accepting applications');
    }

    const veteran = await Veteran.findOne({ user: userId });
    if (!veteran) {
      throw ApiError.badRequest('Veteran profile record not found');
    }

    // 1. Server-Side Smart Eligibility Check
    const eligibilityEval = evaluateEligibility(veteran, scheme);
    if (eligibilityEval.status === 'NOT_ELIGIBLE') {
      throw ApiError.badRequest(
        `Submission blocked: You do not satisfy the criteria for this scheme (${eligibilityEval.unmatchedCriteria.join('; ')})`
      );
    }
    if (eligibilityEval.status === 'INCOMPLETE_PROFILE') {
      throw ApiError.badRequest(
        `Submission blocked: Your profile lacks necessary service information (${eligibilityEval.missingCriteria.join('; ')}). Please complete your profile first.`
      );
    }

    // 2. Validate Scheme Application Form Fields
    if (Array.isArray(scheme.applicationFields) && scheme.applicationFields.length > 0) {
      for (const field of scheme.applicationFields) {
        if (field.required) {
          const val = application.formData?.[field.name];
          if (val === undefined || val === null || String(val).trim() === '') {
            throw ApiError.badRequest(`Missing required application field: "${field.label}"`);
          }
        }
      }
    }

    // 3. Validate Required Documents
    if (Array.isArray(scheme.requiredDocuments) && scheme.requiredDocuments.length > 0) {
      const attachedTypes = (application.documents || []).map((d) => (d.documentType || '').trim().toLowerCase());
      const missingDocs = [];

      for (const reqDoc of scheme.requiredDocuments) {
        const normalized = reqDoc.trim().toLowerCase();
        if (!attachedTypes.includes(normalized)) {
          missingDocs.push(reqDoc);
        }
      }

      if (missingDocs.length > 0) {
        throw ApiError.badRequest(
          `Please attach the required supporting documents: ${missingDocs.join(', ')}`
        );
      }
    }

    // 4. Update Application Status to SUBMITTED
    application.status = 'SUBMITTED';
    application.submittedAt = new Date();
    application.timeline.push({
      status: 'SUBMITTED',
      message: 'Application officially submitted for departmental scrutiny and verification.',
      changedAt: new Date(),
      changedBy: userId,
    });

    await application.save();

    const populated = await Application.findById(application._id)
      .populate('scheme')
      .populate('veteran')
      .populate('documents.document');

    // Real-Time Notification & Socket Event Dispatch
    await notificationService.createNotification({
      userId,
      type: 'APPLICATION_SUBMITTED',
      title: 'Scheme Application Submitted',
      message: `Your application for ${scheme.name} (${application.applicationId}) has been successfully submitted.`,
      entityType: 'SCHEME_APPLICATION',
      entityId: application.applicationId,
      actionUrl: `/veteran/applications/${application.applicationId}`,
      emailDetails: {
        toEmail: req.user.email,
        templateType: 'SCHEME_SUBMITTED',
        data: {
          veteranName: req.user.name,
          schemeName: scheme.name,
          applicationId: application.applicationId,
          submissionDate: application.submittedAt,
          status: application.status,
          actionUrl: `${config.clientUrl}/veteran/applications/${application.applicationId}`,
        },
      },
    });

    socketService.emitToUser(userId, SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, {
      applicationId: application.applicationId,
      status: 'SUBMITTED',
      schemeName: scheme.name,
      timeline: application.timeline,
    });
    socketService.emitToUser(userId, SOCKET_EVENTS.DASHBOARD_UPDATED, { module: 'schemes', type: 'SUBMITTED' });

    // Emit to ADMIN role
    socketService.emitToRole('ADMIN', 'admin:applicationCreated', {
      type: 'SCHEME',
      applicationId: application.applicationId,
      schemeName: scheme.name,
      applicantName: req.user.name,
      submittedAt: application.submittedAt,
    });
    socketService.emitToRole('ADMIN', 'admin:dashboardUpdated', { module: 'scheme_applications' });

    emitApplicationEvent(NOTIFICATION_EVENTS.APPLICATION_SUBMITTED, {
      applicationId: application.applicationId,
      status: 'SUBMITTED',
      userId,
      schemeName: scheme.name,
    });

    return sendSuccess(res, 'Application submitted successfully!', {
      application: populated.toJSON(),
      applicationId: application.applicationId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw an application (only allowed in DRAFT or SUBMITTED status)
 */
export const withdrawApplication = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await Application.findById(id);
    }
    if (!application) {
      application = await Application.findOne({ applicationId: id });
    }

    if (!application) {
      throw ApiError.notFound('Application record not found');
    }

    // Ownership check
    if (application.user.toString() !== userId.toString()) {
      throw ApiError.forbidden('You do not have permission to withdraw this application');
    }

    if (!['DRAFT', 'SUBMITTED'].includes(application.status)) {
      throw ApiError.badRequest(
        `Application cannot be withdrawn in its current processing stage (Status: ${application.status}).`
      );
    }

    application.status = 'WITHDRAWN';
    application.timeline.push({
      status: 'WITHDRAWN',
      message: 'Application withdrawn by applicant.',
      changedAt: new Date(),
      changedBy: userId,
    });

    await application.save();

    emitApplicationEvent(NOTIFICATION_EVENTS.APPLICATION_WITHDRAWN, {
      applicationId: application.applicationId,
      status: 'WITHDRAWN',
      userId,
    });

    return sendSuccess(res, 'Application withdrawn successfully', {
      application: application.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin controlled status updates with admin remarks and timeline event
 */
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    if (!status || !APPLICATION_STATUS.includes(status)) {
      throw ApiError.badRequest(
        `Invalid status. Allowed statuses: ${APPLICATION_STATUS.join(', ')}`
      );
    }

    let application = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      application = await Application.findById(id);
    }
    if (!application) {
      application = await Application.findOne({ applicationId: id });
    }

    if (!application) {
      throw ApiError.notFound('Application record not found');
    }

    // Prevent invalid regression e.g. APPROVED back to DRAFT
    if (application.status === 'APPROVED' && status === 'DRAFT') {
      throw ApiError.badRequest('Approved applications cannot be reverted to draft status');
    }

    application.status = status;
    if (adminRemarks) {
      application.adminRemarks = adminRemarks.trim();
    }

    application.timeline.push({
      status,
      message:
        adminRemarks?.trim() ||
        `Application status updated to ${status.replace('_', ' ')} by authority.`,
      changedAt: new Date(),
      changedBy: req.user._id || req.user.id,
    });

    await application.save();

    // Fetch user details for email & notification dispatch
    const veteranUser = await User.findById(application.user);
    const scheme = await Scheme.findById(application.scheme);
    const schemeName = scheme?.name || 'Welfare Scheme';

    await notificationService.createNotification({
      userId: application.user,
      type: 'APPLICATION_STATUS_CHANGED',
      title: `Scheme Application ${status.replace('_', ' ')}`,
      message: `Your application for ${schemeName} (${application.applicationId}) is now ${status.replace('_', ' ')}.${adminRemarks ? ` Remarks: ${adminRemarks}` : ''}`,
      entityType: 'SCHEME_APPLICATION',
      entityId: application.applicationId,
      actionUrl: `/veteran/applications/${application.applicationId}`,
      emailDetails: veteranUser?.email
        ? {
            toEmail: veteranUser.email,
            templateType: 'SCHEME_STATUS_CHANGED',
            data: {
              veteranName: veteranUser.name || 'Veteran',
              schemeName,
              applicationId: application.applicationId,
              newStatus: status,
              adminRemarks,
              actionUrl: `${config.clientUrl}/veteran/applications/${application.applicationId}`,
            },
          }
        : null,
    });

    socketService.emitToUser(application.user, SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, {
      applicationId: application.applicationId,
      status,
      adminRemarks,
      timeline: application.timeline,
    });
    socketService.emitToUser(application.user, SOCKET_EVENTS.DASHBOARD_UPDATED, { module: 'schemes', status });

    emitApplicationEvent(NOTIFICATION_EVENTS.APPLICATION_STATUS_CHANGED, {
      applicationId: application.applicationId,
      status,
      adminRemarks,
      userId: application.user,
    });

    return sendSuccess(res, `Application status updated to ${status}`, {
      application: application.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
