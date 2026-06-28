export interface Experience {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  degree: string;
  institute: string;
  year: string;
}

export interface Project {
  name: string;
  description: string;
  tools: string;
}

export interface ResumeData {
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications?: string[];
  additionalInformation?: string[];
  languages?: string[];
}

export interface UserProfile {
  name: string;
  headline: string;
  location: string;
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
  avatarUrl: string;
}

export interface InterviewMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
}

export interface ScanResult {
  score: number;
  strengths: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
}
