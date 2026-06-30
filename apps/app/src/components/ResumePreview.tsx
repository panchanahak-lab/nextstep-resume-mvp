import React from 'react';
import type { ResumeData } from '../../../../packages/shared/src/types';
import Card from '../../../../packages/shared/src/components/Card';
import { COPY } from '@nextstep/shared';

export type ResumeTemplateId = 'classic-clean' | 'modern-blue' | 'minimal-pro' | 'campus-fresher' | 'government-format';

interface ResumePreviewProps {
  data: ResumeData;
  className?: string;
  paperMode?: boolean;
  selectedTemplate?: ResumeTemplateId;
  profilePhoto?: string | null;
}

const displayUrl = (value: string) => value.replace(/^https?:\/\//i, '').replace(/\/$/, '').trim();

const sectionTitleClass = (template: ResumeTemplateId) => {
  if (template === 'campus-fresher') return 'text-green-600 border-b border-green-200';
  if (template === 'modern-blue') return 'text-primary-700 border-b border-primary-200';
  if (template === 'minimal-pro') return 'text-neutral-900 border-b border-neutral-200';
  return 'text-neutral-900 border-b border-neutral-300';
};

const templateFont = (template: ResumeTemplateId) => {
  if (template === 'minimal-pro') return 'Georgia, serif';
  if (template === 'modern-blue') return 'Inter, Arial, sans-serif';
  return 'Arial, sans-serif';
};

const ResumePreview: React.FC<ResumePreviewProps> = ({
  data,
  className = '',
  paperMode = false,
  selectedTemplate = 'classic-clean',
  profilePhoto = null,
}) => {
  const isEmpty = !data.name && !data.title && !data.summary && data.experience.length === 0;
  const mutedText = paperMode ? 'text-neutral-500' : 'text-neutral-500 dark:text-neutral-400';
  const showPhoto = Boolean(profilePhoto && (selectedTemplate === 'modern-blue' || selectedTemplate === 'campus-fresher'));
  const contactItems = [
    data.location,
    data.email,
    data.phone,
    data.linkedinUrl ? displayUrl(data.linkedinUrl) : '',
    data.portfolioUrl ? displayUrl(data.portfolioUrl) : '',
  ].filter(Boolean);
  const contactLine = contactItems.join(' | ');
  const sectionClass = `mb-5 ${selectedTemplate === 'minimal-pro' ? 'border-b border-neutral-200 pb-4' : ''}`;
  const headingClass = `mb-3 pb-1 text-xs font-bold uppercase tracking-wider ${sectionTitleClass(selectedTemplate)}`;

  if (isEmpty) {
    return (
      <Card className={`resume-preview-card p-6 lg:p-8 flex items-center justify-center min-h-[500px] bg-neutral-50/50 dark:bg-neutral-900/50 border-dashed ${className}`}>
        <p className={`${mutedText} text-center`}>
          {COPY.BUILDER.emptyState}
        </p>
      </Card>
    );
  }

  const renderSummary = () => data.summary ? (
    <div className={sectionClass}>
      <h3 className={headingClass}>Summary</h3>
      <p className="text-sm leading-relaxed text-neutral-700">{data.summary}</p>
    </div>
  ) : null;

  const renderExperience = () => data.experience && data.experience.length > 0 ? (
    <div className={sectionClass}>
      <h3 className={headingClass}>Experience</h3>
      <div className="space-y-4">
        {data.experience.map((exp, index) => (
          <div key={index}>
            <p className="text-sm font-semibold text-neutral-950">{exp.jobTitle}</p>
            <p className="text-sm text-neutral-500">
              {[exp.company, [exp.startDate, exp.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' | ')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-700">{exp.description}</p>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const renderEducation = () => data.education && data.education.length > 0 ? (
    <div className={sectionClass}>
      <h3 className={headingClass}>Education</h3>
      <div className="space-y-2">
        {data.education.map((edu, index) => (
          <div key={index}>
            <p className="text-sm font-semibold text-neutral-950">{edu.degree}</p>
            <p className="text-sm text-neutral-500">
              {[edu.institute, edu.year].filter(Boolean).join(' | ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const renderSkills = () => data.skills && data.skills.length > 0 ? (
    <div className={sectionClass}>
      <h3 className={headingClass}>Skills</h3>
      <p className="text-sm leading-relaxed text-neutral-700">{data.skills.join(' | ')}</p>
    </div>
  ) : null;

  const renderProjects = () => data.projects && data.projects.length > 0 ? (
    <div className={sectionClass}>
      <h3 className={headingClass}>Projects</h3>
      <div className="space-y-3">
        {data.projects.map((project, index) => (
          <div key={index}>
            <p className="text-sm font-semibold text-neutral-950">{project.name}</p>
            <p className="mt-1 text-sm text-neutral-700">{project.description}</p>
            {project.tools && <p className="mt-1 text-xs text-neutral-500">Tools: {project.tools}</p>}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const renderPersonalDetails = () => selectedTemplate === 'government-format' && (data.dateOfBirth || data.gender) ? (
    <div className={sectionClass}>
      <h3 className={headingClass}>Personal Details</h3>
      <div className="grid grid-cols-1 gap-1 text-sm text-neutral-700 sm:grid-cols-2">
        {data.dateOfBirth && <p><span className="font-semibold text-neutral-950">Date of Birth:</span> {data.dateOfBirth}</p>}
        {data.gender && <p><span className="font-semibold text-neutral-950">Gender:</span> {data.gender}</p>}
      </div>
    </div>
  ) : null;

  const renderDeclaration = () => selectedTemplate === 'government-format' ? (
    <div className="mt-8">
      <h3 className={headingClass}>Declaration</h3>
      <p className="text-sm leading-relaxed text-neutral-700">
        I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief.
      </p>
      <div className="mt-8 text-right text-sm text-neutral-900">
        <p>{data.name || '[Full Name]'}</p>
        <p>Date: ___________</p>
      </div>
    </div>
  ) : null;

  const bodySections = selectedTemplate === 'campus-fresher'
    ? [renderSummary(), renderEducation(), renderExperience(), renderSkills(), renderProjects()]
    : [renderSummary(), renderExperience(), renderEducation(), renderSkills(), renderProjects()];

  return (
    <Card padding="none" className={`resume-preview-card overflow-hidden !bg-white !text-neutral-900 ${paperMode ? '!border-neutral-200 !shadow-none !rounded-none' : ''} ${className}`}>
      <div style={{ fontFamily: templateFont(selectedTemplate) }}>
        {selectedTemplate === 'modern-blue' ? (
          <div className="mb-6 flex items-center justify-between gap-4 bg-primary-600 p-6 text-white">
            <div>
              <h2 className="text-2xl font-bold">{data.name}</h2>
              <p className="font-medium text-primary-100">{data.title}</p>
              {contactLine && <p className="mt-2 text-xs text-primary-50">{contactLine}</p>}
            </div>
            {showPhoto && <img src={profilePhoto || ''} alt="Profile" className="h-[60px] w-[60px] rounded-full border-2 border-white object-cover" />}
          </div>
        ) : (
          <div className="mb-4 flex items-start justify-between gap-4 p-6 pb-0">
            <div>
              <h2 className={`text-xl font-bold ${selectedTemplate === 'campus-fresher' ? 'text-green-700' : 'text-neutral-950'}`}>{data.name}</h2>
              <p className={selectedTemplate === 'campus-fresher' ? 'font-medium text-green-700' : 'font-medium text-neutral-700'}>{data.title}</p>
              {contactLine && <p className="mt-1 text-sm text-neutral-500">{contactLine}</p>}
            </div>
            {showPhoto && <img src={profilePhoto || ''} alt="Profile" className="h-[60px] w-[60px] rounded-full border-2 border-white object-cover shadow-sm" />}
          </div>
        )}

        <div className={selectedTemplate === 'modern-blue' ? 'px-6 pb-6' : 'px-6 pb-6'}>
          {renderPersonalDetails()}
          {bodySections}
          {renderDeclaration()}
        </div>
      </div>
    </Card>
  );
};

export default ResumePreview;
