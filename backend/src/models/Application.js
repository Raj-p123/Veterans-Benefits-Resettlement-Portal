import mongoose from 'mongoose';

export const APPLICATION_TYPES = ['SCHEME', 'JOB', 'TRAINING', 'OTHER'];

export const APPLICATION_STATUS = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'DOCUMENT_VERIFICATION',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
];

const attachedDocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      required: true,
      trim: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const timelineEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: APPLICATION_STATUS,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: [true, 'Application ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    veteran: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Veteran',
      required: [true, 'Veteran profile reference is required'],
      index: true,
    },
    scheme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      required: [true, 'Scheme reference is required'],
      index: true,
    },
    applicationType: {
      type: String,
      enum: APPLICATION_TYPES,
      default: 'SCHEME',
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    documents: {
      type: [attachedDocumentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: APPLICATION_STATUS,
      default: 'DRAFT',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
      index: true,
    },
    adminRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
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

// Compound index for finding active applications by user & scheme
applicationSchema.index({ user: 1, scheme: 1, status: 1 });

export const Application = mongoose.model('Application', applicationSchema);
