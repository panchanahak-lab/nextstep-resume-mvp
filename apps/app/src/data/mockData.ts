import type { ResumeData, UserProfile, ScanResult, InterviewMessage, ActivityItem } from '../../../../packages/shared/src/types';

export const mockResumeData: ResumeData = {
  name: 'Rajesh Kumar',
  title: 'Senior Mechanical Engineer',
  location: 'Mumbai, India',
  email: 'rajesh.kumar@email.com',
  phone: '+91 98765 43210',
  summary: 'Experienced mechanical engineer with 8+ years in HVAC systems, data center infrastructure, and project management. Proven track record in designing and commissioning cooling systems for Tier III and Tier IV data centers.',
  experience: [
    { jobTitle: 'Senior Mechanical Engineer', company: 'DataTech Solutions Pvt Ltd', startDate: 'Jan 2021', endDate: 'Present', description: 'Lead mechanical design for data center cooling systems. Managed HVAC installations for 3 Tier III facilities. Reduced energy consumption by 18% through optimized cooling design.' },
    { jobTitle: 'Mechanical Engineer', company: 'CoolAir Systems', startDate: 'Jun 2017', endDate: 'Dec 2020', description: 'Designed precision cooling systems for server rooms. Conducted thermal analysis and CFD simulations. Coordinated with electrical and civil teams for MEP integration.' },
    { jobTitle: 'Junior Engineer', company: 'BuildRight Construction', startDate: 'Jul 2015', endDate: 'May 2017', description: 'Assisted in HVAC system installation and commissioning. Prepared technical drawings using AutoCAD. Supported project planning and vendor coordination.' }
  ],
  education: [
    { degree: 'B.Tech in Mechanical Engineering', institute: 'NIT Rourkela', year: '2015' },
    { degree: 'HSC (Science)', institute: 'DAV Public School, Bhubaneswar', year: '2011' }
  ],
  skills: ['HVAC Design', 'AutoCAD', 'Revit MEP', 'CFD Analysis', 'Project Management', 'Data Center Cooling', 'BMS Integration', 'Energy Auditing', 'Vendor Management', 'Technical Documentation'],
  projects: [
    { name: 'Tier III Data Center Cooling - Navi Mumbai', description: 'Designed and commissioned 2MW precision cooling system with N+1 redundancy. Implemented hot/cold aisle containment.', tools: 'AutoCAD, Revit, HAP, CFD' },
    { name: 'HVAC Retrofit - Corporate Office', description: 'Led HVAC system upgrade for 50,000 sq ft office. Achieved 22% energy savings through VRF system implementation.', tools: 'Carrier HAP, AutoCAD, MS Project' }
  ]
};

export const mockUserProfile: UserProfile = {
  name: 'Rajesh Kumar',
  headline: 'Senior Mechanical Engineer | Data Center Infrastructure',
  location: 'Mumbai, India',
  bio: 'Passionate mechanical engineer specializing in data center cooling and HVAC systems. 8+ years of experience in designing, installing, and commissioning precision cooling solutions.',
  githubUrl: 'https://github.com',
  linkedinUrl: 'https://linkedin.com',
  avatarUrl: ''
};

export const mockScanResult: ScanResult = {
  score: 72,
  strengths: ['Strong technical skills section', 'Quantified achievements', 'Relevant project experience', 'Clear job progression'],
  missingKeywords: ['PUE optimization', 'Tier IV certification', 'ASHRAE standards', 'Computational fluid dynamics', 'Chiller plant design', 'Fire suppression systems'],
  suggestions: ['Add ASHRAE guideline references to strengthen domain expertise', 'Include PUE metrics from data center projects', 'Mention specific certifications (e.g., LEED, PMP)', 'Add more action verbs to experience descriptions', 'Include a dedicated certifications section']
};

export const mockInterviewMessages: InterviewMessage[] = [
  { id: '1', role: 'interviewer', content: 'Welcome! Tell me about your experience with data center cooling systems.', timestamp: new Date().toISOString() },
  { id: '2', role: 'candidate', content: 'I have 8 years of experience in HVAC and data center cooling. I\'ve designed precision cooling systems for Tier III facilities and achieved 18% energy savings through optimized designs.', timestamp: new Date().toISOString() },
  { id: '3', role: 'interviewer', content: 'That\'s great. Can you explain the difference between raised floor and overhead cooling in a data center?', timestamp: new Date().toISOString() }
];

export const mockActivityItems: ActivityItem[] = [
  { id: '1', type: 'resume', title: 'Resume Updated', description: 'You updated your work experience section', date: '2 hours ago' },
  { id: '2', type: 'scan', title: 'Resume Scanned', description: 'ATS Score: 72/100 for Data Center Engineer role', date: '1 day ago' },
  { id: '3', type: 'interview', title: 'Mock Interview Completed', description: 'Technical interview for Mechanical Engineer', date: '3 days ago' },
  { id: '4', type: 'resume', title: 'Resume Created', description: 'Created new resume using AI builder', date: '1 week ago' }
];
