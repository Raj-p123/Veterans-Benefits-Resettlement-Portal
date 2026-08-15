import mongoose from 'mongoose';
import { Scheme } from '../models/Scheme.js';
import { config } from '../config/environment.js';

export const SCHEMES_SEED_DATA = [
  // 1. PENSION SCHEMES
  {
    schemeId: 'SCH-2026-00001',
    name: 'SPARSH Defense Pension System & Service Pension',
    shortDescription:
      'System for Pension Administration (Raksha) — End-to-end digital processing and disbursement of defense pensions directly into pensioner bank accounts.',
    description:
      'SPARSH (System for Pension Administration - Raksha) is an initiative of the Ministry of Defence to provide a comprehensive, transparent solution for pension administration of the Armed Forces (Army, Navy, Air Force, and Defence Civilians). It handles pension initiation, verification, sanction, disbursement, and online grievance redressal with digital life certificate integration (Jeevan Pramaan).',
    category: 'Pension',
    subCategory: 'Service & Superannuation Pension',
    benefits: [
      'Direct monthly pension credit to registered bank account with zero intermediary delay',
      'Online access to monthly Pension Slips, Form 16, and Corrigendum PPOs',
      'Integration with Digital Life Certificate (Jeevan Pramaan / Facial Recognition)',
      'Direct online grievance submission and real-time resolution tracking',
    ],
    eligibility: {
      minimumAge: 35,
      maximumAge: 110,
      minimumServiceYears: 15,
      serviceBranches: ['Army', 'Navy', 'Air Force', 'Other'],
      serviceStatuses: ['Retired', 'Discharged', 'Released'],
      states: ['All India'],
      otherConditions: ['Must possess a valid Defense Pension Payment Order (PPO) number'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'ppoNumber',
        label: 'Defense Pension Payment Order (PPO / e-PPO) Number',
        type: 'text',
        required: true,
        placeholder: 'e.g. PCDA/P/123456789',
      },
      {
        name: 'bankAccountNumber',
        label: 'Pension Disbursement Bank Account Number',
        type: 'text',
        required: true,
        placeholder: 'e.g. 30891234567',
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
        label: 'Pension Disbursing Bank & Branch',
        type: 'text',
        required: true,
        placeholder: 'e.g. State Bank of India, CPPC Branch',
      },
    ],
    applicationProcess: [
      'Access the SPARSH portal (sparsh.defencepension.gov.in) using your service credentials.',
      'Perform initial profile verification and update Aadhaar and mobile link.',
      'Submit annual digital life certificate through SPARSH or Jeevan Pramaan portal in November.',
      'Track monthly disbursement and pension entitlements via the portal dashboard.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Principal Controller of Defence Accounts (Pensions) / Ministry of Defence',
    officialWebsite: 'https://sparsh.defencepension.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
  {
    schemeId: 'SCH-2026-00002',
    name: 'One Rank One Pension (OROP) Framework & Equalization Scheme',
    shortDescription:
      'Equal pension payouts for defense personnel retiring in the same rank with the same length of service, regardless of date of retirement.',
    description:
      'The One Rank One Pension (OROP) scheme ensures uniformity in pension payments to armed forces personnel retiring in the same rank with the same length of service, irrespective of their date of retirement. Revisions occur periodically based on average maximum and minimum pensions of retirees in qualifying years, protecting veterans from historic inflation disparities.',
    category: 'Pension',
    subCategory: 'Equalization & Revision',
    benefits: [
      'Periodic equalization of pension rates across historical retirement batches',
      'Arrears disbursement directly credited to verified defense pension accounts',
      'Family pension protection extended to eligible widows and war dependents',
    ],
    eligibility: {
      minimumAge: 35,
      maximumAge: 120,
      minimumServiceYears: 15,
      serviceBranches: ['Army', 'Navy', 'Air Force'],
      serviceStatuses: ['Retired', 'Discharged', 'Released'],
      states: ['All India'],
      otherConditions: ['Eligible under OROP equalization rounds notifications'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'originalPpoNumber',
        label: 'Original / Pre-OROP PPO Number',
        type: 'text',
        required: true,
        placeholder: 'e.g. S/012345/2012',
      },
      {
        name: 'qualifyingServiceYears',
        label: 'Total Qualifying Service Duration (Years & Months)',
        type: 'text',
        required: true,
        placeholder: 'e.g. 21 Years 6 Months',
      },
      {
        name: 'bankAccountNumber',
        label: 'Defense Pension Account Number',
        type: 'text',
        required: true,
        placeholder: 'e.g. 1029384756',
      },
    ],
    applicationProcess: [
      'OROP revisions are processed automatically by PCDA (P) Prayagraj into SPARSH accounts.',
      'Veterans can check their revised entitlement table on the DESW portal.',
      'If discrepancy arises in rank-length bracket, lodge a revision request via SPARSH or Record Office.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Department of Ex-Servicemen Welfare (DESW), MoD',
    officialWebsite: 'https://www.desw.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
  {
    schemeId: 'SCH-2026-00003',
    name: 'Defense Disability Pension & Ex-Gratia Compensation Scheme',
    shortDescription:
      'Financial support and monthly disability element for armed forces personnel invalidated or impaired due to military service.',
    description:
      'The Disability Pension consists of a Service Element (based on length of service) and a Disability Element (assessed by a Medical Board attributable to or aggravated by military service). Broad-banding benefits provide enhanced compensation categories (50%, 75%, 100%) for personnel sustaining physical impairments during active operations or peacetime military duty.',
    category: 'Pension',
    subCategory: 'Disability & Medical Board Relief',
    benefits: [
      'Monthly Disability Element calculated as percentage of last reckonable emoluments',
      'Broad-banding enhancement provisions (e.g. 20-50% disability broadbanded to 50%)',
      'Ex-gratia lump sum compensation in war injury cases',
      'Lifelong ECHS cashless specialty healthcare coverage',
    ],
    eligibility: {
      minimumAge: 20,
      maximumAge: 110,
      minimumServiceYears: 1,
      serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard'],
      serviceStatuses: ['Discharged', 'Released', 'Retired'],
      states: ['All India'],
      otherConditions: ['Disability recognized as attributable to or aggravated by military service by Medical Board'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'disabilityPercentage',
        label: 'Medical Board Assessed Disability Percentage (%)',
        type: 'number',
        required: true,
        placeholder: 'e.g. 50',
      },
      {
        name: 'medicalBoardDate',
        label: 'Date of Release Medical Board (RMB / IMB)',
        type: 'date',
        required: true,
      },
      {
        name: 'disabilityNature',
        label: 'Nature of Injury / Medical Disability',
        type: 'textarea',
        required: true,
        placeholder: 'Describe disability as certified in Medical Board proceedings (AFMSF-16)...',
      },
    ],
    applicationProcess: [
      'Medical board records are forwarded by the Military Hospital and Record Office to PCDA (P).',
      'Disability element is sanctioned alongside the discharge PPO.',
      'Appeals for assessment review can be submitted to the Defense Ministry Appellate Committee within 6 months.',
    ],
    applicationMode: 'Hybrid',
    deadline: null,
    officialSource: 'Department of Ex-Servicemen Welfare (DESW)',
    officialWebsite: 'https://www.desw.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: false,
    isSampleData: false,
  },

  // 2. HEALTHCARE SCHEMES
  {
    schemeId: 'SCH-2026-00004',
    name: 'Ex-Servicemen Contributory Health Scheme (ECHS)',
    shortDescription:
      'Flagship cashless comprehensive healthcare scheme providing OPD and IPD medical coverage for ex-servicemen and dependents across India.',
    description:
      'ECHS is a publicly funded healthcare system providing all-inclusive medical care to ESM pensioners and their authorized dependents through a nationwide network of 427+ ECHS Polyclinics and thousands of empaneled private super-specialty hospitals and diagnostic centers on a completely cashless basis.',
    category: 'Healthcare',
    subCategory: 'Cashless Super-Specialty Medical Care',
    benefits: [
      'Cashless outpatient (OPD) and in-hospital (IPD) treatment at empaneled hospitals',
      'Coverage for all major medical conditions including oncology, cardiac surgery, and joint replacements',
      'Free distribution of medicines, implants, and artificial limbs',
      'Digital 64Kb Smart Cards for veteran and family members for nationwide hospital check-in',
    ],
    eligibility: {
      minimumAge: 20,
      maximumAge: 120,
      minimumServiceYears: 5,
      serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard'],
      serviceStatuses: ['Retired', 'Discharged', 'Released'],
      states: ['All India'],
      otherConditions: ['Must be an ESM pensioner with formal defense discharge'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'nearestPolyclinic',
        label: 'Preferred Regional ECHS Polyclinic',
        type: 'text',
        required: true,
        placeholder: 'e.g. ECHS Polyclinic Pune Cantt / Jalandhar',
      },
      {
        name: 'dependentsCount',
        label: 'Number of Eligible Dependent Family Members (Spouse / Children)',
        type: 'number',
        required: true,
        placeholder: 'e.g. 3',
      },
      {
        name: 'bloodGroup',
        label: 'Applicant Veteran Blood Group',
        type: 'select',
        required: true,
        options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
    ],
    applicationProcess: [
      'Visit echs.sourceinfosys.com or official ECHS portal to register online.',
      'Fill in service details, upload photos, and add verified dependents.',
      'Submit the application and verify at the nearest Station Headquarters.',
      'Collect the 64Kb ECHS Smart Card from the designated ECHS Polyclinic.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Central Organisation ECHS / Ministry of Defence',
    officialWebsite: 'https://echs.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
  {
    schemeId: 'SCH-2026-00005',
    name: 'Medical Financial Assistance for Non-Pensioner Veterans (RMEWF)',
    shortDescription:
      'Financial grant for non-pensioner ex-servicemen and widows suffering from severe or life-threatening illnesses.',
    description:
      'Administered by the Kendriya Sainik Board (KSB) under the Raksha Mantri Ex-Servicemen Welfare Fund, this grant provides critical medical relief up to ₹1,25,000 for non-pensioner ex-servicemen of all ranks and their widows who are not covered under ECHS and are undergoing treatment at government or recognized hospitals.',
    category: 'Healthcare',
    subCategory: 'Critical Illness Relief Grant',
    benefits: [
      'One-time or recurring financial reimbursement up to ₹1,25,000 per financial year',
      'Coverage for cancer, bypass surgery, renal transplantation, and stroke rehabilitation',
      'Direct DBT credit to the veteran/widow bank account',
    ],
    eligibility: {
      minimumAge: 50,
      maximumAge: 110,
      minimumServiceYears: 3,
      serviceBranches: ['Army', 'Navy', 'Air Force'],
      serviceStatuses: ['Discharged', 'Released', 'Retired'],
      states: ['All India'],
      otherConditions: ['Non-pensioner ESM of rank Havildar / equivalent and below, not covered by ECHS'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'hospitalName',
        label: 'Name of Treating Hospital',
        type: 'text',
        required: true,
        placeholder: 'e.g. Command Hospital / Government Medical College',
      },
      {
        name: 'medicalDiagnosis',
        label: 'Medical Diagnosis / Disease',
        type: 'textarea',
        required: true,
        placeholder: 'Specify illness, date of admission, and treatment required...',
      },
      {
        name: 'claimedAmount',
        label: 'Total Medical Expenditure Claimed (INR)',
        type: 'number',
        required: true,
        placeholder: 'e.g. 85000',
      },
    ],
    applicationProcess: [
      'Apply online on the Kendriya Sainik Board portal (ksb.gov.in).',
      'Upload verified medical bills and ZSB recommendation letter.',
      'The Secretary of Zila Sainik Welfare Office will forward the dossier to KSB HQ for disbursement.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Kendriya Sainik Board (KSB), Ministry of Defence',
    officialWebsite: 'https://ksb.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: false,
    isSampleData: false,
  },

  // 3. HOUSING SCHEMES
  {
    schemeId: 'SCH-2026-00006',
    name: 'Army Welfare Housing Organisation (AWHO) Housing Schemes',
    shortDescription:
      'Affordable, structurally superior residential housing complexes constructed on a "No Profit - No Loss" basis for defense personnel and veterans.',
    description:
      'AWHO constructs residential apartments, independent villas, and townships across premier Indian metropolitan and Tier-2 defense cantonment cities exclusively for serving personnel, ex-servicemen, war widows, and their dependents at cost-effective construction prices.',
    category: 'Housing',
    subCategory: 'Subsidized Residential Allotment',
    benefits: [
      'High-quality housing in secure, gated defense communities at subsidized cost',
      'Priority allotment quota for war widows, battle casualties, and disabled soldiers',
      'Facilitation of specialized defense home loans with competitive interest rates',
    ],
    eligibility: {
      minimumAge: 25,
      maximumAge: 100,
      minimumServiceYears: 5,
      serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard'],
      serviceStatuses: ['Retired', 'Discharged', 'Released', 'Other'],
      states: ['All India'],
      otherConditions: ['Must not already hold more than one AWHO residential allotment'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'preferredStation',
        label: 'Preferred Housing Station / City',
        type: 'select',
        required: true,
        options: ['Pune', 'Bengaluru', 'Gurugram/NCR', 'Mohali/Chandigarh', 'Secunderabad', 'Lucknow', 'Kochi', 'Coimbatore'],
      },
      {
        name: 'dwellingUnitType',
        label: 'Dwelling Unit Category Preference',
        type: 'select',
        required: true,
        options: ['Super Deluxe Apartment (4 BHK)', 'Deluxe Apartment (3 BHK)', 'Modern Apartment (2 BHK)', 'Single Bedroom (1 BHK)'],
      },
    ],
    applicationProcess: [
      'Browse active housing project announcements on awhosena.in.',
      'Submit application form online or through registered post with requisite earnest deposit.',
      'Participate in transparent computerized allotment draws conducted at AWHO HQ New Delhi.',
    ],
    applicationMode: 'Hybrid',
    deadline: null,
    officialSource: 'Army Welfare Housing Organisation (AWHO), New Delhi',
    officialWebsite: 'https://www.awhosena.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
  {
    schemeId: 'SCH-2026-00007',
    name: 'Financial Assistance for House Repair for Disabled Veterans & War Widows',
    shortDescription:
      'Grant of up to ₹1,00,000 for repair and modification of homes for 100% disabled ex-servicemen and war widows.',
    description:
      'Under the Raksha Mantri Ex-Servicemen Welfare Fund, financial assistance is sanctioned to 100% service-disabled soldiers and war widows/orphans for structural repair of their dwelling house or accessibility modifications (ramps, wide doorways, accessible washrooms).',
    category: 'Housing',
    subCategory: 'Accessibility & Structural Repair Grant',
    benefits: [
      'One-time financial grant up to ₹1,00,000',
      'Direct benefit transfer to bank account',
      'Accessibility retrofitting for wheelchair and mobility-impaired veterans',
    ],
    eligibility: {
      minimumAge: 20,
      maximumAge: 100,
      minimumServiceYears: 1,
      serviceBranches: ['Army', 'Navy', 'Air Force'],
      serviceStatuses: ['Discharged', 'Released', 'Retired'],
      states: ['All India'],
      otherConditions: ['100% disability certificate or War Widow status recognized by MoD'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'houseAddress',
        label: 'Full Address of the Residential Property Under Repair',
        type: 'textarea',
        required: true,
        placeholder: 'Address, Tehsil, District, PIN Code...',
      },
      {
        name: 'estimatedCost',
        label: 'Total Estimated Repair / Modification Cost (INR)',
        type: 'number',
        required: true,
        placeholder: 'e.g. 100000',
      },
    ],
    applicationProcess: [
      'Submit application via KSB online portal (ksb.gov.in).',
      'Zila Sainik Welfare Officer conducts site inspection and verifies house ownership.',
      'KSB processes and credits sanctioned funds into the applicant bank account.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Kendriya Sainik Board (KSB)',
    officialWebsite: 'https://ksb.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: false,
    isSampleData: false,
  },

  // 4. EDUCATION SCHEMES
  {
    schemeId: 'SCH-2026-00008',
    name: "Prime Minister's Scholarship Scheme (PMSS) for Wards of Ex-Servicemen",
    shortDescription:
      'Monthly scholarship of up to ₹3,000/month for higher technical and professional degree courses (Engineering, Medicine, Management) for veteran children.',
    description:
      'The Prime Minister’s Scholarship Scheme (PMSS) aims to encourage technical and post-graduate education for the dependent wards and widows of ex-servicemen and Coast Guard personnel. Over 5,500 scholarships are awarded annually for approved degrees recognized by statutory regulatory bodies (UGC, AICTE, MCI).',
    category: 'Education',
    subCategory: 'Higher Professional Degree Scholarship',
    benefits: [
      '₹3,000 per month for girls (₹36,000 annually) and ₹2,500 per month for boys (₹30,000 annually)',
      'Covers full course duration (4–5 years for B.Tech/MBBS, 2 years for MBA/MCA)',
      'Direct annual disbursement through National Scholarship Portal (NSP) / KSB',
    ],
    eligibility: {
      minimumAge: 17,
      maximumAge: 30,
      minimumServiceYears: 1,
      serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard'],
      serviceStatuses: ['Retired', 'Discharged', 'Released', 'Other'],
      states: ['All India'],
      otherConditions: [
        'Minimum 60% marks in 10+2 / Diploma / Graduation for course entry',
        'Student enrolled in first year of recognized professional degree',
      ],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'studentName',
        label: "Dependent Student's Full Legal Name",
        type: 'text',
        required: true,
        placeholder: 'e.g. Priya Rathore',
      },
      {
        name: 'courseName',
        label: 'Degree Programme Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. B.Tech Computer Science / MBBS / MBA',
      },
      {
        name: 'collegeName',
        label: 'College / University & Campus Location',
        type: 'text',
        required: true,
        placeholder: 'e.g. IIT Bombay / AIIMS New Delhi',
      },
      {
        name: 'qualifyingMarks',
        label: 'Percentage Scored in 10+2 / Qualifying Exam (%)',
        type: 'number',
        required: true,
        placeholder: 'e.g. 88',
      },
    ],
    applicationProcess: [
      'Apply online on the Kendriya Sainik Board portal (ksb.gov.in) between August and November annually.',
      'Upload digital copies of marks sheets, Bonafide certificate, and PPO.',
      'Application is verified by ZSB, RSB, and final merit list released by KSB in February.',
    ],
    applicationMode: 'Online',
    deadline: new Date('2026-11-30T23:59:59Z'),
    officialSource: 'Kendriya Sainik Board / Prime Minister’s Office',
    officialWebsite: 'https://ksb.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
  {
    schemeId: 'SCH-2026-00009',
    name: 'Financial Assistance for School Education of ESM Children (Classes 1-12 & Graduation)',
    shortDescription:
      'Annual grant of ₹12,000 per child (up to two children) for primary, secondary, and undergraduate education of non-pensioner veterans.',
    description:
      'Under the RMEWF, financial assistance is provided to non-pensioner ex-servicemen up to the rank of Havildar / equivalent and their widows to support school and college education for up to two children from Class 1 through Graduation.',
    category: 'Education',
    subCategory: 'School & College Tuition Assistance',
    benefits: [
      '₹1,000 per month (₹12,000 annually) per eligible child',
      'Support available from 1st standard up to Graduation degree',
      'Paid annually directly to the bank account of the veteran/mother',
    ],
    eligibility: {
      minimumAge: 25,
      maximumAge: 100,
      minimumServiceYears: 3,
      serviceBranches: ['Army', 'Navy', 'Air Force'],
      serviceStatuses: ['Discharged', 'Released', 'Retired'],
      states: ['All India'],
      otherConditions: ['Non-pensioner ESM of rank Havildar and below, with children enrolled in recognized schools'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'childName',
        label: 'Name of Child',
        type: 'text',
        required: true,
        placeholder: 'e.g. Amit Kumar',
      },
      {
        name: 'currentClass',
        label: 'Current Class / Standard of Study',
        type: 'text',
        required: true,
        placeholder: 'e.g. Class 9 / 1st Year B.Com',
      },
      {
        name: 'schoolName',
        label: 'School / College Name & Address',
        type: 'text',
        required: true,
        placeholder: 'e.g. Kendriya Vidyalaya No. 1, Pune',
      },
    ],
    applicationProcess: [
      'Submit online application through ksb.gov.in with school bonafide certificate.',
      'Zila Sainik Board verifies student attendance and marks.',
      'Approved grant credited annually via DBT.',
    ],
    applicationMode: 'Online',
    deadline: new Date('2026-12-31T23:59:59Z'),
    officialSource: 'Kendriya Sainik Board (KSB)',
    officialWebsite: 'https://ksb.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: false,
    isSampleData: false,
  },

  // 5. EMPLOYMENT & RESETTLEMENT SCHEMES
  {
    schemeId: 'SCH-2026-00010',
    name: 'Directorate General Resettlement (DGR) Security Agency Sponsorship Scheme',
    shortDescription:
      'Empowerment of retired defense officers to operate sponsored private security agencies employing ex-servicemen guards across central public sector undertakings (PSUs).',
    description:
      'The DGR Security Agency Scheme provides self-employment opportunities to retired Commissioned Officers by sponsoring their registered private security agencies to Central Public Sector Enterprises (CPSEs), nationalized banks, and major government establishments, with the condition that at least 85% of guard staff comprise ex-servicemen.',
    category: 'Employment',
    subCategory: 'Enterprise & Security Sponsorship',
    benefits: [
      'Assured commercial security contracts with Central PSUs and government departments',
      'Empowerment to employ and provide dignified livelihood to fellow JCOs/OR veterans',
      'Two-year renewable commercial sponsorship cycle',
    ],
    eligibility: {
      minimumAge: 35,
      maximumAge: 60,
      minimumServiceYears: 10,
      serviceBranches: ['Army', 'Navy', 'Air Force'],
      serviceStatuses: ['Retired', 'Discharged', 'Released'],
      states: ['All India'],
      otherConditions: ['Retired Commissioned Officers registered with DGR within 5 years of retirement'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'psaraLicenseNumber',
        label: 'State PSARA License / Registration Reference Number',
        type: 'text',
        required: true,
        placeholder: 'e.g. PSARA/MH/2024/0987',
      },
      {
        name: 'preferredRegion',
        label: 'Target Geographical Region for PSU Operations',
        type: 'text',
        required: true,
        placeholder: 'e.g. Western Region (Maharashtra & Gujarat)',
      },
    ],
    applicationProcess: [
      'Register on DGR India portal (dgrindia.gov.in) post-retirement.',
      'Complete mandatory 2-week DGR Security Entrepreneurship Course.',
      'Obtain state PSARA license and apply for Central PSU empanelment quota.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Directorate General Resettlement (DGR), Department of ESM Welfare',
    officialWebsite: 'https://dgrindia.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
  {
    schemeId: 'SCH-2026-00011',
    name: 'Ex-Servicemen Coal Loading and Transportation Scheme',
    shortDescription:
      'Special commercial coal tipper transportation contracts awarded to Ex-Servicemen private transport companies at Coal India subsidiaries.',
    description:
      'Operated jointly by DGR and Coal India Ltd (CIL), this scheme facilitates formation of private transport companies by ex-servicemen for loading and inter-colliery transportation of coal across subsidiaries like SECL, MCL, BCCL, and WCL, providing lucrative civilian fleet operations.',
    category: 'Employment',
    subCategory: 'Commercial Logistics & Fleet Enterprise',
    benefits: [
      'Assured high-tonnage transportation contracts with Coal India subsidiaries',
      'Bank credit facilitation for tipper truck fleet acquisition at preferential terms',
      'Long-term operational profitability and JCO/NCO employment generation',
    ],
    eligibility: {
      minimumAge: 30,
      maximumAge: 62,
      minimumServiceYears: 10,
      serviceBranches: ['Army', 'Navy', 'Air Force'],
      serviceStatuses: ['Retired', 'Discharged', 'Released'],
      states: ['All India'],
      otherConditions: ['Registered ESM company formed by retired defense personnel'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'companyCinNumber',
        label: 'ESM Transport Company CIN / Registration Number',
        type: 'text',
        required: true,
        placeholder: 'e.g. U60200MH2024PTC123456',
      },
      {
        name: 'fleetCapacity',
        label: 'Proposed Commercial Tipper Fleet Strength',
        type: 'number',
        required: true,
        placeholder: 'e.g. 10',
      },
    ],
    applicationProcess: [
      'Form an ESM Company with fellow veterans and register with DGR.',
      'Participate in DGR coal company sponsorship rounds announced on dgrindia.gov.in.',
      'Execute contract with respective Coal India subsidiary.',
    ],
    applicationMode: 'Hybrid',
    deadline: null,
    officialSource: 'Directorate General Resettlement / Coal India Limited',
    officialWebsite: 'https://dgrindia.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: false,
    isSampleData: false,
  },

  // 6. SKILL DEVELOPMENT & TRANSITION
  {
    schemeId: 'SCH-2026-00012',
    name: 'DGR Officer Resettlement Training & Executive Transition Programme',
    shortDescription:
      'Fully sponsored 6-month management conversion courses conducted at premier Indian Institutes of Management (IIMs) and IITs for retiring officers.',
    description:
      'The DGR conducts fully subsidized executive resettlement diploma programs in Business Administration, Supply Chain Management, Corporate Governance, and Defense Industrial Management at premier management institutions (IIM Ahmedabad, IIM Bangalore, IIM Calcutta, MDI Gurgaon) for transitioning defense officers.',
    category: 'Skill Development',
    subCategory: 'Executive Management Transition',
    benefits: [
      '100% course fee sponsorship by Ministry of Defence',
      'Post-Graduate Executive Management Certificate from top-tier IIMs/IITs',
      'Dedicated corporate placement drives and alumni executive networking',
    ],
    eligibility: {
      minimumAge: 30,
      maximumAge: 60,
      minimumServiceYears: 10,
      serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard'],
      serviceStatuses: ['Retired', 'Released', 'Discharged'],
      states: ['All India'],
      otherConditions: ['Commissioned Officers within 2 years before or after retirement date'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'preferredInstitute',
        label: 'Preferred Executive Management Institute',
        type: 'select',
        required: true,
        options: ['IIM Ahmedabad', 'IIM Bangalore', 'IIM Calcutta', 'IIM Indore', 'MDI Gurgaon', 'IIT Delhi'],
      },
      {
        name: 'managementSpecialization',
        label: 'Specialization Cohort Interest',
        type: 'select',
        required: true,
        options: ['Strategic Supply Chain & Operations', 'Corporate Risk & Cybersecurity Leadership', 'General Management & Entrepreneurship', 'Defense Industrial Manufacturing'],
      },
    ],
    applicationProcess: [
      'Apply online through DGR Training Portal (dgrindia.gov.in) during annual nomination cycles.',
      'Selection based on service seniority and institute admission criteria.',
      'Attend full-time residential / blended classes at designated IIM campus.',
    ],
    applicationMode: 'Online',
    deadline: new Date('2026-10-15T23:59:59Z'),
    officialSource: 'Directorate General Resettlement (DGR)',
    officialWebsite: 'https://dgrindia.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
  {
    schemeId: 'SCH-2026-00013',
    name: 'National Skill Development Corporation (NSDC) - Veteran Cyber & Tech Skilling',
    shortDescription:
      'Free industry certification courses in Cyber Security, Artificial Intelligence, Drone Maintenance, and Cloud Architecture for ex-servicemen (JCOs/OR).',
    description:
      'A collaborative initiative between the Ministry of Skill Development, NSDC, and DESW to transition retiring JCOs and Other Ranks into high-demand technology, logistics, renewable energy, and cyber defense careers with recognized National Skills Qualifications Framework (NSQF) certification.',
    category: 'Skill Development',
    subCategory: 'High-Tech Industry Skilling',
    benefits: [
      'Zero tuition fee for all enrolled veterans (sponsored under Skill India)',
      'Industry-recognized NSQF Level 5/6 professional certificates',
      'Direct interview access with defense tech, IT, and aerospace corporate recruiters',
    ],
    eligibility: {
      minimumAge: 20,
      maximumAge: 58,
      minimumServiceYears: 3,
      serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard', 'Other'],
      serviceStatuses: ['Retired', 'Discharged', 'Released'],
      states: ['All India'],
      otherConditions: ['Open to all JCOs, NCOs, and soldiers transitioning to civilian careers'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'techTrack',
        label: 'Technical Certification Track',
        type: 'select',
        required: true,
        options: ['Cyber Security Incident Responder (NSQF-6)', 'Drone / UAV Technician & Pilot (NSQF-5)', 'Cloud Infrastructure Administrator (NSQF-6)', 'Advanced Logistics & Warehouse Automation (NSQF-5)'],
      },
      {
        name: 'trainingCenterLocation',
        label: 'Preferred Regional Training Center',
        type: 'text',
        required: true,
        placeholder: 'e.g. Pune, Bengaluru, Hyderabad, Delhi NCR, Chandigarh',
      },
    ],
    applicationProcess: [
      'Register on the Skill India Digital Portal (skillindiadigital.gov.in) with your defense trade details.',
      'Select technical cohort (Cyber Defense / UAV Maintenance / Cloud Administration).',
      'Complete hybrid instruction and practical assessment at accredited center.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'National Skill Development Corporation (NSDC) / Ministry of Skill Development',
    officialWebsite: 'https://www.skillindiadigital.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: false,
    isSampleData: false,
  },

  // 7. FAMILY WELFARE & DAUGHTER MARRIAGE ASSISTANCE
  {
    schemeId: 'SCH-2026-00014',
    name: "Financial Assistance for Marriage of Ex-Servicemen's Daughters",
    shortDescription:
      'One-time grant of ₹50,000 for marriage of daughters of non-pensioner ex-servicemen or widows.',
    description:
      'Administered under the Raksha Mantri Ex-Servicemen Welfare Fund (RMEWF), this scheme offers financial support of ₹50,000 per daughter (up to two daughters) of non-pensioner ex-servicemen up to the rank of Havildar / equivalent, helping families fulfill marriage solemnization obligations without incurring debilitating debt.',
    category: 'Family Welfare',
    subCategory: 'Daughter Marriage Grant',
    benefits: [
      'Lump-sum grant of ₹50,000 per daughter (up to two daughters)',
      'Direct credit into the bank account of the veteran or mother',
      'Processing facilitated through local Zila Sainik Boards',
    ],
    eligibility: {
      minimumAge: 35,
      maximumAge: 100,
      minimumServiceYears: 3,
      serviceBranches: ['Army', 'Navy', 'Air Force'],
      serviceStatuses: ['Discharged', 'Released', 'Retired'],
      states: ['All India'],
      otherConditions: ['Non-pensioner ESM of rank Havildar / equivalent and below; daughter age 18+'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'daughterName',
        label: "Daughter's Full Legal Name",
        type: 'text',
        required: true,
        placeholder: 'e.g. Ananya Rathore',
      },
      {
        name: 'marriageDate',
        label: 'Date of Marriage Solemnization',
        type: 'date',
        required: true,
      },
      {
        name: 'marriageRegistrationNo',
        label: 'Marriage Certificate Registration Reference (if available)',
        type: 'text',
        required: false,
        placeholder: 'e.g. REG/2026/4321',
      },
    ],
    applicationProcess: [
      'Submit online application on ksb.gov.in within one year of marriage date.',
      'Attach certified marriage certificate from Registrar of Marriages / Municipal Body.',
      'Funds are released upon scrutiny by KSB HQ New Delhi.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Kendriya Sainik Board (KSB)',
    officialWebsite: 'https://ksb.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
  {
    schemeId: 'SCH-2026-00015',
    name: 'Penury Grant for Indigent Non-Pensioner Ex-Servicemen and Widows (Above 65 Years)',
    shortDescription:
      'Monthly sustenance allowance of ₹4,000 per month for non-pensioner elderly veterans living in severe economic hardship.',
    description:
      'A monthly life-support penury grant of ₹4,000 per month is provided by the Ministry of Defence through the Kendriya Sainik Board for indigent non-pensioner ex-servicemen and their widows who are 65 years of age or older, without any other source of steady livelihood.',
    category: 'Financial Assistance',
    subCategory: 'Elderly Sustenance & Penury Relief',
    benefits: [
      '₹4,000 monthly sustenance pension disbursed on a lifetime basis',
      'Direct DBT transfer into beneficiary bank account every quarter',
      'Protection against extreme poverty for aging veterans',
    ],
    eligibility: {
      minimumAge: 65,
      maximumAge: 120,
      minimumServiceYears: 2,
      serviceBranches: ['Army', 'Navy', 'Air Force'],
      serviceStatuses: ['Discharged', 'Released', 'Retired'],
      states: ['All India'],
      otherConditions: ['Non-pensioner ESM / widow aged 65 years or above with annual income below state poverty threshold'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'annualIncome',
        label: 'Total Annual Family Income from All Sources (INR)',
        type: 'number',
        required: true,
        placeholder: 'e.g. 35000',
      },
      {
        name: 'incomeCertAuthority',
        label: 'Income Certificate Issuing Authority (Tehsildar / SDO)',
        type: 'text',
        required: true,
        placeholder: 'e.g. Tehsildar Haveli, Pune District',
      },
    ],
    applicationProcess: [
      'Apply online on ksb.gov.in or visit local Zila Sainik Welfare Office.',
      'Submit income certificate and certificate of non-receipt of any other pension.',
      'Quarterly grant released upon annual life verification.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Kendriya Sainik Board / Armed Forces Flag Day Fund',
    officialWebsite: 'https://ksb.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: false,
    isSampleData: false,
  },

  // 8. FINANCIAL ASSISTANCE / MOBILITY RELIEF
  {
    schemeId: 'SCH-2026-00016',
    name: 'Financial Assistance for Purchase of Modified Scooters / Mobility Equipment',
    shortDescription:
      'One-time grant of up to ₹1,00,000 for motorized retrofitted three-wheelers and mobility aids for disabled ex-servicemen.',
    description:
      'Sanctioned from the Armed Forces Flag Day Fund through the Kendriya Sainik Board, this scheme funds the purchase of modified three-wheeled scooters or motorized wheelchairs for disabled ex-servicemen having 50% or more locomotive disability attributable to service.',
    category: 'Financial Assistance',
    subCategory: 'Assistive Mobility Aid Grant',
    benefits: [
      '100% cost reimbursement or up to ₹1,00,000 for modified vehicle purchase',
      'Independence and dignified personal mobility for paralyzed or amputee veterans',
      'Renewable every 5 years for vehicle replacement',
    ],
    eligibility: {
      minimumAge: 20,
      maximumAge: 95,
      minimumServiceYears: 1,
      serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard'],
      serviceStatuses: ['Discharged', 'Released', 'Retired'],
      states: ['All India'],
      otherConditions: ['50% or greater locomotive disability certified by Military / Government Hospital'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Service Certificate',
      'Identity Document',
    ],
    applicationFields: [
      {
        name: 'mobilityEquipmentType',
        label: 'Required Mobility Aid / Vehicle Type',
        type: 'select',
        required: true,
        options: ['Motorized Retrofitted 3-Wheeled Scooter', 'Motorized Wheelchair', 'Custom Orthotic / Prosthetic Mobility Unit'],
      },
      {
        name: 'dealerQuotationAmount',
        label: 'Authorized Dealer Quotation Amount (INR)',
        type: 'number',
        required: true,
        placeholder: 'e.g. 98000',
      },
    ],
    applicationProcess: [
      'Apply online via ksb.gov.in with medical disability certificate and vehicle quotation.',
      'Zila Sainik Welfare Officer endorses mobility requirement.',
      'Sanction letter issued and payment disbursed directly.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Kendriya Sainik Board (KSB)',
    officialWebsite: 'https://ksb.gov.in',
    state: 'All India',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
  // 13. ODISHA & BHUBANESWAR STATE WELFARE SCHEMES
  {
    schemeId: 'SCH-2026-00025',
    name: 'Odisha Rajya Sainik Board Ex-Servicemen Welfare & Financial Grant',
    shortDescription:
      'State government welfare grants for domicile ex-servicemen, war widows, and disabled veterans in Odisha managed by Rajya Sainik Board, Bhubaneswar.',
    description:
      'The Rajya Sainik Board (RSB), Government of Odisha, Bhubaneswar provides special ex-gratia financial assistance, daughter marriage grants, and medical emergency assistance to verified ex-servicemen (ESM) and their dependents residing across Odisha.',
    category: 'Financial Assistance',
    subCategory: 'State Welfare Grant',
    benefits: [
      'One-time financial grant of ₹50,000 for daughter marriage of indigent ESM',
      'Emergency medical grant of up to ₹30,000 for critical illness treatment in Odisha',
      'Free vocational guidance and state government job quota assistance in Bhubaneswar',
      'Monthly pocket money assistance for disabled ex-servicemen in government hospitals',
    ],
    eligibility: {
      minimumAge: 18,
      maximumAge: 100,
      minimumServiceYears: 5,
      serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard', 'Other'],
      serviceStatuses: ['Retired', 'Discharged', 'Released'],
      states: ['Odisha', 'All India'],
      otherConditions: ['Must be a permanent resident / domicile of Odisha or registered with Zila Sainik Board Odisha'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Identity Document',
      'Service Certificate',
      'State Domicile Certificate',
    ],
    applicationFields: [
      {
        name: 'zsbLocation',
        label: 'Registered Zila Sainik Board in Odisha (e.g. Bhubaneswar, Cuttack, Balasore)',
        type: 'text',
        required: true,
        placeholder: 'e.g. ZSB Bhubaneswar',
      },
      {
        name: 'esmIdNumber',
        label: 'Odisha ESM Identity Card Number',
        type: 'text',
        required: true,
        placeholder: 'e.g. OD/BHUB/2024/1042',
      },
      {
        name: 'bankAccountNumber',
        label: 'Bank Account Number',
        type: 'text',
        required: true,
        placeholder: 'e.g. 30891234567',
      },
      {
        name: 'bankIfsc',
        label: 'Bank IFSC Code',
        type: 'text',
        required: true,
        placeholder: 'e.g. SBIN0001234',
      },
    ],
    applicationProcess: [
      'Submit online application through portal or visit Rajya Sainik Board, IRC Village, Bhubaneswar.',
      'Zila Sainik Welfare Officer verifies defense records and domicile status.',
      'Sanction approved and grant disbursed to verified bank account.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Rajya Sainik Board (RSB), Government of Odisha, Bhubaneswar',
    officialWebsite: 'https://home.odisha.gov.in',
    state: 'Odisha',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
  {
    schemeId: 'SCH-2026-00026',
    name: 'Bhubaneswar Defense Veteran Skill Resettlement & IT Transition Program',
    shortDescription:
      'Specialized IT, cybersecurity, and logistics training program in Bhubaneswar for retiring defense personnel with guaranteed placement linkages.',
    description:
      'Sponsored by the Directorate of Resettlement in partnership with IT institutions in Bhubaneswar (Odisha). Provides cutting-edge certification in cloud administration, facility management, and industrial security with corporate placement assistance across Eastern India.',
    category: 'Skill Development',
    subCategory: 'Corporate Transition',
    benefits: [
      '100% sponsored technical and executive management training in Bhubaneswar',
      'Monthly training stipend of ₹8,000 provided during course duration',
      'Direct interview access with corporate defense-friendly employers in Odisha',
      'Industry-recognized professional certification upon completion',
    ],
    eligibility: {
      minimumAge: 21,
      maximumAge: 58,
      minimumServiceYears: 5,
      serviceBranches: ['Army', 'Navy', 'Air Force', 'Coast Guard', 'Other'],
      serviceStatuses: ['Retired', 'Discharged', 'Released'],
      states: ['Odisha', 'All India'],
      otherConditions: ['Preference given to personnel within 2 years of retirement or recently released'],
    },
    requiredDocuments: [
      'Discharge Certificate',
      'Identity Document',
      'Service Certificate',
    ],
    applicationFields: [
      {
        name: 'preferredStream',
        label: 'Preferred Training Stream (IT Security, Facility Management, Logistics)',
        type: 'select',
        required: true,
        options: ['Cybersecurity & Network Admin', 'Corporate Facility Management', 'Defense Logistics & Supply Chain'],
      },
      {
        name: 'highestEducation',
        label: 'Highest Educational Qualification',
        type: 'text',
        required: true,
        placeholder: 'e.g. Graduate / Diploma in Engineering',
      },
    ],
    applicationProcess: [
      'Apply online with educational credentials and discharge book.',
      'Attend online aptitude orientation by training partner in Bhubaneswar.',
      'Commence course and receive placement interview calls.',
    ],
    applicationMode: 'Online',
    deadline: null,
    officialSource: 'Directorate of Resettlement (DGR) & Odisha Skill Development Authority',
    officialWebsite: 'https://dgrindia.gov.in',
    state: 'Odisha',
    country: 'India',
    status: 'ACTIVE',
    isFeatured: true,
    isSampleData: false,
  },
];

export const seedSchemes = async () => {
  console.log('[Seed Schemes] Seeding official welfare schemes and pension records with applicationFields...');
  let inserted = 0;
  let updated = 0;

  for (const item of SCHEMES_SEED_DATA) {
    const existing = await Scheme.findOne({ schemeId: item.schemeId });
    if (existing) {
      await Scheme.updateOne({ schemeId: item.schemeId }, { $set: item });
      updated++;
    } else {
      await Scheme.create(item);
      inserted++;
    }
  }

  console.log(`[Seed Schemes] Successfully processed: ${inserted} created, ${updated} updated (Total: ${SCHEMES_SEED_DATA.length}).`);
};

// Standalone runner if executed directly: node src/utils/seedSchemes.js
const runStandalone = async () => {
  if (process.argv[1]?.endsWith('seedSchemes.js')) {
    try {
      await mongoose.connect(config.mongodbUri);
      console.log('[MongoDB] Connected to:', config.mongodbUri);
      await seedSchemes();
      await mongoose.disconnect();
      console.log('[MongoDB] Disconnected cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[Seed Schemes Error]:', err.message);
      process.exit(1);
    }
  }
};

runStandalone();
