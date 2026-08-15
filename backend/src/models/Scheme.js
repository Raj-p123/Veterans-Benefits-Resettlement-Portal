import mongoose from 'mongoose';

export const SCHEME_CATEGORIES = [
  'Pension',
  'Healthcare',
  'Housing',
  'Education',
  'Financial Assistance',
  'Family Welfare',
  'Employment',
  'Skill Development',
  'Resettlement',
  'Other',
];

export const SCHEME_STATUS = ['ACTIVE', 'INACTIVE', 'EXPIRED'];

const eligibilityCriteriaSchema = new mongoose.Schema(
  {
    minimumAge: {
      type: Number,
      min: 0,
      default: 0,
    },
    maximumAge: {
      type: Number,
      min: 0,
      default: 120,
    },
    minimumServiceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    serviceBranches: {
      type: [String],
      default: ['Army', 'Navy', 'Air Force', 'Coast Guard', 'Other'],
    },
    ranks: {
      type: [String],
      default: [],
    },
    serviceStatuses: {
      type: [String],
      default: ['Retired', 'Discharged', 'Released', 'Other'],
    },
    states: {
      type: [String],
      default: ['All India'],
    },
    employmentStatuses: {
      type: [String],
      default: [],
    },
    educationLevels: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    otherConditions: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const applicationFieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Field name identifier is required'],
      trim: true,
    },
    label: {
      type: String,
      required: [true, 'Field label is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox'],
      default: 'text',
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: [],
    },
    placeholder: {
      type: String,
      default: '',
    },
    helperText: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const schemeSchema = new mongoose.Schema(
  {
    schemeId: {
      type: String,
      required: [true, 'Scheme ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Scheme name is required'],
      trim: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'Full description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: SCHEME_CATEGORIES,
        message: '{VALUE} is not a valid scheme category',
      },
      index: true,
    },
    subCategory: {
      type: String,
      trim: true,
      default: '',
    },
    benefits: {
      type: [String],
      default: [],
    },
    eligibility: {
      type: eligibilityCriteriaSchema,
      default: () => ({}),
    },
    requiredDocuments: {
      type: [String],
      default: [
        'Service Certificate',
        'Discharge Certificate',
        'Identity Document',
      ],
    },
    applicationFields: {
      type: [applicationFieldSchema],
      default: [
        {
          name: 'bankAccountNumber',
          label: 'Direct Benefit Transfer (DBT) Bank Account Number',
          type: 'text',
          required: true,
          placeholder: 'e.g. 123456789012',
          helperText: 'Account must be held in the name of the applicant veteran.',
        },
        {
          name: 'bankIfsc',
          label: 'Bank IFSC Code',
          type: 'text',
          required: true,
          placeholder: 'e.g. SBIN0001234',
        },
        {
          name: 'bankName',
          label: 'Bank & Branch Name',
          type: 'text',
          required: true,
          placeholder: 'e.g. State Bank of India, Pune Cantonment',
        },
        {
          name: 'reasonForAssistance',
          label: 'Specific Purpose / Justification for Application',
          type: 'textarea',
          required: true,
          placeholder: 'Provide a brief statement explaining the purpose of this grant application...',
        },
      ],
    },
    applicationProcess: {
      type: [String],
      default: [
        'Verify eligibility criteria and assemble required documents.',
        'Complete the online application form on this portal.',
        'Attach verified documents from your personal Documents Vault.',
        'Submit the application and track progress in your Applications Dashboard.',
      ],
    },
    applicationMode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      default: 'Online',
    },
    deadline: {
      type: Date,
      default: null,
    },
    officialSource: {
      type: String,
      required: [true, 'Official source / authority is required'],
      trim: true,
    },
    officialWebsite: {
      type: String,
      required: [true, 'Official website reference URL is required'],
      trim: true,
    },
    state: {
      type: String,
      default: 'All India',
      index: true,
    },
    country: {
      type: String,
      default: 'India',
    },
    status: {
      type: String,
      enum: {
        values: SCHEME_STATUS,
        message: '{VALUE} is not a valid scheme status',
      },
      default: 'ACTIVE',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isSampleData: {
      type: Boolean,
      default: false,
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

// Compound & single field indexes for smart search & filtering
schemeSchema.index({ status: 1, category: 1, state: 1 });
schemeSchema.index({ name: 1, status: 1 });

// Full-text search index for keyword searching
schemeSchema.index({
  name: 'text',
  shortDescription: 'text',
  description: 'text',
  benefits: 'text',
  officialSource: 'text',
});

export const Scheme = mongoose.model('Scheme', schemeSchema);
