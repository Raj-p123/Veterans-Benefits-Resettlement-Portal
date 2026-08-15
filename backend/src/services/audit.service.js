import { AuditLog } from '../models/AuditLog.js';

/**
 * Safely records an administrative audit log entry
 * @param {Object} options
 * @param {string|ObjectId} options.userId - Admin performing the action
 * @param {string} options.action - Action constant string
 * @param {string} options.entityType - Entity type ('VETERAN', 'EMPLOYER', etc.)
 * @param {string} options.entityId - ID of the target entity
 * @param {string} options.description - Clear explanation of action
 * @param {Object} [options.metadata] - Optional additional context
 * @param {Object|string} [options.req] - Express request object or IP string
 */
export const recordAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  description,
  metadata = {},
  req = null,
}) => {
  try {
    if (!userId || !action || !entityType || !entityId) {
      console.warn('[AuditLog] Skipped recording: missing required audit parameters.');
      return null;
    }

    let ipAddress = '';
    if (typeof req === 'string') {
      ipAddress = req;
    } else if (req && typeof req === 'object') {
      ipAddress =
        req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        '';
    }

    // Ensure sensitive fields (like password, tokens) are stripped from metadata
    const cleanMetadata = { ...metadata };
    delete cleanMetadata.password;
    delete cleanMetadata.currentPassword;
    delete cleanMetadata.newPassword;
    delete cleanMetadata.confirmPassword;
    delete cleanMetadata.token;

    const logEntry = await AuditLog.create({
      user: userId,
      action,
      entityType,
      entityId: String(entityId),
      description,
      metadata: cleanMetadata,
      ipAddress,
    });

    console.log(`[AuditLog] Recorded: ${action} on ${entityType}:${entityId} by User:${userId}`);
    return logEntry;
  } catch (error) {
    console.error('[AuditLog Error]: Failed to create audit log record:', error.message);
    return null;
  }
};

export default {
  recordAuditLog,
};
