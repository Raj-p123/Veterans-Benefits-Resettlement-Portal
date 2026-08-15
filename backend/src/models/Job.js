import mongoose from 'mongoose';

export const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'TEMPORARY',
  'INTERNSHIP',
];

export const WORK_MODES = ['ONSITE', 'REMOTE', 'HYBRID'];

export const JOB_STATUS = [
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'PAUSED',
  'CLOSED',
  'EXPIRED',
  'REJECTED',
];

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: [true, 'Job ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: [true, 'Employer reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    industry: {
      type: String,
      required: [true, 'Industry sector is required'],
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
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
    locationCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
      _id: false,
    },
    employmentType: {
      type: String,
      enum: EMPLOYMENT_TYPES,
      default: 'FULL_TIME',
      index: true,
    },
    workMode: {
      type: String,
      enum: WORK_MODES,
      default: 'ONSITE',
      index: true,
    },
    salaryMin: {
      type: Number,
      min: 0,
      default: 0,
    },
    salaryMax: {
      type: Number,
      min: 0,
      default: 0,
    },
    salaryCurrency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    experienceMin: {
      type: Number,
      min: 0,
      default: 0,
    },
    experienceMax: {
      type: Number,
      min: 0,
      default: 30,
    },
    education: {
      type: String,
      default: 'Any Graduate / Defense Certified',
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    benefits: {
      type: [String],
      default: [],
    },
    openings: {
      type: Number,
      min: 1,
      default: 1,
    },
    applicationDeadline: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: JOB_STATUS,
      default: 'ACTIVE',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    applicantCount: {
      type: Number,
      default: 0,
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

// Normalize location coordinates prior to save for valid GeoJSON 2dsphere indexing
jobSchema.pre('save', function (next) {
  if (typeof this.longitude === 'number' && typeof this.latitude === 'number' && !isNaN(this.longitude) && !isNaN(this.latitude)) {
    this.locationCoordinates = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
  } else if (
    !this.locationCoordinates ||
    !Array.isArray(this.locationCoordinates.coordinates) ||
    this.locationCoordinates.coordinates.length < 2 ||
    isNaN(this.locationCoordinates.coordinates[0]) ||
    isNaN(this.locationCoordinates.coordinates[1])
  ) {
    this.locationCoordinates = undefined;
  }
  next();
});

// Geospatial and compound location indexes
jobSchema.index({ locationCoordinates: '2dsphere' }, { sparse: true });
jobSchema.index({ city: 1, state: 1, status: 1 });
jobSchema.index({ latitude: 1, longitude: 1, status: 1 });

// Full text search index
jobSchema.index({
  title: 'text',
  description: 'text',
  industry: 'text',
  requiredSkills: 'text',
  location: 'text',
  city: 'text',
  state: 'text',
  address: 'text',
});

export const Job = mongoose.model('Job', jobSchema);
