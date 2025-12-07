
export interface Job {
  id: string;
  date: string;
  job_title: string;
  company: string;
  logo_url?: string;
  country: string;
  location: string;
  skills: string[]; // Parsed from string list
  salary: string;
  source: string;
  job_link: string;
  description: string; // Added for context
}

export interface UserPreferences {
  desiredLocations: string[];
  interestedIndustries: string[];
  salaryRange: string;
  workMode: 'Remote' | 'Hybrid' | 'On-Site' | 'Any';
}

export interface UserProfile {
  name: string;
  email: string;
  jobTitle?: string;
  resumeText: string;
  parsedSkills: string[];
  experienceLevel: string;
  preferences?: UserPreferences;
}

export interface ATSAnalysis {
  score: number;
  missingKeywords: string[];
  formattingIssues: string[];
  suggestions: string[];
}

export interface Application {
  id: string;
  jobId: string;
  status: 'draft' | 'tailoring' | 'ready' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  tailoredResume: string;
  coverLetter: string;
  atsAnalysis?: ATSAnalysis; // Added ATS data
  companyResearch: string[]; // URLs or snippets
  matchScore: number;
  createdAt: string;
  dateApplied?: string; // ISO Date string YYYY-MM-DD
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  JOBS = 'JOBS',
  APPLICATIONS = 'APPLICATIONS',
  PROFILE = 'PROFILE'
}
