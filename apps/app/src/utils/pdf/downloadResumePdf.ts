import React from 'react';
import type { ResumeData } from '../../types/resume';

export const PDF_MESSAGES = {
  preparing: 'Preparing your PDF...',
  success: 'Your resume is ready.',
  validation: 'Add a few resume details before downloading.',
  error: 'We could not prepare your PDF. Please try again.',
} as const;

const hasText = (value?: string) => Boolean(value?.trim());

const hasExperience = (data: ResumeData) =>
  data.experience.some((item) =>
    [item.jobTitle, item.company, item.startDate, item.endDate, item.description].some(hasText),
  );

const hasEducation = (data: ResumeData) =>
  data.education.some((item) => [item.degree, item.institute, item.year].some(hasText));

const hasProjects = (data: ResumeData) =>
  (data.projects ?? []).some((item) => [item.name, item.description, item.tools].some(hasText));

const hasContentSection = (data: ResumeData) =>
  hasText(data.summary) ||
  hasExperience(data) ||
  hasEducation(data) ||
  (data.skills ?? []).some(hasText) ||
  hasProjects(data) ||
  (data.certifications ?? []).some(hasText) ||
  (data.achievements ?? []).some(hasText);

export const validateResumeForPdf = (data: ResumeData) => {
  const hasCandidateName = hasText(data.name);
  const hasContactDetail = [data.email, data.phone, data.location].some(hasText);

  return hasCandidateName && hasContactDetail && hasContentSection(data);
};

export const getResumePdfFilename = (data: ResumeData) => {
  const candidate = data.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `nextstep-resume-${candidate || 'candidate'}.pdf`;
};

export const createResumePdfBlob = async (data: ResumeData) => {
  const [{ pdf }, { default: ResumePDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../../components/resume/ResumePDF'),
  ]);

  return pdf(React.createElement(ResumePDF, { data })).toBlob();
};

export const downloadResumePdf = async (data: ResumeData) => {
  if (!validateResumeForPdf(data)) {
    return { ok: false, message: PDF_MESSAGES.validation };
  }

  try {
    const blob = await createResumePdfBlob(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = getResumePdfFilename(data);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { ok: true, message: PDF_MESSAGES.success };
  } catch (error) {
    console.error('Resume PDF generation failed', error);
    return { ok: false, message: PDF_MESSAGES.error };
  }
};
