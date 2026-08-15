import { Veteran } from '../models/Veteran.js';
import { Document } from '../models/Document.js';
import { generateVeteranId } from '../utils/veteranIdGenerator.js';
import { calculateProfileCompletion } from '../utils/profileCompletion.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Get or initialize current veteran's profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    let veteran = await Veteran.findOne({ user: userId });

    // If profile does not exist yet for this registered veteran, initialize one cleanly
    if (!veteran) {
      const veteranId = await generateVeteranId();
      veteran = await Veteran.create({
        user: userId,
        veteranId,
        personalInformation: {
          fullName: req.user.name || '',
          email: req.user.email || '',
          phone: req.user.phone || '',
          country: 'India',
        },
        serviceInformation: {
          serviceBranch: 'Army',
          serviceStatus: 'Retired',
        },
        profileCompletion: 20, // Initial minimal shell
        verificationStatus: 'PENDING',
      });
    }

    const docsCount = await Document.countDocuments({ user: userId });
    const completion = calculateProfileCompletion(veteran, docsCount);

    if (veteran.profileCompletion !== completion.percentage) {
      veteran.profileCompletion = completion.percentage;
      await veteran.save({ validateBeforeSave: false });
    }

    return sendSuccess(res, 'Veteran profile retrieved successfully', {
      profile: veteran.toJSON ? veteran.toJSON() : veteran,
      completion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create veteran profile (explicit POST)
 */
export const createProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const existing = await Veteran.findOne({ user: userId });
    if (existing) {
      throw ApiError.badRequest('Profile already exists for this veteran. Use update API instead.');
    }

    const veteranId = await generateVeteranId();

    const {
      personalInformation = {},
      serviceInformation = {},
      education = [],
      skills = [],
      certifications = [],
      jobPreferences = {},
    } = req.body;

    // Validate service dates if both provided
    if (serviceInformation.dateOfJoining && serviceInformation.dateOfDischarge) {
      const joinDate = new Date(serviceInformation.dateOfJoining);
      const dischargeDate = new Date(serviceInformation.dateOfDischarge);
      if (dischargeDate < joinDate) {
        throw ApiError.badRequest('Discharge / Retirement date cannot be before joining date');
      }
    }

    const docsCount = await Document.countDocuments({ user: userId });
    const completion = calculateProfileCompletion(
      { personalInformation, serviceInformation, education, skills, jobPreferences },
      docsCount
    );

    const newVeteran = await Veteran.create({
      user: userId,
      veteranId,
      personalInformation: {
        ...personalInformation,
        fullName: personalInformation.fullName || req.user.name,
        email: req.user.email,
        phone: personalInformation.phone || req.user.phone,
      },
      serviceInformation,
      education,
      skills,
      certifications,
      jobPreferences,
      profileCompletion: completion.percentage,
      verificationStatus: 'PENDING',
    });

    return sendCreated(res, 'Veteran profile created successfully', {
      profile: newVeteran.toJSON(),
      completion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update veteran profile (PUT)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    let veteran = await Veteran.findOne({ user: userId });

    if (!veteran) {
      // Auto initialize if not created yet
      const veteranId = await generateVeteranId();
      veteran = new Veteran({
        user: userId,
        veteranId,
        personalInformation: {
          fullName: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
        },
      });
    }

    const {
      personalInformation,
      serviceInformation,
      education,
      skills,
      certifications,
      jobPreferences,
    } = req.body;

    // Date validations
    if (serviceInformation?.dateOfJoining && serviceInformation?.dateOfDischarge) {
      const joinDate = new Date(serviceInformation.dateOfJoining);
      const dischargeDate = new Date(serviceInformation.dateOfDischarge);
      if (dischargeDate < joinDate) {
        throw ApiError.badRequest('Discharge / Retirement date cannot be before joining date');
      }
    }

    // Merge updates safely
    if (personalInformation) {
      const existingPersonal = veteran.personalInformation?.toObject
        ? veteran.personalInformation.toObject()
        : (veteran.personalInformation || {});
      veteran.personalInformation = {
        ...existingPersonal,
        ...personalInformation,
        email: req.user.email, // Preserve verified email from user
      };
    }

    if (serviceInformation) {
      const existingService = veteran.serviceInformation?.toObject
        ? veteran.serviceInformation.toObject()
        : (veteran.serviceInformation || {});
      veteran.serviceInformation = {
        ...existingService,
        ...serviceInformation,
      };
    }

    if (Array.isArray(education)) {
      veteran.education = education;
    }

    if (Array.isArray(skills)) {
      veteran.skills = skills.map((s) => String(s).trim()).filter(Boolean);
    }

    if (Array.isArray(certifications)) {
      veteran.certifications = certifications;
    }

    if (jobPreferences) {
      const existingJobPrefs = veteran.jobPreferences?.toObject
        ? veteran.jobPreferences.toObject()
        : (veteran.jobPreferences || {});
      veteran.jobPreferences = {
        ...existingJobPrefs,
        ...jobPreferences,
      };
    }

    // Recalculate profile completion
    const docsCount = await Document.countDocuments({ user: userId });
    const completion = calculateProfileCompletion(veteran, docsCount);
    veteran.profileCompletion = completion.percentage;

    await veteran.save();

    return sendSuccess(res, 'Veteran profile updated successfully', {
      profile: veteran.toJSON(),
      completion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile completion breakdown
 */
export const getProfileCompletion = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const veteran = await Veteran.findOne({ user: userId });
    const docsCount = await Document.countDocuments({ user: userId });

    const completion = calculateProfileCompletion(veteran, docsCount);

    return sendSuccess(res, 'Profile completion breakdown retrieved', completion);
  } catch (error) {
    next(error);
  }
};
