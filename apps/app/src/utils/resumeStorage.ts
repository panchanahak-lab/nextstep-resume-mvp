import type { ResumeData } from '../../../../packages/shared/src/types';

export const emptyResumeData: ResumeData = {
  name: '',
  title: '',
  location: '',
  email: '',
  phone: '',
  linkedinUrl: '',
  portfolioUrl: '',
  dateOfBirth: '',
  gender: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
};

export const getResumeStorageKey = (userId: string) => `nextstep_resume_autosave_${userId}`;

export const isResumeDataEmpty = (data: ResumeData) => {
  return ![
    data.name,
    data.title,
    data.location,
    data.email,
    data.phone,
    data.linkedinUrl,
    data.portfolioUrl,
    data.dateOfBirth,
    data.gender,
    data.summary,
    ...data.experience.flatMap((item) => [
      item.jobTitle,
      item.company,
      item.startDate,
      item.endDate,
      item.description,
    ]),
    ...data.education.flatMap((item) => [
      item.degree,
      item.institute,
      item.year,
    ]),
    ...data.skills,
    ...data.projects.flatMap((item) => [
      item.name,
      item.description,
      item.tools,
    ]),
  ].some((value) => value.trim());
};

export const loadStoredResume = (userId: string): ResumeData | null => {
  try {
    const saved = localStorage.getItem(getResumeStorageKey(userId));
    if (!saved) return null;

    const parsed = JSON.parse(saved) as ResumeData;
    return {
      ...emptyResumeData,
      ...parsed,
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    };
  } catch (error) {
    console.error('Failed to parse saved resume', error);
    return null;
  }
};

export const saveStoredResume = (userId: string, data: ResumeData) => {
  const key = getResumeStorageKey(userId);

  if (isResumeDataEmpty(data)) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(key, JSON.stringify(data));
};
