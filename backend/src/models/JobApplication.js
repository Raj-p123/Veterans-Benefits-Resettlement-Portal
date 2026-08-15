import mongoose from 'mongoose';

export const JOB_APPLICATION_STATUS = [
  'APPLIED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW',
  'SELECTED',
  'REJECTED',
  'WITHDRAWN',
];

const attachedDocSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    documentType: {
      type: String,
      default: 'Document',
    },
    documentName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
  },
  { _id: true }
);

const timelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: JOB_APPLICATION_STATUS,
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

const jobApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: [true, 'Job application ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
      index: true,
    },
    veteran: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Veteran',
      required: [true, 'Veteran reference is required'],
      index: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: [true, 'Employer reference is required'],
      index: true,
    },
    coverLetter: {
      type: String,
      trim: true,
      default: '',
    },
    resumeDocument: {
      type: attachedDocSchema,
      default: null,
    },
    additionalDocuments: {
      type: [attachedDocSchema],
      default: [],
    },
    status: {
      type: String,
      enum: JOB_APPLICATION_STATUS,
      default: 'APPLIED',
      index: true,
    },
    employerRemarks: {
      type: String,
      trim: true,
      default: '',
    },
    timeline: {
      type: [timelineSchema],
      default: [],
    },
    appliedAt: {
      type: Date,
      default: Date.now,
      index: true,
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

// Compound index to prevent duplicate active applications
jobApplicationSchema.index({ veteran: 1, job: 1, status: 1 });

export const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
