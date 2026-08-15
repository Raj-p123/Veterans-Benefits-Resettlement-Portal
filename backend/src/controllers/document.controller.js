import path from 'path';
import fs from 'fs';
import { Document, DOCUMENT_TYPES } from '../models/Document.js';
import { Veteran } from '../models/Veteran.js';
import { Employer } from '../models/Employer.js';
import { JobApplication } from '../models/JobApplication.js';
import { uploadFile, deleteFile } from '../config/cloudinary.js';
import { calculateProfileCompletion } from '../utils/profileCompletion.js';
import { generateVeteranId } from '../utils/veteranIdGenerator.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { socketService } from '../services/socketService.js';

/**
 * Helper to check user authorization to access/view/download a specific document
 */
export const checkDocumentAccess = async (document, user) => {
  if (!user) return false;
  const userId = (user._id || user.id).toString();

  // 1. Admin has global audit & scrutiny access
  if (user.role === 'ADMIN') return true;

  // 2. Veteran owner has full access to their own records
  if (document.user.toString() === userId) return true;

  // 3. Employer can access ONLY if document was submitted as part of a job application for their job
  if (user.role === 'EMPLOYER') {
    const employer = await Employer.findOne({ user: user._id || user.id });
    if (!employer) return false;

    const jobApp = await JobApplication.findOne({
      employer: employer._id,
      $or: [
        { 'resumeDocument.document': document._id },
        { 'additionalDocuments.document': document._id },
        { veteran: document.veteran }, // Authorized candidate dossier
      ],
    });

    if (jobApp) return true;
  }

  return false;
};

/**
 * Upload a new supporting document with atomic consistency
 */
