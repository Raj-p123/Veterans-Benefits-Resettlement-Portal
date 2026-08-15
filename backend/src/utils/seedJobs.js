import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Employer } from '../models/Employer.js';
import { Job } from '../models/Job.js';
import { config } from '../config/environment.js';

export const seedEmployersAndJobs = async () => {
  console.log('Seeding Employers & Defense Jobs...');

  // Ensure default demo employer user exists
  let employerUser = await User.findOne({ email: 'employer@example.com' });
  if (!employerUser) {
    employerUser = await User.create({
      name: 'Tata Advanced Systems HR',
      email: 'employer@example.com',
      password: 'EmployerPassword123!',
      role: 'EMPLOYER',
      phone: '+919876500002',
    });
  }

  // Create or update Tata Advanced Systems Employer Profile
  let tataEmployer = await Employer.findOne({ user: employerUser._id });
  if (!tataEmployer) {
    tataEmployer = await Employer.create({
      user: employerUser._id,
      employerId: 'EMP-2026-00001',
      companyName: 'Tata Advanced Systems Limited (TASL)',
      companyDescription:
        'Tata Advanced Systems Limited is the strategic aerospace and defense arm of the Tata Group, pioneering solutions in aerospace, radar systems, land mobility, and unmanned systems.',
      industry: 'Defense & Aerospace',
      companySize: '1000+ Employees',
      website: 'https://www.tataadvancedsystems.com',
      email: 'careers@tasl.tata.com',
      phone: '+912066001234',
      address: 'Plot No. 1, Chakan Industrial Area, Phase II',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '410501',
      logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=120&auto=format&fit=crop&q=60',
      contactPerson: {
        name: 'Col. Rajesh Verma (Retd.)',
        designation: 'Head of Defense Veteran Talent Acquisition',
        phone: '+919876500002',
        email: 'rajesh.verma@tasl.tata.com',
      },
      verificationStatus: 'VERIFIED',
      isActive: true,
    });
  }

  // Additional Employers
  const corporateEmployers = [
    {
      companyName: 'L&T Defense & Aerospace',
      email: 'resettlement@lntdefense.com',
      phone: '+918022004500',
      industry: 'Defense Manufacturing',
      companySize: '1000+ Employees',
      city: 'Bangalore',
      state: 'Karnataka',
      address: 'L&T House, Ballard Estate',
      description:
        'Larsen & Toubro Defense manufactures state-of-the-art weapon platforms, naval submarines, armored systems, and radar systems for India’s armed forces.',
      contactPerson: {
        name: 'Brig. Alok Sharma (Retd.)',
        designation: 'VP - Strategic Veteran Resettlement',
        phone: '+919811223344',
        email: 'alok.sharma@lntdefense.com',
      },
    },
    {
      companyName: 'Bharat Forge Defense Systems',
      email: 'careers@bharatforge-defense.com',
      phone: '+912067042000',
      industry: 'Heavy Engineering & Artillery',
      companySize: '1000+ Employees',
      city: 'Pune',
      state: 'Maharashtra',
      address: 'Mundhwa, Pune Cantonment Peripheral',
      description:
        'Bharat Forge Defense is India’s premier manufacturer of advanced artillery guns (ATAGS), armored troop carriers, and specialized defense metallurgy.',
      contactPerson: {
        name: 'Maj. Gen. Sunita Rao (Retd.)',
        designation: 'Director - Veteran Leadership & Engineering',
        phone: '+919822334455',
        email: 'sunita.rao@bharatforge-defense.com',
      },
    },
    {
      companyName: 'Mahindra Defense Systems',
      email: 'recruitment@mahindradefense.com',
      phone: '+912224901441',
      industry: 'Tactical Vehicles & Maritime',
      companySize: '501-1000 Employees',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Mahindra Towers, Worli',
      description:
        'Mahindra Defense designs light specialist tactical vehicles (ALSRV), submarine warfare components, and homeland security surveillance gear.',
      contactPerson: {
        name: 'Lt. Cdr. Vivek Nair (Retd.)',
        designation: 'Lead Talent Partner - Defense Ex-Servicemen',
        phone: '+919833445566',
        email: 'vivek.nair@mahindradefense.com',
      },
    },
    {
      companyName: 'Solar Defense & Space Technologies',
      email: 'defense@solargroup.com',
      phone: '+917122564200',
      industry: 'Ammunition & Drone Systems',
      companySize: '501-1000 Employees',
      city: 'Nagpur',
      state: 'Maharashtra',
      address: 'Solar House, Civil Lines',
      description:
        'Solar Industries is India’s foremost defense innovator developing Loitering Munitions (Nagastra-1), multi-mode grenades, and rocket propellants.',
      contactPerson: {
        name: 'Cdr. Pradeep Joshi (Retd.)',
        designation: 'Chief of Resettlement & Safety Programs',
        phone: '+919844556677',
        email: 'pradeep.joshi@solargroup.com',
      },
    },
  ];

  const employerMap = {
    tasl: tataEmployer,
  };

  let empIndex = 2;
  for (const empData of corporateEmployers) {
    let existingEmp = await Employer.findOne({ companyName: empData.companyName });
    if (!existingEmp) {
      // Create user for employer
      const empUserEmail = empData.email;
      let u = await User.findOne({ email: empUserEmail });
      if (!u) {
        u = await User.create({
          name: `${empData.companyName} HR`,
          email: empUserEmail,
          password: 'EmployerPassword123!',
          role: 'EMPLOYER',
          phone: empData.phone,
        });
      }

      existingEmp = await Employer.create({
        user: u._id,
        employerId: `EMP-2026-0000${empIndex}`,
        companyName: empData.companyName,
        companyDescription: empData.description,
        industry: empData.industry,
        companySize: empData.companySize,
        website: `https://${empData.email.split('@')[1]}`,
        email: empData.email,
        phone: empData.phone,
        address: empData.address,
        city: empData.city,
        state: empData.state,
        country: 'India',
        postalCode: '400001',
        contactPerson: empData.contactPerson,
        verificationStatus: 'VERIFIED',
        isActive: true,
      });
      empIndex++;
    }
    employerMap[empData.companyName] = existingEmp;
  }

  // Seed 12 High-Value Resettlement Job Postings
  const jobsData = [
    {
      jobId: 'JOB-2026-000001',
      employer: tataEmployer._id,
      title: 'Chief Security & Asset Protection Officer',
      description:
        'Lead comprehensive physical and electronic security operations across our multi-acre aerospace defense manufacturing facility. Responsible for intelligence coordination, perimeter defense, surveillance protocols, and crisis response management.',
      industry: 'Defense & Aerospace',
      location: 'Chakan Industrial Area, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      employmentType: 'FULL_TIME',
      workMode: 'ONSITE',
      salaryMin: 1400000,
      salaryMax: 2000000,
      salaryCurrency: 'INR',
      experienceMin: 10,
      experienceMax: 26,
      education: 'Graduate / Indian Armed Forces Defense Service Staff College / Equivalent',
      requiredSkills: [
        'Security Operations',
        'Perimeter Defense',
        'Crisis Management',
        'Physical Security',
        'Risk Assessment',
        'Intelligence Analysis',
      ],
      preferredSkills: [
        'Electronic Surveillance Systems (CCTV/Access Control)',
        'VIP Protection',
        'Disaster Recovery Planning',
      ],
      responsibilities: [
        'Design, implement, and audit physical security frameworks across aerospace manufacturing hangars.',
        'Supervise a team of 80+ security guards, quick reaction teams (QRT), and perimeter patrol units.',
        'Liaise with local police, intelligence bureaus, and defense liaison officers for emergency protocols.',
        'Conduct monthly risk vulnerability assessments and red-team security audits.',
      ],
      requirements: [
        'Minimum 10 years of commissioned/JCO service in Indian Army (Infantry, Military Police, Signals) or Navy/Air Force security cadre.',
        'Exemplary military discharge record with certified integrity.',
        'Demonstrated leadership managing large protective security detachments.',
      ],
      benefits: [
        'Comprehensive family healthcare coverage',
        'Corporate performance bonus',
        'Executive transport facility',
        'Subsidized housing allowance in Pune',
      ],
      openings: 2,
      applicationDeadline: new Date('2026-12-31'),
      status: 'ACTIVE',
      featured: true,
    },
    {
      jobId: 'JOB-2026-000002',
      employer: employerMap['L&T Defense & Aerospace']._id,
      title: 'Unmanned Aerial Vehicle (UAV) Flight Test & Operations Lead',
      description:
        'Spearhead flight testing, telemetry analysis, and mission control operations for indigenous medium-altitude tactical UAVs and loitering defense drone systems.',
      industry: 'Defense Manufacturing',
      location: 'Electronics City / Aerospace Park, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      employmentType: 'FULL_TIME',
      workMode: 'HYBRID',
      salaryMin: 1600000,
      salaryMax: 2400000,
      salaryCurrency: 'INR',
      experienceMin: 8,
      experienceMax: 22,
      education: 'B.Tech / Diploma in Avionics / Military Aviation Qualified',
      requiredSkills: [
        'Drone Operations',
        'UAV Flight Testing',
        'Telemetry',
        'Avionics',
        'Aviation Safety',
        'Ground Control Stations (GCS)',
      ],
      preferredSkills: [
        'Indian Air Force / Army Aviation Remotely Piloted Aircraft (RPA) operator certificate',
        'Radio Frequency & SATCOM protocol handling',
      ],
      responsibilities: [
        'Plan and execute tactical flight test profiles for prototype fixed-wing and VTOL surveillance drones.',
        'Coordinate with DGCA, IAF Air Traffic Control, and test range authorities for flight clearances.',
        'Debrief engineering teams on aerodynamic performance, payload integration, and sensor gimbal telemetry.',
      ],
      requirements: [
        'Ex-Servicemen from Indian Air Force / Army Aviation / Navy Aviation with minimum 500+ simulator/flight hours on UAVs or combat aircraft.',
        'Thorough grasp of flight dynamics, weather navigation, and electronic countermeasures.',
      ],
      benefits: [
        'Relocation reimbursement to Bangalore',
        'Stock options & annual project milestones bonus',
        'Higher technical certifications sponsorship',
      ],
      openings: 3,
      applicationDeadline: new Date('2026-11-30'),
      status: 'ACTIVE',
      featured: true,
    },
    {
      jobId: 'JOB-2026-000003',
      employer: employerMap['Solar Defense & Space Technologies']._id,
      title: 'Defense Cyber Threat & SOC Incident Commander',
      description:
        'Direct 24/7 Security Operations Center (SOC) defending mission-critical defense production systems, missile guidance software repositories, and enterprise networks against state-sponsored advanced persistent threats (APTs).',
      industry: 'Ammunition & Drone Systems',
      location: 'Cyber Defense Hub, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      employmentType: 'FULL_TIME',
      workMode: 'REMOTE',
      salaryMin: 1800000,
      salaryMax: 2800000,
      salaryCurrency: 'INR',
      experienceMin: 6,
      experienceMax: 20,
      education: 'B.E./B.Tech Computer Science / Cyber Security or Military Signals Intelligence equivalent',
      requiredSkills: [
        'Cybersecurity',
        'Threat Hunting',
        'Incident Response',
        'SOC Operations',
        'Network Security',
        'SIEM / SOAR',
      ],
      preferredSkills: [
        'Corps of Signals / CERT-In / Defense Cyber Agency (DCA) veteran background',
        'CISSP / CEH / OSCP certification',
      ],
      responsibilities: [
        'Monitor, investigate, and neutralize cyber attacks against defense ERP and air-gapped weapons telemetry systems.',
        'Lead digital forensics and reverse-engineering of malicious firmware binaries.',
        'Enforce ISO 27001, NIST 800-171, and Defense Information Security Guidance compliance.',
      ],
      requirements: [
        'Proven track record in cyber defense, network penetration testing, or military electronic warfare.',
        'Ability to maintain highest confidentiality clearance.',
      ],
      benefits: [
        'Full remote work flexibility with home-office equipment allowance',
        'Annual cybersecurity conference sponsorships',
        'Premium health cover for dependents',
      ],
      openings: 2,
      applicationDeadline: new Date('2026-12-15'),
      status: 'ACTIVE',
      featured: true,
    },
    {
      jobId: 'JOB-2026-000004',
      employer: employerMap['Bharat Forge Defense Systems']._id,
      title: 'Armored Combat Vehicle Maintenance Superintendent',
      description:
        'Oversee the overhaul, mechanical integration, powertrain testing, and field maintenance of high-mobility 8x8 armored infantry carriers and towed artillery guns.',
      industry: 'Heavy Engineering & Artillery',
      location: 'Defense Vehicle Proving Grounds, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      employmentType: 'FULL_TIME',
      workMode: 'ONSITE',
      salaryMin: 1200000,
      salaryMax: 1800000,
      salaryCurrency: 'INR',
      experienceMin: 12,
      experienceMax: 28,
      education: 'Diploma in Mechanical/Automobile Engineering or EME / Armoured Corps Master Technician',
      requiredSkills: [
        'Heavy Vehicle Maintenance',
        'Diesel Powertrains',
        'Hydraulics',
        'Armor Metallurgy',
        'Field Maintenance',
        'EME Procedures',
      ],
      preferredSkills: [
        'Corps of Electronics and Mechanical Engineers (EME) or Armoured Corps veteran',
        'Experience with T-90/BMP-2/K9 Vajra powerpacks',
      ],
      responsibilities: [
        'Supervise the assembly, suspension alignment, and firing range readiness testing of wheeled armored vehicles.',
        'Manage maintenance schedules, spare parts supply chains, and diagnostic telemetry.',
        'Train junior mechanical technicians on defense maintenance standards and torque calibrations.',
      ],
      requirements: [
        'Minimum 12 years of hands-on military maintenance experience on armored combat vehicles or heavy combat machinery.',
        'Strong diagnostic capabilities for high-horsepower turbocharged diesel engines and hydraulic recoil dampers.',
      ],
      benefits: [
        'Pune plant accommodation or high HRA allowance',
        'Medical insurance covering OPD and hospitalization',
        'Annual productivity incentive',
      ],
      openings: 4,
      applicationDeadline: new Date('2026-10-31'),
      status: 'ACTIVE',
      featured: false,
    },
    {
      jobId: 'JOB-2026-000005',
      employer: tataEmployer._id,
      title: 'Tactical Communications & Radar Systems Specialist',
      description:
        'Deploy, calibrate, and troubleshoot software-defined tactical radios, 3D surveillance radar arrays, and battlefield management datalinks for export and defense programs.',
      industry: 'Defense & Aerospace',
      location: 'Hardware Park, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      employmentType: 'FULL_TIME',
      workMode: 'ONSITE',
      salaryMin: 1300000,
      salaryMax: 1900000,
      salaryCurrency: 'INR',
      experienceMin: 7,
      experienceMax: 24,
      education: 'Diploma / Degree in Electronics, Telecommunication, or Radar Engineering',
      requiredSkills: [
        'Radar Systems',
        'Tactical Communications',
        'Software Defined Radio (SDR)',
        'RF Engineering',
        'Signal Processing',
        'Microwave Antennas',
      ],
      preferredSkills: [
        'Corps of Signals / IAF Radar Operators / Navy Weapon Electrical specialists',
        'Experience with phased-array radar or Rohde & Schwarz test gear',
      ],
      responsibilities: [
        'Conduct factory acceptance testing (FAT) and field range trials for air defense and coastal surveillance radars.',
        'Install and configure high-frequency/VHF tactical radio networks with frequency hopping encryption.',
        'Document technical maintenance manuals and provide customer training to armed forces units.',
      ],
      requirements: [
        'Military experience operating or maintaining ground radars, electronic warfare systems, or defense tactical radios.',
        'Sound knowledge of RF spectrum analysis, VSWR testing, and fiber-optic communication lines.',
      ],
      benefits: [
        'Relocation package to Hyderabad',
        'Travel allowances for field trial deployments',
        'Comprehensive family health policy',
      ],
      openings: 3,
      applicationDeadline: new Date('2026-11-15'),
      status: 'ACTIVE',
      featured: false,
    },
    {
      jobId: 'JOB-2026-000006',
      employer: employerMap['Mahindra Defense Systems']._id,
      title: 'Strategic Supply Chain & Defense Procurement Lead',
      description:
        'Manage end-to-end sourcing, supplier development, defense offset compliance, and raw material logistics for tactical vehicle assembly lines.',
      industry: 'Tactical Vehicles & Maritime',
      location: 'Mahindra Logistics Hub, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      employmentType: 'FULL_TIME',
      workMode: 'HYBRID',
      salaryMin: 1500000,
      salaryMax: 2200000,
      salaryCurrency: 'INR',
      experienceMin: 8,
      experienceMax: 25,
      education: 'MBA / Post Graduate Diploma in Supply Chain / Defense Logistics Qualified',
      requiredSkills: [
        'Supply Chain Management',
        'Defense Procurement',
        'Vendor Management',
        'Inventory Optimization',
        'Logistics Operations',
        'Contract Negotiation',
      ],
      preferredSkills: [
        'Army Ordnance Corps (AOC) / Army Service Corps (ASC) / Navy Logistics cadre veteran',
        'Familiarity with Defense Acquisition Procedure (DAP 2020) and GeM portal',
      ],
      responsibilities: [
        'Negotiate contracts with Tier-1 defense component vendors across armor steel, ballistic glass, and drivetrain parts.',
        'Maintain lean inventory levels minimizing lead times for critical assembly lines.',
        'Ensure 100% compliance with indigenization norms (Make in India defense quotas).',
      ],
      requirements: [
        'Substantial experience in defense inventory management, ordnance depots, or heavy engineering supply chains.',
        'Proficiency in SAP MM / ERP systems and advanced Excel modeling.',
      ],
      benefits: [
        'Hybrid work policy (2 days WFH/week)',
        'Company car lease option and executive perks',
        'Annual performance bonus',
      ],
      openings: 2,
      applicationDeadline: new Date('2026-12-31'),
      status: 'ACTIVE',
      featured: true,
    },
    {
      jobId: 'JOB-2026-000007',
      employer: employerMap['Solar Defense & Space Technologies']._id,
      title: 'Executive VIP Protection & Crisis Management Director',
      description:
        'Plan and execute close protection details, tactical travel security, route recon, and crisis mitigation for high-profile executive delegations and international defense dignitaries.',
      industry: 'Ammunition & Drone Systems',
      location: 'National Capital Region, New Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      employmentType: 'FULL_TIME',
      workMode: 'ONSITE',
      salaryMin: 1700000,
      salaryMax: 2500000,
      salaryCurrency: 'INR',
      experienceMin: 12,
      experienceMax: 30,
      education: 'Graduate / NSG / Special Forces / Military Police Qualification',
      requiredSkills: [
        'VIP Close Protection',
        'Threat Assessment',
        'Route Reconnaissance',
        'Tactical Driving',
        'First Aid / EMT',
        'Crisis Management',
      ],
      preferredSkills: [
        'Special Forces (Para SF / MARCOS / Garud) or NSG (Special Group) background',
        'Certified Defensive Driving and Advanced Tactical Firearms mastery',
      ],
      responsibilities: [
        'Conduct detailed threat vulnerability assessments for domestic and overseas executive itineraries.',
        'Lead motorcade protection teams, evasive vehicle maneuvers, and static security deployments.',
        'Coordinate with local security agencies, state intelligence branches, and embassy security attachés.',
      ],
      requirements: [
        'Minimum 12 years of specialized military service in elite special operations or close protection units.',
        'Unblemished conduct record with top physical fitness standards.',
      ],
      benefits: [
        'Executive travel perks and per-diem allowances',
        'Full health coverage including high-risk life insurance',
        'Company accommodations in central New Delhi',
      ],
      openings: 2,
      applicationDeadline: new Date('2026-10-31'),
      status: 'ACTIVE',
      featured: false,
    },
    {
      jobId: 'JOB-2026-000008',
      employer: employerMap['L&T Defense & Aerospace']._id,
      title: 'Aviation Avionics Maintenance Engineer',
      description:
        'Perform depot-level inspections, avionics wiring harness installations, sensor calibration, and cockpit instruments integration for naval and military helicopters.',
      industry: 'Defense Manufacturing',
      location: 'Aerospace Engineering Facility, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      employmentType: 'FULL_TIME',
      workMode: 'ONSITE',
      salaryMin: 1100000,
      salaryMax: 1600000,
      salaryCurrency: 'INR',
      experienceMin: 6,
      experienceMax: 20,
      education: 'Diploma / Degree in Aeronautical/Avionics Engineering or IAF/Navy Electrical Fitter',
      requiredSkills: [
        'Avionics',
        'Helicopter Maintenance',
        'Wiring Harnesses',
        'Flight Instruments',
        'Navigation Systems',
        'Aircraft Electricals',
      ],
      preferredSkills: [
        'Indian Navy (Naval Aviation) or Indian Air Force ex-airman (Electrical/Instrument/Radar Fitter)',
        'Experience with Sea King, ALH Dhruv, or Kamov rotorcraft',
      ],
      responsibilities: [
        'Inspect, test, and repair cockpit multifunction displays (MFD), inertial navigation systems, and sonar sensors.',
        'Ensure military airworthiness documentation and DGQA quality standards compliance.',
        'Support flight test crews during pre-flight and post-flight avionics snag rectifications.',
      ],
      requirements: [
        'Proven military aviation experience working on military rotorcraft or fixed-wing electrical/avionics systems.',
        'Attention to detail, soldering mastery, and schematic diagram comprehension.',
      ],
      benefits: [
        'Bangalore city transport assistance',
        'Comprehensive medical coverage',
        'Skill certification sponsorships',
      ],
      openings: 5,
      applicationDeadline: new Date('2026-11-30'),
      status: 'ACTIVE',
      featured: false,
    },
    {
      jobId: 'JOB-2026-000009',
      employer: employerMap['Solar Defense & Space Technologies']._id,
      title: 'Ammunition & Ordnance Safety Compliance Officer',
      description:
        'Enforce strict explosive safety regulations, magazine storage protocols, electrostatic discharge controls, and hazardous material handling in our defense ordnance manufacturing plants.',
      industry: 'Ammunition & Drone Systems',
      location: 'Industrial Explosives Complex, Nagpur',
      city: 'Nagpur',
      state: 'Maharashtra',
      employmentType: 'FULL_TIME',
      workMode: 'ONSITE',
      salaryMin: 1300000,
      salaryMax: 1900000,
      salaryCurrency: 'INR',
      experienceMin: 10,
      experienceMax: 25,
      education: 'B.Sc. Chemistry / Industrial Safety Diploma or Army Ordnance Corps (AOC) Ammunition Technician',
      requiredSkills: [
        'Explosive Safety',
        'Hazardous Material Handling',
        'Ammunition Storage',
        'PESO Regulations',
        'Risk Audits',
        'Ordnance Quality Control',
      ],
      preferredSkills: [
        'Army Ordnance Corps (AOC) or Naval Armament Inspection (NAI) veteran',
        'Certified Ammunition Technical Officer (ATO) qualification',
      ],
      responsibilities: [
        'Audit ammunition filling bays, curing sheds, and underground explosive magazines for strict safety compliance.',
        'Conduct safety drills, fire emergency simulations, and environmental impact assessments.',
        'Liaise with Petroleum and Explosives Safety Organization (PESO) and DGQA inspectors for regulatory audits.',
      ],
      requirements: [
        'Minimum 10 years of service managing military ammunition dumps, ordnance depots, or naval armament depots.',
        'Impeccable understanding of blast radius calculations, thermal safety thresholds, and chemical storage compatibility.',
      ],
      benefits: [
        'Subsidized family township living in Nagpur',
        'Risk allowance & corporate insurance',
        'Paid children education assistance',
      ],
      openings: 2,
      applicationDeadline: new Date('2026-12-10'),
      status: 'ACTIVE',
      featured: false,
    },
    {
      jobId: 'JOB-2026-000010',
      employer: employerMap['Bharat Forge Defense Systems']._id,
      title: 'Defense Electronics QA & Testing Inspector',
      description:
        'Conduct rigorous environmental testing (MIL-STD-810), thermal shock analysis, electromagnetic compatibility (EMC) testing, and vibration audits on defense electronics modules.',
      industry: 'Heavy Engineering & Artillery',
      location: 'Electronics Testing Lab, Chennai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      employmentType: 'FULL_TIME',
      workMode: 'ONSITE',
      salaryMin: 1000000,
      salaryMax: 1500000,
      salaryCurrency: 'INR',
      experienceMin: 5,
      experienceMax: 18,
      education: 'Diploma / B.E. in Electronics & Communication / Military Technical Grade 1',
      requiredSkills: [
        'Quality Assurance',
        'MIL-STD Compliance',
        'Environmental Stress Testing',
        'Electronics Inspection',
        'Calibration',
        'DGQA Standards',
      ],
      preferredSkills: [
        'Ex-Air Force, Army Signals, or Naval Electrical QA inspectors',
        'Six Sigma Green Belt or ISO 9001 Lead Auditor certification',
      ],
      responsibilities: [
        'Execute thermal chamber cycling and vibration table tests on ruggedized computers and gun-control boxes.',
        'Verify PCB soldering, conformal coating, and IP67 weather sealing integrity.',
        'Compile exhaustive Quality Inspection Reports (QIR) for Ministry of Defense inspectors.',
      ],
      requirements: [
        'Experience in defense electronics inspection, military repair workshops, or base repair depots (BRD).',
        'Familiarity with military environmental standards (JSS 55555 and MIL-STD-810G).',
      ],
      benefits: [
        'Annual corporate incentive',
        'Comprehensive healthcare cover',
        'Chennai relocation assistance',
      ],
      openings: 3,
      applicationDeadline: new Date('2026-10-31'),
      status: 'ACTIVE',
      featured: false,
    },
    {
      jobId: 'JOB-2026-000011',
      employer: tataEmployer._id,
      title: 'Physical Security Operations Coordinator',
      description:
        'Coordinate shift rosters, control room dispatch, visitor biometric screenings, and vehicle inspection checkpoints across aerospace assembly sites.',
      industry: 'Defense & Aerospace',
      location: 'Turbhe Industrial Area, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      employmentType: 'FULL_TIME',
      workMode: 'ONSITE',
      salaryMin: 800000,
      salaryMax: 1200000,
      salaryCurrency: 'INR',
      experienceMin: 5,
      experienceMax: 20,
      education: 'Higher Secondary (10+2) / Graduate / Ex-Servicemen Certificate',
      requiredSkills: [
        'Physical Security',
        'Control Room Operations',
        'Access Control',
        'Shift Management',
        'CCTV Monitoring',
        'Incident Logging',
      ],
      preferredSkills: [
        'Ex-Servicemen (Havildar / Naib Subedar or equivalent from Army, Navy, Air Force)',
        'Basic computer proficiency (MS Word, Excel, Security Log Systems)',
      ],
      responsibilities: [
        'Direct gate security personnel, metal detector screening points, and material pass validations.',
        'Monitor IP camera walls for perimeter alarms and unauthorized breach attempts.',
        'Brief daily shift teams on heightened alert protocols and VIP convoy arrival timings.',
      ],
      requirements: [
        'Minimum 5 years of military service with exemplary character record.',
        'Strong commanding presence, alertness, and clear verbal communication skills.',
      ],
      benefits: [
        'Subsidized company canteen & tea service',
        'Health & accident insurance policy',
        'Annual bonus and uniform allowance',
      ],
      openings: 6,
      applicationDeadline: new Date('2026-12-31'),
      status: 'ACTIVE',
      featured: false,
    },
    {
      jobId: 'JOB-2026-000012',
      employer: employerMap['Mahindra Defense Systems']._id,
      title: 'Defense Logistics & Convoy Transport Fleet Manager',
      description:
        'Oversee tactical transport logistics, heavy trailer deployments, route surveys, driver training, and convoy safety for defense equipment distribution across pan-India routes.',
      industry: 'Tactical Vehicles & Maritime',
      location: 'Logistics Facility, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      employmentType: 'FULL_TIME',
      workMode: 'ONSITE',
      salaryMin: 1100000,
      salaryMax: 1600000,
      salaryCurrency: 'INR',
      experienceMin: 8,
      experienceMax: 24,
      education: 'Graduate / Army Service Corps (ASC) Mechanical Transport Officer/JCO',
      requiredSkills: [
        'Convoy Operations',
        'Fleet Management',
        'GPS Tracking',
        'Route Clearance',
        'Heavy Transport Safety',
        'Vehicle Maintenance Scheduling',
      ],
      preferredSkills: [
        'Army Service Corps (ASC) transport company veteran',
        'Knowledge of state transit permits and over-dimensional cargo (ODC) protocols',
      ],
      responsibilities: [
        'Plan heavy flatbed convoy routes for armored vehicle deliveries from factory to forward army bases.',
        'Monitor GPS telemetry, driver rest schedules, and highway security escorts.',
        'Maintain fleet health records, fuel efficiency metrics, and vehicle roadworthiness certifications.',
      ],
      requirements: [
        'Extensive background in military convoy management, transport operations, or commercial heavy fleet leadership.',
        'Decisive crisis handling capabilities in case of mechanical breakdowns or transit blockades.',
      ],
      benefits: [
        'Performance bonus linked to fleet on-time dispatch rate',
        'Family health policy with zero copay',
        'Mobile and travel reimbursement',
      ],
      openings: 3,
      applicationDeadline: new Date('2026-11-30'),
      status: 'ACTIVE',
      featured: false,
    },
  ];

  for (const jobData of jobsData) {
    const existing = await Job.findOne({ jobId: jobData.jobId });
    if (!existing) {
      await Job.create(jobData);
    } else {
      await Job.findOneAndUpdate({ jobId: jobData.jobId }, jobData);
    }
  }

  console.log(`Seeded ${jobsData.length} Defense Resettlement Jobs successfully!`);
};
