import mongoose from 'mongoose';

export const AUDIT_ACTIONS = [
  'VETERAN_VERIFIED',
  'VETERAN_REJECTED',
  'VETERAN_PENDING',
  'EMPLOYER_VERIFIED',
  'EMPLOYER_REJECTED',
  'EMPLOYER_PENDING',
  'DOCUMENT_VERIFIED',
  'DOCUMENT_REJECTED',
  'DOCUMENT_STATUS_CHANGED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'USER_STATUS_CHANGED',
  'SCHEME_CREATED',
  'SCHEME_UPDATED',
  'SCHEME_DELETED',
  'SCHEME_STATUS_CHANGED',
  'JOB_MODERATED',
  'JOB_STATUS_CHANGED',
  'JOB_DELETED',
  'SCHEME_APPLICATION_STATUS_CHANGED',
  'JOB_APPLICATION_STATUS_CHANGED',
  'ADMIN_PASSWORD_CHANGED',
  'ADMIN_PROFILE_UPDATED',
  'SYSTEM_EVENT',
];

export const AUDIT_ENTITY_TYPES = [
  'VETERAN',
  'EMPLOYER',
  'DOCUMENT',
  'USER',
  'SCHEME',
  'JOB',
  'SCHEME_APPLICATION',
  'JOB_APPLICATION',
  'AUTH',
  'SETTINGS',
  'SYSTEM',
];

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin user reference is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action identifier is required'],
      index: true,
    },
    entityType: {
      type: String,
      enum: AUDIT_ENTITY_TYPES,
      required: [true, 'Entity type is required'],
      index: true,
    },
    entityId: {
      type: String,
      required: [true, 'Entity ID is required'],
      index: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for optimized querying by date range, action, and entity
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
