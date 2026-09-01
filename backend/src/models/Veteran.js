import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    institution: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
    },
    fieldOfStudy: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: Number,
      min: [1950, 'Year must be after 1950'],
      max: [new Date().getFullYear() + 10, 'Invalid year'],
    },
    gradeOrPercentage: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Certification name is required'],
      trim: true,
    },
    issuingOrganization: {
      type: String,
      required: [true, 'Issuing organization is required'],
      trim: true,
    },
    issueDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    credentialId: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const veteranSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },
    veteranId: {
      type: String,
      required: [true, 'Veteran ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    personalInformation: {
      fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
      },
      dob: {
        type: Date,
      },
      gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
        default: 'Male',
      },
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      profilePhoto: {
        type: String,
        default: '',
      },
      address: {
        type: String,
        trim: true,
        default: '',
      },
      city: {
        type: String,
        trim: true,
        default: '',
      },
      state: {
        type: String,
        trim: true,
        default: '',
      },
      pincode: {
        type: String,
        trim: true,
        default: '',
      },
      country: {
        type: String,
        default: 'India',
        trim: true,
      },
    },
    serviceInformation: {
      serviceBranch: {
        type: String,
        enum: [
          'Army', 'Navy', 'Air Force', 'Coast Guard', 'Other',
          'ARMY', 'NAVY', 'AIR_FORCE', 'AIR FORCE', 'COAST_GUARD', 'COAST GUARD', 'OTHER'
        ],
        default: 'Army',
      },
      rank: {
        type: String,
        trim: true,
        default: '',
      },
      serviceNumber: {
        type: String,
        trim: true,
        default: '',
      },
      dateOfJoining: {
        type: Date,
      },
      dateOfDischarge: {
        type: Date,
      },
      yearsOfService: {
        type: Number,
        min: 0,
        max: 60,
        default: 0,
      },
      serviceStatus: {
        type: String,
        enum: [
          'Retired', 'Discharged', 'Released', 'Other',
          'RETIRED', 'DISCHARGED', 'RELEASED', 'OTHER'
        ],
        default: 'Retired',
      },
      lastPosting: {
        type: String,
        trim: true,
        default: '',
      },
      primaryMilitaryRole: {
        type: String,
        trim: true,
        default: '',
      },
      secondaryMilitaryRoles: {
        type: [String],
        default: [],
      },
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [certificationSchema],
      default: [],
    },
    jobPreferences: {
      preferredJobLocation: {
        type: [String],
        default: [],
      },
      preferredStates: {
        type: [String],
        default: [],
      },
      preferredIndustries: {
        type: [String],
        default: [],
      },
      preferredEmploymentType: {
        type: [String],
        enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Remote'],
        default: ['Full-time'],
      },
      expectedSalaryRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
      },
      willingToRelocate: {
        type: Boolean,
        default: false,
      },
      remoteWorkPreference: {
        type: Boolean,
        default: false,
      },
    },
    profileCompletion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
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

export const Veteran = mongoose.model('Veteran', veteranSchema);
