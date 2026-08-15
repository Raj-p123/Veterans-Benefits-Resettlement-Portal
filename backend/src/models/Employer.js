import mongoose from 'mongoose';

export const EMPLOYER_VERIFICATION_STATUS = ['PENDING', 'VERIFIED', 'REJECTED'];

export const COMPANY_SIZES = [
  '1-10 Employees',
  '11-50 Employees',
  '51-200 Employees',
  '201-500 Employees',
  '501-1000 Employees',
  '1000+ Employees',
];

const employerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },
    employerId: {
      type: String,
      required: [true, 'Employer ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    companyDescription: {
      type: String,
      required: [true, 'Company description is required'],
      trim: true,
    },
    industry: {
      type: String,
      required: [true, 'Industry sector is required'],
      trim: true,
      index: true,
    },
    companySize: {
      type: String,
      enum: COMPANY_SIZES,
      default: '51-200 Employees',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Official corporate email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Corporate contact phone is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    postalCode: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    contactPerson: {
      name: {
        type: String,
        required: [true, 'Contact person name is required'],
        trim: true,
      },
      designation: {
        type: String,
        required: [true, 'Contact person designation is required'],
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
        default: '',
      },
      email: {
        type: String,
        trim: true,
        default: '',
      },
    },
    verificationStatus: {
      type: String,
      enum: EMPLOYER_VERIFICATION_STATUS,
      default: 'PENDING',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

export const Employer = mongoose.model('Employer', employerSchema);