export const uploadDocument = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const file = req.file;
    const { documentType, documentName, fileUrl: bodyFileUrl, fileName, fileSize, mimeType } = req.body;

    if (!file && !bodyFileUrl) {
      throw ApiError.badRequest('Please attach a document file or fileUrl');
    }

    if (!documentType || !DOCUMENT_TYPES.includes(documentType)) {
      // Clean up uploaded file if invalid type
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw ApiError.badRequest(
        `Invalid document classification. Allowed types: ${DOCUMENT_TYPES.join(', ')}`
      );
    }

    // Ensure Veteran profile exists
    let veteran = await Veteran.findOne({ user: userId });
    if (!veteran) {
      const veteranId = await generateVeteranId();
      veteran = await Veteran.create({
        user: userId,
        veteranId,
        personalInformation: {
          fullName: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
        },
      });
    }

    // Process file storage (Cloudinary or secure local disk fallback)
    let uploaded;
    if (file) {
      try {
        uploaded = await uploadFile(file.path, file.originalname, file.mimetype);
      } catch (storageErr) {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw ApiError.badRequest(`File storage failure: ${storageErr.message}`);
      }
    } else {
      uploaded = {
        fileUrl: bodyFileUrl,
        publicId: `doc_${Date.now()}`,
        bytes: fileSize || 1024 * 100,
      };
    }

    let newDoc;
    try {
      newDoc = await Document.create({
        user: userId,
        veteran: veteran._id,
        documentType,
        documentName: documentName?.trim() || fileName || file?.originalname || 'Supporting Document',
        fileUrl: uploaded.fileUrl,
        publicId: uploaded.publicId,
        mimeType: mimeType || file?.mimetype || 'application/pdf',
        fileSize: uploaded.bytes || file?.size || 1024 * 100,
        verificationStatus: 'PENDING',
        uploadedAt: new Date(),
      });
    } catch (dbErr) {
      // Clean up storage if database insert fails
      if (file) {
        await deleteFile(uploaded.publicId, uploaded.fileUrl);
      }
      throw dbErr;
    }

    // Update profile completion
    const docsCount = await Document.countDocuments({ user: userId });
    const completion = calculateProfileCompletion(veteran, docsCount);
    veteran.profileCompletion = completion.percentage;
    await veteran.save({ validateBeforeSave: false });

    // Emit Real-Time event to ADMIN role
    socketService.emitToRole('ADMIN', 'admin:documentUploaded', {
      documentId: newDoc._id.toString(),
      documentName: newDoc.documentName,
      documentType: newDoc.documentType,
      veteranId: veteran.veteranId,
      veteranName: req.user.name,
      uploadedAt: newDoc.uploadedAt,
    });
    socketService.emitToRole('ADMIN', 'admin:dashboardUpdated', { module: 'documents' });

    return sendCreated(res, 'Document uploaded successfully and queued for verification', {
      document: newDoc.toJSON(),
      completionPercentage: completion.percentage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Replace / Re-upload a rejected or existing document
 */
export const replaceDocument = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw ApiError.badRequest('Please attach a replacement document file');
    }

    const document = await Document.findById(id);
    if (!document) {
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw ApiError.notFound('Document record not found');
    }

    // Ownership Enforcement
    if (document.user.toString() !== userId.toString()) {
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw ApiError.forbidden('You do not have permission to replace this document');
    }

    const oldPublicId = document.publicId;
    const oldFileUrl = document.fileUrl;

    // Process new file
    const uploaded = await uploadFile(file.path, file.originalname, file.mimetype);

    // Update record & reset verification status
    document.fileUrl = uploaded.fileUrl;
    document.publicId = uploaded.publicId;
    document.mimeType = file.mimetype;
    document.fileSize = uploaded.bytes || file.size;
    document.verificationStatus = 'PENDING';
    document.rejectionReason = '';
    document.adminRemarks = '';
    document.uploadedAt = new Date();

    if (req.body.documentName?.trim()) {
      document.documentName = req.body.documentName.trim();
    }
    if (req.body.documentType && DOCUMENT_TYPES.includes(req.body.documentType)) {
      document.documentType = req.body.documentType;
    }

    await document.save();

    // Delete old physical file
    await deleteFile(oldPublicId, oldFileUrl);

    // Real-Time notification to Admin
    const veteran = await Veteran.findOne({ user: userId });
    socketService.emitToRole('ADMIN', 'admin:documentUploaded', {
      documentId: document._id.toString(),
      documentName: document.documentName,
      documentType: document.documentType,
      veteranId: veteran?.veteranId,
      veteranName: req.user.name,
      uploadedAt: document.uploadedAt,
      isReplacement: true,
    });
    socketService.emitToRole('ADMIN', 'admin:dashboardUpdated', { module: 'documents' });

    return sendSuccess(res, 'Document replaced successfully and queued for review', {
      document: document.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all documents for the authenticated veteran
 */
export const getDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    const documents = await Document.find({ user: userId }).sort({ createdAt: -1 });

    return sendSuccess(res, 'Documents retrieved successfully', {
      documents: documents.map((doc) => doc.toJSON()),
      total: documents.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single document metadata by ID with strict ownership validation
 */
export const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      throw ApiError.notFound('Document record not found');
    }

    const hasAccess = await checkDocumentAccess(document, req.user);
    if (!hasAccess) {
      throw ApiError.forbidden('Access Denied: You do not have authorization to view this document');
    }

    return sendSuccess(res, 'Document details retrieved successfully', {
      document: document.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Securely stream / view document file (inline) with authorization check
 */
export const streamDocumentFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      throw ApiError.notFound('Document record not found');
    }

    const hasAccess = await checkDocumentAccess(document, req.user);
    if (!hasAccess) {
      throw ApiError.forbidden('Access Denied: You do not have permission to view this file');
    }

    // Remote Cloud Storage
    if (document.fileUrl.startsWith('http://') || document.fileUrl.startsWith('https://')) {
      return res.redirect(document.fileUrl);
    }

    // Local Disk Storage with Path Traversal Protection
    const filename = path.basename(document.fileUrl);
    const safeFilePath = path.resolve('uploads', 'documents', filename);

    if (!fs.existsSync(safeFilePath)) {
      throw ApiError.notFound('Physical document file not found on server storage');
    }

    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.documentName)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.sendFile(safeFilePath);
  } catch (error) {
    next(error);
  }
};

/**
 * Securely download document file (attachment) with authorization check
 */
export const downloadDocumentFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      throw ApiError.notFound('Document record not found');
    }

    const hasAccess = await checkDocumentAccess(document, req.user);
    if (!hasAccess) {
      throw ApiError.forbidden('Access Denied: You do not have permission to download this file');
    }

    // Remote Cloud Storage
    if (document.fileUrl.startsWith('http://') || document.fileUrl.startsWith('https://')) {
      return res.redirect(document.fileUrl);
    }

    // Local Disk Storage with Path Traversal Protection
    const filename = path.basename(document.fileUrl);
    const safeFilePath = path.resolve('uploads', 'documents', filename);

    if (!fs.existsSync(safeFilePath)) {
      throw ApiError.notFound('Physical document file not found on server storage');
    }

    const ext = path.extname(safeFilePath);
    const downloadName = `${document.documentName.replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`;

    return res.download(safeFilePath, downloadName);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document with strict ownership validation
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    // Ownership Enforcement
    if (document.user.toString() !== userId.toString() && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to delete this document');
    }

    // Delete from storage
    await deleteFile(document.publicId, document.fileUrl);

    // Delete record from DB
    await Document.findByIdAndDelete(id);

    // Update profile completion
    const veteran = await Veteran.findOne({ user: userId });
    if (veteran) {
      const docsCount = await Document.countDocuments({ user: userId });
      const completion = calculateProfileCompletion(veteran, docsCount);
      veteran.profileCompletion = completion.percentage;
      await veteran.save({ validateBeforeSave: false });
    }

    return sendSuccess(res, 'Document deleted successfully', {
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};
