import mongoose from 'mongoose';

export const DOCUMENT_TYPES = [
  'Service Certificate',
  'Discharge Certificate',
  'Discharge Book',
  'Identity Document',
  'Pension Document',
  'Education Certificate',
  'Skill Certificate',
  'Experience Certificate',
  'Address Proof',
  'Other',
  'SERVICE_CERTIFICATE',
  'DISCHARGE_CERTIFICATE',
  'DISCHARGE_BOOK',
  'IDENTITY_DOCUMENT',
  'PENSION_DOCUMENT',
  'EDUCATION_CERTIFICATE',
  'SKILL_CERTIFICATE',
  'EXPERIENCE_CERTIFICATE',
  'ADDRESS_PROOF',
  'OTHER',
];

export const DOCUMENT_STATUS = [
  'UPLOADED',
  'PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
];

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    veteran: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Veteran',
      required: [true, 'Veteran reference is required'],
      index: true,
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      enum: {
        values: DOCUMENT_TYPES,
        message: '{VALUE} is not a valid document type',
      },
    },
    documentName: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    publicId: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: DOCUMENT_STATUS,
        message: '{VALUE} is not a valid document verification status',
      },
      default: 'PENDING',
      index: true,
    },
    adminRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
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

export const Document = mongoose.model('Document', documentSchema);
