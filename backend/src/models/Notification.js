import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'APPLICATION_SUBMITTED',
  'APPLICATION_STATUS_CHANGED',
  'JOB_APPLICATION_RECEIVED',
  'JOB_APPLICATION_STATUS_CHANGED',
  'JOB_POSTED',
  'JOB_CLOSED',
  'DOCUMENT_STATUS_CHANGED',
  'VETERAN_VERIFIED',
  'EMPLOYER_VERIFIED',
  'VERIFICATION_STATUS_CHANGED',
  'VETERAN_REGISTERED',
  'EMPLOYER_REGISTERED',
  'SYSTEM',
];

export const NOTIFICATION_ENTITY_TYPES = [
  'SCHEME_APPLICATION',
  'JOB_APPLICATION',
  'JOB',
  'DOCUMENT',
  'PROFILE',
  'VETERAN',
  'EMPLOYER',
  'SCHEME',
  'USER',
  'SYSTEM',
];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      enum: NOTIFICATION_ENTITY_TYPES,
      default: 'SYSTEM',
    },
    entityId: {
      type: String,
      trim: true,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for optimized querying of unread/recent notifications by user
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
